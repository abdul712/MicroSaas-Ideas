'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: React.ElementType;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100'
  };

  const trendIcon = change?.trend === 'up' ? TrendingUpIcon : 
                   change?.trend === 'down' ? TrendingDownIcon : null;
  const trendColor = change?.trend === 'up' ? 'text-green-600' : 
                     change?.trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${trendColor}`}>
              {trendIcon && <trendIcon className="h-4 w-4 mr-1" />}
              <span>{Math.abs(change.value)}% {change.period}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

interface AnalyticsDashboardProps {
  projectId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  dateRange
}) => {
  const [metrics, setMetrics] = useState({
    totalVisitors: 12543,
    conversions: 376,
    conversionRate: 3.2,
    averageSessionDuration: '2m 34s',
    bounceRate: 42.1,
    revenuePerVisitor: 15.67
  });

  const [conversionTrend, setConversionTrend] = useState([
    { date: '2024-01-01', visitors: 1200, conversions: 38, rate: 3.17 },
    { date: '2024-01-02', visitors: 1350, conversions: 45, rate: 3.33 },
    { date: '2024-01-03', visitors: 1180, conversions: 41, rate: 3.47 },
    { date: '2024-01-04', visitors: 1420, conversions: 52, rate: 3.66 },
    { date: '2024-01-05', visitors: 1580, conversions: 59, rate: 3.73 },
    { date: '2024-01-06', visitors: 1340, conversions: 48, rate: 3.58 },
    { date: '2024-01-07', visitors: 1260, conversions: 44, rate: 3.49 }
  ]);

  const [funnelData, setFunnelData] = useState([
    { name: 'Page Visit', value: 10000, fill: '#3b82f6' },
    { name: 'Product View', value: 6500, fill: '#10b981' },
    { name: 'Add to Cart', value: 2800, fill: '#f59e0b' },
    { name: 'Checkout', value: 1200, fill: '#ef4444' },
    { name: 'Purchase', value: 380, fill: '#8b5cf6' }
  ]);

  const [topPages, setTopPages] = useState([
    { page: '/product/wireless-headphones', visitors: 2845, conversions: 127, rate: 4.46 },
    { page: '/category/electronics', visitors: 2156, conversions: 86, rate: 3.99 },
    { page: '/product/smartphone-case', visitors: 1923, conversions: 72, rate: 3.74 },
    { page: '/landing/summer-sale', visitors: 1687, conversions: 94, rate: 5.57 },
    { page: '/product/bluetooth-speaker', visitors: 1534, conversions: 58, rate: 3.78 }
  ]);

  const [deviceBreakdown, setDeviceBreakdown] = useState([
    { name: 'Desktop', value: 45.2, color: '#3b82f6' },
    { name: 'Mobile', value: 38.7, color: '#10b981' },
    { name: 'Tablet', value: 16.1, color: '#f59e0b' }
  ]);

  const [trafficSources, setTrafficSources] = useState([
    { source: 'Organic Search', visitors: 4823, percentage: 38.4 },
    { source: 'Direct', visitors: 3267, percentage: 26.0 },
    { source: 'Social Media', visitors: 2156, percentage: 17.2 },
    { source: 'Paid Ads', visitors: 1547, percentage: 12.3 },
    { source: 'Email', visitors: 750, percentage: 6.0 }
  ]);

  const [realtimeData, setRealtimeData] = useState({
    activeVisitors: 127,
    conversionsToday: 23,
    topPage: '/product/wireless-headphones',
    avgTimeOnSite: '2m 18s'
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        ...prev,
        activeVisitors: Math.floor(Math.random() * 50) + 100,
        conversionsToday: prev.conversionsToday + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Real-time Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{realtimeData.activeVisitors}</div>
            <div className="text-sm text-gray-600">Active Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{realtimeData.conversionsToday}</div>
            <div className="text-sm text-gray-600">Conversions Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 truncate">{realtimeData.topPage}</div>
            <div className="text-sm text-gray-600">Top Page</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{realtimeData.avgTimeOnSite}</div>
            <div className="text-sm text-gray-600">Avg. Time on Site</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Visitors"
          value={metrics.totalVisitors.toLocaleString()}
          change={{ value: 12.5, trend: 'up', period: 'vs last month' }}
          icon={UserGroupIcon}
          color="blue"
        />
        <MetricCard
          title="Conversions"
          value={metrics.conversions}
          change={{ value: 8.3, trend: 'up', period: 'vs last month' }}
          icon={TrendingUpIcon}
          color="green"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change={{ value: 2.1, trend: 'up', period: 'vs last month' }}
          icon={ChartBarIcon}
          color="purple"
        />
        <MetricCard
          title="Avg. Session Duration"
          value={metrics.averageSessionDuration}
          change={{ value: 5.7, trend: 'down', period: 'vs last month' }}
          icon={ClockIcon}
          color="yellow"
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.bounceRate}%`}
          change={{ value: 3.2, trend: 'down', period: 'vs last month' }}
          icon={EyeIcon}
          color="red"
        />
        <MetricCard
          title="Revenue per Visitor"
          value={`$${metrics.revenuePerVisitor}`}
          change={{ value: 15.8, trend: 'up', period: 'vs last month' }}
          icon={CursorArrowRaysIcon}
          color="green"
        />
      </div>

      {/* Conversion Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={conversionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'rate' ? `${value}%` : value,
                  name === 'rate' ? 'Conversion Rate' : name === 'visitors' ? 'Visitors' : 'Conversions'
                ]}
              />
              <Legend />
              <Bar dataKey="visitors" fill="#e5e7eb" name="Visitors" />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Conversion Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                />
                <Tooltip />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Pages */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Pages</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPages.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.page}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.visitors.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      page.rate > 4 ? 'bg-green-100 text-green-800' :
                      page.rate > 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {page.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
        <div className="space-y-4">
          {trafficSources.map((source, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{source.source}</span>
                  <span className="text-sm text-gray-600">{source.visitors.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900 w-12 text-right">
                {source.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;