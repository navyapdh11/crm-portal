"use client";

import { useState, useEffect } from "react";
import { ActionModal } from "../components/Modal";

interface Project {
  id: number;
  name: string;
  client: string;
  status: "onboarding" | "active" | "paused" | "completed" | "archived";
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  team: string[];
}

const projects: Project[] = [
  { id: 1, name: "Website Redesign", client: "Acme Corp", status: "active", progress: 65, startDate: "2026-02-01", endDate: "2026-05-15", budget: 45000, team: ["JD", "SK", "MR"] },
  { id: 2, name: "Mobile App", client: "TechCo", status: "onboarding", progress: 20, startDate: "2026-03-15", endDate: "2026-08-30", budget: 85000, team: ["AL", "TB"] },
  { id: 3, name: "CRM Integration", client: "Global Corp", status: "active", progress: 45, startDate: "2026-01-15", endDate: "2026-04-30", budget: 32000, team: ["JD", "NP"] },
  { id: 4, name: "Data Analytics", client: "Startup Inc", status: "paused", progress: 80, startDate: "2026-01-01", endDate: "2026-03-31", budget: 28000, team: ["MR"] },
  { id: 5, name: "API Development", client: "Enterprise Ltd", status: "completed", progress: 100, startDate: "2025-11-01", endDate: "2026-02-28", budget: 55000, team: ["SK", "AL", "TB"] },
  { id: 6, name: "Security Audit", client: "Retail Plus", status: "active", progress: 35, startDate: "2026-03-01", endDate: "2026-05-15", budget: 18000, team: ["NP"] },
];

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  onboarding: { label: "Onboarding", bg: "var(--color-info-bg)", text: "var(--color-info)", icon: "🚀" },
  active: { label: "Active", bg: "var(--color-success-bg)", text: "var(--color-success)", icon: "⚡" },
  paused: { label: "Paused", bg: "var(--color-warning-bg)", text: "var(--color-warning)", icon: "⏸️" },
  completed: { label: "Completed", bg: "var(--color-accent-subtle)", text: "var(--color-accent)", icon: "✅" },
  archived: { label: "Archived", bg: "var(--color-bg-subtle)", text: "var(--color-text-tertiary)", icon: "📦" },
};

function AnimatedProgress({ progress }: { progress: number }) {
  const [currentProgress, setCurrentProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setCurrentProgress(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);
  
  return (
    <div className="w-full h-2 rounded-full" style={{ background: 'var(--color-bg-subtle)' }}>
      <div 
        className="h-full rounded-full progress-fill"
        style={{ width: `${currentProgress}%` }}
      />
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const config = statusConfig[project.status];
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div 
      className="p-6 rounded-2xl animate-fade-in-up card-hover"
      style={{ 
        animationDelay: `${0.2 + index * 0.1}s`,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{project.name}</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{project.client}</p>
        </div>
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: config.bg, color: config.text }}
        >
          {config.icon} {config.label}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: 'var(--color-text-tertiary)' }}>Progress</span>
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{project.progress}%</span>
        </div>
        <AnimatedProgress progress={project.progress} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Timeline</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Budget</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            ${project.budget.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.team.map((member, i) => (
            <div 
              key={i}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2"
              style={{ 
                background: 'var(--color-accent-subtle)', 
                color: 'var(--color-accent)',
                borderColor: 'var(--color-surface)'
              }}
            >
              {member}
            </div>
          ))}
        </div>
        <button 
          className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--color-accent)', background: 'var(--color-accent-subtle)' }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  
  const filteredProjects = filter === "all" ? projects : projects.filter(p => p.status === filter);
  
  const activeCount = projects.filter(p => p.status === "active").length;
  const completedCount = projects.filter(p => p.status === "completed").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  
  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-1 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Projects
          </h1>
          <p className="animate-fade-in-up animate-stagger-1" style={{ color: 'var(--color-text-secondary)' }}>
            Track and manage client projects
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 animate-fade-in-up animate-stagger-2" onClick={() => setShowModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Projects", value: activeCount, icon: "⚡" },
          { label: "Completed", value: completedCount, icon: "✅" },
          { label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}k`, icon: "💰" },
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="p-5 rounded-2xl animate-fade-in-up"
            style={{ animationDelay: `${0.1 + index * 0.1}s`, background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-fade-in-up animate-stagger-3">
        {["all", "onboarding", "active", "paused", "completed", "archived"].map((status) => (
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
            {status === "all" ? "All Projects" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
      
      <ActionModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        type="project" 
      />
    </div>
  );
}