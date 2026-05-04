'use client';

import { useEffect, useState } from 'react';
import { useCleanerLocationSubscription } from '@/hooks/useLocationTracker';
import { calculateETA, formatDistance, formatDuration } from '@/lib/location-utils';

interface BookingTrackingProps {
  bookingId: string;
  cleanerId: string;
  customerLat: number;
  customerLng: number;
  cleanerName: string;
  cleanerRating: number;
  estimatedArrival: string;
}

export default function BookingTracker({
  bookingId,
  cleanerId,
  customerLat,
  customerLng,
  cleanerName,
  cleanerRating,
  estimatedArrival,
}: BookingTrackingProps) {
  const cleanerLocation = useCleanerLocationSubscription(cleanerId);
  const [eta, setEta] = useState<{ distance: number; eta: number; etaFormatted: string } | null>(null);
  const [status, setStatus] = useState<'en_route' | 'arriving_soon' | 'arrived' | 'in_progress'>('en_route');

  useEffect(() => {
    if (cleanerLocation) {
      const etaData = calculateETA(
        cleanerLocation.latitude,
        cleanerLocation.longitude,
        customerLat,
        customerLng,
        cleanerLocation.speed ? cleanerLocation.speed * 3.6 : undefined // Convert m/s to km/h
      );
      setEta(etaData);

      // Update status based on ETA
      if (etaData.distance < 0.1) {
        setStatus('arrived');
      } else if (etaData.distance < 1) {
        setStatus('arriving_soon');
      } else {
        setStatus('en_route');
      }
    }
  }, [cleanerLocation, customerLat, customerLng]);

  const statusConfig = {
    en_route: {
      label: 'En Route',
      color: 'bg-blue-500',
      icon: '🚗',
      message: 'Your cleaner is on the way',
    },
    arriving_soon: {
      label: 'Arriving Soon',
      color: 'bg-yellow-500',
      icon: '⚡',
      message: 'Your cleaner is almost there!',
    },
    arrived: {
      label: 'Arrived',
      color: 'bg-green-500',
      icon: '✅',
      message: 'Your cleaner has arrived!',
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-purple-500',
      icon: '🧹',
      message: 'Cleaning in progress',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
            <div className={`px-4 py-2 rounded-full ${currentStatus.color} text-white font-semibold text-sm`}>
              {currentStatus.icon} {currentStatus.label}
            </div>
          </div>
          <p className="text-gray-600">{currentStatus.message}</p>
        </div>

        {/* Cleaner Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {cleanerName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{cleanerName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-gray-700">{cleanerRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Estimated Arrival</p>
              <p className="text-lg font-semibold text-gray-900">{estimatedArrival}</p>
            </div>
          </div>
        </div>

        {/* ETA Card */}
        {eta && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 mb-1">Distance</p>
                <p className="text-2xl font-bold text-blue-900">{formatDistance(eta.distance)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-600 mb-1">ETA</p>
                <p className="text-2xl font-bold text-green-900">{eta.etaFormatted}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="relative">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {status === 'arrived' || status === 'in_progress' ? '100%' : eta ? Math.max(0, 100 - Math.round(eta.eta / 60 * 100)) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  status === 'arrived' || status === 'in_progress'
                    ? 'bg-green-500'
                    : status === 'arriving_soon'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${status === 'arrived' || status === 'in_progress'
                    ? 100
                    : eta
                    ? Math.max(0, 100 - Math.round(eta.eta / 60 * 100))
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Map Placeholder (integrate with Google Maps or Mapbox) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="relative h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-600">Map Integration</p>
              <p className="text-sm text-gray-500 mt-1">
                Connect Google Maps or Mapbox for live tracking
              </p>
              {cleanerLocation && (
                <p className="text-xs text-gray-400 mt-2">
                  Cleaner: {cleanerLocation.latitude.toFixed(4)}, {cleanerLocation.longitude.toFixed(4)}
                </p>
              )}
            </div>
            {/* Animated cleaner icon */}
            <div
              className="absolute transition-all duration-1000 text-3xl"
              style={{
                left: cleanerLocation
                  ? `${((cleanerLocation.longitude - customerLng) / 0.01 + 0.5) * 100}%`
                  : '50%',
                top: cleanerLocation
                  ? `${((customerLat - cleanerLocation.latitude) / 0.01 + 0.5) * 100}%`
                  : '50%',
              }}
            >
              🚗
            </div>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition">
            📞 Call Cleaner
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition">
            💬 Message
          </button>
        </div>
      </div>
    </div>
  );
}
