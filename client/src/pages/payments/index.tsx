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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BellRing,
  CalendarClock,
  Check,
  ChevronsUpDown,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileBarChart,
  FileText,
  Filter,
  HelpCircle,
  History,
  Info,
  LineChart,
  MoreHorizontal,
  Phone,
  PieChart,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Settings,
  Share,
  Smartphone,
  Wallet,
  Banknote,
  CircleDollarSign,
  Share2,
  Compass,
  Landmark,
  Building,
  PhoneCall,
  ShieldCheck,
  QrCode,
  CircleAlert,
  CheckCircle2,
  Copy
} from "lucide-react";

// Sample data for the Payments module (in a real app, this would come from API)
const paymentsData = {
  // Payment gateway metrics
  metrics: {
    totalTransactions: 1286,
    totalVolume: 562485.50,
    successRate: 0.985, // 98.5%
    avgTransactionValue: 437.39,
    pendingTransactions: 18,
    failedTransactions: 5,
    refundRate: 0.015, // 1.5%
    chargeback: 0.0025, // 0.25%
    mpesaTransactions: 842,
    stripeTransactions: 304,
    otherTransactions: 140
  },
  
  // Recent transactions
  recentTransactions: [
    { id: "TRX-9856", date: "2023-05-10", time: "14:32:21", customer: "John Smith", gateway: "MPESA", amount: 2500, status: "Completed", type: "Payment", reference: "INV-4501" },
    { id: "TRX-9855", date: "2023-05-10", time: "11:45:18", customer: "Emma Johnson", gateway: "Stripe", amount: 7850, status: "Completed", type: "Payment", reference: "INV-4500" },
    { id: "TRX-9854", date: "2023-05-09", time: "16:22:05", customer: "Michael Chen", gateway: "MPESA", amount: 1200, status: "Completed", type: "Payment", reference: "INV-4499" },
    { id: "TRX-9853", date: "2023-05-09", time: "14:08:56", customer: "Sophia Garcia", gateway: "MPESA", amount: 950, status: "Failed", type: "Payment", reference: "INV-4498" },
    { id: "TRX-9852", date: "2023-05-09", time: "10:33:42", customer: "David Wilson", gateway: "Stripe", amount: 12500, status: "Pending", type: "Payment", reference: "INV-4497" },
    { id: "TRX-9851", date: "2023-05-08", time: "17:12:30", customer: "Emma Johnson", gateway: "Stripe", amount: 1800, status: "Refunded", type: "Refund", reference: "INV-4495" },
    { id: "TRX-9850", date: "2023-05-08", time: "09:45:12", customer: "Isabella Martinez", gateway: "MPESA", amount: 3200, status: "Completed", type: "Payment", reference: "INV-4496" }
  ],
  
  // MPESA specific data
  mpesa: {
    transactionTypes: {
      customerPayment: 652,
      b2c: 105,
      b2b: 85
    },
    dailyVolume: [
      { date: "2023-05-03", amount: 42500 },
      { date: "2023-05-04", amount: 38750 },
      { date: "2023-05-05", amount: 45200 },
      { date: "2023-05-06", amount: 51800 },
      { date: "2023-05-07", amount: 48300 },
      { date: "2023-05-08", amount: 43600 },
      { date: "2023-05-09", amount: 47200 },
      { date: "2023-05-10", amount: 52800 }
    ],
    recentCallbacks: [
      { id: "CB-1245", transaction: "TRX-9856", type: "Confirmation", status: "Success", timestamp: "2023-05-10T14:32:45Z" },
      { id: "CB-1244", transaction: "TRX-9854", type: "Confirmation", status: "Success", timestamp: "2023-05-09T16:22:28Z" },
      { id: "CB-1243", transaction: "TRX-9853", type: "Confirmation", status: "Failed", timestamp: "2023-05-09T14:09:12Z", error: "Insufficient funds" },
      { id: "CB-1242", transaction: "TRX-9850", type: "Confirmation", status: "Success", timestamp: "2023-05-08T09:45:38Z" }
    ]
  },
  
  // Payment methods analytics
  paymentMethods: [
    { method: "MPESA", percentage: 65.5, lastMonth: 63.2, growth: 2.3 },
    { method: "Stripe (Card)", percentage: 23.6, lastMonth: 25.8, growth: -2.2 },
    { method: "Other Mobile Money", percentage: 6.4, lastMonth: 5.5, growth: 0.9 },
    { method: "Bank Transfer", percentage: 4.5, lastMonth: 5.5, growth: -1.0 }
  ],
  
  // Gateway performance
  gatewayPerformance: [
    { gateway: "MPESA", successRate: 0.988, avgProcessingTime: 25, dailyVolume: 45600 },
    { gateway: "Stripe", successRate: 0.976, avgProcessingTime: 2.3, dailyVolume: 22500 },
    { gateway: "Razorpay", successRate: 0.982, avgProcessingTime: 3.4, dailyVolume: 8700 }
  ]
};

