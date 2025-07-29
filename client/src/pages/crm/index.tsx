import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ErpNavigation from "@/components/ErpNavigation";
import Dashboard from "@/components/crm/Dashboard";
import ContactManagement from "@/components/crm/ContactManagement";
import DealManagement from "@/components/crm/DealManagement";
import LeadManagement from "@/components/crm/LeadManagement";
import ActivityManagement from "@/components/crm/ActivityManagement";
import CompanyManagement from "@/components/crm/CompanyManagement";
import PhoneCallManagement from "@/components/crm/PhoneCallManagement";
import {
  useCrmDashboard,
  useGenerateReport,
  useCrmMetrics,
  useLeadAnalytics,
  useDealPipeline,
  useTasks,
  useActivities,
} from "@/hooks/use-crm-data";
import { useCrmWebSocket, useCrmCacheInvalidation } from "@/hooks/use-crm-websocket";
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

// Mock data for CRM dashboard
const mockMetrics = {
  totalLeads: 156,
  totalContacts: 89,
  openDeals: 23,
  totalDealValue: 2500000,
  wonDeals: 12,
  conversionRate: 15.4
};

const mockLeadAnalytics = {
  leadSources: [
    { source: "Website", count: 45 },
    { source: "Social Media", count: 32 },
    { source: "Email Campaign", count: 28 },
    { source: "Referral", count: 25 },
    { source: "Cold Call", count: 15 },
    { source: "Trade Show", count: 11 }
  ]
};

const mockPipeline = {
  stages: [
    { stage: "Prospecting", count: 15, totalValue: 450000 },
    { stage: "Qualification", count: 12, totalValue: 380000 },
    { stage: "Proposal", count: 8, totalValue: 720000 },
    { stage: "Negotiation", count: 5, totalValue: 650000 },
    { stage: "Closed Won", count: 3, totalValue: 300000 }
  ]
};

const mockUpcomingTasks = [
  {
    id: 1,
    title: "Follow up with Acme Corp",
    type: "call",
    priority: "high",
    dueDate: "2023-12-15T10:00:00Z",
    contact: "John Smith"
  },
  {
    id: 2,
    title: "Send proposal to TechStart",
    type: "email",
    priority: "medium",
    dueDate: "2023-12-16T14:00:00Z",
    contact: "Sarah Johnson"
  },
  {
    id: 3,
    title: "Demo preparation",
    type: "meeting",
    priority: "high",
    dueDate: "2023-12-17T09:00:00Z",
    contact: "Michael Chen"
  }
];

const mockRecentActivities = [
  {
    id: 1,
    type: "call",
    description: "Called John Smith at Acme Corp",
    timestamp: "2023-12-14T15:30:00Z"
  },
  {
    id: 2,
    type: "email",
    description: "Sent proposal to Sarah Johnson",
    timestamp: "2023-12-14T14:20:00Z"
  },
  {
    id: 3,
    type: "meeting",
    description: "Demo meeting with Global Services",
    timestamp: "2023-12-14T11:00:00Z"
  }
];

export default function CrmManagement() {
  const { toast: useToastHook } = useToast();
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("overview");
  
  // Enable real-time WebSocket updates
  useCrmWebSocket();
  
  // Use real-time CRM hooks
  const { invalidateAll } = useCrmCacheInvalidation();
  const generateReport = useGenerateReport();

  // Handle report generation
  const handleGenerateReport = async (type: "leads" | "activities" | "tasks" | "metrics", format: "json" | "csv") => {
    try {
      await generateReport.mutateAsync({ 
        type, 
        format,
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
        },
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    invalidateAll();
    toast.success("Data refreshed successfully!");
  };




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
            <Dashboard />

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