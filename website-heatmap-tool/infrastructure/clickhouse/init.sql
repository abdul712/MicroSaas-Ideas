-- ClickHouse Database Schema for Analytics Data
-- High-performance time-series analytics for heatmap events

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS analytics;
USE analytics;

-- Raw events table (high-volume ingestion)
CREATE TABLE IF NOT EXISTS events (
    -- Event identification
    event_id String,
    site_id String,
    session_id String,
    user_id String,
    
    -- Event data
    event_type LowCardinality(String),
    event_data String, -- JSON string
    
    -- Page context
    page_url String,
    page_path String,
    page_title String,
    
    -- User context
    ip_address IPv4,
    user_agent String,
    
    -- Device data
    device_type LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    viewport_width UInt16,
    viewport_height UInt16,
    screen_width UInt16,
    screen_height UInt16,
    
    -- Geographic data
    country LowCardinality(String),
    region String,
    city String,
    
    -- Timing
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date, event_type, timestamp)
TTL date + INTERVAL 13 MONTH DELETE
SETTINGS index_granularity = 8192;

-- Click events table (optimized for heatmap generation)
CREATE TABLE IF NOT EXISTS click_events (
    -- Event identification
    event_id String,
    site_id String,
    session_id String,
    user_id String,
    
    -- Click coordinates
    x UInt16,
    y UInt16,
    page_x UInt16,
    page_y UInt16,
    
    -- Target element
    element_selector String,
    element_tag LowCardinality(String),
    element_text String,
    element_attributes String, -- JSON
    
    -- Page context
    page_url String,
    page_path String,
    viewport_width UInt16,
    viewport_height UInt16,
    
    -- Device context
    device_type LowCardinality(String),
    is_mobile UInt8,
    
    -- Timing
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, date, timestamp)
TTL date + INTERVAL 13 MONTH DELETE
SETTINGS index_granularity = 8192;

-- Scroll events table
CREATE TABLE IF NOT EXISTS scroll_events (
    -- Event identification
    event_id String,
    site_id String,
    session_id String,
    user_id String,
    
    -- Scroll data
    scroll_top UInt16,
    scroll_left UInt16,
    scroll_depth Float32,
    max_scroll_depth Float32,
    document_height UInt16,
    viewport_height UInt16,
    
    -- Page context
    page_url String,
    page_path String,
    
    -- Time on page
    time_on_page UInt32, -- milliseconds
    
    -- Device context
    device_type LowCardinality(String),
    is_mobile UInt8,
    
    -- Timing
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, date, timestamp)
TTL date + INTERVAL 13 MONTH DELETE
SETTINGS index_granularity = 8192;

-- Mouse movement events table (if enabled)
CREATE TABLE IF NOT EXISTS mouse_events (
    -- Event identification
    event_id String,
    site_id String,
    session_id String,
    user_id String,
    
    -- Mouse coordinates
    x UInt16,
    y UInt16,
    page_x UInt16,
    page_y UInt16,
    
    -- Movement data
    velocity Float32,
    direction Float32,
    time_since_last_move UInt16,
    
    -- Page context
    page_url String,
    page_path String,
    viewport_width UInt16,
    viewport_height UInt16,
    
    -- Timing
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, date, timestamp)
TTL date + INTERVAL 6 MONTH DELETE -- Shorter retention for mouse data
SETTINGS index_granularity = 8192;

-- Form interaction events
CREATE TABLE IF NOT EXISTS form_events (
    -- Event identification
    event_id String,
    site_id String,
    session_id String,
    user_id String,
    
    -- Form data
    form_selector String,
    field_selector String,
    field_name String,
    field_type LowCardinality(String),
    interaction_type LowCardinality(String), -- focus, blur, change, submit
    
    -- Interaction metrics
    time_in_field UInt32, -- milliseconds
    character_count UInt16,
    value_hash String, -- Hashed field value for privacy
    
    -- Page context
    page_url String,
    page_path String,
    
    -- Timing
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, interaction_type, date, timestamp)
TTL date + INTERVAL 13 MONTH DELETE
SETTINGS index_granularity = 8192;

-- Page view events
CREATE TABLE IF NOT EXISTS page_views (
    -- Event identification
    event_id String,
    site_id String,
    session_id String,
    user_id String,
    
    -- Page data
    page_url String,
    page_path String,
    page_title String,
    referrer String,
    
    -- Viewport data
    viewport_width UInt16,
    viewport_height UInt16,
    screen_width UInt16,
    screen_height UInt16,
    color_depth UInt8,
    pixel_ratio Float32,
    
    -- Performance metrics
    load_time UInt16, -- milliseconds
    dom_ready_time UInt16,
    first_paint_time UInt16,
    first_contentful_paint UInt16,
    
    -- Engagement metrics
    time_on_page UInt32, -- seconds
    scroll_depth Float32,
    max_scroll_depth Float32,
    bounce UInt8, -- boolean
    
    -- Device context
    device_type LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    is_mobile UInt8,
    
    -- Geographic data
    country LowCardinality(String),
    region String,
    city String,
    
    -- UTM parameters
    utm_source String,
    utm_medium String,
    utm_campaign String,
    utm_term String,
    utm_content String,
    
    -- Timing
    timestamp DateTime64(3),
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date, page_path, timestamp)
TTL date + INTERVAL 25 MONTH DELETE -- Longer retention for page views
SETTINGS index_granularity = 8192;

