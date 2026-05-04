import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data.object);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent created:', paymentIntent.id);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { bookingId, cleanerId, platformFee, cleanerPayout } = paymentIntent.metadata;

  // Update payment status
  await supabaseAdmin
    .from('payments')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Update booking status
  if (bookingId) {
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    // Create notification for customer
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('customer_id, services!inner(name)')
      .eq('id', bookingId)
      .single();

    if (booking) {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.customer_id,
        type: 'payment_success',
        title: 'Payment Successful!',
        message: `Your payment for ${booking.services.name} has been processed.`,
        data: { bookingId, amount: paymentIntent.amount / 100 },
      });
    }

    // Create notification for cleaner if assigned
    if (cleanerId) {
      const { data: cleaner } = await supabaseAdmin
        .from('cleaners')
        .select('user_id')
        .eq('id', cleanerId)
        .single();

      if (cleaner) {
        await supabaseAdmin.from('notifications').insert({
          user_id: cleaner.user_id,
          type: 'booking_confirmed',
          title: 'New Booking Confirmed!',
          message: `You have a new booking worth $${cleanerPayout || '0'}.`,
          data: { bookingId, payout: cleanerPayout },
        });
      }
    }
  }

  revalidatePath('/bookings');
  revalidatePath('/dashboard');
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { bookingId } = paymentIntent.metadata;

  await supabaseAdmin
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (bookingId) {
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('customer_id')
      .eq('id', bookingId)
      .single();

    if (booking) {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.customer_id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
        data: { bookingId },
      });
    }
  }

  revalidatePath('/bookings');
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { bookingId } = paymentIntent.metadata;

  await supabaseAdmin
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (bookingId) {
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
  }

  revalidatePath('/bookings');
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = typeof dispute.payment_intent === 'string' 
    ? dispute.payment_intent 
    : dispute.payment_intent?.id;

  if (paymentIntentId) {
    await supabaseAdmin
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntentId);

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('booking_id, booking!inner(customer_id)')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (payment) {
      await supabaseAdmin.from('notifications').insert({
        user_id: payment.booking.customer_id,
        type: 'dispute',
        title: 'Charge Dispute',
        message: `A dispute has been opened for $${(dispute.amount / 100).toFixed(2)}.`,
        data: { reason: dispute.reason, bookingId: payment.booking_id },
      });
    }
  }
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const paymentIntentId = typeof dispute.payment_intent === 'string' 
    ? dispute.payment_intent 
    : dispute.payment_intent?.id;

  if (paymentIntentId && dispute.status === 'won') {
    // Dispute won - payment stands
    await supabaseAdmin
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntentId);
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log('Transfer created:', transfer.id);
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  await supabaseAdmin
    .from('payments')
    .update({ payout_status: 'failed' })
    .eq('payout_id', transfer.id);
}

async function handleAccountUpdated(account: Stripe.Account) {
  const { cleanerId } = account.metadata;

  if (cleanerId) {
    const isVerified = account.details_submitted && !account.requirements?.currently_due?.length;

    await supabaseAdmin
      .from('cleaners')
      .update({ is_verified: isVerified })
      .eq('id', cleanerId);
  }
}
