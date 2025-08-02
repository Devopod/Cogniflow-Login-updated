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
import { useCrmApi } from "@/hooks/use-api";
import {
  useCrmDashboard,
  useGenerateReport,
  useCrmMetrics,
  useLeadAnalytics,
  useSalesPipeline,
  useTasks,
  useActivities,
} from "@/hooks/use-crm-data";
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
  
  // Use dynamic API data instead of mock data
  const crmApi = useCrmApi();
  
  // Extract data from API hooks
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = crmApi.dashboard;
  const { data: leadAnalyticsData, loading: leadAnalyticsLoading } = crmApi.analytics.leads;
  const { data: pipelineData, loading: pipelineLoading } = crmApi.analytics.pipeline;
  const { data: upcomingTasksData, loading: tasksLoading } = crmApi.tasks;
  const { data: recentActivitiesData, loading: activitiesLoading } = crmApi.activities;
  
  // Use real data or show loading states
  const metrics = Array.isArray(dashboardData) && dashboardData.length > 0 ? dashboardData[0] : null;
  const leadAnalytics = Array.isArray(leadAnalyticsData) && leadAnalyticsData.length > 0 ? leadAnalyticsData[0] : null;
  const pipeline = Array.isArray(pipelineData) && pipelineData.length > 0 ? pipelineData[0] : null;
  const upcomingTasks = upcomingTasksData || [];
  const recentActivities = recentActivitiesData || [];
  
  const isLoading = dashboardLoading || leadAnalyticsLoading || pipelineLoading || tasksLoading || activitiesLoading;
  const error = dashboardError;

  // Generate report mutation
  const generateReport = useGenerateReport();

  // Handle report generation
  const handleGenerateReport = async (type: string, format: string) => {
    try {
      await generateReport.mutateAsync({ type, format });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    crmApi.dashboard.fetchData();
    crmApi.analytics.leads.fetchData();
    crmApi.analytics.pipeline.fetchData();
    crmApi.tasks.fetchData();
    crmApi.activities.fetchData();
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
  const leadSourceChartData = leadAnalytics?.leadSources ? {
    labels: leadAnalytics.leadSources.map((item: any) => item.source),
    datasets: [
      {
        data: leadAnalytics.leadSources.map((item: any) => item.count),
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
  const pipelineChartData = pipeline?.stages ? {
    labels: pipeline.stages.map((stage: any) => stage.stage),
    datasets: [
      {
        label: 'Number of Deals',
        data: pipeline.stages.map((stage: any) => stage.count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'Total Value ($)',
        data: pipeline.stages.map((stage: any) => stage.totalValue),
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
              onClick={() => handleGenerateReport('summary', 'pdf')}
              disabled={generateReport.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generateReport.isPending ? 'Generating...' : 'PDF Report'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleGenerateReport('summary', 'csv')}
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
                    <div className="h-[300px] flex items-center justify-center">
                      <Doughnut 
                        data={leadSourceChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                        <p className="font-medium">No lead data available</p>
                        <p className="text-sm text-muted-foreground mt-1">Start by adding some leads</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Your pending tasks and reminders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm">{task.title}</div>
                          <Badge variant={
                            task.priority === "high" ? "destructive" : 
                            task.priority === "medium" ? "secondary" : 
                            "outline"
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No due date'}</span>
                          </div>
                          <div className="flex items-center">
                            {task.type === "call" && <Phone className="h-3 w-3 mr-1 text-blue-500" />}
                            {task.type === "email" && <MailCheck className="h-3 w-3 mr-1 text-green-500" />}
                            {task.type === "meeting" && <Users className="h-3 w-3 mr-1 text-purple-500" />}
                            <span className="capitalize">{task.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingTasks.length === 0 && (
                      <div className="text-center py-8">
                        <CheckSquare className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                        <p className="font-medium">No pending tasks</p>
                        <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
                      </div>
                    )}
                    <Button className="w-full" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest interactions with contacts and deals</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentTab('activities')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-3 border rounded-md">
                      <div className={`
                        flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                        ${activity.type === 'call' ? 'bg-blue-100 text-blue-600' : 
                          activity.type === 'email' ? 'bg-green-100 text-green-600' : 
                          activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' : 
                          'bg-yellow-100 text-yellow-600'}
                      `}>
                        {activity.type === 'call' && <PhoneCall className="h-5 w-5" />}
                        {activity.type === 'email' && <MailCheck className="h-5 w-5" />}
                        {activity.type === 'meeting' && <Users className="h-5 w-5" />}
                        {activity.type === 'note' && <MessageSquare className="h-5 w-5" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{activity.subject}</div>
                            <div className="text-sm text-muted-foreground">{activity.description}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.createdAt ? format(new Date(activity.createdAt), 'MMM dd, HH:mm') : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                      <p className="font-medium">No recent activities</p>
                      <p className="text-sm text-muted-foreground mt-1">Start by logging some interactions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales Pipeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline Distribution</CardTitle>
                <CardDescription>Real-time view of deals across different stages</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineChartData ? (
                  <div className="h-[400px]">
                    <Bar data={pipelineChartData} options={pipelineChartOptions} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                      <p className="font-medium">No pipeline data available</p>
                      <p className="text-sm text-muted-foreground mt-1">Create some deals to see the pipeline</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <LeadManagement />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <ContactManagement />
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-6">
            <DealManagement />
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <ActivityManagement />
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <CompanyManagement />
          </TabsContent>

          {/* Phone Calls Tab */}
          <TabsContent value="calls" className="space-y-6">
            <PhoneCallManagement />
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
}