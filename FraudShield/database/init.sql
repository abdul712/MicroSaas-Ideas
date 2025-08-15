-- FraudShield Database Schema
-- PCI DSS Compliant database design for fraud detection platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'declined', 'review', 'monitoring');
CREATE TYPE risk_level AS ENUM ('very_low', 'low', 'medium', 'high', 'critical');
CREATE TYPE decision_type AS ENUM ('approve', 'decline', 'review', 'monitor');
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cryptocurrency', 'other');
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer', 'merchant');

-- Organizations/Merchants table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(100),
    risk_tolerance DECIMAL(5,2) DEFAULT 50.00, -- 0-100 scale
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_risk_tolerance CHECK (risk_tolerance >= 0 AND risk_tolerance <= 100)
);

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT, -- Encrypted
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_by UUID,
    updated_by UUID
);

-- Customers table (tokenized for PCI compliance)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_customer_id VARCHAR(255) NOT NULL, -- Merchant's customer ID
    email_hash VARCHAR(64), -- SHA-256 hash for lookup
    email_domain VARCHAR(255),
    phone_hash VARCHAR(64), -- SHA-256 hash
    country_code CHAR(2),
    
    -- Risk profile
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    fraud_history_count INTEGER DEFAULT 0,
    total_transaction_count INTEGER DEFAULT 0,
    total_transaction_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Behavioral metrics
    avg_transaction_amount DECIMAL(15,2),
    preferred_payment_method payment_method_type,
    typical_transaction_time INTEGER, -- Hour of day (0-23)
    account_age_days INTEGER,
    
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint
    UNIQUE(organization_id, external_customer_id),
    
    -- Constraints
    CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    external_transaction_id VARCHAR(255) NOT NULL,
    
    -- Transaction details (non-PCI data only)
    amount DECIMAL(15,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    payment_method payment_method_type NOT NULL,
    payment_processor VARCHAR(100),
    
    -- Geographic information
    ip_address INET,
    country_code CHAR(2),
    state_province VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    
    -- Device information (hashed/anonymized)
    device_fingerprint VARCHAR(255),
    user_agent_hash VARCHAR(64),
    screen_resolution VARCHAR(20),
    browser_language VARCHAR(10),
    
    -- Address information (hashed for privacy)
    billing_address_hash VARCHAR(64),
    shipping_address_hash VARCHAR(64),
    address_mismatch BOOLEAN DEFAULT false,
    
    -- Transaction metadata
    transaction_time TIMESTAMP WITH TIME ZONE NOT NULL,
    processing_time_ms INTEGER,
    
    -- Status and outcomes
    status transaction_status DEFAULT 'pending',
    is_fraud BOOLEAN,
    chargeback_occurred BOOLEAN DEFAULT false,
    chargeback_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint
    UNIQUE(organization_id, external_transaction_id),
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Fraud assessments table
CREATE TABLE fraud_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    assessment_id VARCHAR(32) NOT NULL UNIQUE,
    
    -- Risk scoring
    risk_score DECIMAL(5,2) NOT NULL,
    risk_level risk_level NOT NULL,
    fraud_probability DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    confidence DECIMAL(5,4) NOT NULL,
    
    -- Decision
    decision decision_type NOT NULL,
    decision_reason TEXT,
    
    -- Model information
    model_version VARCHAR(50),
    ensemble_weights JSONB,
    individual_predictions JSONB,
    
    -- Feature analysis
    risk_factors JSONB, -- Array of risk factor objects
    feature_importance JSONB,
    behavioral_score DECIMAL(5,2),
    
    -- Performance metrics
    processing_time_ms INTEGER,
    ml_inference_time_ms INTEGER,
    
    -- Recommendations
    recommended_actions JSONB, -- Array of recommended actions
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT valid_fraud_probability CHECK (fraud_probability >= 0 AND fraud_probability <= 1),
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT valid_behavioral_score CHECK (behavioral_score >= 0 AND behavioral_score <= 100)
);

