#!/usr/bin/env node
import { SeoGeoAuditAgent } from "./api/agents/seo-geo-audit-agent.js";

/**
 * Standalone Audit CLI Entry Point
 * Usage: node cli-audit.js <url> <location> <task>
 */
async function runCli() {
  const [,, url, location, task] = process.argv;

  if (!url || !location || !task) {
    console.error("Usage: node cli-audit.js <url> <location> <task>");
    process.exit(1);
  }

  const agent = new SeoGeoAuditAgent();
  console.log(`Starting audit for ${url} in ${location}...`);
  
  try {
    const result = await agent.execute({ 
      tenantId: "cli-user", 
      url, 
      location, 
      task 
    });

    if (result.success) {
      console.log("Audit Successful:");
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error("Audit Failed:", result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error("System Error:", err);
    process.exit(1);
  }
}

runCli();
