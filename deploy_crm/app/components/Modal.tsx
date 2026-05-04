"use client";

import { useState, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  if (!isOpen && !isAnimating) return null;
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className={`rounded-2xl p-6 w-full max-w-md transform transition-transform duration-200 ${isOpen ? 'scale-100' : 'scale-95'}`}
        style={{ 
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-gray-100"
          >
            <svg className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
}

export function FormField({ label, type = "text", placeholder, value, onChange, options }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
      {options ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm transition-all"
          style={{ 
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm transition-all"
          style={{ 
            background: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      )}
    </div>
  );
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "contact" | "deal" | "invoice" | "project";
}

export function ActionModal({ isOpen, onClose, type }: ActionModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  const getTitle = () => {
    switch (type) {
      case "contact": return "Add New Contact";
      case "deal": return "Create New Deal";
      case "invoice": return "Create Invoice";
      case "project": return "Start New Project";
    }
  };
  
  const getFields = () => {
    switch (type) {
      case "contact":
        return [
          { label: "Full Name", key: "name", placeholder: "John Smith" },
          { label: "Email", key: "email", type: "email", placeholder: "john@example.com" },
          { label: "Company", key: "company", placeholder: "Acme Corp" },
          { label: "Phone", key: "phone", placeholder: "+1 555-0123" },
        ];
      case "deal":
        return [
          { label: "Deal Name", key: "name", placeholder: "Enterprise Platform" },
          { label: "Company", key: "company", placeholder: "Acme Corp" },
          { label: "Value", key: "value", type: "number", placeholder: "50000" },
          { label: "Stage", key: "stage", options: [
            { value: "lead", label: "Lead" },
            { value: "qualified", label: "Qualified" },
            { value: "proposal", label: "Proposal" },
            { value: "negotiation", label: "Negotiation" },
          ]},
        ];
      case "invoice":
        return [
          { label: "Invoice Number", key: "number", placeholder: "INV-2026-001" },
          { label: "Client", key: "client", placeholder: "Acme Corp" },
          { label: "Amount", key: "amount", type: "number", placeholder: "5000" },
          { label: "Due Date", key: "dueDate", type: "date" },
        ];
      case "project":
        return [
          { label: "Project Name", key: "name", placeholder: "Website Redesign" },
          { label: "Client", key: "client", placeholder: "Acme Corp" },
          { label: "Budget", key: "budget", type: "number", placeholder: "50000" },
          { label: "Start Date", key: "startDate", type: "date" },
          { label: "End Date", key: "endDate", type: "date" },
        ];
    }
  };
  
  const handleSubmit = () => {
    alert(`${type === 'contact' ? 'Contact' : type === 'deal' ? 'Deal' : type === 'invoice' ? 'Invoice' : 'Project'} created!\n\nData: ${JSON.stringify(formData, null, 2)}`);
    onClose();
    setFormData({});
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      {getFields().map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          type={field.type || 'text'}
          placeholder={field.placeholder}
          value={formData[field.key] || ''}
          onChange={(value) => setFormData({ ...formData, [field.key]: value })}
          options={(field as any).options}
        />
      ))}
      <div className="flex gap-3 mt-6">
        <button 
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 btn-primary"
        >
          Create
        </button>
      </div>
    </Modal>
  );
}