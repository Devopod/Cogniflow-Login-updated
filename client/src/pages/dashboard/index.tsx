import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CreditCard,
  Bell,
  Calendar,
  BarChart2,
  TrendingUp,
  AlertCircle,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  FileClock,
  Loader2,
  ShoppingCart,
  DollarSign as DollarSignIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ErpNavigation from "@/components/ErpNavigation";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/use-company";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';

// Colors for charts
const COLORS = ["#4ade80", "#60a5fa", "#f97316", "#f43f5e"];

// Sample fallback data
const fallbackSalesData = [
  { date: "2025-01-20", sales: 5000 },
  { date: "2025-01-21", sales: 7500 },
  { date: "2025-01-22", sales: 6200 },
  { date: "2025-01-23", sales: 8100 },
  { date: "2025-01-24", sales: 9200 },
];

const fallbackFinancialData = [
  { month: "Oct", revenue: 45000, expenses: 32000 },
  { month: "Nov", revenue: 52000, expenses: 35000 },
  { month: "Dec", revenue: 48000, expenses: 33000 },
  { month: "Jan", revenue: 58000, expenses: 40000 },
];

export default function DashboardPage() {
  // All hooks at the top!
  const { toast } = useToast();
  const companyStatus = useCompany();

  // Dashboard metrics state
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: { value: "$0", change: 0, isPositive: true },
    newCustomers: { value: "0", change: 0, isPositive: true },
    inventoryItems: { value: "0", change: 0, isPositive: true },
    employeeCount: { value: "0", change: 0, isPositive: true }
  });

  // Dynamic real-time date/time state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connecting'|'connected'|'disconnected'>('connected');

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real data with error handling
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      } catch (error) {
        console.error('Orders fetch error:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices'], 
    queryFn: async () => {
      try {
        const res = await fetch('/api/invoices');
        if (!res.ok) throw new Error('Failed to fetch invoices');
        return res.json();
      } catch (error) {
        console.error('Invoices fetch error:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/inventory/low-stock');
        if (!res.ok) throw new Error('Failed to fetch low stock items');
        return res.json();
      } catch (error) {
        console.error('Low stock fetch error:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: upcomingLeaves = [] } = useQuery({
    queryKey: ['upcomingLeaves'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/hr/upcoming-leaves');
        if (!res.ok) throw new Error('Failed to fetch upcoming leaves');
        return res.json();
      } catch (error) {
        console.error('Leaves fetch error:', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
      } catch (error) {
        console.error('Alerts fetch error:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/activity/recent');
        if (!res.ok) throw new Error('Failed to fetch recent activity');
        return res.json();
      } catch (error) {
        console.error('Recent activity fetch error:', error);
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Calculate analytics safely
  const salesAnalytics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalSales: 0,
        salesByCategory: {},
        salesByDate: {},
        recentOrders: []
      };
    }

    const totalSales = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    
    const salesByDate = orders.reduce((acc: any, order: any) => {
      const date = new Date(order.orderDate).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (order.totalAmount || 0);
      return acc;
    }, {});

    const salesByCategory = orders.reduce((acc: any, order: any) => {
      const category = order.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (order.totalAmount || 0);
      return acc;
    }, {});

    return {
      totalSales,
      salesByDate,
      salesByCategory,
      recentOrders: orders.slice(0, 5)
    };
  }, [orders]);

  const financeAnalytics = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        totalRevenue: 0,
        invoicesByStatus: {},
        monthlyFinancialData: fallbackFinancialData,
        recentInvoices: []
      };
    }

    const totalRevenue = invoices.reduce((sum: number, invoice: any) => sum + (invoice.totalAmount || 0), 0);
    
    const invoicesByStatus = invoices.reduce((acc: any, invoice: any) => {
      const status = invoice.status || 'unknown';
      acc[status] = (acc[status] || 0) + (invoice.totalAmount || 0);
      return acc;
    }, {});

    return {
      totalRevenue,
      invoicesByStatus,
      monthlyFinancialData: fallbackFinancialData,
      recentInvoices: invoices.slice(0, 5)
    };
  }, [invoices]);

  // Format data for charts
  const salesByCategoryData = useMemo(() => {
    return Object.entries(salesAnalytics.salesByCategory).map(([name, value]) => ({
      name,
      value
    }));
  }, [salesAnalytics.salesByCategory]);

  const salesByDateData = useMemo(() => {
    const data = Object.entries(salesAnalytics.salesByDate)
      .map(([date, value]) => ({ date, sales: value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
    
    return data.length > 0 ? data : fallbackSalesData;
  }, [salesAnalytics.salesByDate]);

  const invoiceStatusData = useMemo(() => {
    return Object.entries(financeAnalytics.invoicesByStatus).map(([name, value]) => ({
      name,
      value
    }));
  }, [financeAnalytics.invoicesByStatus]);

  // Update dashboard data when analytics change
  useEffect(() => {
    if (financeAnalytics) {
      setDashboardData(prev => ({
        ...prev,
        totalRevenue: { 
          value: formatCurrency(financeAnalytics.totalRevenue), 
          change: 15, // Sample change
          isPositive: true
        },
        newCustomers: {
          value: orders.length.toString(),
          change: 8,
          isPositive: true
        },
        inventoryItems: {
          value: lowStockItems.length.toString(),
          change: -5,
          isPositive: false
        },
        employeeCount: {
          value: "24", // Sample value
          change: 2,
          isPositive: true
        }
      }));
    }
  }, [financeAnalytics, orders.length, lowStockItems.length]);

  // Loading state
  if (companyStatus.isLoading) {
    return (
      <ErpNavigation>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mt-4">Loading dashboard data...</span>
        </div>
      </ErpNavigation>
    );
  }

  return (
    <ErpNavigation>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {companyStatus.companyName && (
              <p className="text-muted-foreground">
                {companyStatus.companyName}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            }`} title={
              connectionStatus === 'connected' ? 'Connected' :
              connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting'
            } />
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{currentDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</span>
            </Button>
            <Button size="sm">
              <Zap className="h-4 w-4 mr-2" />
              <span>AI Insights</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        {isOrdersLoading || isInvoicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 bg-muted rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">{dashboardData.totalRevenue.value}</div>
                    <div className={`text-sm flex items-center mt-1 ${dashboardData.totalRevenue.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardData.totalRevenue.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {dashboardData.totalRevenue.change}% from last month
                    </div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">{dashboardData.newCustomers.value}</div>
                    <div className={`text-sm flex items-center mt-1 ${dashboardData.newCustomers.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardData.newCustomers.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {dashboardData.newCustomers.change}% from last month
                    </div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">{dashboardData.inventoryItems.value}</div>
                    <div className={`text-sm flex items-center mt-1 ${dashboardData.inventoryItems.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardData.inventoryItems.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(dashboardData.inventoryItems.change)}% from last month
                    </div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Employee Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold">{dashboardData.employeeCount.value}</div>
                    <div className={`text-sm flex items-center mt-1 ${dashboardData.employeeCount.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardData.employeeCount.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {dashboardData.employeeCount.change}% from last month
                    </div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Daily Sales Performance</CardTitle>
                  <CardDescription>Sales data for the last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesByDateData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Monthly revenue vs expenses</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={financeAnalytics.monthlyFinancialData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" fill="#4ade80" stroke="#22c55e" fillOpacity={0.2} name="Revenue" />
                      <Area type="monotone" dataKey="expenses" fill="#f43f5e" stroke="#e11d48" fillOpacity={0.2} name="Expenses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.slice(0, 5).map((activity: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.title || activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.time || 'Just now'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Important notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.length > 0 ? (
                      alerts.slice(0, 5).map((alert: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-full">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.title || alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.time || 'Now'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No alerts</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Your sales data and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatCurrency(salesAnalytics.totalSales)}</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <div className="text-sm text-muted-foreground">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{salesAnalytics.totalSales > 0 ? formatCurrency(salesAnalytics.totalSales / orders.length) : '$0'}</div>
                    <div className="text-sm text-muted-foreground">Avg Order Value</div>
                  </div>
                </div>
                
                {salesByCategoryData.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {salesByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Items</CardTitle>
                  <CardDescription>Items that need reordering</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-red-500">{item.available} units</div>
                            <div className="text-xs text-muted-foreground">Reorder: {item.reorderPoint}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">All items in stock</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesAnalytics.recentOrders.length > 0 ? (
                      salesAnalytics.recentOrders.map((order: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Order #{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.customerName || 'Customer'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(order.totalAmount)}</div>
                            <div className="text-xs text-muted-foreground">{order.status}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No recent orders</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hr" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Leaves</CardTitle>
                <CardDescription>Employee leave requests and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingLeaves.length > 0 ? (
                    upcomingLeaves.slice(0, 5).map((leave: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{leave.employee}</p>
                          <p className="text-xs text-muted-foreground">{leave.department}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{leave.from} - {leave.to}</div>
                          <div className={`text-xs ${leave.status === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                            {leave.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming leaves</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Status</CardTitle>
                  <CardDescription>Current invoice distribution</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {invoiceStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={invoiceStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {invoiceStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No invoice data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest invoice activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financeAnalytics.recentInvoices.length > 0 ? (
                      financeAnalytics.recentInvoices.map((invoice: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Invoice #{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{invoice.customerName || 'Customer'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(invoice.totalAmount)}</div>
                            <div className={`text-xs ${
                              invoice.status === 'paid' ? 'text-green-500' : 
                              invoice.status === 'sent' ? 'text-blue-500' : 'text-yellow-500'
                            }`}>
                              {invoice.status}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No recent invoices</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
}