import axios from 'axios';

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || 'socialproof_analytics';

export class ClickHouseClient {
  private baseURL: string;
  private database: string;

  constructor() {
    this.baseURL = CLICKHOUSE_URL;
    this.database = CLICKHOUSE_DATABASE;
  }

  async query(sql: string): Promise<any[]> {
    try {
      const response = await axios.post(`${this.baseURL}/?database=${this.database}`, sql, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      
      if (response.data) {
        // Parse JSON response if query returns JSON format
        return response.data.split('\n').filter(Boolean).map((line: string) => JSON.parse(line));
      }
      return [];
    } catch (error) {
      console.error('ClickHouse query error:', error);
      throw error;
    }
  }

  async insert(table: string, data: Record<string, any>[]): Promise<void> {
    if (!data.length) return;

    const columns = Object.keys(data[0]);
    const values = data.map(row => 
      columns.map(col => {
        const value = row[col];
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "\\'")}'`;
        }
        if (value === null || value === undefined) {
          return 'NULL';
        }
        return value;
      }).join(', ')
    );

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${values.map(v => `(${v})`).join(', ')}
    `;

    await this.query(sql);
  }

  async createAnalyticsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS widget_analytics (
        timestamp DateTime64(3),
        organization_id String,
        widget_id String,
        campaign_id String,
        event_type String,
        visitor_id String,
        page_url String,
        device_type String,
        location String,
        conversion_value Float64,
        attribution_data String
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (organization_id, timestamp)
    `;
    
    await this.query(sql);
  }

  async createConversionFunnelTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS conversion_funnel (
        timestamp DateTime64(3),
        organization_id String,
        visitor_id String,
        funnel_step String,
        page_url String,
        revenue Float64
      ) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (organization_id, timestamp)
    `;
    
    await this.query(sql);
  }
}

export const clickhouse = new ClickHouseClient();