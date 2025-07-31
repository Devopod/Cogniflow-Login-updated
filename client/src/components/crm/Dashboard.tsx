import React, { useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { 
  Users, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Plus,
} from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useCrmDashboard, useGenerateReport } from "@/hooks/use-crm-data";
import { useCrmWebSocket, useCrmCacheInvalidation } from "@/hooks/use-crm-websocket";
import { toast } from "react-toastify";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "blue" | "green" | "yellow" | "purple" | "red";
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color,
  loading = false 
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  const iconColorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    yellow: "text-yellow-500",
    purple: "text-purple-500",
    red: "text-red-500",
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]} bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  trend.isPositive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`h-6 w-6 ${iconColorClasses[color]}`} />
        </div>
      </div>
    </div>
  );
};

interface Activity {
  id: number;
  subject: string;
  description?: string;
  activityType: string;
  activityDate: string;
  createdAt: string;
  contactId?: number;
  leadId?: number;
  dealId?: number;
  contact?: { name: string };
  lead?: { firstName: string; lastName: string };
  deal?: { title: string };
}

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  assignedTo?: number;
  contactId?: number;
  leadId?: number;
  dealId?: number;
}

const formatActivityDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) {
    return `Today ${format(date, "HH:mm")}`;
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "HH:mm")}`;
  } else {
    return format(date, "MMM dd, HH:mm");
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "call":
      return Phone;
    case "email":
      return Mail;
    case "meeting":
      return Calendar;
    default:
      return Activity;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "low":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export default function Dashboard() {
  // Enable real-time updates
  useCrmWebSocket();
  
  // Fetch dashboard data
  const { 
    metrics, 
    leadAnalytics, 
    dealPipeline, 
    recentActivities, 
    upcomingTasks, 
    isLoading, 
    error 
  } = useCrmDashboard();

  const generateReport = useGenerateReport();
  const { invalidateAll } = useCrmCacheInvalidation();

  // Memoized chart data
  const leadSourceChartData = useMemo(() => {
    if (!leadAnalytics?.leadSources) return null;

    const sources = leadAnalytics.leadSources;
    return {
      labels: sources.map((s: any) => s.source),
      datasets: [
        {
          data: sources.map((s: any) => s.count),
          backgroundColor: [
            "#3B82F6", // blue
            "#10B981", // green
            "#F59E0B", // yellow
            "#EF4444", // red
            "#8B5CF6", // purple
            "#F97316", // orange
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [leadAnalytics]);

  const pipelineChartData = useMemo(() => {
    if (!dealPipeline || dealPipeline.length === 0) return null;

    return {
      labels: dealPipeline.map((stage: any) => stage.name),
      datasets: [
        {
          label: "Deals Count",
          data: dealPipeline.map((stage: any) => stage.dealsCount || 0),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
        {
          label: "Total Value ($)",
          data: dealPipeline.map((stage: any) => (stage.totalValue || 0) / 1000), // Convert to thousands
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 1,
          yAxisID: "y1",
        },
      ],
    };
  }, [dealPipeline]);

  const handleRefresh = () => {
    invalidateAll();
    toast.success("Dashboard refreshed!");
  };

  const handleGenerateReport = async (type: "leads" | "activities" | "tasks" | "metrics") => {
    try {
      await generateReport.mutateAsync({
        type,
        format: "csv",
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          to: new Date().toISOString().split('T')[0], // today
        },
      });
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Unable to load dashboard data. Please try again.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleRefresh}
                    className="bg-red-100 px-4 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back! Here's what's happening with your CRM today.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleGenerateReport("metrics")}
                disabled={generateReport.isPending}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {generateReport.isPending ? "Generating..." : "Export Report"}
              </button>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Leads"
            value={metrics?.totalLeads ?? 0}
            icon={Users}
            color="blue"
            trend={metrics?.leadsTrend ? {
              value: metrics.leadsTrend,
              isPositive: metrics.leadsTrend > 0
            } : undefined}
            loading={isLoading}
          />
          <MetricCard
            title="Total Contacts"
            value={metrics?.totalContacts ?? 0}
            icon={CheckCircle}
            color="green"
            trend={metrics?.contactsTrend ? {
              value: metrics.contactsTrend,
              isPositive: metrics.contactsTrend > 0
            } : undefined}
            loading={isLoading}
          />
          <MetricCard
            title="Active Deals"
            value={metrics?.activeDeals ?? 0}
            icon={Target}
            color="purple"
            trend={metrics?.dealsTrend ? {
              value: metrics.dealsTrend,
              isPositive: metrics.dealsTrend > 0
            } : undefined}
            loading={isLoading}
          />
          <MetricCard
            title="Revenue"
            value={metrics?.totalRevenue ? `$${(metrics.totalRevenue / 1000).toFixed(1)}k` : "$0"}
            icon={DollarSign}
            color="yellow"
            trend={metrics?.revenueTrend ? {
              value: metrics.revenueTrend,
              isPositive: metrics.revenueTrend > 0
            } : undefined}
            loading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Source Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
              <button
                onClick={() => handleGenerateReport("leads")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Export Data
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : leadSourceChartData ? (
              <div className="h-64">
                <Pie 
                  data={leadSourceChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No lead source data available
              </div>
            )}
          </div>

          {/* Sales Pipeline */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sales Pipeline</h3>
              <button
                onClick={() => handleGenerateReport("metrics")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Export Data
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pipelineChartData ? (
              <div className="h-64">
                <Bar 
                  data={pipelineChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    scales: {
                      x: {
                        display: true,
                        title: {
                          display: true,
                          text: "Deal Stages",
                        },
                      },
                      y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "Number of Deals",
                        },
                      },
                      y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        title: {
                          display: true,
                          text: "Value (Thousands)",
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No pipeline data available
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Activities and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <button
                onClick={() => handleGenerateReport("activities")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity: Activity) => {
                  const ActivityIcon = getActivityIcon(activity.activityType);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ActivityIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.subject}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.contact?.name || 
                           (activity.lead ? `${activity.lead.firstName} ${activity.lead.lastName}` : 
                            activity.deal?.title || "Unknown")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatActivityDate(activity.activityDate)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
              <button
                onClick={() => handleGenerateReport("tasks")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="h-4 w-4 bg-gray-200 rounded mt-1"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : upcomingTasks && upcomingTasks.length > 0 ? (
                upcomingTasks.slice(0, 5).map((task: Task) => (
                  <div key={task.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(parseISO(task.dueDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No upcoming tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}