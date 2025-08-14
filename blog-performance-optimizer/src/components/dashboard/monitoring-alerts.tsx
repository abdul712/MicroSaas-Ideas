'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X,
  AlertCircle,
  TrendingDown,
  Shield,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MonitoringAlertsProps {
  websiteId: string | null;
}

export function MonitoringAlerts({ websiteId }: MonitoringAlertsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (websiteId) {
      loadAlerts();
    }
  }, [websiteId]);

  const loadAlerts = async () => {
    if (!websiteId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/monitoring?websiteId=${websiteId}&status=active`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alertId,
          status: 'acknowledged'
        }),
      });

      if (response.ok) {
        loadAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alertId,
          status: 'resolved'
        }),
      });

      if (response.ok) {
        loadAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'downtime':
        return <TrendingDown className="h-4 w-4" />;
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return severity === 'critical' ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const otherAlerts = alerts.filter(alert => alert.severity !== 'critical');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Monitoring Alerts</span>
          {alerts.length > 0 && (
            <Badge variant="error" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAlerts}
        >
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-500">No active alerts for this website.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                  Critical Alerts
                </h4>
                {criticalAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getAlertIcon(alert.type, alert.severity)}
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                      </div>
                      {alert.triggerValue && alert.thresholdValue && (
                        <div>
                          <span className="font-medium">{alert.triggerValue}</span>
                          <span className="text-gray-500"> / {alert.thresholdValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other Alerts */}
            {otherAlerts.length > 0 && (
              <div className="space-y-3">
                {criticalAlerts.length > 0 && (
                  <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    Other Alerts
                  </h4>
                )}
                {otherAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {getAlertIcon(alert.type, alert.severity)}
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="h-5 w-5 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                          className="h-5 w-5 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{alert.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                      </div>
                      {alert.triggerValue && alert.thresholdValue && (
                        <div>
                          <span className="font-medium">{alert.triggerValue}</span>
                          <span> / {alert.thresholdValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {otherAlerts.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm">
                      View {otherAlerts.length - 5} more alerts
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}