import Link from "next/link";

export default function ApiDocs() {
  return (
    <div className="py-12 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-4 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          API Documentation
        </h1>
        <p className="text-lg animate-fade-in-up animate-stagger-1" style={{ color: 'var(--color-text-secondary)' }}>
          RESTful API for multi-tenant CRM, Invoices, and Projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="p-6 rounded-2xl animate-fade-in-up animate-stagger-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Authentication</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            JWT-based authentication with Bearer tokens.
          </p>
          <code className="block p-3 rounded-lg text-sm" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
            Authorization: Bearer &lt;token&gt;
          </code>
        </div>

        <div className="p-6 rounded-2xl animate-fade-in-up animate-stagger-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Multi-Tenancy</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            All requests require tenant identification via header.
          </p>
          <code className="block p-3 rounded-lg text-sm" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
            X-Tenant-Id: &lt;uuid&gt;
          </code>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 animate-fade-in-up animate-stagger-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Available Endpoints
        </h2>
        <div className="space-y-4">
          {[
            { method: "GET", path: "/tenants/{tenant_id}/contacts", desc: "List contacts" },
            { method: "POST", path: "/tenants/{tenant_id}/contacts", desc: "Create contact" },
            { method: "GET", path: "/tenants/{tenant_id}/deals", desc: "List deals" },
            { method: "POST", path: "/tenants/{tenant_id}/deals", desc: "Create deal" },
            { method: "GET", path: "/tenants/{tenant_id}/invoices", desc: "List invoices" },
            { method: "POST", path: "/tenants/{tenant_id}/invoices", desc: "Create invoice" },
            { method: "GET", path: "/tenants/{tenant_id}/projects", desc: "List projects" },
            { method: "POST", path: "/tenants/{tenant_id}/projects", desc: "Create project" },
            { method: "POST", path: "/tenants/{tenant_id}/trigger", desc: "Trigger automation" },
            { method: "POST", path: "/internal/agents/{agent_id}/invoke", desc: "Invoke agent" },
          ].map((endpoint, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl animate-fade-in-up"
              style={{ animationDelay: `${0.5 + i * 0.05}s`, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {endpoint.method}
              </span>
              <code className="flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{endpoint.path}</code>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{endpoint.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}