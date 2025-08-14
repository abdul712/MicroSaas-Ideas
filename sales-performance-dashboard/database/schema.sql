-- Sales Performance Dashboard - Database Schema
-- PostgreSQL with TimescaleDB extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');
CREATE TYPE integration_type AS ENUM ('salesforce', 'hubspot', 'pipedrive', 'stripe', 'paypal', 'shopify', 'woocommerce');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');

-- Organizations table (Multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_status subscription_status DEFAULT 'trialing',
    billing_email VARCHAR(255),
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{
        "users": 5,
        "integrations": 3,
        "data_retention_months": 12,
        "api_calls_per_month": 10000
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for organization lookups
CREATE INDEX idx_organizations_domain ON organizations(domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_active ON organizations(id) WHERE deleted_at IS NULL;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(100), -- TOTP secret
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_email_per_org UNIQUE (organization_id, email, deleted_at)
);

-- Create indexes for user lookups
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_org ON users(organization_id) WHERE deleted_at IS NULL;

-- OAuth providers table
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'salesforce'
    provider_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_provider_per_user UNIQUE (user_id, provider)
);

-- Integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type integration_type NOT NULL,
    status integration_status DEFAULT 'pending',
    config JSONB NOT NULL, -- Encrypted credentials and settings
    sync_frequency VARCHAR(20) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily'
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(20) DEFAULT 'pending',
    last_sync_error TEXT,
    sync_stats JSONB DEFAULT '{}', -- Records synced, errors, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_integration_per_org UNIQUE (organization_id, type, name)
);

-- Create index for integration lookups
CREATE INDEX idx_integrations_org_type ON integrations(organization_id, type);
CREATE INDEX idx_integrations_sync ON integrations(last_sync_at) WHERE status = 'active';

