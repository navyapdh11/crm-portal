"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stat {
  label: string;
  value: number;
  change: string;
  prefix?: string;
  suffix?: string;
}

const stats: Stat[] = [
  { label: "Total Contacts", value: 124, change: "+12%", prefix: "", suffix: "" },
  { label: "Active Deals", value: 45, change: "+8%", prefix: "", suffix: "" },
  { label: "Revenue Due", value: 12450, change: "-3%", prefix: "$", suffix: "" },
  { label: "Active Projects", value: 18, change: "+5%", prefix: "", suffix: "" },
];

const activities = [
  { type: "contact", message: "New contact added: John Smith", time: "2 hours ago", icon: "👤" },
  { type: "deal", message: "Deal moved to negotiation: Acme Corp", time: "4 hours ago", icon: "📈" },
  { type: "invoice", message: "Invoice #1234 sent to Client Co", time: "1 day ago", icon: "📄" },
  { type: "project", message: "Project 'Website Redesign' completed", time: "2 days ago", icon: "🎯" },
  { type: "contact", message: "Sarah Johnson updated profile", time: "3 days ago", icon: "✏️" },
];

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
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
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const isPositive = stat.change.startsWith("+");
  
  return (
    <div 
      className="p-6 rounded-2xl animate-fade-in-up card-hover"
      style={{ 
        animationDelay: `${0.1 + index * 0.1}s`,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
          <svg className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPositive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
          </svg>
        </div>
      </div>
      
      <div className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
        <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {stat.change}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>vs last month</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
        <p className="animate-fade-in-up animate-stagger-1" style={{ color: 'var(--color-text-secondary)' }}>
          Welcome back! Here's what's happening with your business.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="p-6 rounded-2xl animate-fade-in-up animate-stagger-5"
          style={{ 
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              Recent Activity
            </h2>
            <button className="text-sm font-medium" style={{ color: 'var(--color-accent)' }} onClick={() => alert('View all activity')}>View all</button>
          </div>
          
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl transition-all table-row-hover"
                style={{ animationDelay: `${0.6 + index * 0.05}s` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: 'var(--color-bg-subtle)' }}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {activity.message}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div 
          className="p-6 rounded-2xl animate-fade-in-up animate-stagger-6"
          style={{ 
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Contact", icon: "➕", href: "/contacts" },
              { label: "Create Invoice", icon: "📝", href: "/invoices" },
              { label: "New Deal", icon: "💼", href: "/deals" },
              { label: "Start Project", icon: "🚀", href: "/projects" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all card-hover"
                style={{ 
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}