-- Risk factors table for detailed analysis
CREATE TABLE risk_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES fraud_assessments(id) ON DELETE CASCADE,
    factor_name VARCHAR(100) NOT NULL,
    factor_score DECIMAL(5,2) NOT NULL,
    factor_weight DECIMAL(5,4) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'behavioral', 'geographic', 'device', 'payment', 'ml_model'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_factor_score CHECK (factor_score >= 0 AND factor_score <= 100),
    CONSTRAINT valid_factor_weight CHECK (factor_weight >= 0 AND factor_weight <= 1)
);

-- Rules engine table
CREATE TABLE fraud_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rule configuration
    rule_type VARCHAR(50) NOT NULL, -- 'velocity', 'geographic', 'amount', 'behavioral', 'custom'
    conditions JSONB NOT NULL, -- Rule conditions in JSON format
    actions JSONB NOT NULL, -- Actions to take when rule fires
    
    -- Rule parameters
    threshold_value DECIMAL(15,4),
    threshold_operator VARCHAR(10), -- '>', '<', '>=', '<=', '=', '!='
    time_window_minutes INTEGER,
    
    -- Rule status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100, -- Higher number = higher priority
    
    -- Performance tracking
    total_triggers INTEGER DEFAULT 0,
    false_positive_count INTEGER DEFAULT 0,
    true_positive_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Unique constraint per organization
    UNIQUE(organization_id, name)
);

-- Rule triggers history
CREATE TABLE rule_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES fraud_rules(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES fraud_assessments(id) ON DELETE SET NULL,
    
    trigger_value DECIMAL(15,4), -- The value that triggered the rule
    threshold_value DECIMAL(15,4), -- The threshold that was exceeded
    action_taken VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machine learning models metadata
CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'random_forest', 'xgboost', 'neural_network', etc.
    
    -- Model performance metrics
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    auc_score DECIMAL(5,4),
    
    -- Training information
    training_data_size INTEGER,
    training_duration_seconds INTEGER,
    feature_count INTEGER,
    
    -- Model metadata
    hyperparameters JSONB,
    feature_names JSONB,
    training_metrics JSONB,
    
    -- Deployment status
    is_production BOOLEAN DEFAULT false,
    deployment_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Unique constraint for model name and version
    UNIQUE(name, version)
);