-- Dashboards table
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}', -- Layout, widgets, filters
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for dashboard lookups
CREATE INDEX idx_dashboards_org ON dashboards(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dashboards_user ON dashboards(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_dashboards_public ON dashboards(is_public) WHERE is_public = true AND deleted_at IS NULL;

-- Dashboard shares table (for collaboration)
CREATE TABLE dashboard_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view', -- 'view', 'edit'
    shared_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales metrics table (TimescaleDB hypertable)
CREATE TABLE sales_metrics (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    organization_id UUID NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'revenue', 'deals_count', 'pipeline_value', etc.
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    dimensions JSONB DEFAULT '{}', -- team_id, user_id, product_id, region, etc.
    source_integration_id UUID REFERENCES integrations(id),
    metadata JSONB DEFAULT '{}'
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('sales_metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes for sales metrics
CREATE INDEX idx_sales_metrics_org_time ON sales_metrics(organization_id, time DESC);
CREATE INDEX idx_sales_metrics_type_time ON sales_metrics(metric_type, time DESC);
CREATE INDEX idx_sales_metrics_dimensions ON sales_metrics USING GIN (dimensions);

-- Sales events table (detailed transaction logs)
CREATE TABLE sales_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    organization_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'deal_created', 'deal_updated', 'deal_closed_won', etc.
    entity_id VARCHAR(255), -- CRM deal ID, opportunity ID, etc.
    entity_type VARCHAR(50), -- 'deal', 'contact', 'company'
    user_id UUID REFERENCES users(id),
    integration_id UUID REFERENCES integrations(id),
    properties JSONB DEFAULT '{}',
    previous_values JSONB DEFAULT '{}', -- For tracking changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('sales_events', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes for sales events
CREATE INDEX idx_sales_events_org_time ON sales_events(organization_id, time DESC);
CREATE INDEX idx_sales_events_type ON sales_events(event_type, time DESC);
CREATE INDEX idx_sales_events_entity ON sales_events(entity_type, entity_id);

-- Forecasts table
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    forecast_type VARCHAR(50) NOT NULL, -- 'revenue', 'deals', 'pipeline'
    time_period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    forecast_date DATE NOT NULL,
    predicted_value DECIMAL(15,2) NOT NULL,
    confidence_lower DECIMAL(15,2),
    confidence_upper DECIMAL(15,2),
    actual_value DECIMAL(15,2), -- Filled in after the period
    model_version VARCHAR(50),
    model_accuracy DECIMAL(5,4), -- 0.0 to 1.0
    dimensions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for forecasts
CREATE INDEX idx_forecasts_org_date ON forecasts(organization_id, forecast_date DESC);
CREATE INDEX idx_forecasts_type_date ON forecasts(forecast_type, forecast_date DESC);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- Alert conditions and thresholds
    notification_channels JSONB DEFAULT '{}', -- email, slack, webhook
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert logs table
CREATE TABLE alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_value DECIMAL(15,2),
    threshold_value DECIMAL(15,2),
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_details JSONB DEFAULT '{}'
);

-- Teams table (for sales team management)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES users(id),
    target_revenue DECIMAL(15,2),
    target_period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_team_name_per_org UNIQUE (organization_id, name)
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'manager', 'member'
    quota DECIMAL(15,2),
    quota_period VARCHAR(20) DEFAULT 'monthly',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_per_team UNIQUE (team_id, user_id)
);

-- API keys table (for programmatic access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL, -- Hashed API key
    permissions JSONB DEFAULT '{}', -- Specific permissions for this key
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create index for API key lookups
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('audit_logs', 'created_at', chunk_time_interval => INTERVAL '1 month');

-- Create index for audit logs
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);

-- Create continuous aggregates for performance

-- Daily sales summary
CREATE MATERIALIZED VIEW daily_sales_summary
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS day,
    organization_id,
    metric_type,
    SUM(value) as total_value,
    AVG(value) as avg_value,
    COUNT(*) as count,
    currency
FROM sales_metrics
GROUP BY day, organization_id, metric_type, currency;

-- Monthly sales summary
CREATE MATERIALIZED VIEW monthly_sales_summary
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 month', time) AS month,
    organization_id,
    metric_type,
    SUM(value) as total_value,
    AVG(value) as avg_value,
    COUNT(*) as count,
    currency
FROM sales_metrics
GROUP BY month, organization_id, metric_type, currency;

-- Weekly team performance summary
CREATE MATERIALIZED VIEW weekly_team_performance
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 week', time) AS week,
    organization_id,
    dimensions->>'team_id' as team_id,
    dimensions->>'user_id' as user_id,
    SUM(CASE WHEN metric_type = 'revenue' THEN value ELSE 0 END) as total_revenue,
    SUM(CASE WHEN metric_type = 'deals_count' THEN value ELSE 0 END) as total_deals,
    COUNT(*) as total_activities
FROM sales_metrics
WHERE dimensions ? 'team_id' OR dimensions ? 'user_id'
GROUP BY week, organization_id, team_id, user_id;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('daily_sales_summary',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('monthly_sales_summary',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

SELECT add_continuous_aggregate_policy('weekly_team_performance',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- Add data retention policies (keep raw data for 2 years, aggregates for 5 years)
SELECT add_retention_policy('sales_metrics', INTERVAL '2 years');
SELECT add_retention_policy('sales_events', INTERVAL '2 years');
SELECT add_retention_policy('audit_logs', INTERVAL '1 year');

-- Create functions for common operations

-- Function to get organization settings
CREATE OR REPLACE FUNCTION get_organization_settings(org_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT settings FROM organizations WHERE id = org_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id_param UUID, required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val FROM users WHERE id = user_id_param;
    
    CASE required_role
        WHEN 'admin' THEN RETURN user_role_val = 'admin';
        WHEN 'manager' THEN RETURN user_role_val IN ('admin', 'manager');
        WHEN 'analyst' THEN RETURN user_role_val IN ('admin', 'manager', 'analyst');
        WHEN 'viewer' THEN RETURN user_role_val IS NOT NULL;
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to add sales metric with automatic aggregation
CREATE OR REPLACE FUNCTION add_sales_metric(
    org_id UUID,
    metric_type_param VARCHAR(50),
    value_param DECIMAL(15,2),
    dimensions_param JSONB DEFAULT '{}',
    source_integration_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO sales_metrics (
        time, organization_id, metric_type, value, dimensions, source_integration_id
    ) VALUES (
        NOW(), org_id, metric_type_param, value_param, dimensions_param, source_integration_id_param
    ) RETURNING time::text::uuid INTO new_id;
    
    -- Trigger real-time notifications if needed
    PERFORM pg_notify('sales_metric_update', json_build_object(
        'organization_id', org_id,
        'metric_type', metric_type_param,
        'value', value_param,
        'dimensions', dimensions_param
    )::text);
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
    team_id UUID;
BEGIN
    -- Create sample organization
    INSERT INTO organizations (name, domain, subscription_plan)
    VALUES ('Acme Corporation', 'acme.com', 'professional')
    RETURNING id INTO org_id;
    
    -- Create sample admin user
    INSERT INTO users (organization_id, email, first_name, last_name, role, email_verified)
    VALUES (org_id, 'admin@acme.com', 'John', 'Admin', 'admin', true)
    RETURNING id INTO user_id;
    
    -- Create sample team
    INSERT INTO teams (organization_id, name, manager_id, target_revenue)
    VALUES (org_id, 'Sales Team Alpha', user_id, 100000.00)
    RETURNING id INTO team_id;
    
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, quota)
    VALUES (team_id, user_id, 25000.00);
    
    -- Create sample dashboard
    INSERT INTO dashboards (organization_id, created_by, name, config)
    VALUES (org_id, user_id, 'Revenue Dashboard', '{
        "layout": "grid",
        "widgets": [
            {"type": "revenue_chart", "position": {"x": 0, "y": 0, "w": 6, "h": 4}},
            {"type": "deals_pipeline", "position": {"x": 6, "y": 0, "w": 6, "h": 4}},
            {"type": "team_performance", "position": {"x": 0, "y": 4, "w": 12, "h": 4}}
        ]
    }');
    
    -- Add sample sales metrics
    INSERT INTO sales_metrics (time, organization_id, metric_type, value, dimensions) VALUES
    (NOW() - INTERVAL '1 day', org_id, 'revenue', 5000.00, '{"team_id": "' || team_id || '", "user_id": "' || user_id || '"}'),
    (NOW() - INTERVAL '2 days', org_id, 'revenue', 7500.00, '{"team_id": "' || team_id || '", "user_id": "' || user_id || '"}'),
    (NOW() - INTERVAL '3 days', org_id, 'deals_count', 3.00, '{"team_id": "' || team_id || '", "user_id": "' || user_id || '"}'),
    (NOW() - INTERVAL '4 days', org_id, 'pipeline_value', 25000.00, '{"team_id": "' || team_id || '"}');
    
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sales_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sales_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sales_app;