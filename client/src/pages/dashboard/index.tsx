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
import { useOrders, useQuotations } from "@/hooks/use-sales-data";
import { useInvoices } from "@/hooks/use-finance-data";
import { useSalesAnalytics, useQuotationAnalytics } from "@/hooks/use-sales-analytics";
import { useFinanceAnalytics } from "@/hooks/use-finance-analytics";
import { formatCurrency } from "@/lib/utils";
import { Contact } from "@shared/schema";

// Colors for charts
const COLORS = ["#4ade80", "#60a5fa", "#f97316", "#f43f5e"];

// Sample data for non-sales sections (we'll keep these for now)
const lowStockItems = [
  { id: 1, name: "Laptop - Pro Model", sku: "LT-PM-2023", available: 5, reorderPoint: 10 },
  { id: 2, name: "Network Router", sku: "NR-2000-X", available: 3, reorderPoint: 8 },
  { id: 3, name: "Wireless Keyboard", sku: "KB-WL-102", available: 7, reorderPoint: 15 },
  { id: 4, name: "24\" LCD Monitor", sku: "MON-24-HD", available: 4, reorderPoint: 12 },
];

const upcomingLeaves = [
  { id: 1, employee: "John Smith", department: "Development", from: "May 10", to: "May 15", status: "Approved" },
  { id: 2, employee: "Emily Johnson", department: "Design", from: "May 12", to: "May 14", status: "Pending" },
  { id: 3, employee: "David Brown", department: "Marketing", from: "May 18", to: "May 25", status: "Approved" },
];

