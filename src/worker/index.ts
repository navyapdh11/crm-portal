import { createPgClient } from "../api/db/client.js";
import { AutomationEngine } from "../api/automations/engine.js";

const POLLING_INTERVAL_MS = 5000;

async function main() {
  const db = await createPgClient();
  const engine = new AutomationEngine(db);
  
  console.log("Worker started, listening for automation jobs...");

  // Start the polling loop
  const poll = async () => {
    try {
      await engine.processPendingRuns();
    } catch (error) {
      console.error("Error during polling:", error);
    } finally {
      setTimeout(poll, POLLING_INTERVAL_MS);
    }
  };

  poll();
  
  process.on("SIGTERM", () => {
    console.log("Shutting down worker...");
    process.exit(0);
  });
}

main().catch(err => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
