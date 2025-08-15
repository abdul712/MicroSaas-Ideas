-- PostgreSQL initialization script for Competitor Analysis Platform
-- This script creates additional database objects not handled by Prisma

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types for better type safety
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE plan_type AS ENUM ('starter', 'professional', 'business', 'enterprise');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'cancelled');

-- Create functions for common operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate organization slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate price change percentage
CREATE OR REPLACE FUNCTION calculate_price_change(old_price NUMERIC, new_price NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    IF old_price = 0 OR old_price IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(((new_price - old_price) / old_price * 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get competitor metrics summary
CREATE OR REPLACE FUNCTION get_competitor_metrics(competitor_id TEXT, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    start_date TIMESTAMP;
BEGIN
    start_date := CURRENT_TIMESTAMP - INTERVAL '%s days' % days_back;
    
    SELECT json_build_object(
        'price_changes', (
            SELECT COUNT(*) FROM price_history 
            WHERE competitor_id = get_competitor_metrics.competitor_id 
            AND detected_at >= start_date
        ),
        'avg_price', (
            SELECT AVG(price) FROM price_history 
            WHERE competitor_id = get_competitor_metrics.competitor_id 
            AND detected_at >= start_date
        ),
        'data_points', (
            SELECT COUNT(*) FROM scraped_data 
            WHERE competitor_id = get_competitor_metrics.competitor_id 
            AND scraped_at >= start_date
        ),
        'alerts_triggered', (
            SELECT COUNT(*) FROM alerts 
            WHERE competitor_id = get_competitor_metrics.competitor_id 
            AND triggered_at >= start_date
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for competitor analytics
CREATE MATERIALIZED VIEW competitor_analytics AS
SELECT 
    c.id,
    c.name,
    c.organization_id,
    COUNT(DISTINCT ph.id) as total_price_points,
    COUNT(DISTINCT sd.id) as total_data_points,
    COUNT(DISTINCT a.id) as total_alerts,
    AVG(ph.price) as avg_price,
    MIN(ph.price) as min_price,
    MAX(ph.price) as max_price,
    COUNT(DISTINCT sm.id) as social_metrics_count,
    AVG(sm.engagement_rate) as avg_engagement_rate,
    MAX(sd.scraped_at) as last_scraped_at,
    MAX(ph.detected_at) as last_price_update
FROM competitors c
LEFT JOIN price_history ph ON c.id = ph.competitor_id
LEFT JOIN scraped_data sd ON c.id = sd.competitor_id
LEFT JOIN alerts a ON c.id = a.competitor_id
LEFT JOIN social_metrics sm ON c.id = sm.competitor_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.organization_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX competitor_analytics_id_idx ON competitor_analytics (id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_competitor_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY competitor_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitors_organization_active 
ON competitors (organization_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_data_competitor_type_date 
ON scraped_data (competitor_id, data_type, scraped_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_price_history_competitor_date 
ON price_history (competitor_id, detected_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_org_severity_date 
ON alerts (organization_id, severity, triggered_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_metrics_competitor_platform_date 
ON social_metrics (competitor_id, platform, measured_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monitoring_rules_competitor_active 
ON monitoring_rules (competitor_id, is_active);

-- Create GIN indexes for JSON fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_data_processed_gin 
ON scraped_data USING gin (processed_data);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_data_gin 
ON alerts USING gin (data);

-- Create text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitors_name_trgm 
ON competitors USING gin (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name_trgm 
ON organizations USING gin (name gin_trgm_ops);

-- Create partitioning for large tables (price_history and scraped_data)
-- Note: This would be implemented based on actual usage patterns

-- Insert default data
INSERT INTO organizations (id, name, slug, plan, status) VALUES 
('default-org', 'Default Organization', 'default-org', 'enterprise', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_competitors_updated_at ON competitors;
CREATE TRIGGER update_competitors_updated_at 
    BEFORE UPDATE ON competitors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monitoring_rules_updated_at ON monitoring_rules;
CREATE TRIGGER update_monitoring_rules_updated_at 
    BEFORE UPDATE ON monitoring_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically generate organization slug
CREATE OR REPLACE FUNCTION set_organization_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_organization_slug_trigger ON organizations;
CREATE TRIGGER set_organization_slug_trigger 
    BEFORE INSERT OR UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION set_organization_slug();

-- Create function for row-level security
CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_organization_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on sensitive tables
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY org_isolation_competitors ON competitors 
    FOR ALL TO authenticated 
    USING (organization_id = current_user_organization_id());

CREATE POLICY org_isolation_alerts ON alerts 
    FOR ALL TO authenticated 
    USING (organization_id = current_user_organization_id());

CREATE POLICY org_isolation_reports ON reports 
    FOR ALL TO authenticated 
    USING (organization_id = current_user_organization_id());

-- Create role for application
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_app_password';
    END IF;
END
$$;

-- Grant permissions to application role
GRANT CONNECT ON DATABASE competitor_analysis TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Set up scheduled job to refresh materialized view (if pg_cron is available)
-- SELECT cron.schedule('refresh-analytics', '0 */6 * * *', 'SELECT refresh_competitor_analytics();');

-- Create notification function for real-time updates
CREATE OR REPLACE FUNCTION notify_data_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'data_change',
        json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'id', COALESCE(NEW.id, OLD.id),
            'organization_id', COALESCE(NEW.organization_id, OLD.organization_id)
        )::text
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time notifications
CREATE TRIGGER notify_competitor_changes 
    AFTER INSERT OR UPDATE OR DELETE ON competitors 
    FOR EACH ROW EXECUTE FUNCTION notify_data_change();

CREATE TRIGGER notify_alert_changes 
    AFTER INSERT OR UPDATE OR DELETE ON alerts 
    FOR EACH ROW EXECUTE FUNCTION notify_data_change();

CREATE TRIGGER notify_scraped_data_changes 
    AFTER INSERT ON scraped_data 
    FOR EACH ROW EXECUTE FUNCTION notify_data_change();

-- Create database maintenance functions
CREATE OR REPLACE FUNCTION cleanup_old_scraped_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM scraped_data 
    WHERE scraped_at < CURRENT_TIMESTAMP - INTERVAL '%s days' % days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to archive old alerts
CREATE OR REPLACE FUNCTION archive_old_alerts(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE alerts 
    SET is_archived = true 
    WHERE triggered_at < CURRENT_TIMESTAMP - INTERVAL '%s days' % days_to_keep
    AND is_archived = false;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Final setup completion
SELECT 'Database initialization completed successfully' AS status;