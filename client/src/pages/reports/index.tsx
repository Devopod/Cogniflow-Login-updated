import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ErpNavigation from "@/components/ErpNavigation";
import {
  BarChart,
  LineChart,
  PieChart,
  Activity,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart2,
  BarChart3,
  BarChart4,
  Check,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Filter,
  GanttChart,
  Globe,
  HelpCircle,
  Info,
  LayoutGrid,
  LayoutList,
  LineChart as LineChartIcon,
  Mail,
  MoreHorizontal,
  Calendar,
  CalendarDays,
  CalendarRange,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  Percent,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Share,
  Share2,
  Sliders,
  Smartphone,
  Sparkles,
  Table as TableIcon,
  Tags,
  Trash,
  Users,
  Wallet,
  Wand2,
  UserRound,
  Building,
  Building2,
  ChevronDown,
  ListFilter,
  Boxes,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// No more mock data - using real APIs

// Get category icon
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Sales":
      return <BarChart3 className="h-4 w-4 text-blue-600" />;
    case "Finance":
      return <CreditCard className="h-4 w-4 text-green-600" />;
    case "HR":
      return <Users className="h-4 w-4 text-amber-600" />;
    case "Inventory":
      return <Package className="h-4 w-4 text-purple-600" />;
    case "Products":
      return <Boxes className="h-4 w-4 text-indigo-600" />;
    case "Marketing":
      return <LineChartIcon className="h-4 w-4 text-red-600" />;
    case "Customer":
      return <UserRound className="h-4 w-4 text-sky-600" />;
    case "Procurement":
      return <Building2 className="h-4 w-4 text-emerald-600" />;
    default:
      return <FileBarChart className="h-4 w-4 text-slate-600" />;
  }
};

// Get format icon
const getFormatIcon = (format: string) => {
  switch (format) {
    case "PDF":
      return <FileText className="h-4 w-4 text-red-600" />;
    case "Excel":
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    case "Dashboard":
      return <LayoutGrid className="h-4 w-4 text-blue-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-600" />;
  }
};

// Get schedule icon
const getScheduleIcon = (scheduleType: string) => {
  switch (scheduleType) {
    case "Daily":
      return <Calendar className="h-4 w-4 text-blue-600" />;
    case "Weekly":
      return <CalendarDays className="h-4 w-4 text-amber-600" />;
    case "Monthly":
      return <CalendarRange className="h-4 w-4 text-purple-600" />;
    case "Quarterly":
      return <CalendarRange className="h-4 w-4 text-green-600" />;
    default:
      return <Clock className="h-4 w-4 text-slate-600" />;
  }
};

const ReportsManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  // Fetch reports data
  const { data: reportsData = {
    stats: {
      totalReports: 0,
      totalDashboards: 0,
      reportsRunThisMonth: 0
    },
    recentReports: [],
    dashboards: [],
    scheduled: [],
    templates: []
  }, isLoading: reportsLoading } = useQuery({
    queryKey: ['reportsData'],
    queryFn: async () => {
      const response = await fetch('/api/reports/management-dashboard', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }
      return response.json();
    },
  });

  // Fetch all reports data for categories
  const { data: allReportsData = {
    categories: [],
    savedReports: []
  } } = useQuery({
    queryKey: ['allReportsData'],
    queryFn: async () => {
      const response = await fetch('/api/reports/all-reports', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch all reports data');
      }
      return response.json();
    },
  });

  // Filter reports based on search and category
  const filteredReports = reportsData.recentReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Format date in readable format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports Management</h1>
            <p className="text-muted-foreground">
              Create, customize, and schedule reports and dashboards
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Sliders className="h-4 w-4 mr-2" />
              Customize
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Reports Management Tabs */}
        <Tabs
          defaultValue="dashboard"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Reports Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Reports Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Reports</p>
                      <h2 className="text-3xl font-bold">{reportsData.stats.totalReports}</h2>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <FileBarChart className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Across {allReportsData?.categories?.length || 0} categories
                  </div>
                </CardContent>
              </Card>

              {/* Total Dashboards Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Dashboards</p>
                      <h2 className="text-3xl font-bold">{reportsData.stats.totalDashboards}</h2>
                    </div>
                    <div className="bg-purple-500/10 p-2 rounded-full">
                      <LayoutGrid className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {reportsData.dashboards.filter(d => d.shared).length} shared dashboards
                  </div>
                </CardContent>
              </Card>

              {/* Reports Run Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Reports Run</p>
                      <h2 className="text-3xl font-bold">{reportsData.stats.reportsRunThisMonth}</h2>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <Activity className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    This month
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Reports Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled</p>
                      <h2 className="text-3xl font-bold">{reportsData.scheduled.length}</h2>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {reportsData.scheduled.filter(s => s.status === "Active").length} active schedules
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Categories & Top Viewed Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Categories */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Report Categories</CardTitle>
                      <CardDescription>Organized by business functions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allReportsData?.categories?.map((category, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 border rounded-md hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setCategoryFilter(category.name)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            {getCategoryIcon(category.name)}
                          </div>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.name === 'Sales' && 'Sales performance, pipeline, and forecasting reports'}
                              {category.name === 'Finance' && 'Financial statements, cash flow, and tax reports'}
                              {category.name === 'CRM' && 'Customer demographics, behavior, and satisfaction'}
                              {category.name === 'Inventory' && 'Stock levels, movement, and valuation reports'}
                              {category.name === 'HR' && 'Employee performance, attendance, and payroll reports'}
                            </div>
                            <div className="mt-2 text-sm">{category.count} reports</div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="col-span-full text-center text-muted-foreground py-8">
                        {reportsLoading ? "Loading categories..." : "No categories available"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                  <CardDescription>Recently generated reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allReportsData?.savedReports?.slice(0, 5).map((report, idx) => (
                      <div key={report.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{report.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Generated {formatDate(report.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-8">
                        {reportsLoading ? "Loading recent reports..." : "No recent reports available"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recently Generated Reports</CardTitle>
                    <CardDescription>Reports you've accessed recently</CardDescription>
                  </div>
                  <Button variant="link" className="h-8 px-0">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reportsData.recentReports.slice(0, 6).map(report => (
                    <div 
                      key={report.id} 
                      className="p-4 border rounded-md hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getFormatIcon(report.format)}
                          <div className="font-medium">{report.name}</div>
                        </div>
                        {report.favorite && <div className="text-amber-500">★</div>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {getCategoryIcon(report.category)}
                        <span>{report.category}</span>
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">
                        Generated: {formatDate(report.lastGenerated)}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {getScheduleIcon(report.scheduleType)}
                        <span>{report.scheduleType}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View More Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI-Powered Insights */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>AI-Powered Reporting Insights</CardTitle>
                    <CardDescription>Smart analytics and recommendations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <Wand2 className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <h3 className="text-lg font-medium">Report Optimization</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our AI has identified 3 reports with overlapping data. Consider consolidating them for better insights and efficiency.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View recommendations</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <h3 className="text-lg font-medium">Trend Detection</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We've detected a significant pattern in your sales data that isn't covered by your current reports. Consider creating a specialized analysis.
                    </p>
                    <Button variant="link" className="px-0 mt-2">Explore pattern</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                    <h3 className="text-lg font-medium">Schedule Optimization</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on usage patterns, switching your Daily Inventory report to run at 6AM instead of 7:30AM would align better with team workflows.
                    </p>
                    <Button variant="link" className="px-0 mt-2">Review suggestion</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Reports Search & Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {allReportsData?.categories?.map((category, idx) => (
                          <SelectItem key={idx} value={category.name}>{category.name}</SelectItem>
                        )) || null}
                      </SelectContent>
                    </Select>

                    <div className="flex border rounded-md overflow-hidden">
                      <Button 
                        variant={viewMode === "grid" ? "default" : "ghost"} 
                        size="sm" 
                        onClick={() => setViewMode("grid")}
                        className="rounded-none"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={viewMode === "list" ? "default" : "ghost"} 
                        size="sm" 
                        onClick={() => setViewMode("list")}
                        className="rounded-none"
                      >
                        <LayoutList className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List/Grid */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "space-y-4"}>
              {filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  viewMode === "grid" ? (
                    <Card key={report.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getFormatIcon('PDF')}
                            <div className="font-medium">{report.name}</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Clock className="h-4 w-4 mr-2" />
                                Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Sliders className="h-4 w-4 mr-2" />
                                Edit Report
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {getCategoryIcon(report.reportType)}
                          <span>{report.reportType}</span>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Generated: {formatDate(report.createdAt)}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          {getScheduleIcon('On Demand')}
                          <span>On Demand</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                              {getFormatIcon('PDF')}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {report.name}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  {getCategoryIcon(report.reportType)}
                                  <span>{report.reportType}</span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  {getScheduleIcon('On Demand')}
                                  <span>On Demand</span>
                                </div>
                                <span>•</span>
                                <span>Generated: {formatDate(report.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Sliders className="h-4 w-4 mr-2" />
                                  Edit Report
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reports found</h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      We couldn't find any reports matching your search criteria. Try adjusting your filters or create a new report.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {filteredReports.length > 0 && viewMode === "grid" && (
              <div className="flex justify-center mt-6">
                <Button variant="outline">Load More</Button>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Report Templates</CardTitle>
                    <CardDescription>Pre-configured reports for quick setup</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reportsData.templates.map(template => (
                    <Card key={template.id} className="border shadow-none">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          </div>
                          <Badge className={
                            template.complexity === "Simple" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : template.complexity === "Medium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }>
                            {template.complexity}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {getCategoryIcon(template.category)}
                          <span>{template.category}</span>
                        </div>
                        <div className="mt-4">
                          <Button className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Scheduled Reports</CardTitle>
                    <CardDescription>Automated report generation and distribution</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Name</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsData.scheduled.map(schedule => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.name}</TableCell>
                          <TableCell>{schedule.frequency}</TableCell>
                          <TableCell>
                            {schedule.day}, {schedule.time}
                          </TableCell>
                          <TableCell>
                            {schedule.recipients.length > 1 
                              ? `${schedule.recipients[0]} +${schedule.recipients.length - 1} more` 
                              : schedule.recipients[0]
                            }
                          </TableCell>
                          <TableCell>{formatDate(schedule.lastRun)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={
                              schedule.status === "Active" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }>
                              {schedule.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Report
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Run Now
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Edit Recipients
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Sliders className="h-4 w-4 mr-2" />
                                  Edit Schedule
                                </DropdownMenuItem>
                                {schedule.status === "Active" ? (
                                  <DropdownMenuItem>
                                    <PauseCircle className="h-4 w-4 mr-2" />
                                    Pause Schedule
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Resume Schedule
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Schedule
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboards Tab */}
          <TabsContent value="dashboards" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Interactive Dashboards</CardTitle>
                    <CardDescription>Real-time data visualization</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportsData.dashboards.map(dashboard => (
                    <Card key={dashboard.id} className="border shadow-none">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{dashboard.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{dashboard.description}</p>
                          </div>
                          {dashboard.shared && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <Share2 className="h-3 w-3 mr-1" />
                              Shared
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Owner: {dashboard.owner} • Last viewed: {formatDate(dashboard.lastViewed)}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="icon">
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Sliders className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports Analytics</CardTitle>
                <CardDescription>
                  Usage statistics and insights for your reports
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <FileBarChart className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Advanced Analytics Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  analyze report usage, performance metrics, and optimize your reporting strategy.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Report usage analytics and user engagement metrics</li>
                    <li>Performance measurements and load time optimization</li>
                    <li>Storage utilization and database query analysis</li>
                    <li>Automated recommendations for report consolidation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
};

export default ReportsManagement;