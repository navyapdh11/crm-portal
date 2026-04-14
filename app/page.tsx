import Link from "next/link";

export default function Home() {
  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to CRM Portal</h1>
        <p className="text-gray-600 mb-8">
          Multi-tenant CRM, Invoice Generator, and Client Portal system
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard" className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600 text-sm">Overview of your business metrics</p>
          </Link>
          
          <Link href="/contacts" className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contacts</h2>
            <p className="text-gray-600 text-sm">Manage your customer contacts</p>
          </Link>
          
          <Link href="/deals" className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Deals</h2>
            <p className="text-gray-600 text-sm">Track your sales pipeline</p>
          </Link>
          
          <Link href="/invoices" className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Invoices</h2>
            <p className="text-gray-600 text-sm">Create and manage invoices</p>
          </Link>
          
          <Link href="/projects" className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Projects</h2>
            <p className="text-gray-600 text-sm">Track client projects</p>
          </Link>
          
          <Link href="/api" className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">API</h2>
            <p className="text-gray-600 text-sm">API documentation (OpenAPI)</p>
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900">Quick Start</h3>
          <p className="text-blue-700 text-sm mt-1">
            Use the API with: <code className="bg-blue-100 px-1 rounded">X-Tenant-Id</code> header for multi-tenancy
          </p>
        </div>
      </div>
    </div>
  );
}