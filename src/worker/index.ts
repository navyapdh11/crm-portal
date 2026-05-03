import { createPgClient } from "../api/db/client.js";
import { AutomationEngine } from "../api/automations/engine.js";

async function main() {
  const db = await createPgClient();
  const engine = new AutomationEngine(db);
  
  console.log("Worker started, listening for automation jobs...");
  
  process.on("SIGTERM", () => {
    console.log("Shutting down worker...");
    process.exit(0);
  });
}

main().catch(err => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});