export default function DashboardPage() {
  const { toast } = useToast();
  const companyStatus = useCompany();
  
  // Fetch orders, quotations, and invoices
  const { data: orders, isLoading: isOrdersLoading, error: ordersError } = useOrders();
  const { data: quotations, isLoading: isQuotationsLoading, error: quotationsError } = useQuotations();
  const { data: invoices, isLoading: isInvoicesLoading, error: invoicesError } = useInvoices();
  
  // Calculate analytics
  const salesAnalytics = useSalesAnalytics(orders);
  const quotationAnalytics = useQuotationAnalytics(quotations);
  const financeAnalytics = useFinanceAnalytics(invoices);
  
  // Format data for charts
  const salesByCategoryData = useMemo(() => {
    return Object.entries(salesAnalytics.salesByCategory).map(([name, value]) => ({
      name,
      value
    }));
  }, [salesAnalytics.salesByCategory]);
  
  const salesByDateData = useMemo(() => {
    return Object.entries(salesAnalytics.salesByDate)
      .map(([date, value]) => ({ date, sales: value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }, [salesAnalytics.salesByDate]);
  
  // Format invoice status data for charts
  const invoiceStatusData = useMemo(() => {
    return Object.entries(financeAnalytics.invoicesByStatus).map(([name, value]) => ({
      name,
      value
    }));
  }, [financeAnalytics.invoicesByStatus]);
  
  // Generate recent activities from invoices
  const recentActivities = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    return financeAnalytics.recentInvoices.map(invoice => {
      const timeDiff = new Date().getTime() - new Date(invoice.updatedAt).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor(timeDiff / (1000 * 60));
      
      let timeAgo;
      if (days > 0) {
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
      
      return {
        id: invoice.id,
        type: "invoice",
        title: `Invoice #${invoice.invoiceNumber} ${invoice.status}`,
        amount: formatCurrency(invoice.totalAmount),
        time: timeAgo,
      };
    });
  }, [financeAnalytics.recentInvoices]);
  
  // Dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: { value: "$0", change: 0, isPositive: true },
    newCustomers: { value: "0", change: 0, isPositive: true },
    inventoryItems: { value: "0", change: 0, isPositive: true },
    employeeCount: { value: "0", change: 0, isPositive: true }
  });
  
  // Update dashboard data when analytics change
  useEffect(() => {
    if (financeAnalytics) {
      // Calculate month-over-month change
      const calculateChange = () => {
        if (financeAnalytics.monthlyFinancialData.length < 2) return 0;
        
        const currentMonth = financeAnalytics.monthlyFinancialData[financeAnalytics.monthlyFinancialData.length - 1];
        const previousMonth = financeAnalytics.monthlyFinancialData[financeAnalytics.monthlyFinancialData.length - 2];
        
        if (previousMonth.revenue === 0) return 100;
        
        return Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100);
      };
      
      const change = calculateChange();
      
      setDashboardData(prev => ({
        ...prev,
        totalRevenue: { 
          value: formatCurrency(financeAnalytics.totalRevenue), 
          change: change,
          isPositive: change >= 0
        }
      }));
    }
  }, [financeAnalytics]);

  const isLoading = isOrdersLoading || isQuotationsLoading || isInvoicesLoading;

  // If company status is still loading, show a loading indicator
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
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>May 2023</span>
            </Button>
            <Button size="sm">
              <Zap className="h-4 w-4 mr-2" />
              <span>AI Insights</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
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
                      {dashboardData.inventoryItems.change}% from last month
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
                  <CardTitle>Monthly Sales Performance</CardTitle>
                  <CardDescription>Comparison of sales vs targets for the current year</CardDescription>
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
                      <Bar dataKey="sales" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Actual Sales" />
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
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start">
                        <div className={`mr-4 p-2 rounded-full 
                          ${activity.type === "invoice" ? "bg-blue-100" : ""}
                          ${activity.type === "inventory" ? "bg-green-100" : ""}
                          ${activity.type === "expense" ? "bg-red-100" : ""}
                          ${activity.type === "employee" ? "bg-purple-100" : ""}
                        `}>
                          {activity.type === "invoice" && <FileText className={`h-5 w-5 text-blue-500`} />}
                          {activity.type === "inventory" && <Package className={`h-5 w-5 text-green-500`} />}
                          {activity.type === "expense" && <CreditCard className={`h-5 w-5 text-red-500`} />}
                          {activity.type === "employee" && <Users className={`h-5 w-5 text-purple-500`} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
                            {activity.amount && (
                              <p className="text-sm font-medium">{activity.amount}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline" size="sm">View All Activity</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Alerts & Notifications</CardTitle>
                  <CardDescription>Important updates requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-yellow-800">Low Inventory Alert</p>
                          <p className="text-sm text-yellow-700 mt-1">4 products are below their reorder point and need attention.</p>
                          <Button variant="outline" size="sm" className="mt-2 bg-white">View Inventory</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <FileClock className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800">Upcoming Invoice Due</p>
                          <p className="text-sm text-blue-700 mt-1">3 invoices are due in the next 5 days with a total value of $12,450.</p>
                          <Button variant="outline" size="sm" className="mt-2 bg-white">Review Invoices</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-purple-800">Employee Leave Requests</p>
                          <p className="text-sm text-purple-700 mt-1">2 new leave requests await your approval.</p>
                          <Button variant="outline" size="sm" className="mt-2 bg-white">Process Requests</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sales" className="space-y-6 mt-4">
            {/* Sales Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(salesAnalytics.totalSales)}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        From {orders?.length || 0} orders
                      </div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSignIcon className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quotations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl font-bold">{quotations?.length || 0}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Value: {formatCurrency(quotationAnalytics.totalQuotationValue)}
                      </div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(salesAnalytics.averageOrderValue)}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Per order average
                      </div>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your customers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : salesAnalytics.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found. Create your first order to see it here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-3 font-medium">Order Number</th>
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesAnalytics.recentOrders.map((order) => (
                          <tr key={order.id} className="border-b last:border-none">
                            <td className="py-3">{order.orderNumber}</td>
                            <td className="py-3">{new Date(order.orderDate).toLocaleDateString()}</td>
                            <td className="py-3">Customer #{order.contactId || 'N/A'}</td>
                            <td className="py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                                ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                              `}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3">
                              <Button variant="ghost" size="sm">View</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-6 text-center">
                  <Button variant="outline" size="sm">View All Orders</Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Distribution of sales across product categories</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : salesByCategoryData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No sales data available by category
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {salesByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              {/* Sales Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Daily sales trend for the last 7 days</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : salesByDateData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                      No sales data available for the selected period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesByDateData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                          formatter={(value) => [`$${value}`, 'Sales']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#4ade80" 
                          strokeWidth={2} 
                          dot={{ r: 6 }} 
                          name="Sales" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Customers with highest order value</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : salesAnalytics.topCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No customer data available
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-3 font-medium">Customer ID</th>
                          <th className="pb-3 font-medium">Total Orders Value</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesAnalytics.topCustomers.map((customer) => (
                          <tr key={customer.contactId} className="border-b last:border-none">
                            <td className="py-3">Customer #{customer.contactId}</td>
                            <td className="py-3 font-medium">{formatCurrency(customer.total)}</td>
                            <td className="py-3">
                              <Button variant="ghost" size="sm">View Details</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="operations" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Products below reorder point requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium">Product Name</th>
                        <th className="pb-3 font-medium">SKU</th>
                        <th className="pb-3 font-medium">Available</th>
                        <th className="pb-3 font-medium">Reorder Point</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((item) => (
                        <tr key={item.id} className="border-b last:border-none">
                          <td className="py-3">{item.name}</td>
                          <td className="py-3 font-mono text-sm">{item.sku}</td>
                          <td className="py-3">
                            <span className="font-medium text-red-500">{item.available}</span>
                          </td>
                          <td className="py-3">{item.reorderPoint}</td>
                          <td className="py-3">
                            <Button variant="outline" size="sm">Reorder</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Capacity</CardTitle>
                  <CardDescription>Current storage utilization across locations</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Main Warehouse", used: 75, available: 25 },
                        { name: "Secondary Storage", used: 60, available: 40 },
                        { name: "Distribution Center", used: 45, available: 55 },
                        { name: "Partner Facility", used: 30, available: 70 },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="used" stackId="a" fill="#f97316" name="Used Capacity (%)" />
                      <Bar dataKey="available" stackId="a" fill="#e2e8f0" name="Available (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>On-time delivery metrics for last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: "Jan", onTime: 94, late: 6 },
                        { month: "Feb", onTime: 91, late: 9 },
                        { month: "Mar", onTime: 95, late: 5 },
                        { month: "Apr", onTime: 97, late: 3 },
                        { month: "May", onTime: 96, late: 4 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="onTime" stroke="#4ade80" strokeWidth={2} name="On-time Delivery %" />
                      <Line type="monotone" dataKey="late" stroke="#f43f5e" strokeWidth={2} name="Late Delivery %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="hr" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Leave Requests</CardTitle>
                <CardDescription>Employee time-off scheduled for the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium">Employee</th>
                        <th className="pb-3 font-medium">Department</th>
                        <th className="pb-3 font-medium">From</th>
                        <th className="pb-3 font-medium">To</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingLeaves.map((leave) => (
                        <tr key={leave.id} className="border-b last:border-none">
                          <td className="py-3">{leave.employee}</td>
                          <td className="py-3">{leave.department}</td>
                          <td className="py-3">{leave.from}</td>
                          <td className="py-3">{leave.to}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
                              ${leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            `}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Headcount</CardTitle>
                  <CardDescription>Current employee distribution by department</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Engineering", value: 24 },
                          { name: "Sales", value: 16 },
                          { name: "Marketing", value: 12 },
                          { name: "Finance", value: 8 },
                          { name: "HR", value: 4 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: "Engineering", value: 24 },
                          { name: "Sales", value: 16 },
                          { name: "Marketing", value: 12 },
                          { name: "Finance", value: 8 },
                          { name: "HR", value: 4 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Daily attendance rate for the current month</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { day: "1", rate: 96 },
                        { day: "2", rate: 97 },
                        { day: "3", rate: 98 },
                        { day: "4", rate: 95 },
                        { day: "5", rate: 94 },
                        { day: "8", rate: 92 },
                        { day: "9", rate: 95 },
                        { day: "10", rate: 97 },
                        { day: "11", rate: 98 },
                        { day: "12", rate: 96 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="day" />
                      <YAxis domain={[90, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="#60a5fa" strokeWidth={2} name="Attendance Rate %" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="finance" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Accounts Receivable</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$35,240</div>
                  <div className="text-sm text-muted-foreground mt-1">From 28 open invoices</div>
                  <div className="mt-4 flex space-x-2">
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">$18,450 Current</div>
                    <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">$10,320 1-30 Days</div>
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">$6,470 30+ Days</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Accounts Payable</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$28,750</div>
                  <div className="text-sm text-muted-foreground mt-1">To 15 vendors</div>
                  <div className="mt-4 flex space-x-2">
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">$15,200 Current</div>
                    <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">$8,320 1-30 Days</div>
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">$5,230 30+ Days</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">+$12,840</div>
                  <div className="text-sm text-muted-foreground mt-1">Last 30 days</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="text-xs bg-green-100 rounded-md p-2">
                      <div className="font-medium text-green-800">$48,350</div>
                      <div className="text-green-700">Income</div>
                    </div>
                    <div className="text-xs bg-red-100 rounded-md p-2">
                      <div className="font-medium text-red-800">$35,510</div>
                      <div className="text-red-700">Expenses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>Monthly revenue, expenses and profit trends</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { month: "Jan", revenue: 56000, expenses: 40000, profit: 16000 },
                      { month: "Feb", revenue: 62000, expenses: 45000, profit: 17000 },
                      { month: "Mar", revenue: 58000, expenses: 42000, profit: 16000 },
                      { month: "Apr", revenue: 70000, expenses: 48000, profit: 22000 },
                      { month: "May", revenue: 65000, expenses: 43000, profit: 22000 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#60a5fa" name="Revenue" />
                    <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" />
                    <Bar dataKey="profit" fill="#4ade80" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
}