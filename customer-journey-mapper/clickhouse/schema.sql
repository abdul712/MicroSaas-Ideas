-- ClickHouse schema for high-performance analytics
-- Run this schema on your ClickHouse instance

-- Events table for raw event data
CREATE TABLE IF NOT EXISTS events (
    id String,
    event_type String,
    customer_id String,
    journey_id Nullable(String),
    session_id Nullable(String),
    properties String, -- JSON string
    timestamp DateTime64(3),
    org_id String,
    date Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp)
) ENGINE = MergeTree()
PARTITION BY (org_id, date)
ORDER BY (timestamp, customer_id, event_type)
TTL timestamp + INTERVAL 2 YEAR;

-- Journey paths for path analysis
CREATE TABLE IF NOT EXISTS journey_paths (
    id String,
    customer_id String,
    journey_id String,
    org_id String,
    path Array(String), -- Array of touchpoint IDs
    path_events Array(String), -- Array of event types
    timestamps Array(DateTime64(3)), -- Timestamps for each step
    duration_ms UInt64,
    completion_status Enum8('in_progress' = 1, 'completed' = 2, 'dropped_off' = 3),
    started_at DateTime64(3),
    completed_at Nullable(DateTime64(3)),
    date Date MATERIALIZED toDate(started_at)
) ENGINE = MergeTree()
PARTITION BY (org_id, date)
ORDER BY (started_at, journey_id, customer_id);

-- Touchpoint performance metrics
CREATE TABLE IF NOT EXISTS touchpoint_metrics (
    org_id String,
    journey_id String,
    touchpoint_id String,
    date Date,
    hour UInt8,
    visits UInt64,
    unique_visitors UInt64,
    conversions UInt64,
    drop_offs UInt64,
    avg_time_spent Float64,
    bounce_rate Float64
) ENGINE = SummingMergeTree()
PARTITION BY (org_id, date)
ORDER BY (date, hour, journey_id, touchpoint_id);

-- Conversion funnel analysis
CREATE TABLE IF NOT EXISTS conversion_funnels (
    org_id String,
    journey_id String,
    funnel_step UInt8,
    step_name String,
    date Date,
    hour UInt8,
    entries UInt64,
    exits UInt64,
    conversions UInt64,
    conversion_rate Float64,
    avg_time_to_convert Float64
) ENGINE = SummingMergeTree()
PARTITION BY (org_id, date)
ORDER BY (date, hour, journey_id, funnel_step);

-- Customer segments for cohort analysis
CREATE TABLE IF NOT EXISTS customer_segments (
    customer_id String,
    org_id String,
    journey_id String,
    segment_name String,
    segment_properties String, -- JSON
    first_event_date Date,
    last_event_date Date,
    total_events UInt64,
    total_sessions UInt64,
    lifetime_value Float64
) ENGINE = ReplacingMergeTree()
PARTITION BY (org_id, first_event_date)
ORDER BY (customer_id, journey_id, segment_name);

-- Real-time session tracking
CREATE TABLE IF NOT EXISTS active_sessions (
    session_id String,
    customer_id String,
    org_id String,
    journey_id Nullable(String),
    current_touchpoint Nullable(String),
    session_start DateTime64(3),
    last_activity DateTime64(3),
    page_views UInt32,
    events_count UInt32,
    device_type String,
    browser String,
    location String
) ENGINE = ReplacingMergeTree(last_activity)
PARTITION BY (org_id, toDate(session_start))
ORDER BY (session_id, customer_id);

-- Materialized views for real-time analytics

-- Real-time touchpoint performance
CREATE MATERIALIZED VIEW IF NOT EXISTS touchpoint_performance_mv TO touchpoint_metrics AS
SELECT
    org_id,
    journey_id,
    JSONExtractString(properties, 'touchpoint_id') as touchpoint_id,
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    count() as visits,
    uniq(customer_id) as unique_visitors,
    countIf(event_type = 'conversion') as conversions,
    countIf(event_type = 'exit') as drop_offs,
    avg(toFloat64OrNull(JSONExtractString(properties, 'time_spent'))) as avg_time_spent,
    countIf(JSONExtractString(properties, 'is_bounce') = 'true') / count() as bounce_rate
FROM events
WHERE JSONHas(properties, 'touchpoint_id')
GROUP BY org_id, journey_id, touchpoint_id, date, hour;

-- Real-time funnel analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_analysis_mv TO conversion_funnels AS
SELECT
    org_id,
    journey_id,
    toUInt8(JSONExtractUInt(properties, 'funnel_step')) as funnel_step,
    JSONExtractString(properties, 'step_name') as step_name,
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    countIf(event_type = 'funnel_entry') as entries,
    countIf(event_type = 'funnel_exit') as exits,
    countIf(event_type = 'funnel_conversion') as conversions,
    conversions / entries as conversion_rate,
    avg(toFloat64OrNull(JSONExtractString(properties, 'time_to_convert'))) as avg_time_to_convert
FROM events
WHERE JSONHas(properties, 'funnel_step')
GROUP BY org_id, journey_id, funnel_step, step_name, date, hour;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_events_customer_journey ON events (customer_id, journey_id);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events (event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_journey_paths_completion ON journey_paths (completion_status, journey_id);
CREATE INDEX IF NOT EXISTS idx_touchpoint_metrics_date ON touchpoint_metrics (date, journey_id);