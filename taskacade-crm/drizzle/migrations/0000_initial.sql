-- Taskade CRM Initial Schema Migration

-- Create enums
DO $$ BEGIN
  CREATE TYPE contact_stage AS ENUM ('lead', 'prospect', 'customer', 'churned');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('onboarding', 'active', 'paused', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  owner_id UUID,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(200),
  title VARCHAR(100),
  source VARCHAR(50) DEFAULT 'other',
  stage contact_stage DEFAULT 'lead',
  tags JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Deals
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contact_id UUID,
  name VARCHAR(300) NOT NULL,
  stage deal_stage NOT NULL,
  amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  close_date DATE,
  probability INTEGER,
  owner_id UUID,
  pipeline_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_contact_id UUID NOT NULL,
  deal_id UUID,
  number VARCHAR(50) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  total DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),
  tax_rate DECIMAL(5, 2),
  due_date DATE NOT NULL,
  status invoice_status DEFAULT 'draft',
  line_items JSONB,
  payment_url VARCHAR(500),
  stripe_payment_intent_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  client_contact_id UUID NOT NULL,
  deal_id UUID,
  name VARCHAR(300) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'onboarding',
  template_id UUID,
  due_date DATE,
  budget DECIMAL(12, 2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Files
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL,
  uploader_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  storage_provider VARCHAR(20) DEFAULT 's3',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  fields_modified JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  occurred_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  position JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'beginner',
  is_active VARCHAR(5) DEFAULT 'true',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tenant ON dashboard_widgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_tenant ON flashcards(tenant_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed flashcards for non-technical users
INSERT INTO flashcards (id, tenant_id, title, front, back, category, difficulty) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'How to Create a Contact', 'What are the steps to add a new contact in the CRM?',
   '1. Go to Contacts in the sidebar\n2. Click "Add Contact"\n3. Fill in name, email, company\n4. Set the stage (Lead/Prospect)\n5. Click Save',
   'crm', 'beginner'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Create an Invoice', 'How do I generate and send an invoice?',
   '1. Go to Invoices\n2. Click "New Invoice"\n3. Select the client contact\n4. Add line items (description + amount)\n5. Set due date\n6. Click "Send Invoice"',
   'invoices', 'beginner'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Move a Deal Stage', 'How do I update the stage of a deal?',
   '1. Open the deal from the Deals page\n2. Click the current stage badge\n3. Select the new stage from the dropdown\n4. Update amount and probability\n5. Click Save',
   'crm', 'intermediate'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Run an Automation', 'How do I trigger automated workflows?',
   '1. Go to Automations tab\n2. Choose from: New Lead Follow-up, Invoice Overdue, Deal Stage Change, Project Milestone\n3. Click "Trigger"\n4. The system runs it in the background',
   'automations', 'beginner'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Use AI Agents', 'What are AI agents and how do I use them?',
   '1. Go to AI Agents tab\n2. Choose an agent type (Chain of Thoughts, MCTS, etc.)\n3. Type your question or task\n4. Click "Test Agent"\n5. View the reasoning trace and result',
   'agents', 'intermediate'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Create a Project', 'How do I set up a new client project?',
   '1. Go to Projects\n2. Click "New Project"\n3. Select the client contact\n4. Add name, description, due date\n5. Set status to "Onboarding"\n6. Click Save',
   'projects', 'beginner'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Dashboard Overview', 'What does the Dashboard show?',
   'The Dashboard displays: Total Contacts, Active Deals, Pipeline Value, Revenue, Invoices, Projects, and Overdue items. Use it as your command center for the entire CRM.',
   'settings', 'beginner'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001',
   'Advanced: MCTS Agent', 'When should I use Monte Carlo Tree Search?',
   'Use MCTS for complex optimization problems (e.g., "Which deals should I prioritize this quarter?"). MCTS explores many paths and converges on the optimal strategy through simulation.',
   'agents', 'advanced');
