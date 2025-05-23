
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

const pieData = [
  { name: "Electronics", value: 42 },
  { name: "Furniture", value: 28 },
  { name: "Office Supplies", value: 18 },
  { name: "Other", value: 12 }
];

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

const SalesManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("overview");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 457890,
    salesCount: 126,
    avgOrderValue: 3634,
    conversionRate: 18.7,
    returnRate: 2.3,
    pendingQuotations: 14,
    pendingOrders: 8,
    customerCount: 87,
    repeatCustomerRate: 64
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      id: "10428",
      customer: "ABC Corporation",
      items: 3,
      time: "Today, 10:42 AM",
      status: "paid"
    }
  ]);

  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket(`wss://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_order') {
        // Update metrics
        setSalesMetrics(prev => ({
          ...prev,
          totalSales: prev.totalSales + data.data.total,
          salesCount: prev.salesCount + 1,
          pendingOrders: prev.pendingOrders + 1,
          avgOrderValue: Math.round((prev.totalSales + data.data.total) / (prev.salesCount + 1))
        }));

        // Update recent orders
        const newOrder = {
          id: data.data.id.split('-')[1],
          customer: data.data.customer,
          items: data.data.items.length,
          time: "Just now",
          status: "pending"
        };

        setRecentOrders(prev => [newOrder, ...prev.slice(0, 3)]);
      }
    };

    return () => ws.close();
  }, []);

  // Monthly sales data
  const salesData = [
    { month: "Jan", sales: 42000 },
    { month: "Feb", sales: 38000 },
    { month: "Mar", sales: 45000 },
    { month: "Apr", sales: 39000 },
    { month: "May", sales: 47000 },
    { month: "Jun", sales: 52000 },
    { month: "Jul", sales: 58000 },
    { month: "Aug", sales: 63000 },
    { month: "Sep", sales: 59000 },
    { month: "Oct", sales: 64000 },
    { month: "Nov", sales: 72000 },
    { month: "Dec", sales: 78000 }
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
                  <h2 className="text-3xl font-bold">{formatCurrency(salesMetrics.totalSales)}</h2>
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
                  <h2 className="text-3xl font-bold">{salesMetrics.salesCount}</h2>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{salesMetrics.pendingOrders} pending orders</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Order Value</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(salesMetrics.avgOrderValue)}</h2>
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
                  <h2 className="text-3xl font-bold">{salesMetrics.pendingQuotations}</h2>
                </div>
                <div className="bg-purple-500/10 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{salesMetrics.pendingQuotations} pending quotations</span>
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
                      <Badge className="bg-green-500/10 text-green-500">{salesMetrics.conversionRate}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Return Rate</span>
                      <Badge className="bg-red-500/10 text-red-500">{salesMetrics.returnRate}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Repeat Customers</span>
                      <Badge className="bg-blue-500/10 text-blue-500">{salesMetrics.repeatCustomerRate}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Fulfillment Time</span>
                      <Badge className="bg-amber-500/10 text-amber-500">2.3 days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quote to Order</span>
                      <Badge className="bg-purple-500/10 text-purple-500">42%</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-sm font-medium">Overall Health</span>
                      <Badge className="bg-green-500 text-white">Good</Badge>
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
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order #10427</p>
                        <p className="text-xs text-muted-foreground">XYZ Ltd - 12 items</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Yesterday, 2:15 PM</span>
                        </div>
                      </div>
                      <Badge className="bg-amber-500 text-white">Processing</Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order #10426</p>
                        <p className="text-xs text-muted-foreground">Tech Solutions Inc - 5 items</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Yesterday, 11:30 AM</span>
                        </div>
                      </div>
                      <Badge className="bg-purple-500 text-white">Shipped</Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order #10425</p>
                        <p className="text-xs text-muted-foreground">Global Services LLC - 8 items</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">May 1, 2023</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">Completed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Product category breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Electronics", value: 42 },
                          { name: "Furniture", value: 28 },
                          { name: "Office Supplies", value: 18 },
                          { name: "Other", value: 12 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Electronics</span>
                      </div>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Furniture</span>
                      </div>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-sm">Office Supplies</span>
                      </div>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm">Other</span>
                      </div>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Highest revenue customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          A
                        </div>
                        <div>
                          <p className="text-sm font-medium">ABC Corporation</p>
                          <p className="text-xs text-muted-foreground">24 orders this year</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">$86,240</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500">
                          T
                        </div>
                        <div>
                          <p className="text-sm font-medium">Tech Solutions Inc</p>
                          <p className="text-xs text-muted-foreground">18 orders this year</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">$65,780</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center font-bold text-green-500">
                          G
                        </div>
                        <div>
                          <p className="text-sm font-medium">Global Services LLC</p>
                          <p className="text-xs text-muted-foreground">15 orders this year</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">$52,450</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center font-bold text-amber-500">
                          X
                        </div>
                        <div>
                          <p className="text-sm font-medium">XYZ Ltd</p>
                          <p className="text-xs text-muted-foreground">12 orders this year</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">$48,920</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  This tab will show your sales orders and their details
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <ShoppingCart className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Orders Management</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is being implemented in the current phase. You'll be able to create, edit, and manage all sales orders.
                </p>
                <Button onClick={() => setLocation("/sales/orders")}>
                  Manage Orders
                </Button>
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