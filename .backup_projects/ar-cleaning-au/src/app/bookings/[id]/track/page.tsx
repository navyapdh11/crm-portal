'use client';

import { useSearchParams } from 'next/navigation';
import BookingTracker from '@/components/BookingTracker';

export default function TrackBookingPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') || '';

  // In a real app, fetch booking details from API
  // This is mock data for demonstration
  const mockBooking = {
    id: bookingId,
    cleanerId: 'cleaner-123',
    cleanerName: 'Sarah M.',
    cleanerRating: 4.9,
    customerLat: -33.8688,
    customerLng: 151.2093,
    estimatedArrival: '10:30 AM',
  };

  return (
    <BookingTracker
      bookingId={mockBooking.id}
      cleanerId={mockBooking.cleanerId}
      customerLat={mockBooking.customerLat}
      customerLng={mockBooking.customerLng}
      cleanerName={mockBooking.cleanerName}
      cleanerRating={mockBooking.cleanerRating}
      estimatedArrival={mockBooking.estimatedArrival}
    />
  );
}