// Gateway icons
const getGatewayIcon = (gateway: string) => {
  switch (gateway) {
    case "MPESA":
      return <Smartphone className="h-4 w-4 text-green-600" />;
    case "Stripe":
      return <CreditCard className="h-4 w-4 text-indigo-600" />;
    default:
      return <Wallet className="h-4 w-4 text-blue-600" />;
  }
};

// Status badges
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
    case "Pending":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
    case "Failed":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Failed</Badge>;
    case "Refunded":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const PaymentsManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Filter transactions based on search and filters
  const filteredTransactions = paymentsData.recentTransactions.filter(txn => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || txn.status === statusFilter;
    const matchesGateway = gatewayFilter === "all" || txn.gateway === gatewayFilter;
    
    // Simple date filter - just for demo purposes
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "today" && txn.date === "2023-05-10") ||
      (dateFilter === "yesterday" && txn.date === "2023-05-09") ||
      (dateFilter === "week" && ["2023-05-04", "2023-05-05", "2023-05-06", "2023-05-07", "2023-05-08", "2023-05-09", "2023-05-10"].includes(txn.date));
    
    return matchesSearch && matchesStatus && matchesGateway && matchesDate;
  });

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments Management</h1>
            <p className="text-muted-foreground">
              Manage payment gateways, transactions, and integrations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Payments Management Tabs */}
        <Tabs
          defaultValue="dashboard"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="mpesa">MPESA Integration</TabsTrigger>
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Payment Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Transactions Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Transactions</p>
                      <h2 className="text-3xl font-bold">{paymentsData.metrics.totalTransactions}</h2>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-600">{formatPercentage(paymentsData.metrics.successRate)}</span>
                    <span className="text-muted-foreground"> success rate</span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Volume Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Volume</p>
                      <h2 className="text-3xl font-bold">{formatCurrency(paymentsData.metrics.totalVolume)}</h2>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <Banknote className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Avg. {formatCurrency(paymentsData.metrics.avgTransactionValue)} per transaction
                  </div>
                </CardContent>
              </Card>

              {/* MPESA Transactions Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">MPESA Transactions</p>
                      <h2 className="text-3xl font-bold">{paymentsData.metrics.mpesaTransactions}</h2>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded-full">
                      <Smartphone className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {formatPercentage(paymentsData.metrics.mpesaTransactions / paymentsData.metrics.totalTransactions)} of total transactions
                  </div>
                </CardContent>
              </Card>

              {/* Pending Transactions Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Pending/Failed</p>
                      <h2 className="text-3xl font-bold">{paymentsData.metrics.pendingTransactions + paymentsData.metrics.failedTransactions}</h2>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {paymentsData.metrics.pendingTransactions} pending, {paymentsData.metrics.failedTransactions} failed
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Methods */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Method distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center mb-4">
                    <PieChart className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mt-1">(Payment method distribution chart)</p>
                  </div>
                  <div className="space-y-4">
                    {paymentsData.paymentMethods.map((method, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1 text-sm">
                          <div className="flex items-center gap-2">
                            {method.method === "MPESA" && <Smartphone className="h-4 w-4 text-green-500" />}
                            {method.method === "Stripe (Card)" && <CreditCard className="h-4 w-4 text-indigo-500" />}
                            {method.method === "Other Mobile Money" && <Phone className="h-4 w-4 text-blue-500" />}
                            {method.method === "Bank Transfer" && <Landmark className="h-4 w-4 text-amber-500" />}
                            <span>{method.method}</span>
                          </div>
                          <span className="font-medium">{method.percentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={method.percentage} className="h-2 flex-grow" />
                          <span className="text-xs flex items-center whitespace-nowrap">
                            {method.growth > 0 ? (
                              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            {Math.abs(method.growth)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gateway Performance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Gateway Performance</CardTitle>
                      <CardDescription>Success rates and processing times</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Gateway metrics */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Gateway</TableHead>
                            <TableHead className="text-center">Success Rate</TableHead>
                            <TableHead className="text-center">Avg. Processing</TableHead>
                            <TableHead className="text-right">Daily Volume</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentsData.gatewayPerformance.map((gateway, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getGatewayIcon(gateway.gateway)}
                                  <span className="font-medium">{gateway.gateway}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${
                                  gateway.successRate > 0.98 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                    : gateway.successRate > 0.95
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                  {formatPercentage(gateway.successRate)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {gateway.avgProcessingTime} {gateway.avgProcessingTime < 3 ? "sec" : "sec"}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(gateway.dailyVolume)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Daily performance chart */}
                    <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                      <LineChart className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mt-1">(Daily transaction volume chart)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest payment activities</CardDescription>
                  </div>
                  <Button variant="link" className="h-8 px-0">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsData.recentTransactions.slice(0, 5).map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>
                            <div className="font-medium">{txn.id}</div>
                            <div className="text-xs text-muted-foreground">{txn.reference}</div>
                          </TableCell>
                          <TableCell>
                            <div>{txn.date}</div>
                            <div className="text-xs text-muted-foreground">{txn.time}</div>
                          </TableCell>
                          <TableCell>{txn.customer}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getGatewayIcon(txn.gateway)}
                              <span>{txn.gateway}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(txn.status)}
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
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <History className="h-4 w-4 mr-2" />
                                  Transaction History
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <RefreshCcw className="h-4 w-4 mr-2" />
                                  Retry Transaction
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={txn.status !== "Completed"}>
                                  <Share className="h-4 w-4 mr-2" />
                                  Issue Refund
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

            {/* AI-Powered Insights */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>AI-Powered Payment Insights</CardTitle>
                    <CardDescription>Advanced analytics and recommendations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <FileBarChart className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <h3 className="text-lg font-medium">Transaction Patterns</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Transaction volume has increased by 18% during evening hours (6-9 PM). Consider optimizing payment processing capacity during these peak times.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View analysis</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                    <h3 className="text-lg font-medium">Fraud Prevention</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our AI has flagged 3 potentially suspicious transactions in the last 24 hours. Review the flagged transactions to prevent fraud.
                    </p>
                    <Button variant="link" className="px-0 mt-2">Review flagged transactions</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <Compass className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <h3 className="text-lg font-medium">Optimization Opportunity</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customers using MPESA have a 12% higher completion rate than other payment methods. Consider making MPESA more prominent in your checkout flow.
                    </p>
                    <Button variant="link" className="px-0 mt-2">Explore recommendations</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Transaction Search & Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions by ID, customer, or reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={gatewayFilter}
                      onValueChange={setGatewayFilter}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Gateway" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Gateways</SelectItem>
                        <SelectItem value="MPESA">MPESA</SelectItem>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                        <SelectItem value="Razorpay">Razorpay</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={dateFilter}
                      onValueChange={setDateFilter}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
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

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Transaction Records</CardTitle>
                    <CardDescription>Comprehensive transaction history</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Transaction
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell>
                              <div className="font-medium">{txn.id}</div>
                              <div className="text-xs text-muted-foreground">{txn.reference}</div>
                            </TableCell>
                            <TableCell>
                              <div>{txn.date}</div>
                              <div className="text-xs text-muted-foreground">{txn.time}</div>
                            </TableCell>
                            <TableCell>{txn.customer}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getGatewayIcon(txn.gateway)}
                                <span>{txn.gateway}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(txn.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(txn.status)}
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
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <History className="h-4 w-4 mr-2" />
                                    Transaction History
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Retry Transaction
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled={txn.status !== "Completed"}>
                                    <Share className="h-4 w-4 mr-2" />
                                    Issue Refund
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No transactions found matching your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {paymentsData.recentTransactions.length} transactions
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

          {/* MPESA Integration Tab */}
          <TabsContent value="mpesa" className="space-y-6">
            {/* MPESA Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">MPESA Volume</p>
                      <h2 className="text-3xl font-bold">{formatCurrency(317850)}</h2>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <Smartphone className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-600">+8.2%</span>
                    <span className="text-muted-foreground"> vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Transaction Types</p>
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-blue-100 text-blue-800">C2B: {paymentsData.mpesa.transactionTypes.customerPayment}</Badge>
                        <Badge className="bg-purple-100 text-purple-800">B2C: {paymentsData.mpesa.transactionTypes.b2c}</Badge>
                        <Badge className="bg-violet-100 text-violet-800">B2B: {paymentsData.mpesa.transactionTypes.b2b}</Badge>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <Share2 className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last 30 days distribution
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Integration Status</p>
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded-full">
                      <CircleAlert className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    All systems operational
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MPESA Analytics & Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Transactions Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Daily Transaction Volume</CardTitle>
                      <CardDescription>Last 7 days activity</CardDescription>
                    </div>
                    <Select defaultValue="7days">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mt-1">(Daily MPESA transaction volume chart)</p>
                  </div>
                </CardContent>
              </Card>

              {/* MPESA API Status */}
              <Card>
                <CardHeader>
                  <CardTitle>API Status</CardTitle>
                  <CardDescription>Callback and endpoint status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/10">
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          C2B API
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Last checked 3 minutes ago</div>
                    </div>
                    
                    <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/10">
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          B2C API
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Last checked 3 minutes ago</div>
                    </div>
                    
                    <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/10">
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          STK Push API
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Last checked 3 minutes ago</div>
                    </div>
                    
                    <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/10">
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Transaction Query API
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Last checked 3 minutes ago</div>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          QR Code API
                        </div>
                        <Badge variant="outline">Not Configured</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Configure in settings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Callbacks & Testing Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Callbacks */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Callbacks</CardTitle>
                  <CardDescription>Latest API callback events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Callback ID</TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsData.mpesa.recentCallbacks.map((callback) => (
                          <TableRow key={callback.id}>
                            <TableCell className="font-medium">{callback.id}</TableCell>
                            <TableCell>{callback.transaction}</TableCell>
                            <TableCell>{callback.type}</TableCell>
                            <TableCell>
                              {new Date(callback.timestamp).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {callback.status === "Success" ? (
                                <Badge className="bg-green-100 text-green-800">Success</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  Failed
                                  <span title={callback.error}>
                                    <HelpCircle className="h-3 w-3 ml-1 cursor-help" />
                                  </span>
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Test Interface */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Interface</CardTitle>
                  <CardDescription>Test MPESA integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">STK Push Test</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Phone Number</label>
                          <Input placeholder="254712345678" />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Amount</label>
                          <Input placeholder="10" type="number" />
                        </div>
                        <Button className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send Test Request
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Transaction Status Query</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Transaction ID</label>
                          <Input placeholder="MPA45GT567" />
                        </div>
                        <Button className="w-full">
                          <Search className="h-4 w-4 mr-2" />
                          Query Status
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Setup Card */}
            <Card>
              <CardHeader>
                <CardTitle>MPESA Integration Configuration</CardTitle>
                <CardDescription>API credentials and webhook setup</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md space-y-2">
                      <h3 className="font-medium">API Credentials</h3>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Consumer Key</span>
                          <Button variant="ghost" size="sm" className="h-6">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </div>
                        <div className="text-sm font-mono bg-muted p-2 rounded">••••••••••••••••</div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Consumer Secret</span>
                          <Button variant="ghost" size="sm" className="h-6">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </div>
                        <div className="text-sm font-mono bg-muted p-2 rounded">••••••••••••••••</div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Passkey</span>
                          <Button variant="ghost" size="sm" className="h-6">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </div>
                        <div className="text-sm font-mono bg-muted p-2 rounded">••••••••••••••••</div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Short Code</span>
                        </div>
                        <div className="text-sm font-mono">174379</div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Settings className="h-4 w-4 mr-2" />
                        Update Credentials
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-md space-y-2">
                      <h3 className="font-medium">Callback URLs</h3>
                      <div>
                        <span className="text-sm text-muted-foreground">C2B Validation URL</span>
                        <div className="flex items-center gap-2">
                          <Input value="https://api.example.com/mpesa/validation" readOnly className="font-mono text-xs" />
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">C2B Confirmation URL</span>
                        <div className="flex items-center gap-2">
                          <Input value="https://api.example.com/mpesa/confirmation" readOnly className="font-mono text-xs" />
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">B2C Result URL</span>
                        <div className="flex items-center gap-2">
                          <Input value="https://api.example.com/mpesa/b2c/result" readOnly className="font-mono text-xs" />
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Register URLs
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stripe Tab */}
          <TabsContent value="stripe" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Integration</CardTitle>
                <CardDescription>
                  Configure and manage Stripe payment gateway
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <CreditCard className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Stripe Integration Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  configure and manage Stripe payments with advanced features.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Seamless checkout integration with Elements</li>
                    <li>Subscription and recurring payment management</li>
                    <li>Pre-authorized payments and tokenization</li>
                    <li>Comprehensive refund and dispute handling</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Razorpay Tab */}
          <TabsContent value="razorpay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Integration</CardTitle>
                <CardDescription>
                  Configure and manage Razorpay payment gateway
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Wallet className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Razorpay Integration Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  configure and manage Razorpay payments with advanced features.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Standard checkout and payment pages</li>
                    <li>UPI, wallet, and card payment options</li>
                    <li>Payment links and invoicing</li>
                    <li>Route optimization with Smart Routing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Settings</CardTitle>
                <CardDescription>
                  Configure payment processing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Settings className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Configuration Settings Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  configure advanced settings for all payment gateways.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Unified dashboard for all payment gateways</li>
                    <li>Smart routing rules between payment providers</li>
                    <li>Custom webhook configuration and error handling</li>
                    <li>Payment security compliance settings</li>
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

export default PaymentsManagement;