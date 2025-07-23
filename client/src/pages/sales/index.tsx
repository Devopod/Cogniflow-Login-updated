
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
} from "recharts";

const COLORS = ["#4ade80", "#60a5fa", "#f97316", "#f43f5e"];

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ErpNavigation from "@/components/ErpNavigation";
import {
  BarChart3,
  CalendarRange,
  Clock,
  Cog,
  DollarSign,
  FileText,
  Filter,
  ListFilter,
  PlusSquare,
  Receipt,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";

import { OrderForm } from "@/components/sales/OrderForm";
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const SalesManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("overview");
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Fetch sales metrics dynamically
  const { data: salesMetrics = {}, refetch: refetchSalesMetrics } = useQuery({
    queryKey: ['salesMetrics'],
    queryFn: async () => {
      // TODO: Replace with your actual backend endpoint
      const res = await fetch('/api/sales/metrics');
      if (!res.ok) throw new Error('Failed to fetch sales metrics');
      return res.json();
    },
  });

  // Fetch recent orders dynamically
  const { data: recentOrders = [], refetch: refetchRecentOrders } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      // TODO: Replace with your actual backend endpoint
      const res = await fetch('/api/sales/recent-orders');
      if (!res.ok) throw new Error('Failed to fetch recent orders');
      return res.json();
    },
  });

  // Fetch sales data for charts dynamically
  const { data: salesData = [], refetch: refetchSalesData } = useQuery({
    queryKey: ['salesData'],
    queryFn: async () => {
      // TODO: Replace with your actual backend endpoint
      const res = await fetch('/api/sales/monthly-sales');
      if (!res.ok) throw new Error('Failed to fetch sales data');
      return res.json();
    },
  });

  // Fetch sales by category for pie chart dynamically
  const { data: salesByCategory = [], refetch: refetchSalesByCategory } = useQuery({
    queryKey: ['salesByCategory'],
    queryFn: async () => {
      // TODO: Replace with your actual backend endpoint
      const res = await fetch('/api/sales/by-category');
      if (!res.ok) throw new Error('Failed to fetch sales by category');
      return res.json();
    },
  });

  // Fetch top customers dynamically
  const { data: topCustomers = [], refetch: refetchTopCustomers } = useQuery({
    queryKey: ['topCustomers'],
    queryFn: async () => {
      // TODO: Replace with your actual backend endpoint
      const res = await fetch('/api/sales/top-customers');
      if (!res.ok) throw new Error('Failed to fetch top customers');
      return res.json();
    },
  });

  // Fetch orders dynamically for Orders tab
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // TODO: Replace with your actual backend endpoint
      const res = await fetch('/api/sales/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = io('http://localhost:4000'); // TODO: Replace with your backend URL
    socket.on('orders_updated', () => {
      refetchRecentOrders();
      refetchOrders();
    });
    socket.on('sales_metrics_updated', refetchSalesMetrics); // Refetch sales metrics
    socket.on('sales_data_updated', refetchSalesData); // Refetch sales performance chart
    socket.on('recent_orders_updated', refetchRecentOrders); // Refetch recent orders
    socket.on('top_customers_updated', refetchTopCustomers); // Refetch top customers
    socket.on('sales_by_category_updated', refetchSalesByCategory); // Refetch sales by category
    // If you have a separate query for all orders, add refetchOrders here
    // If dashboard needs to update, emit/trigger dashboard update event as well
    return () => {
      socket.disconnect();
    };
  }, [refetchSalesMetrics, refetchRecentOrders, refetchSalesData, refetchTopCustomers, refetchSalesByCategory, refetchOrders]);

  const { toast } = useToast();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const safeNumber = (value: any, fallback = 0) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return fallback;
    return value;
  };

  const safePercent = (value: any, fallback = '0%') => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return fallback;
    return value + '%';
  };

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
            <p className="text-muted-foreground">
              Manage sales orders, quotations, and customer transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sales Reports</DialogTitle>
                  <DialogDescription>Generate and view sales reports</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <Button className="w-full" onClick={() => toast({ title: "Generating sales report..." })}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Sales Overview
                    </Button>
                    <Button className="w-full" onClick={() => toast({ title: "Generating revenue report..." })}>
                      <LineChart className="h-4 w-4 mr-2" />
                      Revenue Analysis
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Cog className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sales Settings</DialogTitle>
                  <DialogDescription>Configure sales module settings</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable notifications</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-generate quotations</Label>
                    <Switch />
                  </div>
                  <Separator />
                  <Button onClick={() => toast({ title: "Settings saved" })}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>

            <OrderForm
              open={showOrderForm}
              onClose={() => setShowOrderForm(false)}
            />
            <Button
              size="sm"
              onClick={() => setShowOrderForm(true)}
            >
              <PlusSquare className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Sales Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Sales</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(safeNumber(salesMetrics.totalSales))}</h2>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+12.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Orders</p>
                  <h2 className="text-3xl font-bold">{safeNumber(salesMetrics.salesCount)}</h2>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{safeNumber(salesMetrics.pendingOrders)} pending orders</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Order Value</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(safeNumber(salesMetrics.avgOrderValue))}</h2>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-full">
                  <Tag className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+4.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Quotations</p>
                  <h2 className="text-3xl font-bold">{safeNumber(salesMetrics.pendingQuotations)}</h2>
                </div>
                <div className="bg-purple-500/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{safeNumber(salesMetrics.pendingQuotations)} pending quotations</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Management Tabs */}
        <Tabs
          defaultValue="overview"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Sales Performance</CardTitle>
                      <CardDescription>Monthly sales trends over time</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Last 12 Months
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {salesData.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">No sales data available. Data will appear after you create your first order.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conversion Rate</span>
                      <Badge className="bg-green-500/10 text-green-500">{safePercent(salesMetrics.conversionRate, '—')}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Return Rate</span>
                      <Badge className="bg-red-500/10 text-red-500">{safePercent(salesMetrics.returnRate, '—')}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Repeat Customers</span>
                      <Badge className="bg-blue-500/10 text-blue-500">{safePercent(salesMetrics.repeatCustomerRate, '—')}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Fulfillment Time</span>
                      <Badge className="bg-amber-500/10 text-amber-500">{safeNumber(salesMetrics.avgFulfillmentTime, '—')} days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quote to Order</span>
                      <Badge className="bg-purple-500/10 text-purple-500">{safePercent(salesMetrics.quoteToOrder, '—')}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-sm font-medium">Overall Health</span>
                      <Badge className="bg-green-500 text-white">{salesMetrics.overallHealth || '—'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground">No recent orders yet. Orders will appear here after you create your first order.</div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-start gap-3 p-3 border rounded-md">
                          <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Order #{order.id}</p>
                            <p className="text-xs text-muted-foreground">{order.customer} - {order.items} items</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{order.time}</span>
                            </div>
                          </div>
                          <Badge className={order.status === 'paid' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                            {order.status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Product category breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesByCategory.length === 0 ? (
                    <div className="text-center text-muted-foreground">No sales by category data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie
                          data={salesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="space-y-2">
                    {salesByCategory.map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${COLORS[index % COLORS.length]}`}></div>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Highest revenue customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {topCustomers.length === 0 ? (
                    <div className="text-center text-muted-foreground">No top customers yet. Data will appear after you have sales.</div>
                  ) : (
                    <div className="space-y-4">
                      {topCustomers.map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">{customer.orderCount} orders this year</p>
                            </div>
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(customer.totalRevenue)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>All sales orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center text-muted-foreground">No orders yet. Orders will appear here after you create your first order.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-3 font-medium">Order #</th>
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium">Items</th>
                          <th className="pb-3 font-medium">Total</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="border-b last:border-none">
                            <td className="py-3">{order.orderNumber}</td>
                            <td className="py-3">{order.customerName}</td>
                            <td className="py-3">{order.items.length}</td>
                            <td className="py-3">{formatCurrency(order.total)}</td>
                            <td className="py-3">{order.status}</td>
                            <td className="py-3">{new Date(order.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Quotations</CardTitle>
                <CardDescription>
                  This tab will allow you to create and track sales quotations
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <FileText className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Quotations Management</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is being implemented in the current phase. You'll be able to create, send, and track quotations with the QUOT-#### prefix.
                </p>
                <Button onClick={() => setLocation("/sales/quotations")}>
                  Manage Quotations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Customers</CardTitle>
                <CardDescription>
                  This tab will allow you to manage customer information
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Users className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Customer Management</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is being implemented in the current phase. You'll be able to manage customer information, view customer history, and track sales by customer.
                </p>
                <Button onClick={() => setLocation("/sales/customers")}>
                  Manage Customers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  This tab will show your products and pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Tag className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Product Catalog</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is being implemented in the current phase. You'll be able to manage products, pricing, and discounts for sales.
                </p>
                <Button onClick={() => setLocation("/sales/products")}>
                  View Product Catalog
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  This tab will allow you to manage invoices and payments
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <Receipt className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Invoice Management</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is being implemented in the current phase. You'll be able to create, send, and track invoices for sales orders.
                </p>
                <Button onClick={() => setLocation("/sales/invoices")}>
                  Manage Invoices
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Sales Analytics</CardTitle>
                <CardDescription>
                  This tab will provide detailed sales analytics and reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <BarChart3 className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Sales Analytics</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is being implemented in the current phase. You'll be able to view detailed sales reports, trends, and forecasts.
                </p>
                <Button onClick={() => setLocation("/sales/analytics")}>
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
};

export default SalesManagement;