-- FraudShield Database Schema Initialization
-- Production-ready schema with proper indexing and constraints

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'declined', 'review', 'expired');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer', 'api_user');
CREATE TYPE model_status AS ENUM ('training', 'active', 'deprecated', 'failed');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical', 'emergency');

-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merchants and organizations
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    risk_category VARCHAR(50) DEFAULT 'medium',
    api_key VARCHAR(255) UNIQUE NOT NULL,
    webhook_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    external_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    registration_date TIMESTAMP WITH TIME ZONE,
    risk_score DECIMAL(5,2) DEFAULT 50.00,
    total_orders INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    chargeback_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id, external_id)
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    customer_id UUID REFERENCES customers(id),
    external_id VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_processor VARCHAR(50),
    billing_address JSONB,
    shipping_address JSONB,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    status transaction_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_id, external_id)
);

-- Fraud assessments
CREATE TABLE fraud_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    risk_score DECIMAL(5,2) NOT NULL,
    fraud_probability DECIMAL(5,4) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    risk_level risk_level NOT NULL,
    behavioral_score DECIMAL(5,2),
    anomaly_score DECIMAL(5,2),
    model_version VARCHAR(50),
    processing_time_ms INTEGER,
    risk_factors JSONB DEFAULT '[]',
    model_scores JSONB DEFAULT '{}',
    feature_importance JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ML Models
CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    status model_status DEFAULT 'training',
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    auc_score DECIMAL(5,4),
    training_samples INTEGER,
    model_path VARCHAR(500),
    hyperparameters JSONB DEFAULT '{}',
    feature_config JSONB DEFAULT '{}',
    training_started_at TIMESTAMP WITH TIME ZONE,
    training_completed_at TIMESTAMP WITH TIME ZONE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

-- Feature store
CREATE TABLE feature_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    computation_logic TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer behavioral patterns
CREATE TABLE customer_behaviors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    behavior_date DATE NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    unique_devices INTEGER DEFAULT 0,
    unique_ips INTEGER DEFAULT 0,
    avg_transaction_amount DECIMAL(12,2) DEFAULT 0,
    velocity_score DECIMAL(5,2) DEFAULT 50,
    pattern_score DECIMAL(5,2) DEFAULT 50,
    anomaly_indicators JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, behavior_date)
);

-- Device fingerprints
CREATE TABLE device_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint_hash VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    screen_resolution VARCHAR(20),
    timezone VARCHAR(50),
    language VARCHAR(10),
    platform VARCHAR(50),
    plugins JSONB DEFAULT '[]',
    fonts JSONB DEFAULT '[]',
    risk_score DECIMAL(5,2) DEFAULT 50,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transaction_count INTEGER DEFAULT 0
);

-- Geographic data
CREATE TABLE ip_geolocation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET UNIQUE NOT NULL,
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    isp VARCHAR(255),
    is_vpn BOOLEAN DEFAULT false,
    is_proxy BOOLEAN DEFAULT false,
    risk_score DECIMAL(5,2) DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chargeback data
CREATE TABLE chargebacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    chargeback_id VARCHAR(255) NOT NULL,
    reason_code VARCHAR(10),
    reason_description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    chargeback_date TIMESTAMP WITH TIME ZONE,
    response_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'received',
    dispute_evidence JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alerts and notifications
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    alert_type VARCHAR(50) NOT NULL,
    severity alert_severity DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- API usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_amount ON transactions(amount);

CREATE INDEX idx_fraud_assessments_transaction_id ON fraud_assessments(transaction_id);
CREATE INDEX idx_fraud_assessments_risk_score ON fraud_assessments(risk_score);
CREATE INDEX idx_fraud_assessments_decision ON fraud_assessments(decision);
CREATE INDEX idx_fraud_assessments_created_at ON fraud_assessments(created_at);

CREATE INDEX idx_customers_merchant_id ON customers(merchant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_risk_score ON customers(risk_score);

CREATE INDEX idx_customer_behaviors_customer_id ON customer_behaviors(customer_id);
CREATE INDEX idx_customer_behaviors_behavior_date ON customer_behaviors(behavior_date);

CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_fingerprints_risk_score ON device_fingerprints(risk_score);

CREATE INDEX idx_ip_geolocation_ip ON ip_geolocation(ip_address);
CREATE INDEX idx_ip_geolocation_country ON ip_geolocation(country_code);

CREATE INDEX idx_chargebacks_transaction_id ON chargebacks(transaction_id);
CREATE INDEX idx_chargebacks_date ON chargebacks(chargeback_date);

CREATE INDEX idx_alerts_merchant_id ON alerts(merchant_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_severity ON alerts(severity);

CREATE INDEX idx_api_usage_merchant_id ON api_usage(merchant_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- GIN indexes for JSONB columns
CREATE INDEX idx_transactions_billing_address ON transactions USING GIN (billing_address);
CREATE INDEX idx_transactions_device_info ON transactions USING GIN (device_info);
CREATE INDEX idx_fraud_assessments_risk_factors ON fraud_assessments USING GIN (risk_factors);
CREATE INDEX idx_merchants_settings ON merchants USING GIN (settings);

-- Partial indexes for active records
CREATE INDEX idx_merchants_active ON merchants(id) WHERE is_active = true;
CREATE INDEX idx_customers_active ON customers(merchant_id, risk_score) WHERE is_active = true;

-- Full-text search indexes
CREATE INDEX idx_merchants_name_trgm ON merchants USING GIN (name gin_trgm_ops);
CREATE INDEX idx_customers_email_trgm ON customers USING GIN (email gin_trgm_ops);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_behaviors_updated_at BEFORE UPDATE ON customer_behaviors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_geolocation_updated_at BEFORE UPDATE ON ip_geolocation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chargebacks_updated_at BEFORE UPDATE ON chargebacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO merchants (id, name, domain, industry, api_key) VALUES 
(
    uuid_generate_v4(),
    'Demo Store',
    'demo.fraudshield.com',
    'E-commerce',
    encode(gen_random_bytes(32), 'hex')
);

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES 
(
    'admin@fraudshield.com',
    crypt('admin123', gen_salt('bf')),
    'Admin',
    'User',
    'admin'
);

-- Create views for common queries
CREATE VIEW transaction_summary AS
SELECT 
    t.id,
    t.external_id,
    t.amount,
    t.currency,
    t.status,
    fa.risk_score,
    fa.decision,
    fa.risk_level,
    m.name as merchant_name,
    c.email as customer_email,
    t.created_at
FROM transactions t
LEFT JOIN fraud_assessments fa ON t.id = fa.transaction_id
LEFT JOIN merchants m ON t.merchant_id = m.id
LEFT JOIN customers c ON t.customer_id = c.id;

CREATE VIEW merchant_statistics AS
SELECT 
    m.id,
    m.name,
    COUNT(t.id) as total_transactions,
    SUM(t.amount) as total_amount,
    AVG(fa.risk_score) as avg_risk_score,
    COUNT(CASE WHEN fa.decision = 'declined' THEN 1 END) as declined_count,
    COUNT(cb.id) as chargeback_count
FROM merchants m
LEFT JOIN transactions t ON m.id = t.merchant_id
LEFT JOIN fraud_assessments fa ON t.id = fa.transaction_id
LEFT JOIN chargebacks cb ON t.id = cb.transaction_id
WHERE m.is_active = true
GROUP BY m.id, m.name;

-- Grant permissions (adjust based on your user setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fraudshield;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fraudshield;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fraudshield;