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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErpNavigation from "@/components/ErpNavigation";
import {
  AlertCircle,
  ArrowUpDown,
  BadgeCheck,
  BarChart3,
  Building,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  LineChart,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  PieChart,
  Plus,
  Search,
  Send,
  Star,
  StarHalf,
  Truck,
  Users,
  FileBarChart,
  Briefcase,
  Handshake,
  TrendingUp,
  FileCheck,
  PackageCheck,
  Clock,
  BookOpen,
  Settings,
  BarChart4
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample data for the Suppliers module (would come from API in a real application)
const suppliersData = {
  // Supplier overview metrics
  metrics: {
    totalSuppliers: 156,
    activeSuppliers: 142,
    inactiveSuppliers: 14,
    averageRating: 4.2,
    totalPurchases: 2576430,
    openOrders: 18,
    averageLeadTime: 12, // days
    onTimeDelivery: 0.92, // 92%
    qualityScore: 0.89, // 89%
    pendingInvoices: 24
  },
  
  // Supplier categories
  categories: [
    { id: 1, name: "Raw Materials", supplierCount: 42, spend: 985000 },
    { id: 2, name: "Packaging", supplierCount: 28, spend: 420000 },
    { id: 3, name: "Office Supplies", supplierCount: 15, spend: 76000 },
    { id: 4, name: "IT Equipment", supplierCount: 12, spend: 345000 },
    { id: 5, name: "Professional Services", supplierCount: 35, spend: 450000 },
    { id: 6, name: "Logistics", supplierCount: 18, spend: 235000 },
    { id: 7, name: "Maintenance", supplierCount: 6, spend: 65430 }
  ],
  
  // List of suppliers
  suppliers: [
    { 
      id: 1, 
      name: "TechSource Inc.", 
      category: "IT Equipment", 
      contactPerson: "John Smith", 
      email: "john@techsource.com", 
      phone: "+1 (555) 123-4567", 
      address: "1234 Tech Way, San Francisco, CA 94107", 
      website: "techsource.com",
      paymentTerms: "Net 30", 
      taxID: "TX-98765432",
      rating: 4.8,
      status: "Active",
      onTimeDelivery: 0.98,
      qualityScore: 0.95,
      responseTime: 1.5, // days
      openOrders: 3,
      yearlySpend: 125000
    },
    { 
      id: 2, 
      name: "Global Materials Ltd.", 
      category: "Raw Materials", 
      contactPerson: "Emily Johnson", 
      email: "emily@globalmaterials.com", 
      phone: "+1 (555) 234-5678", 
      address: "5678 Industry Blvd, Chicago, IL 60607", 
      website: "globalmaterials.com",
      paymentTerms: "Net 45", 
      taxID: "TX-87654321",
      rating: 4.2,
      status: "Active",
      onTimeDelivery: 0.89,
      qualityScore: 0.92,
      responseTime: 2.0, // days
      openOrders: 4,
      yearlySpend: 230000
    },
    { 
      id: 3, 
      name: "Office Supplies Direct", 
      category: "Office Supplies", 
      contactPerson: "Michael Brown", 
      email: "michael@officesupplies.com", 
      phone: "+1 (555) 345-6789", 
      address: "910 Commerce St, Dallas, TX 75201", 
      website: "officesuppliesdirect.com",
      paymentTerms: "Net 15", 
      taxID: "TX-76543210",
      rating: 4.5,
      status: "Active",
      onTimeDelivery: 0.95,
      qualityScore: 0.91,
      responseTime: 1.0, // days
      openOrders: 2,
      yearlySpend: 48000
    },
    { 
      id: 4, 
      name: "Enterprise Logistics", 
      category: "Logistics", 
      contactPerson: "Sarah Wilson", 
      email: "sarah@enterpriselogistics.com", 
      phone: "+1 (555) 456-7890", 
      address: "4200 Transport Ave, Atlanta, GA 30308", 
      website: "enterpriselogistics.com",
      paymentTerms: "Net 30", 
      taxID: "TX-65432109",
      rating: 3.9,
      status: "Active",
      onTimeDelivery: 0.86,
      qualityScore: 0.85,
      responseTime: 2.5, // days
      openOrders: 2,
      yearlySpend: 120000
    },
    { 
      id: 5, 
      name: "Quality Packaging Solutions", 
      category: "Packaging", 
      contactPerson: "David Rodriguez", 
      email: "david@qualitypackaging.com", 
      phone: "+1 (555) 567-8901", 
      address: "789 Industrial Pkwy, Portland, OR 97201", 
      website: "qualitypackaging.com",
      paymentTerms: "Net 30", 
      taxID: "TX-54321098",
      rating: 4.7,
      status: "Active",
      onTimeDelivery: 0.94,
      qualityScore: 0.97,
      responseTime: 1.2, // days
      openOrders: 5,
      yearlySpend: 180000
    },
    { 
      id: 6, 
      name: "Professional Consulting Group", 
      category: "Professional Services", 
      contactPerson: "Amanda Lee", 
      email: "amanda@pcg.com", 
      phone: "+1 (555) 678-9012", 
      address: "1500 Business Center, New York, NY 10007", 
      website: "pcg.com",
      paymentTerms: "Net 45", 
      taxID: "TX-43210987",
      rating: 4.4,
      status: "Active",
      onTimeDelivery: 0.91,
      qualityScore: 0.88,
      responseTime: 1.8, // days
      openOrders: 0,
      yearlySpend: 200000
    },
    { 
      id: 7, 
      name: "Maintenance Pros Inc.", 
      category: "Maintenance", 
      contactPerson: "Robert Taylor", 
      email: "robert@maintenancepros.com", 
      phone: "+1 (555) 789-0123", 
      address: "345 Service Road, Denver, CO 80205", 
      website: "maintenancepros.com",
      paymentTerms: "Net 15", 
      taxID: "TX-32109876",
      rating: 4.0,
      status: "Inactive",
      onTimeDelivery: 0.80,
      qualityScore: 0.83,
      responseTime: 3.0, // days
      openOrders: 0,
      yearlySpend: 35000
    },
    { 
      id: 8, 
      name: "EcoPackage Solutions", 
      category: "Packaging", 
      contactPerson: "Jennifer White", 
      email: "jennifer@ecopackage.com", 
      phone: "+1 (555) 890-1234", 
      address: "678 Green Ave, Austin, TX 78701", 
      website: "ecopackage.com",
      paymentTerms: "Net 30", 
      taxID: "TX-21098765",
      rating: 4.9,
      status: "Active",
      onTimeDelivery: 0.97,
      qualityScore: 0.99,
      responseTime: 1.0, // days
      openOrders: 2,
      yearlySpend: 140000
    }
  ],
  
  // Recent purchase orders with suppliers
  recentOrders: [
    { id: "PO-2023-1564", supplier: "TechSource Inc.", date: "May 10, 2023", amount: 24500, status: "Delivered", items: 8 },
    { id: "PO-2023-1563", supplier: "Global Materials Ltd.", date: "May 08, 2023", amount: 35800, status: "In Transit", items: 12 },
    { id: "PO-2023-1562", supplier: "Quality Packaging Solutions", date: "May 05, 2023", amount: 12750, status: "Processing", items: 5 },
    { id: "PO-2023-1561", supplier: "Office Supplies Direct", date: "May 03, 2023", amount: 5380, status: "Delivered", items: 24 },
    { id: "PO-2023-1560", supplier: "Enterprise Logistics", date: "May 01, 2023", amount: 18900, status: "Delivered", items: 3 }
  ],
  
  // Performance insights
  performance: {
    topPerformers: [
      { supplier: "EcoPackage Solutions", category: "Packaging", score: 96, improvement: 4 },
      { supplier: "TechSource Inc.", category: "IT Equipment", score: 94, improvement: 2 },
      { supplier: "Quality Packaging Solutions", category: "Packaging", score: 92, improvement: 3 }
    ],
    underperforming: [
      { supplier: "Maintenance Pros Inc.", category: "Maintenance", score: 68, decline: 8 },
      { supplier: "Enterprise Logistics", category: "Logistics", score: 72, decline: 5 }
    ],
    riskFactors: [
      { factor: "Delivery Delays", suppliers: 4, impact: "High" },
      { factor: "Quality Issues", suppliers: 2, impact: "Medium" },
      { factor: "Financial Stability", suppliers: 3, impact: "High" }
    ]
  }
};

const SupplierManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

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
    return `${(value * 100).toFixed(0)}%`;
  };

  // Filter suppliers based on search and filters
  const filteredSuppliers = suppliersData.suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Function to render supplier rating stars
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 fill-amber-400 text-amber-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
        ))}
      </div>
    );
  };

  // Get badge style based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case "Inactive":
        return <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Inactive</Badge>;
      case "Delivered":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Delivered</Badge>;
      case "In Transit":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">In Transit</Badge>;
      case "Processing":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
            <p className="text-muted-foreground">
              Manage your supplier relationships, performance, and orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Supplier Management Tabs */}
        <Tabs
          defaultValue="dashboard"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="catalogs">Catalogs</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Supplier Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Suppliers Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Suppliers</p>
                      <h2 className="text-3xl font-bold">{suppliersData.metrics.totalSuppliers}</h2>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <Building2 className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {suppliersData.metrics.activeSuppliers} active, {suppliersData.metrics.inactiveSuppliers} inactive
                  </div>
                </CardContent>
              </Card>

              {/* Open Orders Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Open Orders</p>
                      <h2 className="text-3xl font-bold">{suppliersData.metrics.openOrders}</h2>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-full">
                      <Truck className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {suppliersData.metrics.pendingInvoices} pending invoices
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Performance Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">On-Time Delivery</p>
                      <h2 className="text-3xl font-bold">{formatPercentage(suppliersData.metrics.onTimeDelivery)}</h2>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Avg. lead time: {suppliersData.metrics.averageLeadTime} days
                  </div>
                </CardContent>
              </Card>

              {/* Total Spend Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Spend</p>
                      <h2 className="text-3xl font-bold">{formatCurrency(suppliersData.metrics.totalPurchases)}</h2>
                    </div>
                    <div className="bg-purple-500/10 p-2 rounded-full">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Across {suppliersData.categories.length} categories
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supplier Categories & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Supplier Categories */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Supplier Categories</CardTitle>
                      <CardDescription>Distribution of suppliers by category</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Category distribution visualization */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mt-1">(Category distribution chart)</p>
                      </div>
                      
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mt-1">(Spend by category chart)</p>
                      </div>
                    </div>
                    
                    {/* Category list */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Suppliers</TableHead>
                            <TableHead className="text-right">Total Spend</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {suppliersData.categories.map(category => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell className="text-center">{category.supplierCount}</TableCell>
                              <TableCell className="text-right">{formatCurrency(category.spend)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Purchase Orders</CardTitle>
                  <CardDescription>Latest supplier orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {suppliersData.recentOrders.map(order => (
                      <div key={order.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{order.id}</div>
                            <div className="text-sm text-muted-foreground">{order.supplier}</div>
                            <div className="text-xs text-muted-foreground mt-1">{order.date} • {order.items} items</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="font-medium">{formatCurrency(order.amount)}</div>
                            <div className="mt-1">{getStatusBadge(order.status)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics & Risk Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Supplier Performance</CardTitle>
                      <CardDescription>Key metrics and top performers</CardDescription>
                    </div>
                    <Button variant="link" className="h-8 px-0">View Details</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Top Performers</h3>
                      <div className="space-y-3">
                        {suppliersData.performance.topPerformers.map((supplier, idx) => (
                          <div key={idx} className="p-3 border rounded-md bg-green-50/50 dark:bg-green-950/20">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{supplier.supplier}</span>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                {supplier.score}/100
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{supplier.category}</div>
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {supplier.improvement}% improvement this quarter
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Underperforming Suppliers */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Attention Required</h3>
                      <div className="space-y-3">
                        {suppliersData.performance.underperforming.map((supplier, idx) => (
                          <div key={idx} className="p-3 border rounded-md bg-red-50/50 dark:bg-red-950/20">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{supplier.supplier}</span>
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                {supplier.score}/100
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{supplier.category}</div>
                            <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {supplier.decline}% decline this quarter
                            </div>
                          </div>
                        ))}
                        
                        <div className="p-3 border rounded-md bg-amber-50/50 dark:bg-amber-950/20">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Risk Assessment</span>
                          </div>
                          <div className="space-y-2 mt-2">
                            {suppliersData.performance.riskFactors.map((risk, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span>{risk.factor}</span>
                                <span className={`font-medium ${
                                  risk.impact === "High" ? "text-red-600 dark:text-red-400" : 
                                  risk.impact === "Medium" ? "text-amber-600 dark:text-amber-400" : 
                                  "text-green-600 dark:text-green-400"
                                }`}>
                                  {risk.suppliers} suppliers • {risk.impact} impact
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI-Powered Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Insights</CardTitle>
                  <CardDescription>Smart recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <FileBarChart className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                      <h3 className="text-lg font-medium">Cost Savings</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Consolidating office supply purchases to Office Supplies Direct could save approximately $12,500 annually.
                      </p>
                      <Button variant="link" className="px-0 mt-2">View analysis</Button>
                    </div>
                    
                    <div className="p-4 border rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <Handshake className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                      <h3 className="text-lg font-medium">Partnership Opportunity</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        EcoPackage Solutions offers complementary products to Global Materials. Consider joint sourcing strategy.
                      </p>
                      <Button variant="link" className="px-0 mt-2">Explore opportunity</Button>
                    </div>
                    
                    <div className="p-4 border rounded-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                      <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                      <h3 className="text-lg font-medium">Lead Time Optimization</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Adjusting order quantities for raw materials could reduce lead times by 15% and storage costs by 8%.
                      </p>
                      <Button variant="link" className="px-0 mt-2">Review recommendation</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            {/* Supplier Search & Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
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
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {suppliersData.categories.map(category => (
                          <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
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

            {/* Supplier Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Supplier Directory</CardTitle>
                    <CardDescription>Manage your organization's suppliers</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                        <TableHead className="hidden md:table-cell">Rating</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map(supplier => (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.name}</div>
                              <div className="text-xs text-muted-foreground">{supplier.paymentTerms}</div>
                            </div>
                          </TableCell>
                          <TableCell>{supplier.category}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <div>{supplier.contactPerson}</div>
                              <div className="text-xs text-muted-foreground">{supplier.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {renderRatingStars(supplier.rating)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(supplier.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedSupplier(supplier)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Orders
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Edit Supplier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Contact Supplier
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Globe className="h-4 w-4 mr-2" />
                                  Visit Website
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
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredSuppliers.length} of {suppliersData.suppliers.length} suppliers
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

            {/* Supplier Details Dialog */}
            {selectedSupplier && (
              <Dialog open={!!selectedSupplier} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {selectedSupplier.name}
                      {selectedSupplier.status === "Active" && (
                        <BadgeCheck className="h-5 w-5 text-blue-500 ml-1" />
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedSupplier.category} • {selectedSupplier.paymentTerms}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Contact Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">{selectedSupplier.contactPerson}</div>
                            <div className="text-xs text-muted-foreground">Primary Contact</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{selectedSupplier.email}</div>
                            <div className="text-xs text-muted-foreground">Email</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{selectedSupplier.phone}</div>
                            <div className="text-xs text-muted-foreground">Phone</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{selectedSupplier.address}</div>
                            <div className="text-xs text-muted-foreground">Address</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex items-center gap-1">
                            <div>{selectedSupplier.website}</div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Rating</span>
                            <span className="font-medium">{selectedSupplier.rating}/5</span>
                          </div>
                          <div className="flex">
                            {renderRatingStars(selectedSupplier.rating)}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>On-Time Delivery</span>
                            <span className="font-medium">{formatPercentage(selectedSupplier.onTimeDelivery)}</span>
                          </div>
                          <Progress value={selectedSupplier.onTimeDelivery * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Quality Score</span>
                            <span className="font-medium">{formatPercentage(selectedSupplier.qualityScore)}</span>
                          </div>
                          <Progress value={selectedSupplier.qualityScore * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Response Time</span>
                            <span className="font-medium">{selectedSupplier.responseTime} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Business Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Business Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{selectedSupplier.taxID}</div>
                            <div className="text-xs text-muted-foreground">Tax ID</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{selectedSupplier.paymentTerms}</div>
                            <div className="text-xs text-muted-foreground">Payment Terms</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{selectedSupplier.openOrders} open orders</div>
                            <div className="text-xs text-muted-foreground">Current Orders</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <LineChart className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{formatCurrency(selectedSupplier.yearlySpend)}</div>
                            <div className="text-xs text-muted-foreground">Yearly Spend</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex justify-between items-center">
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Orders
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Send className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>
                  Manage orders, deliveries, and communication with suppliers
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <PackageCheck className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Purchase Orders Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  create, track, and manage purchase orders with automated workflows.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Multi-level approval workflows with automatic notifications</li>
                    <li>Order tracking with real-time status updates</li>
                    <li>Electronic receiving and quality inspection</li>
                    <li>Three-way matching for invoices, orders, and receipts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
                <CardDescription>
                  Analyze and optimize supplier performance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <BarChart4 className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Performance Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  track, score, and compare supplier performance across multiple dimensions.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Customizable KPI scorecards for each supplier</li>
                    <li>Performance benchmarking across supplier categories</li>
                    <li>Automated supplier assessments and feedback</li>
                    <li>Risk monitoring and mitigation recommendations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Contracts</CardTitle>
                <CardDescription>
                  Manage agreements, terms, and renewals
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Briefcase className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Contract Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  create, track, and manage supplier contracts with automated workflows.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Contract template library with clause management</li>
                    <li>Milestone tracking and renewal notifications</li>
                    <li>Electronic signature integration</li>
                    <li>Compliance monitoring and reporting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Catalogs Tab */}
          <TabsContent value="catalogs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Catalogs</CardTitle>
                <CardDescription>
                  Browse and manage product catalogs from suppliers
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <BookOpen className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Catalog Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to 
                  browse, search, and order from supplier product catalogs.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <p className="font-medium">Key Features Coming Soon:</p>
                  <ul className="list-disc mt-2 space-y-1 text-muted-foreground">
                    <li>Unified catalog with products from all suppliers</li>
                    <li>Punch-out integration with supplier websites</li>
                    <li>Custom catalogs with negotiated pricing</li>
                    <li>Favorites and frequently ordered items</li>
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

export default SupplierManagement;