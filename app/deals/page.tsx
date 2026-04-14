"use client";

import { useState, useRef } from "react";
import { ActionModal } from "../components/Modal";

interface Deal {
  id: number;
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
}

const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const dealsByStage: Record<string, Deal[]> = {
  "Lead": [
    { id: 1, name: "Acme Corp Expansion", company: "Acme Corp", value: 15000, stage: "Lead", probability: 20 },
    { id: 2, name: "TechCo Pilot", company: "TechCo", value: 8500, stage: "Lead", probability: 15 },
    { id: 3, name: "Startup MVP", company: "Startup Inc", value: 12000, stage: "Lead", probability: 10 },
  ],
  "Qualified": [
    { id: 4, name: "Enterprise Platform", company: "Global Corp", value: 45000, stage: "Qualified", probability: 40 },
    { id: 5, name: "Retail Integration", company: "Retail Plus", value: 22000, stage: "Qualified", probability: 35 },
  ],
  "Proposal": [
    { id: 6, name: "Healthcare System", company: "MedCare", value: 85000, stage: "Proposal", probability: 60 },
    { id: 7, name: "FinTech Dashboard", company: "BankTech", value: 38000, stage: "Proposal", probability: 55 },
  ],
  "Negotiation": [
    { id: 8, name: "E-commerce Platform", company: "ShopSmart", value: 28000, stage: "Negotiation", probability: 75 },
  ],
  "Closed Won": [
    { id: 9, name: "SaaS Migration", company: "CloudFirst", value: 35000, stage: "Closed Won", probability: 100 },
    { id: 10, name: "Data Analytics", company: "Insight Co", value: 18000, stage: "Closed Won", probability: 100 },
  ],
  "Closed Lost": [
    { id: 11, name: "Legacy Upgrade", company: "OldTech", value: 12000, stage: "Closed Lost", probability: 0 },
  ],
};

const stageColors: Record<string, string> = {
  "Lead": "from-slate-400 to-gray-500",
  "Qualified": "from-blue-400 to-indigo-500",
  "Proposal": "from-amber-400 to-orange-500",
  "Negotiation": "from-emerald-400 to-teal-500",
  "Closed Won": "from-green-400 to-emerald-500",
  "Closed Lost": "from-red-400 to-rose-500",
};

export default function Deals() {
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [localDeals, setLocalDeals] = useState(dealsByStage);
  const dragOverRef = useRef<string | null>(null);
  
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };
  
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    dragOverRef.current = stage;
  };
  
  const handleDrop = (targetStage: string) => {
    if (draggedDeal && targetStage !== "Closed Won" && targetStage !== "Closed Lost") {
      setLocalDeals((prev) => {
        const newDeals = { ...prev };
        Object.keys(newDeals).forEach((key) => {
          newDeals[key] = newDeals[key].filter((d) => d.id !== draggedDeal.id);
        });
        const updatedDeal = { ...draggedDeal, stage: targetStage };
        newDeals[targetStage] = [...(newDeals[targetStage] || []), updatedDeal];
        return newDeals;
      });
      setDraggedDeal(null);
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };
  
  const totalValue = Object.values(localDeals).flat().reduce((sum, deal) => sum + deal.value, 0);
  const pipelineValue = [...localDeals["Lead"], ...localDeals["Qualified"], ...localDeals["Proposal"], ...localDeals["Negotiation"]].reduce((sum, deal) => sum + deal.value, 0);
  
  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold mb-1 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Deals
          </h1>
          <p className="animate-fade-in-up animate-stagger-1" style={{ color: 'var(--color-text-secondary)' }}>
            Track your sales pipeline
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 animate-fade-in-up animate-stagger-2" onClick={() => setShowModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Deal
        </button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Pipeline", value: formatCurrency(pipelineValue), sub: `${Object.values(localDeals).flat().filter(d => d.stage !== "Closed Won" && d.stage !== "Closed Lost").length} deals` },
          { label: "Closed Won", value: formatCurrency(localDeals["Closed Won"].reduce((s, d) => s + d.value, 0)), sub: "This quarter" },
          { label: "Win Rate", value: "32%", sub: "+5% vs last month" },
          { label: "Avg Deal Size", value: formatCurrency(Math.round(pipelineValue / 4)), sub: "4 active deals" },
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="p-5 rounded-2xl animate-fade-in-up"
            style={{ animationDelay: `${0.1 + index * 0.1}s`, background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
            <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage, stageIndex) => {
          const stageDeals = localDeals[stage] || [];
          const stageTotal = stageDeals.reduce((s, d) => s + d.value, 0);
          
          return (
            <div 
              key={stage}
              className="rounded-2xl p-4 animate-fade-in-up"
              style={{ 
                animationDelay: `${0.3 + stageIndex * 0.05}s`,
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)'
              }}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDrop={() => handleDrop(stage)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${stageColors[stage]}`} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{stage}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }}>
                  {stageDeals.length}
                </span>
              </div>
              
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(stageTotal)}</p>
              
              <div className="space-y-2">
                {stageDeals.map((deal, dealIndex) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    className="p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all card-hover"
                    style={{ 
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                      animationDelay: `${0.4 + stageIndex * 0.05 + dealIndex * 0.03}s`
                    }}
                  >
                    <p className="font-medium text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{deal.company}</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>{deal.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>{formatCurrency(deal.value)}</span>
                      {deal.stage !== "Closed Won" && deal.stage !== "Closed Lost" && (
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--color-bg-subtle)' }}>
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${deal.probability}%`,
                                background: deal.probability >= 60 ? 'var(--color-success)' : deal.probability >= 30 ? 'var(--color-warning)' : 'var(--color-error)'
                              }} 
                            />
                          </div>
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{deal.probability}%</span>
</div>
        )}
      </div>
      
      <ActionModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        type="deal" 
      />
    </div>
  );
}