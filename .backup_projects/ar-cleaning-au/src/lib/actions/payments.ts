'use server';

import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee
const PLATFORM_FEE_MINIMUM = 5.00; // Minimum $5 platform fee

interface CreatePaymentIntentParams {
  bookingId: string;
  customerId: string;
  serviceId: string;
  amount: number;
  currency?: string;
  cleanerId?: string;
}

export async function createPaymentIntent({
  bookingId,
  customerId,
  amount,
  currency = 'aud',
  cleanerId,
}: CreatePaymentIntentParams) {
  try {
    // 1. Get or create Stripe customer
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', customerId)
      .single();

    if (!user) {
      return { error: 'User not found' };
    }

    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: customerId,
        },
      });
      stripeCustomerId = customer.id;

      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customerId);
    }

    // 2. Calculate platform fee
    const platformFee = Math.max(amount * PLATFORM_FEE_PERCENTAGE, PLATFORM_FEE_MINIMUM);
    const cleanerPayout = amount - platformFee;

    // 3. Create Payment Intent with transfer data for Connect
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: stripeCustomerId,
      metadata: {
        bookingId,
        customerId,
        cleanerId: cleanerId || '',
        platformFee: platformFee.toFixed(2),
        cleanerPayout: cleanerPayout.toFixed(2),
      },
      // If cleaner has Stripe Connect account, use destination charges
      ...(cleanerId ? await getTransferData(cleanerId, cleanerPayout) : {}),
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // 4. Create payment record in database
    const { error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount,
        currency,
        status: 'pending',
      });

    if (dbError) {
      console.error('Error creating payment record:', dbError);
      return { error: 'Failed to create payment' };
    }

    // 5. Update booking with payment intent ID
    await supabaseAdmin
      .from('bookings')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', bookingId);

    revalidatePath('/bookings');
    revalidatePath('/dashboard');

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      platformFee,
      cleanerPayout,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { error: 'Failed to create payment intent' };
  }
}

async function getTransferData(cleanerId: string, payoutAmount: number) {
  const { data: cleaner } = await supabaseAdmin
    .from('cleaners')
    .select('stripe_account_id')
    .eq('id', cleanerId)
    .single();

  if (cleaner?.stripe_account_id) {
    return {
      transfer_data: {
        destination: cleaner.stripe_account_id,
        amount: Math.round(payoutAmount * 100),
      },
    };
  }

  return {};
}

export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', paymentIntentId);

      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('booking_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (payment) {
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', payment.booking_id);
      }

      revalidatePath('/bookings');
      revalidatePath('/dashboard');

      return { success: true };
    }

    return { success: false, status: paymentIntent.status };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return { error: 'Failed to confirm payment' };
  }
}

export async function cancelPayment(paymentIntentId: string) {
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);

    await supabaseAdmin
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntentId);

    revalidatePath('/bookings');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error canceling payment:', error);
    return { error: 'Failed to cancel payment' };
  }
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    await supabaseAdmin
      .from('payments')
      .update({ 
        status: amount ? 'pending' : 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    revalidatePath('/bookings');
    revalidatePath('/dashboard');
    revalidatePath('/admin/payouts');

    return { success: true, refundId: refund.id };
  } catch (error) {
    console.error('Error refunding payment:', error);
    return { error: 'Failed to refund payment' };
  }
}
