'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { calculateDistance } from '@/lib/location-utils';

interface MatchingResult {
  cleaner_id: string;
  user_id: string;
  distance_km: number;
  hourly_rate: number;
  rating: number;
  total_jobs: number;
  is_verified: boolean;
  score: number;
  estimatedPayout: number;
}

interface MatchingParams {
  serviceId: string;
  latitude: number;
  longitude: number;
  scheduledAt: string;
  radiusKm?: number;
}

/**
 * Find and score the best available cleaners for a booking
 */
export async function findBestCleaners({
  serviceId,
  latitude,
  longitude,
  scheduledAt,
  radiusKm = 20,
}: MatchingParams): Promise<{ data: MatchingResult[] | null; error: string | null }> {
  try {
    // Get service details to calculate estimated payout
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('base_price, duration_minutes')
      .eq('id', serviceId)
      .single();

    if (!service) {
      return { data: null, error: 'Service not found' };
    }

    // Call the PostGIS function to find nearby cleaners
    const { data: nearbyCleaners, error } = await supabaseAdmin
      .rpc('find_nearby_cleaners', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
      });

    if (error) {
      console.error('Error finding nearby cleaners:', error);
      return { data: null, error: 'Failed to find cleaners' };
    }

    if (!nearbyCleaners || nearbyCleaners.length === 0) {
      return { data: [], error: 'No available cleaners in your area' };
    }

    // Check availability for the scheduled time
    const scheduledDate = new Date(scheduledAt);
    const bufferMinutes = service.duration_minutes + 60; // 1 hour buffer

    const bookedCleanerIds = await getBookedCleanerIds(
      scheduledDate,
      bufferMinutes
    );

    // Filter out already booked cleaners and score remaining
    const scoredCleaners: MatchingResult[] = nearbyCleaners
      .filter((cleaner: any) => !bookedCleanerIds.includes(cleaner.cleaner_id))
      .map((cleaner: any) => {
        const score = calculateCleanerScore(
          cleaner,
          latitude,
          longitude,
          service.base_price
        );

        const estimatedPayout = calculateEstimatedPayout(
          service.base_price,
          cleaner.hourly_rate,
          service.duration_minutes
        );

        return {
          cleaner_id: cleaner.cleaner_id,
          user_id: cleaner.user_id,
          distance_km: cleaner.distance_km,
          hourly_rate: cleaner.hourly_rate,
          rating: cleaner.rating,
          total_jobs: cleaner.total_jobs,
          is_verified: cleaner.is_verified,
          score,
          estimatedPayout,
        };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending

    return { data: scoredCleaners, error: null };
  } catch (err) {
    console.error('Error in findBestCleaners:', err);
    return { data: null, error: 'Failed to match cleaners' };
  }
}

/**
 * Calculate a comprehensive score for a cleaner
 */
function calculateCleanerScore(
  cleaner: any,
  bookingLat: number,
  bookingLng: number,
  servicePrice: number
): number {
  const WEIGHTS = {
    distance: 0.30,
    rating: 0.30,
    totalJobs: 0.20,
    price: 0.10,
    verified: 0.10,
  };

  // Distance score (closer is better, normalized to 0-1)
  const distanceScore = Math.max(0, 1 - (cleaner.distance_km / 20));

  // Rating score (already 0-5, normalize to 0-1)
  const ratingScore = cleaner.rating / 5;

  // Experience score (based on total jobs, cap at 100)
  const experienceScore = Math.min(cleaner.total_jobs / 100, 1);

  // Price score (lower rate is better for customers, normalize)
  const avgRate = 30; // Average hourly rate
  const priceScore = Math.max(0, 1 - ((cleaner.hourly_rate - avgRate) / avgRate));

  // Verified bonus
  const verifiedScore = cleaner.is_verified ? 1 : 0.5;

  // Weighted final score
  const score =
    distanceScore * WEIGHTS.distance +
    ratingScore * WEIGHTS.rating +
    experienceScore * WEIGHTS.totalJobs +
    priceScore * WEIGHTS.price +
    verifiedScore * WEIGHTS.verified;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate estimated payout for a cleaner
 */
function calculateEstimatedPayout(
  servicePrice: number,
  hourlyRate: number,
  durationMinutes: number
): number {
  const durationHours = durationMinutes / 60;
  const cleanerShare = hourlyRate * durationHours;
  const platformFee = Math.max(servicePrice * 0.15, 5); // 15% or $5 minimum
  return Math.max(cleanerShare, servicePrice - platformFee);
}

/**
 * Get cleaner IDs that are already booked for a time slot
 */
async function getBookedCleanerIds(
  scheduledAt: Date,
  bufferMinutes: number
): Promise<string[]> {
  const startTime = new Date(scheduledAt.getTime() - bufferMinutes * 60000);
  const endTime = new Date(scheduledAt.getTime() + bufferMinutes * 60000);

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('cleaner_id')
    .in('status', ['pending', 'matched', 'confirmed', 'in_progress'])
    .gte('scheduled_at', startTime.toISOString())
    .lte('scheduled_at', endTime.toISOString())
    .not('cleaner_id', 'is', null);

  return bookings?.map((b) => b.cleaner_id!).filter(Boolean) || [];
}

/**
 * Auto-assign the best cleaner to a booking
 */
export async function autoAssignCleaner(
  bookingId: string,
  params: MatchingParams
): Promise<{ data: { cleanerId: string } | null; error: string | null }> {
  try {
    const { data: cleaners, error } = await findBestCleaners(params);

    if (error || !cleaners || cleaners.length === 0) {
      return { data: null, error: error || 'No cleaners available' };
    }

    const bestCleaner = cleaners[0];

    // Update booking with assigned cleaner
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        cleaner_id: bestCleaner.cleaner_id,
        status: 'matched',
        cleaner_payout: bestCleaner.estimatedPayout,
        platform_fee: Math.max(bestCleaner.estimatedPayout * 0.15, 5),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return { data: null, error: 'Failed to assign cleaner' };
    }

    // Create notification for cleaner
    const { data: cleaner } = await supabaseAdmin
      .from('cleaners')
      .select('user_id')
      .eq('id', bestCleaner.cleaner_id)
      .single();

    if (cleaner) {
      await supabaseAdmin.from('notifications').insert({
        user_id: cleaner.user_id,
        type: 'booking_matched',
        title: 'New Booking Match!',
        message: `You've been matched with a booking worth $${bestCleaner.estimatedPayout.toFixed(2)}.`,
        data: {
          bookingId,
          payout: bestCleaner.estimatedPayout,
          distance: bestCleaner.distance_km,
        },
      });
    }

    return { data: { cleanerId: bestCleaner.cleaner_id }, error: null };
  } catch (err) {
    console.error('Error in autoAssignCleaner:', err);
    return { data: null, error: 'Failed to assign cleaner' };
  }
}
