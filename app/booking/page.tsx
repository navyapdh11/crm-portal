'use client';

import { useState } from 'react';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [vibe, setVibe] = useState('');

  return (
    <div className="min-h-screen bg-canvas text-ink p-8">
      <h1 className="text-5xl font-display font-bold mb-12 animate-fade-in-up">Vibe Concierge</h1>
      
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-scale">
          <div className="bg-surface-card p-10 border border-hairline rounded-theme">
            <h2 className="text-3xl font-display mb-6">How are you feeling today?</h2>
            <textarea 
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. 'A quiet place for a business meeting, maybe a Ming-style tea house?'" 
              className="w-full p-6 border border-hairline rounded-theme bg-canvas text-lg h-32"
            />
            <button 
              onClick={() => setStep(2)}
              className="mt-8 bg-primary text-on-primary px-10 py-4 text-lg font-bold rounded-theme hover:bg-primary-active transition-all"
            >
              Consult the Vibe Agent
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in-up">
          <div className="bg-surface-card p-8 border border-hairline rounded-theme">
            <h3 className="text-2xl font-display mb-6">Spatial Preview</h3>
            <div className="aspect-video bg-surface-dark flex items-center justify-center rounded-theme mb-6">
              <span className="text-on-dark font-display">3D Dollhouse View</span>
            </div>
            <div className="flex justify-between items-center p-4 border border-hairline bg-canvas">
              <span className="font-bold">Social Bounty: +Rs 200</span>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-theme">Share & Split</button>
            </div>
          </div>

          <div className="bg-surface-card p-8 border border-hairline rounded-theme">
            <h3 className="text-2xl font-display mb-6">Zero-Click Checkout</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-xl">
                <span>Final Price</span>
                <span className="font-bold text-primary">Rs 2,300</span>
              </div>
              <button 
                onClick={() => alert('Booking Confirmed!')}
                className="w-full bg-primary text-on-primary py-4 text-xl font-bold rounded-theme hover:shadow-lg transition-all"
              >
                Face-Scan to Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
