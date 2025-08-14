-- Simple CRM for Small Business - Database Schema
-- Multi-tenant SaaS architecture with shared schema, tenant isolation by tenant_id

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table for multi-tenancy
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    max_users INTEGER DEFAULT 2,
    max_contacts INTEGER DEFAULT 500,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with tenant association
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table for organizing contacts
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    website TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(20),
    annual_revenue DECIMAL(15, 2),
    employee_count INTEGER,
    description TEXT,
    logo_url TEXT,
    custom_fields JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    job_title VARCHAR(255),
    department VARCHAR(255),
    lead_source VARCHAR(255),
    lead_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, unqualified
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(20),
    social_linkedin TEXT,
    social_twitter TEXT,
    description TEXT,
    avatar_url TEXT,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[],
    owner_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline stages for customizable sales process
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL,
    win_probability DECIMAL(5, 2) DEFAULT 0, -- percentage
    is_active BOOLEAN DEFAULT true,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals/Opportunities table
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    pipeline_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    probability DECIMAL(5, 2) DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    status VARCHAR(50) DEFAULT 'open', -- open, won, lost
    lost_reason TEXT,
    source VARCHAR(255),
    custom_fields JSONB DEFAULT '{}',
    owner_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities for tracking all interactions
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- email, call, meeting, note, task, sms
    subject VARCHAR(255),
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    location TEXT,
    outcome VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) DEFAULT 'completed', -- scheduled, completed, cancelled
    external_id VARCHAR(255), -- for email/calendar integration
    metadata JSONB DEFAULT '{}', -- store email tracking, call recordings, etc.
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks for follow-ups and reminders
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    type VARCHAR(50) DEFAULT 'general', -- general, follow_up, demo, proposal
    reminder_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates for consistent communication
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general', -- general, follow_up, proposal, welcome
    is_active BOOLEAN DEFAULT true,
    variables TEXT[], -- array of available template variables
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email accounts for integration
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- gmail, outlook, exchange
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email threads for tracking conversations
CREATE TABLE email_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    thread_id VARCHAR(255) NOT NULL, -- external email thread ID
    subject VARCHAR(255),
    participants TEXT[],
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual email messages
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    message_id VARCHAR(255) NOT NULL, -- external message ID
    from_email VARCHAR(255) NOT NULL,
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(255),
    body_text TEXT,
    body_html TEXT,
    is_outbound BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom fields configuration
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- contact, company, deal
    field_name VARCHAR(255) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- text, number, date, boolean, select, multi_select
    field_options TEXT[], -- for select/multi_select fields
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks for integrations
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports and analytics configuration
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- sales_pipeline, activity_summary, lead_source
    config JSONB NOT NULL,
    schedule VARCHAR(50), -- daily, weekly, monthly
    recipients TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_companies_name ON companies(tenant_id, name);
CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(tenant_id, email);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_deals_tenant_id ON deals(tenant_id);
CREATE INDEX idx_deals_stage ON deals(pipeline_stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_email_threads_tenant_id ON email_threads(tenant_id);
CREATE INDEX idx_email_threads_contact ON email_threads(contact_id);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Default pipeline stages
INSERT INTO pipeline_stages (tenant_id, name, description, sort_order, win_probability, color_hex) VALUES
('00000000-0000-0000-0000-000000000000', 'Lead', 'Initial contact and qualification', 1, 10, '#EF4444'),
('00000000-0000-0000-0000-000000000000', 'Qualified', 'Qualified lead with budget and timeline', 2, 25, '#F97316'),
('00000000-0000-0000-0000-000000000000', 'Proposal', 'Proposal sent to prospect', 3, 50, '#EAB308'),
('00000000-0000-0000-0000-000000000000', 'Negotiation', 'In active negotiation', 4, 75, '#3B82F6'),
('00000000-0000-0000-0000-000000000000', 'Closed Won', 'Deal successfully closed', 5, 100, '#10B981');