'use client';

import { useTheme } from '../../src/components/themes/ThemeProvider';

const vendors = [
  { id: 'bmw-dealership', name: 'BMW Authorized Dealer', theme: 'bmw' },
  { id: 'shopify-boutique', name: 'Shopify Modern Boutique', theme: 'shopify' },
  { id: 'nepal-bazaar', name: 'Nepal Bazaar Local', theme: 'nepal' },
];

export default function BazaarHub() {
  const { setTheme } = useTheme();

  return (
    <div className="py-12">
      <h1 className="text-4xl font-display font-bold text-ink mb-8">Nepal Bazaar</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="border border-hairline p-6 hover:border-primary transition-colors">
            <h2 className="text-xl font-display font-semibold text-ink">{vendor.name}</h2>
            <p className="text-body mb-4">A unique shopping experience.</p>
            <button 
              onClick={() => {
                setTheme(vendor.theme as any);
                window.location.href = `/bazaar/${vendor.id}`;
              }}
              className="bg-primary text-on-primary px-4 py-2 rounded-theme"
            >
              Visit Storefront
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
