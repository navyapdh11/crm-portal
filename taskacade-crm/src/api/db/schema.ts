import { pgTable, uuid, varchar, text, integer, decimal, timestamp, date, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const contactStageEnum = pgEnum("contact_stage", ["lead", "prospect", "customer", "churned"]);
export const dealStageEnum = pgEnum("deal_stage", ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "viewed", "paid", "partially_paid", "overdue", "cancelled"]);
export const projectStatusEnum = pgEnum("project_status", ["onboarding", "active", "paused", "completed", "archived"]);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  ownerId: uuid("owner_id"),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 200 }),
  title: varchar("title", { length: 100 }),
  source: varchar("source", { length: 50 }).default("other"),
  stage: contactStageEnum("stage").default("lead"),
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  contactId: uuid("contact_id"),
  name: varchar("name", { length: 300 }).notNull(),
  stage: dealStageEnum("stage").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  closeDate: date("close_date"),
  probability: integer("probability"),
  ownerId: uuid("owner_id"),
  pipelineId: uuid("pipeline_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  clientContactId: uuid("client_contact_id").notNull(),
  dealId: uuid("deal_id"),
  number: varchar("number", { length: 50 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  dueDate: date("due_date").notNull(),
  status: invoiceStatusEnum("status").default("draft"),
  lineItems: jsonb("line_items").$type<Array<{ description: string; amount: number; quantity?: number }>>(),
  paymentUrl: varchar("payment_url", { length: 500 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  clientContactId: uuid("client_contact_id").notNull(),
  dealId: uuid("deal_id"),
  name: varchar("name", { length: 300 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default("onboarding"),
  templateId: uuid("template_id"),
  dueDate: date("due_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").notNull(),
  uploaderId: uuid("uploader_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),
  storageProvider: varchar("storage_provider", { length: 20 }).default("s3"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  projectId: uuid("project_id").notNull(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  actorType: varchar("actor_type", { length: 20 }).notNull(),
  actorId: uuid("actor_id").notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id"),
  fieldsModified: jsonb("fields_modified").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  config: jsonb("config").$type<Record<string, any>>().notNull(),
  position: jsonb("position").$type<{ x: number; y: number; w: number; h: number }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).default("beginner"),
  isActive: varchar("is_active", { length: 5 }).default("true"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
