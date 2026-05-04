'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Booking {
  id: string;
  status: string;
  total_amount: number;
  scheduled_at: string;
  address: string;
  services: {
    name: string;
    duration_minutes: number;
  };
  cleaners: {
    users: {
      full_name: string;
    } | null;
  } | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real app, fetch from API with auth context
    // Mock data for demonstration
    setBookings([
      {
        id: 'booking-1',
        status: 'confirmed',
        total_amount: 149,
        scheduled_at: new Date().toISOString(),
        address: '123 George St, Sydney NSW 2000',
        services: {
          name: 'Deep Clean',
          duration_minutes: 180,
        },
        cleaners: {
          users: {
            full_name: 'Sarah M.',
          },
        },
      },
    ]);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'badge-warning',
      matched: 'badge-info',
      confirmed: 'badge-success',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-error',
    };
    return badges[status as keyof typeof badges] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-600 mb-4">No bookings yet</p>
            <Link href="/services" className="btn-primary inline-block">
              Book a Clean
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{booking.services.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{booking.address}</p>
                  </div>
                  <span className={`badge ${getStatusBadge(booking.status)}`}>
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-semibold">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{booking.services.duration_minutes} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cleaner</p>
                    <p className="font-semibold">
                      {booking.cleaners?.users?.full_name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-semibold text-primary-600">${booking.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                    <Link
                      href={`/bookings/${booking.id}/track`}
                      className="btn-primary flex-1 text-center"
                    >
                      📍 Track Cleaner
                    </Link>
                  )}
                  <button className="btn-outline flex-1">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
