-- ClickHouse Schema for Website Heatmap Tool
-- High-performance time-series analytics and event storage

-- Events table for all user interactions
CREATE TABLE IF NOT EXISTS events (
    event_id String,
    event_type Enum8(
        'page_view' = 1,
        'click' = 2, 
        'scroll' = 3,
        'hover' = 4,
        'form_submit' = 5,
        'form_focus' = 6,
        'form_blur' = 7,
        'custom' = 8,
        'identify' = 9
    ),
    timestamp DateTime64(3),
    session_id String,
    user_id Nullable(String),
    website_id String,
    organization_id String,
    
    -- Page context
    url String,
    url_path String,
    url_domain String,
    page_title Nullable(String),
    referrer Nullable(String),
    
    -- User context
    user_agent String,
    ip_address IPv4,
    country_code FixedString(2),
    city Nullable(String),
    
    -- Device information
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    browser String,
    browser_version String,
    os String,
    os_version String,
    screen_width UInt16,
    screen_height UInt16,
    viewport_width UInt16,
    viewport_height UInt16,
    
    -- Event-specific data
    click_x Nullable(UInt16),
    click_y Nullable(UInt16),
    click_button Nullable(UInt8),
    click_element_tag Nullable(String),
    click_element_id Nullable(String),
    click_element_class Nullable(String),
    click_element_selector Nullable(String),
    
    scroll_x Nullable(UInt16),
    scroll_y Nullable(UInt16),
    scroll_percentage Nullable(UInt8),
    document_height Nullable(UInt16),
    
    hover_x Nullable(UInt16),
    hover_y Nullable(UInt16),
    hover_element_tag Nullable(String),
    hover_element_id Nullable(String),
    hover_element_class Nullable(String),
    
    form_element_tag Nullable(String),
    form_element_id Nullable(String),
    form_element_name Nullable(String),
    form_element_type Nullable(String),
    form_data Nullable(String), -- JSON string
    
    -- Custom event data
    event_name Nullable(String),
    event_properties Nullable(String), -- JSON string
    
    -- Metadata
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, website_id, timestamp, session_id)
TTL timestamp + INTERVAL 2 YEAR -- Auto-delete old data
SETTINGS index_granularity = 8192;

-- Sessions table for aggregated session data
CREATE TABLE IF NOT EXISTS sessions (
    session_id String,
    user_id Nullable(String),
    website_id String,
    organization_id String,
    
    -- Session timing
    session_start DateTime64(3),
    session_end DateTime64(3),
    duration_seconds UInt32,
    
    -- Session context
    landing_page String,
    exit_page String,
    referrer Nullable(String),
    utm_source Nullable(String),
    utm_medium Nullable(String),
    utm_campaign Nullable(String),
    
    -- Device information
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    browser String,
    os String,
    country_code FixedString(2),
    city Nullable(String),
    
    -- Session metrics
    page_views UInt16,
    clicks UInt16,
    scrolls UInt16,
    hovers UInt16,
    form_interactions UInt16,
    max_scroll_percentage UInt8,
    
    -- Conversion tracking
    is_bounce Boolean DEFAULT false,
    is_conversion Boolean DEFAULT false,
    conversion_value Nullable(Float32),
    
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(session_start)
ORDER BY (organization_id, website_id, session_start, session_id)
TTL session_start + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- Page views with performance metrics
CREATE TABLE IF NOT EXISTS page_views (
    page_view_id String,
    session_id String,
    user_id Nullable(String),
    website_id String,
    organization_id String,
    
    -- Page information
    url String,
    url_path String,
    page_title Nullable(String),
    referrer Nullable(String),
    
    -- Timing metrics
    timestamp DateTime64(3),
    time_on_page_seconds UInt32,
    
    -- Performance metrics
    load_time_ms Nullable(UInt32),
    dom_content_loaded_ms Nullable(UInt32),
    first_contentful_paint_ms Nullable(UInt32),
    largest_contentful_paint_ms Nullable(UInt32),
    first_input_delay_ms Nullable(UInt32),
    cumulative_layout_shift Nullable(Float32),
    
    -- User interaction metrics
    clicks UInt16 DEFAULT 0,
    scrolls UInt16 DEFAULT 0,
    max_scroll_percentage UInt8 DEFAULT 0,
    
    -- Device context
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    viewport_width UInt16,
    viewport_height UInt16,
    
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, website_id, url_path, timestamp)
TTL timestamp + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- Heatmap data aggregated by coordinates
CREATE TABLE IF NOT EXISTS heatmap_coordinates (
    coordinate_id String,
    website_id String,
    organization_id String,
    url_pattern String,
    
    -- Coordinate data
    x UInt16,
    y UInt16,
    element_tag Nullable(String),
    element_id Nullable(String),
    element_class Nullable(String),
    element_selector Nullable(String),
    
    -- Interaction counts
    click_count UInt32 DEFAULT 0,
    hover_count UInt32 DEFAULT 0,
    
    -- Time ranges
    date_start Date,
    date_end Date,
    
    -- Device segmentation
    desktop_clicks UInt32 DEFAULT 0,
    mobile_clicks UInt32 DEFAULT 0,
    tablet_clicks UInt32 DEFAULT 0,
    
    -- Metadata
    last_updated DateTime DEFAULT now(),
    created_at DateTime DEFAULT now()
) ENGINE = SummingMergeTree((click_count, hover_count, desktop_clicks, mobile_clicks, tablet_clicks))
PARTITION BY toYYYYMM(date_start)
ORDER BY (organization_id, website_id, url_pattern, x, y, date_start)
TTL date_start + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- User journey tracking
CREATE TABLE IF NOT EXISTS user_journeys (
    journey_id String,
    session_id String,
    user_id Nullable(String),
    website_id String,
    organization_id String,
    
    -- Journey steps
    step_number UInt8,
    url String,
    url_path String,
    page_title Nullable(String),
    
    -- Timing
    timestamp DateTime64(3),
    time_spent_seconds UInt32,
    
    -- Interactions on this step
    clicks UInt16 DEFAULT 0,
    scrolls UInt16 DEFAULT 0,
    form_interactions UInt16 DEFAULT 0,
    
    -- Exit tracking
    is_exit Boolean DEFAULT false,
    exit_type Nullable(Enum8('bounce' = 1, 'navigation' = 2, 'close' = 3, 'timeout' = 4)),
    
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, website_id, session_id, step_number)
TTL timestamp + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- Error and rage click tracking
CREATE TABLE IF NOT EXISTS error_events (
    error_id String,
    session_id String,
    website_id String,
    organization_id String,
    
    -- Error details
    error_type Enum8('rage_click' = 1, 'dead_click' = 2, 'js_error' = 3, 'network_error' = 4),
    timestamp DateTime64(3),
    url String,
    
    -- Element information
    element_tag Nullable(String),
    element_id Nullable(String),
    element_class Nullable(String),
    element_selector Nullable(String),
    
    -- Error specifics
    click_count Nullable(UInt8), -- for rage clicks
    error_message Nullable(String),
    error_stack Nullable(String),
    
    -- Context
    user_agent String,
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, website_id, error_type, timestamp)
TTL timestamp + INTERVAL 1 YEAR
SETTINGS index_granularity = 8192;

-- A/B test results
CREATE TABLE IF NOT EXISTS ab_test_events (
    test_event_id String,
    session_id String,
    user_id Nullable(String),
    website_id String,
    organization_id String,
    
    -- Test information
    test_id String,
    variant_id String,
    test_name String,
    variant_name String,
    
    -- Event details
    event_type Enum8('exposure' = 1, 'conversion' = 2),
    timestamp DateTime64(3),
    
    -- Conversion details
    conversion_value Nullable(Float32),
    conversion_currency Nullable(String),
    
    -- Context
    url String,
    referrer Nullable(String),
    device_type Enum8('desktop' = 1, 'mobile' = 2, 'tablet' = 3),
    
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (organization_id, website_id, test_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- Real-time metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMMDD(date)
ORDER BY (organization_id, website_id, date, hour)
AS
SELECT
    organization_id,
    website_id,
    toDate(timestamp) as date,
    toHour(timestamp) as hour,
    count() as total_events,
    uniqExact(session_id) as unique_sessions,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'click') as clicks,
    countIf(event_type = 'scroll') as scrolls,
    countIf(event_type = 'hover') as hovers,
    countIf(event_type IN ('form_submit', 'form_focus', 'form_blur')) as form_interactions,
    avg(scroll_percentage) as avg_scroll_percentage
FROM events
GROUP BY organization_id, website_id, date, hour;

-- Daily metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, website_id, date)
AS
SELECT
    organization_id,
    website_id,
    toDate(timestamp) as date,
    count() as total_events,
    uniqExact(session_id) as unique_sessions,
    uniqExact(user_id) as unique_users,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'click') as clicks,
    countIf(event_type = 'scroll') as scrolls,
    uniqExact(url_path) as unique_pages,
    avg(scroll_percentage) as avg_scroll_percentage,
    quantile(0.5)(scroll_percentage) as median_scroll_percentage,
    quantile(0.95)(scroll_percentage) as p95_scroll_percentage