-- Session events
CREATE TABLE IF NOT EXISTS session_events (
    -- Session identification
    session_id String,
    site_id String,
    user_id String,
    
    -- Session metadata
    ip_address IPv4,
    user_agent String,
    
    -- Device data
    device_type LowCardinality(String),
    browser LowCardinality(String),
    browser_version String,
    os LowCardinality(String),
    is_mobile UInt8,
    
    -- Geographic data
    country LowCardinality(String),
    region String,
    city String,
    timezone String,
    
    -- Session metrics
    duration_seconds UInt32,
    page_views UInt16,
    events_count UInt32,
    bounce UInt8, -- boolean
    
    -- Referrer data
    referrer_url String,
    referrer_domain String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    utm_term String,
    utm_content String,
    
    -- Timing
    started_at DateTime64(3),
    ended_at DateTime64(3),
    date Date MATERIALIZED toDate(started_at),
    hour UInt8 MATERIALIZED toHour(started_at)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date, started_at)
TTL date + INTERVAL 25 MONTH DELETE
SETTINGS index_granularity = 8192;

-- Materialized views for real-time aggregations

-- Hourly click aggregations for heatmap generation
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_click_aggregations
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, viewport_width, viewport_height, date, hour, x_bucket, y_bucket)
TTL date + INTERVAL 13 MONTH DELETE
AS SELECT
    site_id,
    page_path,
    viewport_width,
    viewport_height,
    date,
    hour,
    intDiv(x, 10) * 10 as x_bucket, -- Group coordinates into 10px buckets
    intDiv(y, 10) * 10 as y_bucket,
    count() as click_count,
    device_type
FROM click_events
GROUP BY site_id, page_path, viewport_width, viewport_height, date, hour, x_bucket, y_bucket, device_type;

-- Daily page view aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_page_aggregations
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, date, device_type)
TTL date + INTERVAL 25 MONTH DELETE
AS SELECT
    site_id,
    page_path,
    date,
    device_type,
    count() as page_views,
    avg(time_on_page) as avg_time_on_page,
    avg(scroll_depth) as avg_scroll_depth,
    sum(bounce) as bounces
FROM page_views
GROUP BY site_id, page_path, date, device_type;

-- Scroll depth aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS scroll_depth_aggregations
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, page_path, date, depth_bucket)
TTL date + INTERVAL 13 MONTH DELETE
AS SELECT
    site_id,
    page_path,
    date,
    intDiv(scroll_depth * 10, 10) as depth_bucket, -- 10% buckets
    count() as scroll_count,
    avg(time_on_page) as avg_time_at_depth
FROM scroll_events
GROUP BY site_id, page_path, date, depth_bucket;

-- Create dictionaries for efficient lookups
CREATE DICTIONARY IF NOT EXISTS site_lookup
(
    site_id String,
    organization_id String,
    domain String
)
PRIMARY KEY site_id
SOURCE(POSTGRESQL(
    host 'postgres'
    port 5432
    user 'heatmap_user'
    password 'dev_password_2024'
    db 'heatmap_analytics'
    table 'sites'
))
LAYOUT(HASHED())
LIFETIME(MIN 300 MAX 600);

-- Utility functions for heatmap generation
CREATE FUNCTION IF NOT EXISTS generateHeatmapData AS (site_id_param, page_path_param, date_start, date_end, viewport_w, viewport_h) -> 
arrayMap(
    x -> (x.1, x.2, x.3),
    arraySort(
        x -> x.3,
        groupArray((x_bucket, y_bucket, click_count))
    )
)
FROM (
    SELECT 
        x_bucket,
        y_bucket,
        sum(click_count) as click_count
    FROM hourly_click_aggregations
    WHERE site_id = site_id_param
        AND page_path = page_path_param
        AND date >= date_start
        AND date <= date_end
        AND viewport_width = viewport_w
        AND viewport_height = viewport_h
    GROUP BY x_bucket, y_bucket
    ORDER BY click_count DESC
    LIMIT 10000 -- Limit to prevent excessive data
);

-- Create indexes for better query performance
-- Note: ClickHouse uses ORDER BY clause for indexing, additional indexes for specific queries

-- Optimize settings for high-throughput ingestion
SET max_memory_usage = 20000000000; -- 20GB
SET max_bytes_before_external_group_by = 20000000000;
SET max_bytes_before_external_sort = 20000000000;