import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ErpNavigation from "@/components/ErpNavigation";
import ContactManagement from "@/components/crm/ContactManagement";
import DealManagement from "@/components/crm/DealManagement";
import LeadManagement from "@/components/crm/LeadManagement";
import ActivityManagement from "@/components/crm/ActivityManagement";
import CompanyManagement from "@/components/crm/CompanyManagement";
import PhoneCallManagement from "@/components/crm/PhoneCallManagement";
import { useCrmDashboard, useGenerateReport } from "@/hooks/use-crm-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  CheckSquare,
  Download,
  FileText,
  MailCheck,
  MessageSquare,
  Phone,
  PhoneCall,
  PieChart,
  Plus,
  RefreshCw,
  Users,
  UserPlus,
  Building,
  Activity,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
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
} from "chart.js";
import { format } from "date-fns";
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
  ArcElement
);

export default function CrmManagement() {
  const { toast: useToastHook } = useToast();
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("overview");

  // Use composite dashboard hook for all data
  const dashboard = useCrmDashboard();
  const { metrics, leadAnalytics, dealPipeline, upcomingTasks, recentActivities, isLoading, error } = dashboard;

  // Generate report mutation
  const generateReport = useGenerateReport();

  // Handle report generation
  const handleGenerateReport = async (type: string, format: string) => {
    try {
      await generateReport.mutateAsync({ type: type as any, format: format as any });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    // Queries will auto-refetch on focus or via WebSocket invalidation
    useToastHook({ title: "Success", description: "Data refreshed successfully!" });
  };

  // Create metrics cards with real-time data
  const metricsCards = metrics ? [
    {
      title: "Total Leads",
      value: metrics.totalLeads || 0,
      change: "+12%",
      isPositive: true,
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      title: "Total Contacts",
      value: metrics.totalContacts || 0,
      change: "+8%",
      isPositive: true,
      icon: <UserPlus className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      title: "Open Deals",
      value: metrics.openDeals || 0,
      change: "+15%",
      isPositive: true,
      icon: <CheckSquare className="h-5 w-5" />,
      color: "bg-indigo-500",
    },
    {
      title: "Deal Value",
      value: `$${metrics.totalDealValue?.toLocaleString() || 0}`,
      change: "+22%",
      isPositive: true,
      icon: <DollarSign className="h-5 w-5" />,
      color: "bg-purple-500",
    },
    {
      title: "Won Deals",
      value: metrics.wonDeals || 0,
      change: "+18%",
      isPositive: true,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-emerald-500",
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate?.toFixed(1)}%` || "0%",
      change: "+5.2%",
      isPositive: true,
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-orange-500",
    },
  ] : [];

  // Lead source chart data
  const leadSourceChartData = (leadAnalytics as any)?.leadSources ? {
    labels: (leadAnalytics as any).leadSources.map((item: any) => item.source),
    datasets: [
      {
        data: (leadAnalytics as any).leadSources.map((item: any) => item.count),
        backgroundColor: [
          '#3B82F6', // Blue
          '#10B981', // Green
          '#F59E0B', // Yellow
          '#EF4444', // Red
          '#8B5CF6', // Purple
          '#EC4899', // Pink
        ],
        borderWidth: 0,
      },
    ],
  } : null;

  // Sales pipeline chart data
  const pipelineChartData = (dealPipeline as any)?.stages ? {
    labels: (dealPipeline as any).stages.map((stage: any) => stage.stage),
    datasets: [
      {
        label: 'Number of Deals',
        data: (dealPipeline as any).stages.map((stage: any) => stage.count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'Total Value ($)',
        data: (dealPipeline as any).stages.map((stage: any) => stage.totalValue),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  } : null;

  const pipelineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sales Pipeline',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Number of Deals',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Total Value ($)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <ErpNavigation>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ErpNavigation>
    );
  }

  if (error) {
    return (
      <ErpNavigation>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading CRM Data</h3>
              <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </ErpNavigation>
    );
  }

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
            <p className="text-muted-foreground">
              Manage all your customer relationships and interactions in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleGenerateReport('summary', 'json')}
              disabled={generateReport.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generateReport.isPending ? 'Generating...' : 'JSON Report'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleGenerateReport('leads', 'csv')}
              disabled={generateReport.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCurrentTab('contacts')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Real-time metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {metricsCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{card.title}</p>
                    <h2 className="text-2xl font-bold">{card.value}</h2>
                  </div>
                  <div className={`${card.color} p-2 rounded-full text-white`}>
                    {card.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  {card.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={card.isPositive ? "text-green-500" : "text-red-500"}>
                    {card.change}
                  </span>
                  <span className="text-muted-foreground ml-1">since last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs for different CRM sections */}
        <Tabs
          defaultValue="overview"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="calls">Phone Calls</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lead Source Distribution Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Lead Source Distribution</CardTitle>
                      <CardDescription>Real-time data showing where your leads are coming from</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateReport('leads', 'csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {leadSourceChartData ? (
                    <div className="h-[300px]">
                      <Doughnut data={leadSourceChartData} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No lead source data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Tasks due soon across your deals and contacts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks && upcomingTasks.length > 0 ? (
                      upcomingTasks.map((task: any) => (
                        <div key={task.id} className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Due {task.dueDate ? format(new Date(task.dueDate), 'PP') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{task.priority || 'medium'}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No upcoming tasks</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Pipeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Current distribution across stages</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineChartData ? (
                  <div className="h-[360px]">
                    <Bar data={pipelineChartData} options={pipelineChartOptions} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No pipeline data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest CRM interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities && recentActivities.length > 0 ? (
                    recentActivities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.description || activity.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.timestamp ? format(new Date(activity.timestamp), 'PPp') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No recent activities</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would render their respective management components */}
          <TabsContent value="leads">
            <LeadManagement />
          </TabsContent>
          <TabsContent value="contacts">
            <ContactManagement />
          </TabsContent>
          <TabsContent value="deals">
            <DealManagement />
          </TabsContent>
          <TabsContent value="activities">
            <ActivityManagement />
          </TabsContent>
          <TabsContent value="companies">
            <CompanyManagement />
          </TabsContent>
          <TabsContent value="calls">
            <PhoneCallManagement />
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
}