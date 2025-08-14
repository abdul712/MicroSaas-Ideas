-- ClickHouse schema for high-performance analytics
-- This handles the heavy analytics workload for customer journey data

CREATE DATABASE IF NOT EXISTS journey_analytics;

-- Raw events table for real-time data ingestion
CREATE TABLE IF NOT EXISTS journey_analytics.raw_events (
    event_id String,
    customer_id String,
    organization_id String,
    journey_id Nullable(String),
    touchpoint_id Nullable(String),
    event_type String,
    event_name String,
    properties String, -- JSON string
    session_id Nullable(String),
    timestamp DateTime64(3),
    source Nullable(String),
    user_agent Nullable(String),
    ip_address Nullable(String),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, customer_id, timestamp);

-- Processed events table for analytics queries
CREATE TABLE IF NOT EXISTS journey_analytics.processed_events (
    event_id String,
    customer_id String,
    organization_id String,
    journey_id Nullable(String),
    touchpoint_id Nullable(String),
    event_type String,
    event_name String,
    properties String,
    session_id Nullable(String),
    timestamp DateTime64(3),
    date Date,
    hour UInt8,
    source Nullable(String),
    user_agent Nullable(String),
    ip_address Nullable(String),
    country Nullable(String),
    region Nullable(String),
    city Nullable(String),
    device_type Nullable(String),
    browser Nullable(String),
    os Nullable(String),
    referrer Nullable(String),
    utm_source Nullable(String),
    utm_medium Nullable(String),
    utm_campaign Nullable(String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, journey_id, date, customer_id);

-- Journey sessions aggregation
CREATE TABLE IF NOT EXISTS journey_analytics.journey_sessions (
    session_id String,
    customer_id String,
    organization_id String,
    journey_id String,
    start_time DateTime64(3),
    end_time DateTime64(3),
    duration_seconds UInt32,
    event_count UInt32,
    touchpoints_visited Array(String),
    conversion_events Array(String),
    is_converted UInt8,
    conversion_value Nullable(Float64),
    device_type Nullable(String),
    source Nullable(String),
    date Date
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, journey_id, date, session_id);

-- Conversion funnel data
CREATE TABLE IF NOT EXISTS journey_analytics.conversion_funnel (
    organization_id String,
    journey_id String,
    stage_name String,
    stage_order UInt8,
    unique_users UInt64,
    total_events UInt64,
    conversion_rate Float64,
    drop_off_rate Float64,
    avg_time_to_next_stage Float64,
    date Date
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, journey_id, date, stage_order);

-- Customer lifetime journey paths
CREATE TABLE IF NOT EXISTS journey_analytics.customer_paths (
    customer_id String,
    organization_id String,
    journey_id String,
    path_sequence Array(String),
    touchpoint_sequence Array(String),
    event_timestamps Array(DateTime64(3)),
    total_duration_seconds UInt32,
    is_complete UInt8,
    conversion_value Nullable(Float64),
    start_date Date,
    end_date Date
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(start_date)
ORDER BY (organization_id, customer_id, journey_id);

-- Touchpoint performance metrics
CREATE TABLE IF NOT EXISTS journey_analytics.touchpoint_metrics (
    organization_id String,
    journey_id String,
    touchpoint_id String,
    touchpoint_name String,
    channel String,
    stage String,
    total_interactions UInt64,
    unique_users UInt64,
    conversion_rate Float64,
    avg_engagement_time Float64,
    bounce_rate Float64,
    exit_rate Float64,
    date Date,
    hour UInt8
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, journey_id, touchpoint_id, date, hour);

-- Real-time analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS journey_analytics.realtime_events_mv
TO journey_analytics.processed_events
AS SELECT
    event_id,
    customer_id,
    organization_id,
    journey_id,
    touchpoint_id,
    event_type,
    event_name,
    properties,
    session_id,
    timestamp,
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    source,
    user_agent,
    ip_address,
    -- Extract geolocation (simplified)
    NULL as country,
    NULL as region,
    NULL as city,
    -- Extract device info from user agent (simplified)
    multiIf(
        user_agent LIKE '%Mobile%', 'mobile',
        user_agent LIKE '%Tablet%', 'tablet',
        'desktop'
    ) as device_type,
    -- Extract browser (simplified)
    multiIf(
        user_agent LIKE '%Chrome%', 'Chrome',
        user_agent LIKE '%Firefox%', 'Firefox',
        user_agent LIKE '%Safari%', 'Safari',
        user_agent LIKE '%Edge%', 'Edge',
        'Other'
    ) as browser,
    -- Extract OS (simplified)
    multiIf(
        user_agent LIKE '%Windows%', 'Windows',
        user_agent LIKE '%Mac%', 'macOS',
        user_agent LIKE '%Linux%', 'Linux',
        user_agent LIKE '%Android%', 'Android',
        user_agent LIKE '%iOS%', 'iOS',
        'Other'
    ) as os,
    -- Extract UTM parameters from properties JSON (simplified)
    NULL as referrer,
    NULL as utm_source,
    NULL as utm_medium,
    NULL as utm_campaign
FROM journey_analytics.raw_events;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_processed_events_timestamp ON journey_analytics.processed_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_processed_events_session ON journey_analytics.processed_events (session_id);
CREATE INDEX IF NOT EXISTS idx_customer_paths_dates ON journey_analytics.customer_paths (start_date, end_date);