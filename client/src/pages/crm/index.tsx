import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ErpNavigation from "@/components/ErpNavigation";
import ContactManagement from "@/components/crm/ContactManagement";
import DealManagement from "@/components/crm/DealManagement";
import LeadManagement from "@/components/crm/LeadManagement";
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
  BarChart,
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
  UserPlus
} from "lucide-react";

// Sample summary data for dashboard
const crmSummary = {
  totalContacts: 7,
  activeDeals: 5,
  wonDeals: 2,
  totalDealValue: 153000,
  avgDealSize: 30600,
  conversionRate: 68,
  newLeadsThisMonth: 12,
  upcomingMeetings: 3,
  pendingTasks: 4,
  recentActivities: 8
};

// Sample metrics cards data
const metricsCards = [
  {
    title: "Total Contacts",
    value: crmSummary.totalContacts,
    change: "+2",
    isPositive: true,
    icon: <Users className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    title: "Open Deals",
    value: crmSummary.activeDeals,
    change: "+1",
    isPositive: true,
    icon: <CheckSquare className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    title: "Deal Value",
    value: `$${crmSummary.totalDealValue.toLocaleString()}`,
    change: "+15.3%",
    isPositive: true,
    icon: <BarChart className="h-5 w-5" />,
    color: "bg-indigo-500",
  },
  {
    title: "Conversion Rate",
    value: `${crmSummary.conversionRate}%`,
    change: "+2.4%",
    isPositive: true,
    icon: <PieChart className="h-5 w-5" />,
    color: "bg-purple-500",
  },
];

// Sample recent activities
const recentActivities = [
  {
    id: 1,
    type: "Call",
    contact: "John Smith",
    company: "Acme Corporation",
    summary: "Discussed implementation timeline",
    date: "Today, 11:30 AM",
    user: "Sarah Johnson"
  },
  {
    id: 2,
    type: "Email",
    contact: "Sarah Johnson",
    company: "TechStart Inc.",
    summary: "Sent follow-up with quote details",
    date: "Yesterday, 3:15 PM",
    user: "Michael Chen"
  },
  {
    id: 3,
    type: "Meeting",
    contact: "Michael Chen",
    company: "Global Services Ltd.",
    summary: "Product demonstration completed",
    date: "Yesterday, 10:00 AM",
    user: "Emma Wilson"
  },
  {
    id: 4,
    type: "Note",
    contact: "James Taylor",
    company: "Digital Dynamics",
    summary: "Updated contact info and requirements",
    date: "May 2, 2023",
    user: "David Rodriguez"
  }
];

// Sample upcoming tasks
const upcomingTasks = [
  {
    id: 1,
    title: "Follow up with Acme Corp",
    dueDate: "Today",
    priority: "High",
    type: "Call",
    status: "Pending"
  },
  {
    id: 2,
    title: "Send proposal to TechStart",
    dueDate: "Tomorrow",
    priority: "Medium",
    type: "Email",
    status: "Pending"
  },
  {
    id: 3,
    title: "Prepare demo for NextGen",
    dueDate: "May 10, 2023",
    priority: "High",
    type: "Meeting",
    status: "In Progress"
  },
  {
    id: 4,
    title: "Update Digital Dynamics contract",
    dueDate: "May 12, 2023",
    priority: "Medium",
    type: "Document",
    status: "Pending"
  }
];

export default function CrmManagement() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("overview");

  // Mock query for lead source data
  const { data: leadSourceData, isLoading: isLoadingLeadData } = useQuery({
    queryKey: ["/api/crm/lead-sources"],
    queryFn: () => {
      // Mock data
      return Promise.resolve([
        { source: "Web", count: 45, percentage: 42 },
        { source: "Referral", count: 28, percentage: 27 },
        { source: "Social", count: 19, percentage: 18 },
        { source: "Other", count: 14, percentage: 13 }
      ]);
    },
  });

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Relationship Management</h1>
            <p className="text-muted-foreground">
              Manage all your customer relationships and interactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{card.title}</p>
                    <h2 className="text-3xl font-bold">{card.value}</h2>
                  </div>
                  <div className={`${card.color} p-2 rounded-full text-white`}>
                    {card.icon}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">{card.change}</span>
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
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Lead Source Distribution</CardTitle>
                      <CardDescription>Where your leads are coming from</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingLeadData ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="font-medium">Lead Source Distribution</p>
                        <p className="text-sm text-muted-foreground mt-1">(Visualized chart showing distribution of leads by source)</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {leadSourceData?.map((source) => (
                          <div key={source.source} className="text-center p-3 border rounded-md">
                            <div className="text-sm text-muted-foreground">{source.source}</div>
                            <div className="text-xl font-bold mt-1">{source.percentage}%</div>
                            <div className="text-sm text-muted-foreground mt-1">{source.count} leads</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Your pending tasks and meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="p-3 border rounded-md">
                        <div className="flex justify-between">
                          <div className="font-medium">{task.title}</div>
                          <Badge variant={
                            task.priority === "High" ? "destructive" : 
                            task.priority === "Medium" ? "secondary" : 
                            "outline"
                          }>
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{task.dueDate}</span>
                          </div>
                          <div className="flex items-center">
                            {task.type === "Call" && <Phone className="h-3 w-3 mr-1 text-blue-500" />}
                            {task.type === "Email" && <MailCheck className="h-3 w-3 mr-1 text-green-500" />}
                            {task.type === "Meeting" && <Users className="h-3 w-3 mr-1 text-purple-500" />}
                            {task.type === "Document" && <FileText className="h-3 w-3 mr-1 text-yellow-500" />}
                            <span>{task.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Latest interactions with contacts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
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
                        ${activity.type === 'Call' ? 'bg-blue-100 text-blue-600' : 
                          activity.type === 'Email' ? 'bg-green-100 text-green-600' : 
                          activity.type === 'Meeting' ? 'bg-purple-100 text-purple-600' : 
                          'bg-yellow-100 text-yellow-600'}
                      `}>
                        {activity.type === 'Call' && <PhoneCall className="h-5 w-5" />}
                        {activity.type === 'Email' && <MailCheck className="h-5 w-5" />}
                        {activity.type === 'Meeting' && <Users className="h-5 w-5" />}
                        {activity.type === 'Note' && <MessageSquare className="h-5 w-5" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{activity.contact}</div>
                            <div className="text-sm text-muted-foreground">{activity.company}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">{activity.date}</div>
                        </div>
                        <div className="mt-1 text-sm">{activity.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Pipeline Distribution</CardTitle>
                  <CardDescription>Value distribution across sales stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                    <BarChart className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="font-medium">Sales Pipeline Chart</p>
                    <p className="text-sm text-muted-foreground mt-1">(Visualized chart showing deal distribution by stage)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Lead to customer conversion stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="font-medium">Conversion Funnel Chart</p>
                    <p className="text-sm text-muted-foreground mt-1">(Visualized funnel showing conversion rate at each stage)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Activity Management</CardTitle>
                <CardDescription>
                  This feature will allow you to track all customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <MessageSquare className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Activity Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to log calls, emails, 
                  meetings and other interactions with your contacts and deals.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Management</CardTitle>
                <CardDescription>
                  This feature will allow you to manage company records
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Users className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Company Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to manage company records, 
                  track accounts, and organize contacts by company.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phone Calls Tab */}
          <TabsContent value="calls" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Management</CardTitle>
                <CardDescription>
                  This feature will allow you to log and track phone interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Phone className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Call Tracking Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to log calls, set up 
                  call reminders, and track customer communications via phone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
}