-- Webhooks configuration
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255), -- For webhook signature verification
    
    -- Event configuration
    events JSONB NOT NULL, -- Array of events to subscribe to
    is_active BOOLEAN DEFAULT true,
    
    -- Delivery settings
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Performance tracking
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    last_delivery_at TIMESTAMP WITH TIME ZONE,
    last_delivery_status VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Webhook delivery attempts
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES fraud_assessments(id) ON DELETE SET NULL,
    
    -- Delivery details
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery status
    status VARCHAR(50) NOT NULL, -- 'pending', 'delivered', 'failed', 'retrying'
    http_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    
    -- Timing
    attempt_number INTEGER DEFAULT 1,
    delivered_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Result
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance analytics (time-series data)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Metric details
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    
    -- Dimensions
    time_bucket TIMESTAMP WITH TIME ZONE NOT NULL, -- Rounded to nearest minute/hour
    dimensions JSONB, -- Additional dimensions (model_version, region, etc.)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_org_id ON transactions(organization_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_country ON transactions(country_code);

CREATE INDEX idx_fraud_assessments_transaction_id ON fraud_assessments(transaction_id);
CREATE INDEX idx_fraud_assessments_risk_score ON fraud_assessments(risk_score);
CREATE INDEX idx_fraud_assessments_decision ON fraud_assessments(decision);
CREATE INDEX idx_fraud_assessments_created_at ON fraud_assessments(created_at);

CREATE INDEX idx_customers_org_id ON customers(organization_id);
CREATE INDEX idx_customers_email_hash ON customers(email_hash);
CREATE INDEX idx_customers_risk_score ON customers(risk_score);
CREATE INDEX idx_customers_external_id ON customers(external_customer_id);

CREATE INDEX idx_risk_factors_assessment_id ON risk_factors(assessment_id);
CREATE INDEX idx_risk_factors_category ON risk_factors(category);
CREATE INDEX idx_risk_factors_score ON risk_factors(factor_score);

CREATE INDEX idx_fraud_rules_org_id ON fraud_rules(organization_id);
CREATE INDEX idx_fraud_rules_active ON fraud_rules(is_active);
CREATE INDEX idx_fraud_rules_priority ON fraud_rules(priority);

CREATE INDEX idx_rule_triggers_rule_id ON rule_triggers(rule_id);
CREATE INDEX idx_rule_triggers_transaction_id ON rule_triggers(transaction_id);
CREATE INDEX idx_rule_triggers_created_at ON rule_triggers(created_at);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_performance_metrics_org_id ON performance_metrics(organization_id);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_time ON performance_metrics(time_bucket);

-- GIN indexes for JSONB columns
CREATE INDEX idx_fraud_assessments_risk_factors_gin ON fraud_assessments USING GIN (risk_factors);
CREATE INDEX idx_fraud_assessments_individual_predictions_gin ON fraud_assessments USING GIN (individual_predictions);
CREATE INDEX idx_fraud_rules_conditions_gin ON fraud_rules USING GIN (conditions);
CREATE INDEX idx_performance_metrics_dimensions_gin ON performance_metrics USING GIN (dimensions);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_rules_updated_at BEFORE UPDATE ON fraud_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW fraud_summary AS
SELECT 
    o.name as organization_name,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE fa.decision = 'decline') as declined_transactions,
    COUNT(*) FILTER (WHERE fa.decision = 'approve') as approved_transactions,
    COUNT(*) FILTER (WHERE fa.decision = 'review') as review_transactions,
    AVG(fa.risk_score) as avg_risk_score,
    SUM(t.amount) as total_transaction_volume,
    SUM(t.amount) FILTER (WHERE fa.decision = 'decline') as declined_volume
FROM organizations o
LEFT JOIN transactions t ON o.id = t.organization_id
LEFT JOIN fraud_assessments fa ON t.id = fa.transaction_id
WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.id, o.name;

-- Create function for calculating customer risk score
CREATE OR REPLACE FUNCTION calculate_customer_risk_score(customer_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    risk_score DECIMAL(5,2) := 0;
    fraud_count INTEGER;
    total_count INTEGER;
    avg_amount DECIMAL(15,2);
    recent_declined INTEGER;
BEGIN
    -- Get customer transaction statistics
    SELECT 
        COUNT(*) FILTER (WHERE is_fraud = true),
        COUNT(*),
        AVG(amount),
        COUNT(*) FILTER (WHERE fa.decision = 'decline' AND t.created_at >= NOW() - INTERVAL '30 days')
    INTO fraud_count, total_count, avg_amount, recent_declined
    FROM transactions t
    LEFT JOIN fraud_assessments fa ON t.id = fa.transaction_id
    WHERE t.customer_id = customer_uuid;
    
    -- Calculate risk based on fraud history
    IF total_count > 0 THEN
        risk_score := (fraud_count::DECIMAL / total_count) * 40; -- Max 40 points for fraud history
    END IF;
    
    -- Add risk for recent declines
    risk_score := risk_score + (recent_declined * 5); -- 5 points per recent decline
    
    -- Add risk for high transaction amounts
    IF avg_amount > 1000 THEN
        risk_score := risk_score + 10;
    END IF;
    
    -- Ensure score is within bounds
    risk_score := GREATEST(0, LEAST(100, risk_score));
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Insert default data
INSERT INTO organizations (id, name, domain, industry) 
VALUES ('00000000-0000-0000-0000-000000000001', 'FraudShield Demo', 'demo.fraudshield.com', 'technology');

INSERT INTO users (id, email, password_hash, first_name, last_name, role, organization_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@fraudshield.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2JZw6vD0PG', -- password: admin123
    'System',
    'Administrator',
    'admin',
    '00000000-0000-0000-0000-000000000001'
);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fraudshield;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fraudshield;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fraudshield;