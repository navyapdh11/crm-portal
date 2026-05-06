import { useState, useEffect } from "react";

export function useAuditRuns(tenantId: string, automationId?: string) {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      let url = `/tenants/${tenantId}/runs`;
      if (automationId) url += `?automationId=${automationId}`;
      const response = await fetch(url);
      const data = await response.json();
      setRuns(data.data || []);
    } catch (error) {
      console.error("Failed to fetch audit runs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [tenantId, automationId]);

  return { runs, loading, refresh: fetchRuns };
}
