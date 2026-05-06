"use client";

import { useState, useEffect } from "react";

export default function LlmSettings() {
  const [providers, setProviders] = useState<any[]>([]);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");

  const fetchProviders = async () => {
    const res = await fetch("/tenants/system/llm-providers");
    const data = await res.json();
    setProviders(data.data || []);
  };

  useEffect(() => { fetchProviders(); }, []);

  const addProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/tenants/system/llm-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey })
    });
    setProvider("");
    setApiKey("");
    fetchProviders();
  };

  const deleteProvider = async (id: string) => {
    await fetch(`/tenants/system/llm-providers/${id}`, { method: "DELETE" });
    fetchProviders();
  };

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Manage LLM Providers</h1>
      
      <form onSubmit={addProvider} className="mb-8 p-6 rounded-xl bg-surface border border-hairline flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm mb-1">Provider Name</label>
          <input className="w-full p-2 border rounded-md" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. OpenAI" required />
        </div>
        <div className="flex-1">
          <label className="block text-sm mb-1">API Key</label>
          <input className="w-full p-2 border rounded-md" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." required />
        </div>
        <button className="btn-primary p-2">Add</button>
      </form>

      <div className="space-y-4">
        {providers.map((p) => (
          <div key={p.id} className="flex justify-between items-center p-4 border rounded-xl">
            <span>{p.provider}</span>
            <button className="text-red-500" onClick={() => deleteProvider(p.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
