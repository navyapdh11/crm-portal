"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

const features = [
  {
    title: "Dashboard",
    description: "Overview of your business metrics",
    href: "/dashboard",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Contacts",
    description: "Manage your customer contacts",
    href: "/contacts",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Deals",
    description: "Track your sales pipeline",
    href: "/deals",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Invoices",
    description: "Create and manage invoices",
    href: "/invoices",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Projects",
    description: "Track client projects",
    href: "/projects",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: "from-rose-500 to-pink-500",
  },
];

function AnimatedStat({ label, value, suffix = "" }: Stat) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className="inline-flex">
      {displayValue}
      {suffix}
    </span>
  );
}

export default function Home() {
  return (
    <div className="py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in-up" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent)' }} />
          <span className="text-sm font-medium">Multi-tenant CRM System</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl mb-6 animate-fade-in-up animate-stagger-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
          Welcome to <span style={{ color: 'var(--color-accent)' }}>CRM Portal</span>
        </h1>
        
        <p className="text-xl max-w-2xl mx-auto mb-8 animate-fade-in-up animate-stagger-2" style={{ color: 'var(--color-text-secondary)' }}>
          Streamline your business with our comprehensive CRM, invoice management, and client portal platform.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in-up animate-stagger-3">
          <Link href="/dashboard" className="btn-primary">
            Get Started
          </Link>
          <Link 
            href="/api" 
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            API Docs
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up animate-stagger-4">
          {(
            [
              { label: "Contacts", value: 124 },
              { label: "Active Deals", value: 45 },
              { label: "Invoices", value: 89 },
              { label: "Projects", value: 18 },
            ] as Stat[]
          ).map((stat, index) => (
            <div 
              key={stat.label}
              className="p-4 rounded-xl"
              style={{ 
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div className="text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                <AnimatedStat value={stat.value} />
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <Link 
            key={feature.title} 
            href={feature.href}
            className="group p-6 rounded-2xl animate-fade-in-up"
            style={{ 
              animationDelay: `${0.4 + index * 0.1}s`,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${feature.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {feature.title}
            </h3>
            
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {feature.description}
            </p>
            
            <div className="mt-4 flex items-center text-sm font-medium group-hover:gap-2 transition-all" style={{ color: 'var(--color-accent)' }}>
              <span>Explore</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-16 p-8 rounded-2xl max-w-3xl mx-auto animate-fade-in-up animate-stagger-6" style={{ background: 'linear-gradient(135deg, var(--color-bg-subtle) 0%, var(--color-bg-elevated) 100%)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--color-accent-subtle)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>API Quick Start</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Use the API with the <code className="px-2 py-1 rounded text-sm" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>X-Tenant-Id</code> header for multi-tenancy.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-info">REST API</span>
              <span className="badge badge-success">OpenAPI</span>
              <span className="badge badge-warning">JWT Auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}