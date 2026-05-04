'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPaymentIntent } from '@/lib/actions/payments';
import { autoAssignCleaner } from '@/lib/actions/matching';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const services = [
  { id: 'standard-clean', name: 'Standard Clean', price: 89, duration: 120 },
  { id: 'deep-clean', name: 'Deep Clean', price: 149, duration: 180 },
  { id: 'move-clean', name: 'Move In/Out Clean', price: 199, duration: 240 },
  { id: 'office-clean', name: 'Office Clean', price: 119, duration: 90 },
  { id: 'window-clean', name: 'Window Clean', price: 79, duration: 60 },
  { id: 'end-lease', name: 'End of Lease Clean', price: 249, duration: 300 },
];

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/success`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full btn-primary disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service') || 'standard-clean';

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postcode: '',
    latitude: -33.8688, // Default Sydney
    longitude: 151.2093,
    scheduledDate: '',
    scheduledTime: '10:00',
    notes: '',
  });

  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const service = services.find((s) => s.id === serviceId) || services[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user ID (would come from auth context in real app)
      const customerId = '00000000-0000-0000-0000-000000000000'; // Placeholder

      // Create booking
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      const { data: booking, error: bookingError } = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          serviceId: services.find((s) => s.id === serviceId)?.id,
          totalAmount: service.price,
          address: `${formData.address}, ${formData.city} ${formData.postcode}`,
          latitude: formData.latitude,
          longitude: formData.longitude,
          scheduledAt,
          notes: formData.notes,
        }),
      }).then((res) => res.json());

      if (bookingError || !booking) {
        setError('Failed to create booking');
        setLoading(false);
        return;
      }

      setBookingId(booking.id);

      // Auto-assign cleaner
      const { data: matchedCleaner, error: matchError } = await autoAssignCleaner(booking.id, {
        serviceId: services.find((s) => s.id === serviceId)?.id || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        scheduledAt,
      });

      // Create payment intent
      const paymentResult = await createPaymentIntent({
        bookingId: booking.id,
        customerId,
        serviceId: services.find((s) => s.id === serviceId)?.id || '',
        amount: service.price,
        cleanerId: matchedCleaner?.cleanerId,
      });

      if (paymentResult.error) {
        setError(paymentResult.error);
        setLoading(false);
        return;
      }

      setClientSecret(paymentResult.clientSecret || null);
      setStep(2);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-300'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-300'}`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">Book {service.name}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Sydney"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="2000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <select
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Any special instructions..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-2">Booking Summary</h3>
              <div className="flex justify-between text-sm mb-1">
                <span>{service.name} ({service.duration} min)</span>
                <span>${service.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Platform fee</span>
                <span>Included</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary-600">${service.price.toFixed(2)}</span>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            <button
              onClick={handleContinue}
              disabled={loading || !formData.address || !formData.scheduledDate}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue to Payment →'}
            </button>
          </div>
        )}

        {step === 2 && clientSecret && (
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">Payment</h1>
            <div className="mb-4 p-4 bg-green-50 rounded-xl">
              <p className="text-green-800 font-semibold">Booking Created!</p>
              <p className="text-green-700 text-sm">
                {bookingId ? `Booking ID: ${bookingId}` : ''}
              </p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
