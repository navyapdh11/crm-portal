import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      serviceId,
      totalAmount,
      address,
      latitude,
      longitude,
      scheduledAt,
      notes,
    } = body;

    // Validate required fields
    if (!customerId || !serviceId || !totalAmount || !address || !latitude || !longitude || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: customerId,
        service_id: serviceId,
        total_amount: totalAmount,
        address,
        latitude,
        longitude,
        scheduled_at: scheduledAt,
        notes,
        status: 'pending',
        platform_fee: Math.max(totalAmount * 0.15, 5),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        services (name, description, duration_minutes),
        cleaners (
          id,
          rating,
          users (full_name, email)
        )
      `)
      .eq('customer_id', customerId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
