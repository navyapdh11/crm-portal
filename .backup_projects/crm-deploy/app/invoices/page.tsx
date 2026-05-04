"use client";

import { useState } from "react";

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: number;
}

const invoices: Invoice[] = [
  { id: "1", number: "INV-2026-001", client: "Acme Corp", amount: 5000, dueDate: "2026-04-20", status: "sent", items: 3 },
  { id: "2", number: "INV-2026-002", client: "TechCo", amount: 3250, dueDate: "2026-04-15", status: "paid", items: 2 },
  { id: "3", number: "INV-2026-003", client: "Global Corp", amount: 12500, dueDate: "2026-04-25", status: "sent", items: 5 },
  { id: "4", number: "INV-2026-004", client: "Startup Inc", amount: 2800, dueDate: "2026-04-10", status: "overdue", items: 1 },
  { id: "5", number: "INV-2026-005", client: "Enterprise Ltd", amount: 8900, dueDate: "2026-04-30", status: "draft", items: 4 },
  { id: "6", number: "INV-2026-006", client: "Retail Plus", amount: 4500, dueDate: "2026-04-18", status: "paid", items: 2 },
];

const statusConfig: Record<string, { label: string; class: string; icon: string }> = {
  draft: { label: "Draft", class: "badge", icon: "📝" },
  sent: { label: "Sent", class: "badge badge-info", icon: "📤" },
  paid: { label: "Paid", class: "badge badge-success", icon: "✅" },
  overdue: { label: "Overdue", class: "badge badge-error", icon: "⚠️" },
  cancelled: { label: "Cancelled", class: "badge badge-warning", icon: "❌" },
};

export default function Invoices() {
  const [filter, setFilter] = useState<string>("all");
  
  const filteredInvoices = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const totalDue = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;
  
  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-1 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Invoices
          </h1>
          <p className="animate-fade-in-up animate-stagger-1" style={{ color: 'var(--color-text-secondary)' }}>
            Manage billing and payments
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 animate-fade-in-up animate-stagger-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Due", value: formatCurrency(totalDue), sub: `${invoices.filter(i => i.status === "sent").length} pending`, color: "var(--color-warning)" },
          { label: "Paid This Month", value: formatCurrency(totalPaid), sub: `${invoices.filter(i => i.status === "paid").length} invoices`, color: "var(--color-success)" },
          { label: "Overdue", value: overdueCount.toString(), sub: formatCurrency(invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0)), color: "var(--color-error)" },
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="p-5 rounded-2xl animate-fade-in-up"
            style={{ animationDelay: `${0.1 + index * 0.1}s`, background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: stat.color }} />
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-fade-in-up animate-stagger-3">
        {["all", "draft", "sent", "paid", "overdue"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={{ 
              background: filter === status ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
              color: filter === status ? 'white' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            {status === "all" ? "All Invoices" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      
      <div 
        className="rounded-2xl overflow-hidden animate-fade-in-up animate-stagger-4"
        style={{ 
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)' }}>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {filteredInvoices.map((invoice, index) => {
                const config = statusConfig[invoice.status];
                return (
                  <tr 
                    key={invoice.id} 
                    className="table-row-hover"
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{invoice.number}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>{invoice.items} items</span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{invoice.client}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(invoice.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(invoice.dueDate)}</td>
                    <td className="px-6 py-4">
                      <span className={config.class}>{config.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 rounded-lg transition-all hover:bg-gray-100">
                        <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}