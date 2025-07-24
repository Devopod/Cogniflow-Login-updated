import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmployees, useDepartments } from '@/hooks/use-dynamic-data';
import { useWebSocket } from '@/hooks/use-websocket';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  ArrowDownUp,
  BarChart3,
  BellRing,
  BookCheck,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Download,
  FileBarChart,
  FileText,
  Filter,
  LineChart,
  MoreHorizontal,
  Plus,
  Search,
  Sliders,
  UserPlus,
  UserRound,
  Users,
  UserCircle,
  UserCog,
  X,
  XCircle,
  Timer,
  ArrowRightLeft,
  PanelLeftOpen,
  Calendar as CalendarIcon,
  CircleUser,
  BadgeCheck,
  Award,
  Briefcase,
  PieChart,
  ClipboardCheck,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample data for the HR module (would normally come from API)
const hrData = {
  // Organization metrics
  organization: {
    totalEmployees: 128,
    activeEmployees: 124,
    onLeave: 4,
    returningToday: 1,
    departments: 8,
    avgTenure: 3.2, // years
    openPositions: 5,
    employeeTurnover: 0.12, // 12%
    maleRatio: 0.54, // 54% male
    femaleRatio: 0.46, // 46% female
    avgAge: 32
  },
  
  // Department metrics
  departments: [
    { id: 1, name: "Engineering", employeeCount: 48, manager: "Michael Rodriguez", openPositions: 2 },
    { id: 2, name: "Sales", employeeCount: 28, manager: "Sarah Johnson", openPositions: 1 },
    { id: 3, name: "Marketing", employeeCount: 16, manager: "David Chen", openPositions: 0 },
    { id: 4, name: "Finance", employeeCount: 12, manager: "Emma Wilson", openPositions: 0 },
    { id: 5, name: "Human Resources", employeeCount: 8, manager: "James Miller", openPositions: 1 },
    { id: 6, name: "Customer Support", employeeCount: 10, manager: "Olivia Brown", openPositions: 1 },
    { id: 7, name: "Product", employeeCount: 6, manager: "Ethan Davis", openPositions: 0 },
    { id: 8, name: "Administration", employeeCount: 4, manager: "Sophia Garcia", openPositions: 0 }
  ],
  
  // Sample employees for listing
  employees: [
    { id: 1, name: "John Smith", position: "Senior Developer", department: "Engineering", email: "john.smith@company.com", employmentType: "Full-time", status: "Active", hireDate: "2020-02-15", profileImg: "" },
    { id: 2, name: "Sarah Johnson", position: "Sales Manager", department: "Sales", email: "sarah.johnson@company.com", employmentType: "Full-time", status: "Active", hireDate: "2019-07-22", profileImg: "" },
    { id: 3, name: "David Chen", position: "Marketing Director", department: "Marketing", email: "david.chen@company.com", employmentType: "Full-time", status: "Active", hireDate: "2018-11-05", profileImg: "" },
    { id: 4, name: "Emma Wilson", position: "Financial Analyst", department: "Finance", email: "emma.wilson@company.com", employmentType: "Full-time", status: "On Leave", hireDate: "2021-03-10", profileImg: "" },
    { id: 5, name: "Michael Rodriguez", position: "Engineering Manager", department: "Engineering", email: "michael.rodriguez@company.com", employmentType: "Full-time", status: "Active", hireDate: "2017-09-18", profileImg: "" },
    { id: 6, name: "Olivia Brown", position: "Customer Support Lead", department: "Customer Support", email: "olivia.brown@company.com", employmentType: "Full-time", status: "Active", hireDate: "2020-08-27", profileImg: "" },
    { id: 7, name: "James Miller", position: "HR Manager", department: "Human Resources", email: "james.miller@company.com", employmentType: "Full-time", status: "Active", hireDate: "2019-04-30", profileImg: "" },
    { id: 8, name: "Sophia Garcia", position: "Office Manager", department: "Administration", email: "sophia.garcia@company.com", employmentType: "Full-time", status: "Active", hireDate: "2021-01-15", profileImg: "" },
    { id: 9, name: "Ethan Davis", position: "Product Manager", department: "Product", email: "ethan.davis@company.com", employmentType: "Full-time", status: "Active", hireDate: "2022-02-10", profileImg: "" },
    { id: 10, name: "Isabella Martinez", position: "Junior Developer", department: "Engineering", email: "isabella.martinez@company.com", employmentType: "Full-time", status: "Active", hireDate: "2022-09-05", profileImg: "" }
  ],
  
  // Leave data
  leave: {
    pending: 5,
    approved: 12,
    balances: {
      vacation: { total: 21, used: 8, remaining: 13 },
      sick: { total: 10, used: 2, remaining: 8 },
      personal: { total: 5, used: 1, remaining: 4 }
    },
    recentRequests: [
      { id: 1, employee: "Emma Wilson", type: "Sick Leave", startDate: "2023-05-10", endDate: "2023-05-12", status: "Approved" },
      { id: 2, employee: "John Smith", type: "Vacation", startDate: "2023-06-15", endDate: "2023-06-22", status: "Pending" },
      { id: 3, employee: "Olivia Brown", type: "Personal", startDate: "2023-05-26", endDate: "2023-05-26", status: "Approved" },
      { id: 4, employee: "Isabella Martinez", type: "Sick Leave", startDate: "2023-05-08", endDate: "2023-05-09", status: "Approved" },
      { id: 5, employee: "David Chen", type: "Vacation", startDate: "2023-07-10", endDate: "2023-07-21", status: "Pending" }
    ]
  },
  
  // Attendance data
  attendance: {
    today: {
      present: 118,
      absent: 4,
      late: 6,
      workingRemotely: 42
    },
    thisMonth: {
      averageAttendance: 0.96, // 96%
      lateInstances: 35,
      absences: 12,
      remoteWorkDays: 384
    }
  },
  
  // Payroll summary
  payroll: {
    lastRunDate: "2023-04-30",
    nextRunDate: "2023-05-31",
    totalSalaries: 742500,
    totalBenefits: 148500,
    totalTaxes: 185625,
    netPayroll: 705375,
    payrollByDepartment: [
      { department: "Engineering", amount: 312000, percentage: 42.02 },
      { department: "Sales", amount: 168000, percentage: 22.63 },
      { department: "Marketing", amount: 84000, percentage: 11.31 },
      { department: "Finance", amount: 72000, percentage: 9.7 },
      { department: "HR", amount: 48000, percentage: 6.46 },
      { department: "Customer Support", amount: 58500, percentage: 7.88 }
    ]
  },
  
  // Recent activities (for dashboard)
  recentActivities: [
    { id: 1, activity: "New Employee Onboarded", details: "Isabella Martinez joined as Junior Developer", timestamp: "May 05, 2023", type: "employee" },
    { id: 2, activity: "Promotion", details: "Michael Rodriguez promoted to Engineering Manager", timestamp: "May 01, 2023", type: "employee" },
    { id: 3, activity: "Leave Request", details: "Emma Wilson requested sick leave", timestamp: "Apr 29, 2023", type: "leave" },
    { id: 4, activity: "Performance Review", details: "Quarterly reviews completed for Engineering team", timestamp: "Apr 28, 2023", type: "performance" },
    { id: 5, activity: "Payroll Processed", details: "April 2023 payroll successfully processed", timestamp: "Apr 28, 2023", type: "payroll" }
  ]
};

const HRManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter employees based on search and filters
  const filteredEmployees = hrData.employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Format date in readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "employee":
        return <UserRound className="h-5 w-5 text-blue-500" />;
      case "leave":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case "performance":
        return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case "payroll":
        return <CreditCard className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
            <p className="text-muted-foreground">
              Manage your workforce, attendance, leave and payroll
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* HR Management Tabs */}
        <Tabs
          defaultValue="dashboard"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* HR Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Employees Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Employees</p>
                      <h2 className="text-3xl font-bold">{hrData.organization.totalEmployees}</h2>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Across {hrData.departments.length} departments
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Today's Attendance</p>
                      <h2 className="text-3xl font-bold">{hrData.attendance.today.present}</h2>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {hrData.attendance.today.workingRemotely} working remotely
                  </div>
                </CardContent>
              </Card>

              {/* Leave Requests Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Pending Leave</p>
                      <h2 className="text-3xl font-bold">{hrData.leave.pending}</h2>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {hrData.organization.onLeave} currently on leave
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Payroll</p>
                      <h2 className="text-3xl font-bold">{formatCurrency(hrData.payroll.netPayroll)}</h2>
                    </div>
                    <div className="bg-purple-500/10 p-2 rounded-full">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Next run: {hrData.payroll.nextRunDate}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workforce Overview & Leave Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workforce Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Workforce Overview</CardTitle>
                      <CardDescription>Employee distribution and metrics</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Department Distribution */}
                    <div>
                      <h3 className="text-sm font-medium mb-4">Department Distribution</h3>
                      <div className="h-[180px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">(Department distribution chart)</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        {hrData.departments.slice(0, 4).map(dept => (
                          <div key={dept.id} className="flex justify-between items-center">
                            <span className="text-sm">{dept.name}</span>
                            <span className="text-sm font-medium">{dept.employeeCount}</span>
                          </div>
                        ))}
                        {hrData.departments.length > 4 && (
                          <Button variant="link" size="sm" className="p-0">View all departments</Button>
                        )}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div>
                      <h3 className="text-sm font-medium mb-4">Key Metrics</h3>
                      <div className="space-y-4">
                        <div className="p-3 border rounded-md">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Gender Ratio</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Male</span>
                                <span>{(hrData.organization.maleRatio * 100).toFixed(0)}%</span>
                              </div>
                              <Progress value={hrData.organization.maleRatio * 100} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Female</span>
                                <span>{(hrData.organization.femaleRatio * 100).toFixed(0)}%</span>
                              </div>
                              <Progress value={hrData.organization.femaleRatio * 100} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Avg. Tenure</p>
                            <p className="text-lg font-bold">{hrData.organization.avgTenure} yrs</p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Avg. Age</p>
                            <p className="text-lg font-bold">{hrData.organization.avgAge} yrs</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Open Positions</p>
                            <p className="text-lg font-bold">{hrData.organization.openPositions}</p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Turnover Rate</p>
                            <p className="text-lg font-bold">{(hrData.organization.employeeTurnover * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Leave Dashboard</CardTitle>
                  <CardDescription>Recent requests & balances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Leave Balances */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Average Leave Balances</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Vacation</span>
                            <span>{hrData.leave.balances.vacation.remaining} of {hrData.leave.balances.vacation.total} days</span>
                          </div>
                          <Progress 
                            value={(hrData.leave.balances.vacation.remaining / hrData.leave.balances.vacation.total) * 100} 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Sick Leave</span>
                            <span>{hrData.leave.balances.sick.remaining} of {hrData.leave.balances.sick.total} days</span>
                          </div>
                          <Progress 
                            value={(hrData.leave.balances.sick.remaining / hrData.leave.balances.sick.total) * 100} 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Personal</span>
                            <span>{hrData.leave.balances.personal.remaining} of {hrData.leave.balances.personal.total} days</span>
                          </div>
                          <Progress 
                            value={(hrData.leave.balances.personal.remaining / hrData.leave.balances.personal.total) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Recent Leave Requests */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Recent Requests</h3>
                      <div className="space-y-2">
                        {hrData.leave.recentRequests.slice(0, 3).map(request => (
                          <div key={request.id} className="p-2 border rounded-md">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-sm font-medium">{request.employee}</p>
                                <p className="text-xs text-muted-foreground">{request.type}: {request.startDate} to {request.endDate}</p>
                              </div>
                              <Badge className={
                                request.status === "Approved" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              }>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        <Calendar className="h-4 w-4 mr-2" />
                        View All Requests
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities & Attendance Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>Latest actions and updates</CardDescription>
                    </div>
                    <Button variant="link" className="h-8 px-0">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hrData.recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md">
                        <div className="bg-muted p-2 rounded-full">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.activity}</div>
                          <div className="text-sm text-muted-foreground">{activity.details}</div>
                          <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Stats</CardTitle>
                  <CardDescription>This month's summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="h-[180px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">(Attendance trend chart)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-md">
                        <p className="text-xs text-muted-foreground">Avg. Attendance</p>
                        <p className="text-lg font-bold">{(hrData.attendance.thisMonth.averageAttendance * 100).toFixed(0)}%</p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <p className="text-xs text-muted-foreground">Late Instances</p>
                        <p className="text-lg font-bold">{hrData.attendance.thisMonth.lateInstances}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-md">
                        <p className="text-xs text-muted-foreground">Absences</p>
                        <p className="text-lg font-bold">{hrData.attendance.thisMonth.absences}</p>
                      </div>
                      <div className="p-3 border rounded-md">
                        <p className="text-xs text-muted-foreground">Remote Days</p>
                        <p className="text-lg font-bold">{hrData.attendance.thisMonth.remoteWorkDays}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI-Powered HR Insights */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>AI-Powered HR Insights</CardTitle>
                    <CardDescription>Advanced analytics and recommendations for your workforce</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <h3 className="text-lg font-medium">Performance Trends</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Engineering team productivity has increased by 12% in the past quarter, correlated with the new flex work policy.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View detailed analysis</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <BadgeCheck className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                    <h3 className="text-lg font-medium">Skill Gaps</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Data analysis identifies 3 positions in Marketing that would benefit from advanced digital marketing training.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View training recommendations</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <h3 className="text-lg font-medium">Satisfaction Analysis</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recent survey results show 85% satisfaction, with opportunities to improve in work-life balance and career growth.
                    </p>
                    <Button variant="link" className="px-0 mt-2">Explore employee feedback</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            {/* Employee Search & Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {hrData.departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Employee Directory</CardTitle>
                    <CardDescription>Manage your organization's employees</CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left font-medium text-sm">Employee</th>
                        <th className="py-3 px-4 text-left font-medium text-sm">Position</th>
                        <th className="py-3 px-4 text-left font-medium text-sm hidden md:table-cell">Department</th>
                        <th className="py-3 px-4 text-left font-medium text-sm hidden md:table-cell">Employment</th>
                        <th className="py-3 px-4 text-center font-medium text-sm">Status</th>
                        <th className="py-3 px-4 text-right font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map(employee => (
                        <tr key={employee.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center text-primary">
                                {employee.profileImg ? (
                                  <img src={employee.profileImg} alt={employee.name} className="h-10 w-10 rounded-full" />
                                ) : (
                                  <UserCircle className="h-6 w-6" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-xs text-muted-foreground">{employee.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {employee.position}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {employee.department}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {employee.employmentType}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={
                              employee.status === "Active" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : employee.status === "On Leave"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400"
                            }>
                              {employee.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <PanelLeftOpen className="h-4 w-4 mr-2" />
                                  View Documents
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Transfer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Award className="h-4 w-4 mr-2" />
                                  Performance Review
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <BellRing className="h-4 w-4 mr-2" />
                                  Send Notification
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredEmployees.length} of {hrData.employees.length} employees
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
                <CardDescription>
                  Track and manage employee attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Timer className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Attendance Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  track attendance, manage time off, and generate attendance reports.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Biometric integration with facial recognition</li>
                    <li>Geolocation verification for remote work</li>
                    <li>Automated absence notifications</li>
                    <li>Scheduling and shift management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Management Tab */}
          <TabsContent value="leave" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Leave Management</h2>
                <p className="text-muted-foreground">Track, approve, and manage employee leaves</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Leave Request
                </Button>
              </div>
            </div>
            
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approvals</p>
                      <h2 className="text-3xl font-bold">{hrData.leave.pending}</h2>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-full">
                      <CalendarClock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      <span className="flex-1">Annual Leave</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      <span className="flex-1">Sick Leave</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                      <span className="flex-1">Other</span>
                      <span className="font-medium">1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Currently on Leave</p>
                      <h2 className="text-3xl font-bold">{hrData.organization.onLeave}</h2>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="mb-2">{hrData.organization.returningToday} returning today</p>
                    <div className="flex -space-x-2">
                      {/* Avatar placeholders for people on leave */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium">JD</div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium">SM</div>
                      <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium">TS</div>
                      {hrData.organization.onLeave > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-white flex items-center justify-center text-xs font-medium text-white">+{hrData.organization.onLeave - 3}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Leave Balance Types</p>
                      <h2 className="text-3xl font-bold">6</h2>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <BookCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Leave Type
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>
                  Review and manage employee leave requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Leave Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="Search requests..." className="max-w-xs" />
                </div>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium">Employee</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Duration</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Dates</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hrData.leave.recentRequests.map((request, index) => (
                        <tr key={request.id} className={index < hrData.leave.recentRequests.length - 1 ? "border-b" : ""}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                                {request.employee.split(" ").map(name => name[0]).join("")}
                              </div>
                              <div>
                                <div className="font-medium">{request.employee}</div>
                                <div className="text-sm text-muted-foreground">
                                  {hrData.employees.find(emp => emp.name === request.employee)?.department || "Department"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={
                              request.type === "Sick Leave" 
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : request.type === "Vacation" 
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }>
                              {request.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const start = new Date(request.startDate);
                              const end = new Date(request.endDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                            })()}
                          </td>
                          <td className="py-3 px-4">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={
                              request.status === "Pending" 
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : request.status === "Approved" 
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }>
                              {request.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {request.status === "Pending" && (
                                  <>
                                    <DropdownMenuItem>
                                      <Check className="h-4 w-4 mr-2" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <X className="h-4 w-4 mr-2" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {hrData.leave.recentRequests.length} of {hrData.leave.pending + hrData.leave.approved} leave requests
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </CardFooter>
            </Card>
            
            {/* Leave Balances */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Balances Overview</CardTitle>
                <CardDescription>
                  Track employee leave entitlements and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium">Leave Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Policy</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Allocated</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Used</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Pending</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span className="font-medium">Annual Leave</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">Standard</td>
                        <td className="py-3 px-4">{hrData.leave.balances.vacation.total} days</td>
                        <td className="py-3 px-4">{hrData.leave.balances.vacation.used} days</td>
                        <td className="py-3 px-4">
                          {hrData.leave.recentRequests
                            .filter(r => r.status === 'Pending' && r.type === 'Vacation')
                            .reduce((acc, req) => {
                              const start = new Date(req.startDate);
                              const end = new Date(req.endDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return acc + diffDays;
                            }, 0)} days
                        </td>
                        <td className="py-3 px-4 font-medium">{hrData.leave.balances.vacation.remaining} days</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span className="font-medium">Sick Leave</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">Standard</td>
                        <td className="py-3 px-4">{hrData.leave.balances.sick.total} days</td>
                        <td className="py-3 px-4">{hrData.leave.balances.sick.used} days</td>
                        <td className="py-3 px-4">
                          {hrData.leave.recentRequests
                            .filter(r => r.status === 'Pending' && r.type === 'Sick Leave')
                            .reduce((acc, req) => {
                              const start = new Date(req.startDate);
                              const end = new Date(req.endDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return acc + diffDays;
                            }, 0)} days
                        </td>
                        <td className="py-3 px-4 font-medium">{hrData.leave.balances.sick.remaining} days</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <span className="font-medium">Personal Leave</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">Standard</td>
                        <td className="py-3 px-4">{hrData.leave.balances.personal.total} days</td>
                        <td className="py-3 px-4">{hrData.leave.balances.personal.used} days</td>
                        <td className="py-3 px-4">
                          {hrData.leave.recentRequests
                            .filter(r => r.status === 'Pending' && r.type === 'Personal')
                            .reduce((acc, req) => {
                              const start = new Date(req.startDate);
                              const end = new Date(req.endDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return acc + diffDays;
                            }, 0)} days
                        </td>
                        <td className="py-3 px-4 font-medium">{hrData.leave.balances.personal.remaining} days</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                            <span className="font-medium">Maternity Leave</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">Standard</td>
                        <td className="py-3 px-4">90 days</td>
                        <td className="py-3 px-4">0 days</td>
                        <td className="py-3 px-4">
                          {hrData.leave.recentRequests
                            .filter(r => r.status === 'Pending' && r.type === 'Maternity')
                            .reduce((acc, req) => {
                              const start = new Date(req.startDate);
                              const end = new Date(req.endDate);
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return acc + diffDays;
                            }, 0)} days
                        </td>
                        <td className="py-3 px-4 font-medium">90 days</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                            <span className="font-medium">Paternity Leave</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">Standard</td>
                        <td className="py-3 px-4">14 days</td>
                        <td className="py-3 px-4">0 days</td>
                        <td className="py-3 px-4">0 days</td>
                        <td className="py-3 px-4 font-medium">14 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="ml-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Leave Types
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Management</CardTitle>
                <CardDescription>
                  Process payroll and manage compensation
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <CreditCard className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Payroll Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to
                  process payroll, track deductions, and generate pay slips.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Direct MPESA integration for instant payments</li>
                    <li>Multiple currency and tax jurisdiction support</li>
                    <li>Benefits and bonuses management</li>
                    <li>Digital pay slip delivery with employee portal</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruitment Tab */}
          <TabsContent value="recruitment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recruitment</CardTitle>
                <CardDescription>
                  Manage job openings and candidate pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Briefcase className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Recruitment Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to
                  post jobs, track applicants, and manage the hiring process.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>AI-powered resume screening and matching</li>
                    <li>Interview scheduling with calendar integration</li>
                    <li>Collaborative candidate evaluation</li>
                    <li>Automated onboarding workflow triggers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Management</CardTitle>
                <CardDescription>
                  Track and improve employee performance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <BookCheck className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Performance Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to
                  set goals, conduct reviews, and track employee performance.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Continuous feedback and check-in system</li>
                    <li>OKR and KPI tracking with visual dashboards</li>
                    <li>360-degree peer and manager reviews</li>
                    <li>Skills gap analysis with training recommendations</li>
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

export default HRManagement;