FROM events
GROUP BY organization_id, website_id, date;

-- Popular pages materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_pages
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, website_id, url_path, date)
AS
SELECT
    organization_id,
    website_id,
    url_path,
    toDate(timestamp) as date,
    count() as total_events,
    uniqExact(session_id) as unique_sessions,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'click') as clicks,
    avg(scroll_percentage) as avg_scroll_percentage
FROM events
WHERE url_path != ''
GROUP BY organization_id, website_id, url_path, date;

-- Click heatmap aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS click_heatmap_data
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, website_id, url_path, x, y, date)
AS
SELECT
    organization_id,
    website_id,
    url_path,
    click_x as x,
    click_y as y,
    toDate(timestamp) as date,
    count() as click_count,
    countIf(device_type = 'desktop') as desktop_clicks,
    countIf(device_type = 'mobile') as mobile_clicks,
    countIf(device_type = 'tablet') as tablet_clicks,
    uniqExact(session_id) as unique_sessions
FROM events
WHERE event_type = 'click' AND click_x IS NOT NULL AND click_y IS NOT NULL
GROUP BY organization_id, website_id, url_path, x, y, date;

-- Browser and device analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS browser_analytics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (organization_id, website_id, browser, os, date)
AS
SELECT
    organization_id,
    website_id,
    browser,
    os,
    device_type,
    toDate(timestamp) as date,
    uniqExact(session_id) as unique_sessions,
    count() as total_events,
    countIf(event_type = 'page_view') as page_views,
    avg(scroll_percentage) as avg_scroll_percentage
FROM events
GROUP BY organization_id, website_id, browser, os, device_type, date;

-- Indexes for better query performance
ALTER TABLE events ADD INDEX idx_url_path url_path TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_session_id session_id TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_user_id user_id TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE sessions ADD INDEX idx_landing_page landing_page TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE sessions ADD INDEX idx_user_id user_id TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE page_views ADD INDEX idx_url_path url_path TYPE bloom_filter(0.01) GRANULARITY 1;
ALTER TABLE page_views ADD INDEX idx_session_id session_id TYPE bloom_filter(0.01) GRANULARITY 1;

-- Functions for common queries
-- Note: ClickHouse doesn't support stored procedures, but we can create these as part of application layer

-- Create database for development if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS heatmap_analytics;