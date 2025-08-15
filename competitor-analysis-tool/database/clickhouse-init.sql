-- ClickHouse initialization script for time-series analytics
-- Optimized for competitive intelligence metrics and real-time analytics

-- Create database
CREATE DATABASE IF NOT EXISTS competitor_analytics;
USE competitor_analytics;

-- ========================================
-- TIME-SERIES TABLES
-- ========================================

-- Competitor metrics time-series
CREATE TABLE IF NOT EXISTS competitor_metrics (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    metric_type LowCardinality(String), -- price, traffic, social, seo, content
    metric_name String,
    value Float64,
    unit String DEFAULT '',
    metadata Map(String, String),
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, metric_type, timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- Price change events
CREATE TABLE IF NOT EXISTS price_events (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    product_id String,
    product_name String,
    old_price Float64,
    new_price Float64,
    currency FixedString(3) DEFAULT 'USD',
    change_percent Float64,
    change_type LowCardinality(String), -- increase, decrease, new, discontinued
    source_url String,
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- Website content changes
CREATE TABLE IF NOT EXISTS content_changes (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    page_url String,
    change_type LowCardinality(String), -- title, description, content, structure, new_page, removed_page
    old_value String,
    new_value String,
    similarity_score Float64, -- 0-1 similarity between old and new content
    word_count_change Int32,
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, timestamp)
TTL timestamp + INTERVAL 1 YEAR;

-- Social media metrics
CREATE TABLE IF NOT EXISTS social_metrics (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    platform LowCardinality(String), -- twitter, facebook, linkedin, instagram, youtube, tiktok
    followers_count UInt32,
    following_count UInt32,
    posts_count UInt32,
    engagement_rate Float64,
    avg_likes Float64,
    avg_shares Float64,
    avg_comments Float64,
    reach UInt64,
    impressions UInt64,
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, platform, timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- SEO ranking changes
CREATE TABLE IF NOT EXISTS seo_rankings (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    keyword String,
    search_engine LowCardinality(String) DEFAULT 'google',
    country FixedString(2) DEFAULT 'US',
    device LowCardinality(String) DEFAULT 'desktop', -- desktop, mobile
    position UInt16,
    previous_position UInt16,
    position_change Int16,
    search_volume UInt32,
    difficulty UInt8, -- 0-100
    url String,
    title String,
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, keyword, timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- Traffic estimates
CREATE TABLE IF NOT EXISTS traffic_estimates (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    source LowCardinality(String), -- similarweb, semrush, ahrefs, estimated
    total_visits UInt64,
    unique_visitors UInt64,
    page_views UInt64,
    bounce_rate Float64,
    avg_session_duration Float64,
    pages_per_session Float64,
    top_countries Array(String),
    top_referrers Array(String),
    organic_traffic_percent Float64,
    paid_traffic_percent Float64,
    social_traffic_percent Float64,
    direct_traffic_percent Float64,
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- Advertisement monitoring
CREATE TABLE IF NOT EXISTS ad_campaigns (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    platform LowCardinality(String), -- google_ads, facebook_ads, linkedin_ads, twitter_ads
    ad_id String,
    ad_title String,
    ad_description String,
    ad_url String,
    landing_page String,
    keywords Array(String),
    estimated_budget Float64,
    estimated_clicks UInt32,
    estimated_impressions UInt64,
    ad_format LowCardinality(String), -- text, image, video, carousel
    is_active Bool,
    first_seen DateTime64(3),
    last_seen DateTime64(3),
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, platform, ad_id, timestamp);

-- News and mentions tracking
CREATE TABLE IF NOT EXISTS news_mentions (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    source_type LowCardinality(String), -- news, blog, forum, review, social
    source_name String,
    source_url String,
    title String,
    content String,
    author String,
    sentiment_score Float64, -- -1 to 1
    relevance_score Float64, -- 0 to 1
    reach_estimate UInt64,
    language FixedString(2) DEFAULT 'en',
    tags Array(String),
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, timestamp)
TTL timestamp + INTERVAL 1 YEAR;

-- Product launch tracking
CREATE TABLE IF NOT EXISTS product_launches (
    timestamp DateTime64(3),
    organization_id String,
    competitor_id String,
    product_name String,
    product_category String,
    launch_type LowCardinality(String), -- new_product, update, feature, discontinuation
    description String,
    price Float64,
    currency FixedString(3) DEFAULT 'USD',
    target_market String,
    announcement_channels Array(String),
    estimated_impact LowCardinality(String), -- low, medium, high
    source_urls Array(String),
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, timestamp)
TTL timestamp + INTERVAL 3 YEAR;

-- ========================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ========================================

-- Real-time competitor dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS competitor_dashboard_metrics
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, competitor_id, toDate(timestamp))
AS SELECT
    toStartOfHour(timestamp) as timestamp,
    organization_id,
    competitor_id,
    countState() as data_points,
    avgState(value) as avg_value,
    minState(value) as min_value,
    maxState(value) as max_value,
    uniqState(metric_type) as unique_metrics
FROM competitor_metrics
GROUP BY timestamp, organization_id, competitor_id;

-- Daily price change summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_price_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, competitor_id, date)
AS SELECT
    toDate(timestamp) as date,
    organization_id,
    competitor_id,
    count() as price_changes,
    avg(change_percent) as avg_change_percent,
    sum(if(change_percent > 0, 1, 0)) as price_increases,
    sum(if(change_percent < 0, 1, 0)) as price_decreases,
    sum(if(change_type = 'new', 1, 0)) as new_products,
    sum(if(change_type = 'discontinued', 1, 0)) as discontinued_products
FROM price_events
GROUP BY date, organization_id, competitor_id;

-- Weekly social media growth
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_social_growth
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(week_start)
ORDER BY (organization_id, competitor_id, platform, week_start)
AS SELECT
    toMonday(timestamp) as week_start,
    organization_id,
    competitor_id,
    platform,
    argMax(followers_count, timestamp) as end_followers,
    argMin(followers_count, timestamp) as start_followers,
    end_followers - start_followers as followers_growth,
    avg(engagement_rate) as avg_engagement_rate,
    sum(posts_count) as total_posts
FROM social_metrics
GROUP BY week_start, organization_id, competitor_id, platform;

-- ========================================
-- FUNCTIONS FOR ANALYTICS
-- ========================================

-- Function to calculate market position
CREATE FUNCTION IF NOT EXISTS calculateMarketPosition(competitor_values Array(Float64), target_value Float64)
RETURNS Float64
LANGUAGE SQL
AS $$
SELECT 
    CASE 
        WHEN target_value >= quantile(0.75)(competitor_values) THEN 1.0  -- Top quartile
        WHEN target_value >= quantile(0.50)(competitor_values) THEN 0.75 -- Second quartile
        WHEN target_value >= quantile(0.25)(competitor_values) THEN 0.5  -- Third quartile
        ELSE 0.25 -- Bottom quartile
    END
$$;

-- Function to detect anomalies in metrics
CREATE FUNCTION IF NOT EXISTS detectAnomaly(current_value Float64, historical_avg Float64, historical_std Float64, threshold Float64)
RETURNS UInt8
LANGUAGE SQL
AS $$
SELECT 
    if(abs(current_value - historical_avg) > threshold * historical_std, 1, 0)
$$;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Create additional indexes for common query patterns
ALTER TABLE competitor_metrics ADD INDEX idx_metric_type metric_type TYPE set(100) GRANULARITY 1;
ALTER TABLE price_events ADD INDEX idx_change_type change_type TYPE set(10) GRANULARITY 1;
ALTER TABLE social_metrics ADD INDEX idx_platform platform TYPE set(20) GRANULARITY 1;
ALTER TABLE seo_rankings ADD INDEX idx_keyword keyword TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE ad_campaigns ADD INDEX idx_ad_title ad_title TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1;

-- ========================================
-- SAMPLE QUERIES FOR TESTING
-- ========================================

-- Sample data insertion (for testing)
INSERT INTO competitor_metrics VALUES
    (now64(), 'org1', 'comp1', 'price', 'average_price', 99.99, 'USD', {'category': 'software'}, now64()),
    (now64(), 'org1', 'comp1', 'traffic', 'monthly_visits', 150000, 'visits', {'source': 'similarweb'}, now64()),
    (now64(), 'org1', 'comp2', 'social', 'followers', 5000, 'count', {'platform': 'twitter'}, now64());

-- Example analytics queries
/*
-- Get competitor price trends for last 30 days
SELECT 
    toDate(timestamp) as date,
    competitor_id,
    avg(value) as avg_price,
    min(value) as min_price,
    max(value) as max_price
FROM competitor_metrics 
WHERE metric_type = 'price' 
    AND metric_name = 'average_price'
    AND timestamp >= now64() - INTERVAL 30 DAY
    AND organization_id = 'org1'
GROUP BY date, competitor_id
ORDER BY date DESC, competitor_id;

-- Get social media growth rates
SELECT 
    competitor_id,
    platform,
    followers_growth,
    (followers_growth / start_followers) * 100 as growth_rate_percent
FROM weekly_social_growth
WHERE week_start >= today() - INTERVAL 4 WEEK
    AND organization_id = 'org1'
ORDER BY growth_rate_percent DESC;

-- Detect pricing anomalies
SELECT 
    competitor_id,
    timestamp,
    new_price,
    change_percent,
    detectAnomaly(change_percent, 
                 (SELECT avg(change_percent) FROM price_events WHERE competitor_id = pe.competitor_id), 
                 (SELECT stddevPop(change_percent) FROM price_events WHERE competitor_id = pe.competitor_id), 
                 2.0) as is_anomaly
FROM price_events pe
WHERE timestamp >= now64() - INTERVAL 7 DAY
    AND organization_id = 'org1'
HAVING is_anomaly = 1;
*/

SELECT 'ClickHouse analytics database initialized successfully' as status;