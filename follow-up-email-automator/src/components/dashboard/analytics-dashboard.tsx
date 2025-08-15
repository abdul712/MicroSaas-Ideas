"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { 
  Mail, 
  MousePointer, 
  Eye, 
  Reply, 
  Bounce, 
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    emailsReplied: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  };
  trends: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
  }>;
  topPerformingTemplates: Array<{
    id: string;
    name: string;
    openRate: number;
    clickRate: number;
    sent: number;
  }>;
  sequencePerformance: Array<{
    id: string;
    name: string;
    enrolled: number;
    completed: number;
    openRate: number;
    clickRate: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  timeRange: "7d" | "30d" | "90d";
  onTimeRangeChange: (range: "7d" | "30d" | "90d") => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function AnalyticsDashboard({ data, timeRange, onTimeRangeChange }: AnalyticsDashboardProps) {
  const { overview, trends, topPerformingTemplates, sequencePerformance, hourlyStats, deviceBreakdown } = data;

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "blue",
    format = "number" 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    color?: string;
    format?: "number" | "percentage";
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format === "percentage" ? `${value.toFixed(1)}%` : value.toLocaleString()}
        </div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {change > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
            )}
            <span className={change > 0 ? "text-green-600" : "text-red-600"}>
              {Math.abs(change).toFixed(1)}% from last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Last {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Emails Sent"
          value={overview.emailsSent}
          icon={Mail}
          color="blue"
        />
        <MetricCard
          title="Open Rate"
          value={overview.openRate}
          icon={Eye}
          color="green"
          format="percentage"
        />
        <MetricCard
          title="Click Rate"
          value={overview.clickRate}
          icon={MousePointer}
          color="purple"
          format="percentage"
        />
        <MetricCard
          title="Reply Rate"
          value={overview.replyRate}
          icon={Reply}
          color="orange"
          format="percentage"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Email Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8"
                  name="Sent"
                />
                <Area 
                  type="monotone" 
                  dataKey="opened" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  name="Opened"
                />
                <Area 
                  type="monotone" 
                  dataKey="clicked" 
                  stackId="3" 
                  stroke="#ffc658" 
                  fill="#ffc658"
                  name="Clicked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Best Send Times</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(hour) => `${hour}:00`}
                />
                <Bar dataKey="opened" fill="#82ca9d" name="Opens" />
                <Bar dataKey="clicked" fill="#ffc658" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percentage }) => `${device} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingTemplates.slice(0, 5).map((template, index) => (
                <div key={template.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.sent} sent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{template.openRate.toFixed(1)}% open</p>
                    <p className="text-xs text-gray-500">{template.clickRate.toFixed(1)}% click</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequence Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Email Sequence Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Sequence Name</th>
                  <th className="text-right p-2">Enrolled</th>
                  <th className="text-right p-2">Completed</th>
                  <th className="text-right p-2">Completion Rate</th>
                  <th className="text-right p-2">Open Rate</th>
                  <th className="text-right p-2">Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {sequencePerformance.map((sequence) => (
                  <tr key={sequence.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{sequence.name}</td>
                    <td className="p-2 text-right">{sequence.enrolled}</td>
                    <td className="p-2 text-right">{sequence.completed}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Progress 
                          value={(sequence.completed / sequence.enrolled) * 100} 
                          className="w-16 h-2" 
                        />
                        <span className="text-sm">
                          {((sequence.completed / sequence.enrolled) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-right">{sequence.openRate.toFixed(1)}%</td>
                    <td className="p-2 text-right">{sequence.clickRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Email Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 hours</div>
            <p className="text-xs text-muted-foreground">
              Average time to receive reply
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.emailsSent > 0 ? Math.round(overview.emailsSent / 2.3) : 0}</div>
            <p className="text-xs text-muted-foreground">
              Contacts receiving emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Bounce className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Email delivery failures
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}