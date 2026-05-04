'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  heading: number | null;
  timestamp: number;
}

interface UseLocationTrackerProps {
  cleanerId: string;
  isActive?: boolean;
  updateInterval?: number;
}

export function useLocationTracker({
  cleanerId,
  isActive = false,
  updateInterval = 3000,
}: UseLocationTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const updateLocation = useCallback(async (location: GeolocationPosition) => {
    const now = Date.now();
    // Throttle updates to interval
    if (now - lastUpdateRef.current < updateInterval) return;
    lastUpdateRef.current = now;

    const { latitude, longitude, speed, accuracy, heading } = location.coords;

    const locationData: LocationData = {
      latitude,
      longitude,
      speed,
      accuracy,
      heading,
      timestamp: now,
    };

    setCurrentLocation(locationData);

    // Update cleaner's current location in database
    await supabase
      .from('cleaners')
      .update({
        current_location: `POINT(${longitude} ${latitude})`,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', cleanerId);

    // Insert detailed location record
    await supabase.from('cleaner_locations').insert({
      cleaner_id: cleanerId,
      location: `POINT(${longitude} ${latitude})`,
      speed: speed || 0,
      heading: heading || 0,
      accuracy: accuracy || 10,
    });
  }, [cleanerId, updateInterval]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return;
    }

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        console.error('Location watch error:', error);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: updateInterval,
      }
    );
  }, [updateLocation, updateInterval]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking();
    } else if (!isActive && isTracking) {
      stopTracking();
    }
  }, [isActive, isTracking, startTracking, stopTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    currentLocation,
    isTracking,
    startTracking,
    stopTracking,
  };
}

// Hook to subscribe to cleaner location updates via Supabase Realtime
export function useCleanerLocationSubscription(cleanerId: string | null) {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    accuracy: number;
    updated_at: string;
  } | null>(null);

  useEffect(() => {
    if (!cleanerId) return;

    // Subscribe to cleaner_locations table changes
    const channel = supabase
      .channel(`cleaner-location-${cleanerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cleaner_locations',
          filter: `cleaner_id=eq.${cleanerId}`,
        },
        (payload) => {
          const newLocation = payload.new as any;
          // Extract lat/lng from PostGIS POINT
          const pointMatch = newLocation.location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
          if (pointMatch) {
            setLocation({
              longitude: parseFloat(pointMatch[1]),
              latitude: parseFloat(pointMatch[2]),
              speed: newLocation.speed,
              heading: newLocation.heading,
              accuracy: newLocation.accuracy,
              updated_at: newLocation.created_at,
            });
          }
        }
      )
      .subscribe();

    // Fetch latest location
    const fetchLatestLocation = async () => {
      const { data } = await supabase
        .from('cleaner_locations')
        .select('location, speed, heading, accuracy, created_at')
        .eq('cleaner_id', cleanerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const pointMatch = data.location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
        if (pointMatch) {
          setLocation({
            longitude: parseFloat(pointMatch[1]),
            latitude: parseFloat(pointMatch[2]),
            speed: data.speed,
            heading: data.heading,
            accuracy: data.accuracy,
            updated_at: data.created_at,
          });
        }
      }
    };

    fetchLatestLocation();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cleanerId]);

  return location;
}
