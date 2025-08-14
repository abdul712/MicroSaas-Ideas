"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  CheckCircle
} from "lucide-react";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

// Mock data - in production, this would come from your API
const mockMetrics = {
  totalReviews: 247,
  averageRating: 4.6,
  responseRate: 85,
  newReviews: 12,
  totalReviewsChange: 15.2,
  averageRatingChange: 0.3,
  responseRateChange: -2.1,
  newReviewsChange: 25.0,
};

const mockRecentReviews = [
  {
    id: "1",
    customerName: "John Smith",
    platform: "Google My Business",
    rating: 5,
    text: "Excellent service and great food! The staff was very friendly and accommodating. Will definitely be back.",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: "new",
    sentiment: "positive",
  },
  {
    id: "2",
    customerName: "Sarah Johnson",
    platform: "Yelp",
    rating: 4,
    text: "Good experience overall. The ambiance was nice but the service was a bit slow.",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: "responded",
    sentiment: "positive",
  },
  {
    id: "3",
    customerName: "Mike Wilson",
    platform: "Facebook",
    rating: 2,
    text: "Not satisfied with the quality. Expected much better for the price.",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    status: "flagged",
    sentiment: "negative",
  },
];

const mockPlatformBreakdown = [
  { platform: "Google My Business", reviews: 156, rating: 4.7, color: "bg-blue-500" },
  { platform: "Yelp", reviews: 43, rating: 4.4, color: "bg-red-500" },
  { platform: "Facebook", reviews: 38, rating: 4.6, color: "bg-blue-600" },
  { platform: "TripAdvisor", reviews: 10, rating: 4.8, color: "bg-green-500" },
];

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4) return "text-lime-600";
    if (rating >= 3) return "text-yellow-600";
    if (rating >= 2) return "text-orange-600";
    return "text-red-600";
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "Google My Business": return "bg-blue-100 text-blue-800";
      case "Yelp": return "bg-red-100 text-red-800";
      case "Facebook": return "bg-blue-100 text-blue-800";
      case "TripAdvisor": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "responded": return "bg-green-100 text-green-800";
      case "flagged": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "😊";
      case "negative": return "😞";
      case "neutral": return "😐";
      default: return "❓";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(mockMetrics.totalReviews)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +{mockMetrics.totalReviewsChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getRatingColor(mockMetrics.averageRating))}>
              {mockMetrics.averageRating.toFixed(1)} ⭐
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +{mockMetrics.averageRatingChange} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.responseRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              {mockMetrics.responseRateChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.newReviews}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +{mockMetrics.newReviewsChange}% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Reviews
              <Badge variant="secondary">{mockRecentReviews.length} new</Badge>
            </CardTitle>
            <CardDescription>
              Latest reviews from all connected platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentReviews.map((review) => (
              <div key={review.id} className="flex space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {review.customerName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {review.customerName}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getPlatformColor(review.platform)}>
                        {review.platform.split(" ")[0]}
                      </Badge>
                      <span className="text-sm">{getSentimentIcon(review.sentiment)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {timeAgo(review.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {review.text}
                  </p>
                  <div className="mt-2">
                    <Badge className={getStatusColor(review.status)}>
                      {review.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Reviews
            </Button>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>
              Review distribution across platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockPlatformBreakdown.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-3 h-3 rounded-full", platform.color)} />
                  <div>
                    <p className="text-sm font-medium">{platform.platform}</p>
                    <p className="text-xs text-gray-500">
                      {platform.reviews} reviews
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-medium", getRatingColor(platform.rating))}>
                    {platform.rating.toFixed(1)} ⭐
                  </p>
                  <p className="text-xs text-gray-500">
                    {((platform.reviews / mockMetrics.totalReviews) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm">Respond to Reviews</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Send Invitations</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}