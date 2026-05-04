"use client";

import { useState } from "react";
import { ActionModal } from "../components/Modal";

const contacts = [
  { id: 1, name: "John Smith", email: "john@acme.com", company: "Acme Corp", phone: "+1 555-0123", status: "active" },
  { id: 2, name: "Sarah Johnson", email: "sarah@techco.io", company: "TechCo", phone: "+1 555-0456", status: "active" },
  { id: 3, name: "Michael Chen", email: "michael@startup.com", company: "Startup Inc", phone: "+1 555-0789", status: "lead" },
  { id: 4, name: "Emily Davis", email: "emily@enterprise.co", company: "Enterprise Ltd", phone: "+1 555-0321", status: "inactive" },
  { id: 5, name: "David Wilson", email: "david@global.net", company: "Global Corp", phone: "+1 555-0654", status: "active" },
];

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<typeof contacts[0] | null>(null);
  
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-1 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Contacts
          </h1>
          <p className="animate-fade-in-up animate-stagger-1" style={{ color: 'var(--color-text-secondary)' }}>
            Manage your customer relationships
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 animate-fade-in-up animate-stagger-2" onClick={() => setShowModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>
      
      <div 
        className="p-4 rounded-2xl mb-6 animate-fade-in-up animate-stagger-3"
        style={{ 
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
            style={{ 
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
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
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Company</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {filteredContacts.map((contact, index) => (
                <tr 
                  key={contact.id} 
                  className="table-row-hover"
                  style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{contact.email}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{contact.company}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{contact.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${contact.status === 'active' ? 'badge-success' : contact.status === 'lead' ? 'badge-info' : 'badge-warning'}`}>
                        {contact.status}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); }}
                        className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
                        title="View details"
                      >
                        <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ActionModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        type="contact" 
      />
      
      {selectedContact && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSelectedContact(null)}
        >
          <div 
            className="rounded-2xl p-6 w-full max-w-md"
            style={{ 
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Contact Details</h2>
              <button onClick={() => setSelectedContact(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <p><span className="font-medium">Name:</span> {selectedContact.name}</p>
              <p><span className="font-medium">Email:</span> {selectedContact.email}</p>
              <p><span className="font-medium">Company:</span> {selectedContact.company}</p>
              <p><span className="font-medium">Phone:</span> {selectedContact.phone}</p>
              <p><span className="font-medium">Status:</span> {selectedContact.status}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setSelectedContact(null)}
                className="flex-1 px-4 py-3 rounded-xl font-medium"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Close
              </button>
              <button className="flex-1 btn-primary">
                Edit Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}