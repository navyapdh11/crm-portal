'use client';

import { useTheme } from '../../src/components/themes/ThemeProvider';

const vendors = [
  { id: 'bmw-dealership', name: 'BMW Authorized Dealer', theme: 'bmw', category: 'Automotive', color: 'bg-primary' },
  { id: 'shopify-boutique', name: 'Shopify Modern Boutique', theme: 'shopify', category: 'Retail', color: 'bg-primary' },
  { id: 'nepal-bazaar', name: 'Nepal Bazaar Local', theme: 'nepal', category: 'Grocery', color: 'bg-primary' },
];

export default function BazaarHub() {
  const { setTheme } = useTheme();

  return (
    <div className="py-12 bg-canvas min-h-screen">
      <h1 className="text-6xl font-display font-bold text-ink mb-12 text-center animate-fade-in-up">Nepal Bazaar 2.0</h1>
      
      {/* Bento Grid 2.0 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-6xl mx-auto">
        {vendors.map((vendor) => (
          <div 
            key={vendor.id} 
            className="group relative bg-surface-card p-8 border border-hairline rounded-theme shadow-squishy hover:shadow-squishy-active transition-all cursor-pointer overflow-hidden"
            onClick={() => {
              setTheme(vendor.theme as any);
              window.location.href = `/bazaar/${vendor.id}`;
            }}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${vendor.color} opacity-10 rounded-bl-full`} />
            <span className="text-sm font-bold uppercase tracking-wider text-muted">{vendor.category}</span>
            <h2 className="text-3xl font-display font-bold text-ink mt-2 mb-4">{vendor.name}</h2>
            <div className="w-16 h-2 bg-primary rounded-theme mb-6" />
            <p className="text-body leading-relaxed">Experience a high-octane shopping experience with our curated selection.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
