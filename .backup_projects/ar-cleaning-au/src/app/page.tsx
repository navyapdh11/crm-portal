import Link from 'next/link';

const services = [
  {
    id: 'standard-clean',
    name: 'Standard Clean',
    description: 'Regular house cleaning including dusting, vacuuming, and mopping',
    price: 89,
    duration: '2 hours',
    icon: '🧹',
    category: 'standard',
  },
  {
    id: 'deep-clean',
    name: 'Deep Clean',
    description: 'Thorough cleaning of all areas including hard-to-reach spots',
    price: 149,
    duration: '3 hours',
    icon: '✨',
    category: 'deep',
  },
  {
    id: 'move-clean',
    name: 'Move In/Out Clean',
    description: 'Complete cleaning for property transitions',
    price: 199,
    duration: '4 hours',
    icon: '📦',
    category: 'special',
  },
  {
    id: 'office-clean',
    name: 'Office Clean',
    description: 'Professional office and workspace cleaning',
    price: 119,
    duration: '1.5 hours',
    icon: '🏢',
    category: 'commercial',
  },
  {
    id: 'window-clean',
    name: 'Window Clean',
    description: 'Interior and exterior window cleaning',
    price: 79,
    duration: '1 hour',
    icon: '🪟',
    category: 'add-on',
  },
  {
    id: 'end-lease',
    name: 'End of Lease Clean',
    description: 'Bond-back guaranteed end of lease cleaning',
    price: 249,
    duration: '5 hours',
    icon: '🔑',
    category: 'special',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <nav className="flex justify-between items-center mb-16">
            <Link href="/" className="text-2xl font-bold">
              🧹 AR Cleaning AU
            </Link>
            <div className="flex gap-4">
              <Link href="/services" className="hover:text-primary-200 transition">
                Services
              </Link>
              <Link href="/bookings" className="hover:text-primary-200 transition">
                My Bookings
              </Link>
              <Link href="/cleaners" className="hover:text-primary-200 transition">
                Become a Cleaner
              </Link>
            </div>
          </nav>

          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">
              Premium Cleaning Services
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Book trusted cleaners in your area with real-time tracking
            </p>
            <Link href="/services" className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition inline-block">
              Book Now →
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-600">
              Track your cleaner's arrival live, just like Uber
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">Verified Cleaners</h3>
            <p className="text-gray-600">
              All cleaners are background-checked and rated
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
            <p className="text-gray-600">
              Pay securely with Stripe, only after service completion
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              href={`/booking?service=${service.id}`}
              key={service.id}
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold text-primary-600">${service.price}</span>
                  <span className="text-gray-500 ml-2">/ {service.duration}</span>
                </div>
                <span className="badge badge-info capitalize">{service.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-accent-600 to-accent-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for a Cleaner Space?</h2>
          <p className="text-xl text-accent-100 mb-8">
            Join thousands of happy customers across Australia
          </p>
          <Link href="/services" className="bg-white text-accent-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent-50 transition inline-block">
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-4">AR Cleaning AU</h4>
            <p className="text-sm">Premium cleaning services with real-time tracking</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="hover:text-white transition">Standard Clean</Link></li>
              <li><Link href="/services" className="hover:text-white transition">Deep Clean</Link></li>
              <li><Link href="/services" className="hover:text-white transition">End of Lease</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">About</Link></li>
              <li><Link href="/cleaners" className="hover:text-white transition">Become a Cleaner</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © 2026 AR Cleaning AU. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
