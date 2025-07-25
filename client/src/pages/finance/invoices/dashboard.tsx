import { useState, useMemo } from "react";
import { useLocation } from "wouter";
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
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  RefreshCw,
  Send,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Eye
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  useInvoices,
  useInvoiceStats,
  useOverdueInvoices,
  useRecurringInvoices,
  useInvoicePayments
} from "@/hooks/use-finance-data";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatCurrency, formatDate } from "@/lib/utils";

// Chart colors
const COLORS = ["#4ade80", "#60a5fa", "#f97316", "#f43f5e", "#a855f7", "#06b6d4"];

// Date range options
const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "custom", label: "Custom range" }
];

export default function InvoiceDashboard() {
  const [, navigate] = useLocation();
  const [dateRange, setDateRange] = useState("30d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

  // Fetch invoice data
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices();
  const { data: invoiceStats, isLoading: statsLoading } = useInvoiceStats();
  const { data: overdueInvoices, isLoading: overdueLoading } = useOverdueInvoices();
  const { data: recurringInvoices, isLoading: recurringLoading } = useRecurringInvoices();

  // Real-time updates
  useWebSocket({
    onInvoiceCreated: () => {
      refetchInvoices();
    },
    onInvoiceUpdated: () => {
      refetchInvoices();
    },
    onPaymentReceived: () => {
      refetchInvoices();
    }
  });

  // Filter invoices based on current filters
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    let filtered = [...invoices];
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        invoice.status?.toLowerCase() === statusFilter ||
        invoice.paymentStatus?.toLowerCase() === statusFilter
      );
    }
    
    // Overdue filter
    if (showOnlyOverdue) {
      const now = new Date();
      filtered = filtered.filter(invoice => 
        new Date(invoice.dueDate) < now && 
        invoice.paymentStatus !== "Paid"
      );
    }
    
    // Date range filter
    const now = new Date();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    if (dateRange !== "custom" && daysMap[dateRange as keyof typeof daysMap]) {
      const cutoffDate = new Date(now.getTime() - daysMap[dateRange as keyof typeof daysMap] * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(invoice => new Date(invoice.createdAt) >= cutoffDate);
    }
    
    return filtered;
  }, [invoices, statusFilter, showOnlyOverdue, dateRange]);

  // Calculate metrics from filtered data
  const metrics = useMemo(() => {
    if (!filteredInvoices.length) {
      return {
        totalInvoices: 0,
        totalValue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averageValue: 0,
        conversionRate: 0,
        growth: 0
      };
    }

    const totalInvoices = filteredInvoices.length;
    const totalValue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paidInvoices = filteredInvoices.filter(inv => inv.paymentStatus === "Paid");
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingInvoices = filteredInvoices.filter(inv => inv.paymentStatus === "Pending");
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdueAmount = (overdueInvoices || []).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const averageValue = totalValue / totalInvoices;
    const conversionRate = paidInvoices.length / totalInvoices * 100;

    return {
      totalInvoices,
      totalValue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      averageValue,
      conversionRate,
      growth: 0 // TODO: Calculate growth from previous period
    };
  }, [filteredInvoices, overdueInvoices]);

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!filteredInvoices.length) return [];
    
    const statusCounts = filteredInvoices.reduce((acc, invoice) => {
      const status = invoice.paymentStatus || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      amount: filteredInvoices
        .filter(inv => (inv.paymentStatus || "Unknown") === status)
        .reduce((sum, inv) => sum + inv.totalAmount, 0)
    }));
  }, [filteredInvoices]);

  const monthlyData = useMemo(() => {
    if (!filteredInvoices.length) return [];
    
    const monthlyStats = filteredInvoices.reduce((acc, invoice) => {
      const month = new Date(invoice.createdAt).toISOString().slice(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { month, invoices: 0, amount: 0, paid: 0 };
      }
      acc[month].invoices += 1;
      acc[month].amount += invoice.totalAmount;
      if (invoice.paymentStatus === "Paid") {
        acc[month].paid += invoice.totalAmount;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyStats).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }, [filteredInvoices]);

  const isLoading = invoicesLoading || statsLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your invoice performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => refetchInvoices()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate("/finance/invoices/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="dateRange" className="text-sm font-medium">Date Range:</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="statusFilter" className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={showOnlyOverdue ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyOverdue(!showOnlyOverdue)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Show Overdue Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {/* TODO: Add growth calculation */}
              +5% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.paidAmount)}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.totalValue > 0 ? ((metrics.paidAmount / metrics.totalValue) * 100).toFixed(1) : 0}% of total value
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.overdueAmount)}</div>
            <div className="text-xs text-muted-foreground">
              {overdueInvoices?.length || 0} overdue invoices
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown of invoices by payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : statusChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, `${name} Invoices`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Invoice Trends</CardTitle>
            <CardDescription>Invoice count and value over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => new Date(value + "-01").toLocaleDateString(undefined, { month: 'short' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value + "-01").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      formatter={(value, name) => [
                        name === 'amount' || name === 'paid' ? formatCurrency(value as number) : value,
                        name === 'amount' ? 'Total Amount' : name === 'paid' ? 'Paid Amount' : 'Invoice Count'
                      ]}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stackId="1" 
                      stroke="#60a5fa" 
                      fill="#60a5fa" 
                      fillOpacity={0.3}
                      name="Total Amount"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="paid" 
                      stackId="2" 
                      stroke="#4ade80" 
                      fill="#4ade80" 
                      fillOpacity={0.3}
                      name="Paid Amount"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Invoices</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Invoices</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoices from your customers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices found matching your filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium">Invoice</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Due Date</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.slice(0, 10).map((invoice) => (
                        <tr key={invoice.id} className="border-b last:border-none">
                          <td className="py-3">
                            <div>
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {invoice.id}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">Customer #{invoice.contactId}</td>
                          <td className="py-3">{formatDate(invoice.invoiceDate)}</td>
                          <td className="py-3">
                            <span className={
                              new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== "Paid"
                                ? "text-red-600 font-medium"
                                : ""
                            }>
                              {formatDate(invoice.dueDate)}
                            </span>
                          </td>
                          <td className="py-3 font-medium">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="py-3">
                            <Badge variant={
                              invoice.paymentStatus === "Paid" ? "default" :
                              invoice.paymentStatus === "Partially Paid" ? "secondary" :
                              invoice.status === "Overdue" ? "destructive" :
                              "outline"
                            }>
                              {invoice.paymentStatus || invoice.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
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

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Invoices</CardTitle>
              <CardDescription>Invoices past their due date requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {overdueLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : !overdueInvoices || overdueInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No overdue invoices found
                </div>
              ) : (
                <div className="space-y-4">
                  {overdueInvoices.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You have {overdueInvoices.length} overdue invoices totaling {formatCurrency(metrics.overdueAmount)}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-3 font-medium">Invoice</th>
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium">Due Date</th>
                          <th className="pb-3 font-medium">Days Overdue</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueInvoices.map((invoice) => {
                          const daysOverdue = Math.floor(
                            (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                          );
                          return (
                            <tr key={invoice.id} className="border-b last:border-none">
                              <td className="py-3">
                                <div className="font-medium">{invoice.invoiceNumber}</div>
                              </td>
                              <td className="py-3">Customer #{invoice.contactId}</td>
                              <td className="py-3 text-red-600 font-medium">
                                {formatDate(invoice.dueDate)}
                              </td>
                              <td className="py-3">
                                <Badge variant="destructive">{daysOverdue} days</Badge>
                              </td>
                              <td className="py-3 font-medium">{formatCurrency(invoice.totalAmount)}</td>
                              <td className="py-3">
                                <div className="flex space-x-1">
                                  <Button variant="outline" size="sm">
                                    Send Reminder
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Invoices</CardTitle>
              <CardDescription>Manage your recurring invoice templates</CardDescription>
            </CardHeader>
            <CardContent>
              {recurringLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : !recurringInvoices || recurringInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recurring invoices found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium">Template</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Frequency</th>
                        <th className="pb-3 font-medium">Next Invoice</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recurringInvoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b last:border-none">
                          <td className="py-3">
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                          </td>
                          <td className="py-3">Customer #{invoice.contactId}</td>
                          <td className="py-3 capitalize">{invoice.recurringFrequency}</td>
                          <td className="py-3">
                            {invoice.nextInvoiceDate ? formatDate(invoice.nextInvoiceDate) : "Not scheduled"}
                          </td>
                          <td className="py-3 font-medium">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="py-3">
                            <Badge variant={invoice.isRecurring ? "default" : "secondary"}>
                              {invoice.isRecurring ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm">
                                Generate Next
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
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
      </Tabs>
    </div>
  );
}