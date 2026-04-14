import express from "express";
import { contactsRouter } from "./db/contacts.js";
import { dealsRouter } from "./db/deals.js";
import { invoicesRouter } from "./db/invoices.js";
import { projectsRouter } from "./db/projects.js";
import { automationsRouter } from "./db/automations.js";
import { auditRouter } from "./db/audit.js";

const app = express();

app.use(express.json());

app.use("/tenants", contactsRouter);
app.use("/tenants", dealsRouter);
app.use("/tenants", invoicesRouter);
app.use("/tenants", projectsRouter);
app.use("/tenants", automationsRouter);
app.use("/tenants", auditRouter);

app.use("/internal/agents", automationsRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;

if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}