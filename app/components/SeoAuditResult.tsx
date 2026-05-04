"use client";

import { useState } from "react";

export interface McstNode {
  url: string;
  score: number;
}

export interface MoeResult {
  expert: string;
  analysis: string;
  status: "success" | "error";
}

export interface AuditResult {
  status: string;
  targetUrl: string;
  analyzedUrl: string;
  location: string;
  task: string;
  crawlSummary: {
    pagesVisited: number;
    bestScore: number;
  };
  moeAnalysis: MoeResult[];
  summary: {
    response: string;
  };
}

interface SeoAuditResultProps {
  audit: AuditResult;
}

export function SeoAuditResult({ audit }: SeoAuditResultProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "experts" | "details">("summary");

  return (
    <div 
      className="p-6 rounded-2xl animate-fade-in-up"
      style={{ 
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              2026 Agentic Audit
            </span>
            <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              SEO/GEO Results
            </h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Analyzed {audit.targetUrl} for {audit.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Audit Score</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{(audit.crawlSummary.bestScore * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 mb-6 rounded-xl" style={{ background: 'var(--color-bg-subtle)' }}>
        {(['summary', 'experts', 'details'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={{ 
              background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === "summary" && (
          <div className="animate-fade-in">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Executive Summary</h4>
            <div className="p-4 rounded-xl text-sm leading-relaxed mb-6" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }}>
              {audit.summary.response}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] font-medium uppercase mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Pages Crawled</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{audit.crawlSummary.pagesVisited}</p>
              </div>
              <div className="p-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] font-medium uppercase mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Target Strategy</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{audit.task}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "experts" && (
          <div className="animate-fade-in space-y-4">
            {audit.moeAnalysis.map((res, idx) => (
              <div key={idx} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-subtle)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: res.status === 'success' ? 'var(--color-success)' : 'var(--color-error)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{res.expert}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {res.analysis}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "details" && (
          <div className="animate-fade-in">
             <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Analyzed URL</span>
                  <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--color-text-primary)' }}>{audit.analyzedUrl}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Geographic Focus</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{audit.location}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Agent Engine</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>GPT-4 / MCST-MoE</span>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button className="flex-1 btn-primary text-sm py-2">Generate PDF</button>
        <button className="flex-1 text-sm py-2 rounded-xl font-medium" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          Update Audit
        </button>
      </div>
    </div>
  );
}
