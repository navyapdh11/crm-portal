'use server';

import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Create a Stripe Connect Express account for a cleaner
 */
export async function createConnectAccount(cleanerId: string) {
  try {
    // Get cleaner's user info
    const { data: cleaner } = await supabaseAdmin
      .from('cleaners')
      .select(`
        id,
        user_id,
        hourly_rate,
        users!inner(email, full_name)
      `)
      .eq('id', cleanerId)
      .single();

    if (!cleaner) {
      return { error: 'Cleaner not found' };
    }

    // Check if already has account
    if (cleaner.users?.stripe_account_id) {
      return { error: 'Cleaner already has a Stripe account' };
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      email: cleaner.users.email,
      metadata: {
        cleanerId,
        userId: cleaner.user_id,
      },
      business_type: 'individual',
      business_profile: {
        product_description: 'Cleaning services via AR Cleaning AU',
        mcc: '7273', // Building/facility maintenance
      },
    });

    // Save account ID to cleaner profile
    await supabaseAdmin
      .from('cleaners')
      .update({ stripe_account_id: account.id })
      .eq('id', cleanerId);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${APP_URL}/cleaners/onboarding?refresh=true`,
      return_url: `${APP_URL}/cleaners/onboarding?success=true`,
      type: 'account_onboarding',
    });

    revalidatePath('/cleaners');
    revalidatePath('/admin/cleaners');

    return { url: accountLink.url };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return { error: 'Failed to create Stripe Connect account' };
  }
}

/**
 * Create a payout to a cleaner's Stripe account
 */
export async function createPayout(bookingId: string) {
  try {
    // Get booking and payment info
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        cleaner_id,
        cleaner_payout,
        status,
        cleaners!inner(stripe_account_id),
        payments!inner(stripe_payment_intent_id, payout_status)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (!booking.cleaner_payout || booking.cleaner_payout <= 0) {
      return { error: 'No payout amount set' };
    }

    const cleanerStripeId = booking.cleaners?.stripe_account_id;
    if (!cleanerStripeId) {
      return { error: 'Cleaner has no Stripe Connect account' };
    }

    // Create transfer from platform to cleaner
    const transfer = await stripe.transfers.create({
      amount: Math.round(booking.cleaner_payout * 100),
      currency: 'aud',
      destination: cleanerStripeId,
      source_transaction: booking.payments?.stripe_payment_intent_id,
      metadata: {
        bookingId,
        description: `Payout for booking #${bookingId}`,
      },
    });

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        payout_id: transfer.id,
        payout_amount: booking.cleaner_payout,
        payout_status: 'paid',
      })
      .eq('booking_id', bookingId);

    revalidatePath('/bookings');
    revalidatePath('/admin/payouts');

    return { success: true, transferId: transfer.id };
  } catch (error) {
    console.error('Error creating payout:', error);
    return { error: 'Failed to create payout' };
  }
}

/**
 * Get cleaner's earnings summary
 */
export async function getCleanerEarnings(cleanerId: string, period?: 'month' | 'year') {
  try {
    const view = period === 'year' 
      ? supabaseAdmin.from('cleaner_pnl').select('*').eq('cleaner_id', cleanerId)
      : supabaseAdmin.from('cleaner_pnl').select('*').eq('cleaner_id', cleanerId);

    const { data, error } = await view;

    if (error) {
      return { error: 'Failed to fetch earnings' };
    }

    const totalEarnings = data?.reduce((sum, row) => sum + Number(row.total_earnings), 0) || 0;
    const totalPayouts = data?.reduce((sum, row) => sum + Number(row.total_payouts), 0) || 0;
    const totalJobs = data?.reduce((sum, row) => sum + row.job_count, 0) || 0;

    return {
      totalEarnings,
      totalPayouts,
      pendingEarnings: totalEarnings - totalPayouts,
      totalJobs,
      breakdown: data,
    };
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return { error: 'Failed to fetch earnings' };
  }
}

/**
 * Get platform P&L summary
 */
export async function getPlatformPnL(period?: 'month' | 'year') {
  try {
    const { data, error } = await supabaseAdmin
      .from('platform_pnl')
      .select('*')
      .order('period_start', { ascending: false })
      .limit(period === 'year' ? 12 : 1);

    if (error) {
      return { error: 'Failed to fetch platform P&L' };
    }

    const totals = {
      totalRevenue: data?.reduce((sum, row) => sum + Number(row.total_revenue), 0) || 0,
      totalPayouts: data?.reduce((sum, row) => sum + Number(row.total_payouts), 0) || 0,
      totalFees: data?.reduce((sum, row) => sum + Number(row.total_fees), 0) || 0,
      netProfit: data?.reduce((sum, row) => sum + Number(row.net_profit), 0) || 0,
      totalBookings: data?.reduce((sum, row) => sum + row.booking_count, 0) || 0,
    };

    return {
      ...totals,
      profitMargin: totals.totalRevenue > 0 
        ? ((totals.netProfit / totals.totalRevenue) * 100).toFixed(2)
        : '0.00',
      breakdown: data,
    };
  } catch (error) {
    console.error('Error fetching platform P&L:', error);
    return { error: 'Failed to fetch platform P&L' };
  }
}

/**
 * Get Connect account balance
 */
export async function getConnectBalance() {
  try {
    const balance = await stripe.balance.retrieve();

    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    return {
      available,
      pending,
      currencies: balance.available.map(b => ({
        currency: b.currency,
        amount: b.amount / 100,
      })),
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return { error: 'Failed to fetch balance' };
  }
}
