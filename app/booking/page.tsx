'use client';

import { useState } from 'react';

export default function BookingPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="py-12">
      <h1 className="text-4xl font-display font-bold text-ink mb-8">Vibe Booking</h1>
      
      {step === 1 && (
        <div className="bg-surface-card p-12 border border-hairline text-center">
          <h2 className="text-2xl font-display mb-6">Describe your vibe...</h2>
          <input 
            type="text" 
            placeholder="e.g. 'Quiet meeting spot with tea'" 
            className="w-full max-w-lg p-4 border border-hairline rounded-theme bg-canvas"
          />
          <button 
            onClick={() => setStep(2)}
            className="mt-6 bg-primary text-on-primary px-8 py-3 rounded-theme"
          >
            Find Match
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-surface-card p-8 border border-hairline w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-display mb-4">Glass Card Checkout</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-hairline pb-2">
                <span>Total</span>
                <span className="font-bold">Rs 2,500</span>
              </div>
              <button 
                onClick={() => alert('Booked!')}
                className="w-full bg-primary text-on-primary py-3 rounded-theme"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
