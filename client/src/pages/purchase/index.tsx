import { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ErpNavigation from "@/components/ErpNavigation";
import SuppliersTable from "@/components/purchase/SuppliersTable";
import {
  ArrowDownUp,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  Cog,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  Filter,
  LineChart,
  ListFilter,
  Loader2,
  PackageCheck,
  PackageOpen,
  Pencil,
  PieChart,
  PlusSquare,
  Repeat,
  SearchIcon,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Supplier, PurchaseRequest, PurchaseOrder } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const PurchaseManagement = () => {
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  
  // API Queries
  // Fetch suppliers
  const { 
    data: suppliers = [], 
    isLoading: suppliersLoading,
    isError: suppliersError,
    refetch: refetchSuppliers
  } = useQuery<Supplier[]>({ 
    queryKey: ['/api/suppliers'],
    retry: 1
  });
  
  // Fetch purchase orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError
  } = useQuery<PurchaseOrder[]>({
    queryKey: ['/api/purchase-orders'],
    retry: 1
  });
  
  // Fetch purchase requests
  const {
    data: requests = [],
    isLoading: requestsLoading,
    isError: requestsError
  } = useQuery<PurchaseRequest[]>({
    queryKey: ['/api/purchase-requests'],
    retry: 1
  });
  
  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return apiRequest('DELETE', `/api/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      toast({
        title: "Supplier deleted",
        description: "The supplier has been successfully removed",
        variant: "default",
      });
      // Refresh the suppliers list
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete supplier: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mock purchase data
  const purchaseMetrics = {
    totalPurchases: 253980,
    pendingOrders: 8,
    awaitingApproval: 5,
    averageOrderValue: 12650,
    pendingDeliveries: 3,
    onTimeDelivery: 94.5,
    supplierCount: 24,
    totalRequisitions: 42
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Mock purchase order data
  const purchaseOrders = [
    {
      id: "PO-2023-0021",
      supplier: "XYZ Electronics Ltd",
      dateCreated: "2023-05-02",
      deliveryDate: "2023-05-15",
      amount: 18650,
      status: "pending",
      items: 7,
      requisitionId: "PR-2023-0018"
    },
    {
      id: "PO-2023-0020",
      supplier: "Office Supplies Co",
      dateCreated: "2023-05-01",
      deliveryDate: "2023-05-10",
      amount: 2350,
      status: "approved",
      items: 12,
      requisitionId: "PR-2023-0016"
    },
    {
      id: "PO-2023-0019",
      supplier: "Global Technologies Inc",
      dateCreated: "2023-04-28",
      deliveryDate: "2023-05-12",
      amount: 45800,
      status: "shipped",
      items: 5,
      requisitionId: "PR-2023-0015"
    },
    {
      id: "PO-2023-0018",
      supplier: "Industrial Supplies Ltd",
      dateCreated: "2023-04-25",
      deliveryDate: "2023-05-05",
      amount: 12750,
      status: "received",
      items: 8,
      requisitionId: "PR-2023-0013"
    },
    {
      id: "PO-2023-0017",
      supplier: "Paper Products Inc",
      dateCreated: "2023-04-22",
      deliveryDate: "2023-04-30",
      amount: 3850,
      status: "completed",
      items: 4,
      requisitionId: "PR-2023-0011"
    }
  ];

  // Mock purchase requisitions
  const purchaseRequisitions = [
    {
      id: "PR-2023-0018",
      requestedBy: "Operations Department",
      dateCreated: "2023-05-01",
      neededBy: "2023-05-14",
      status: "pending",
      priority: "high",
      items: 7,
      totalEstimate: 19500
    },
    {
      id: "PR-2023-0017",
      requestedBy: "Marketing Team",
      dateCreated: "2023-04-30",
      neededBy: "2023-05-21",
      status: "approved",
      priority: "medium",
      items: 3,
      totalEstimate: 8200
    },
    {
      id: "PR-2023-0016",
      requestedBy: "IT Department",
      dateCreated: "2023-04-29",
      neededBy: "2023-05-10",
      status: "approved",
      priority: "high",
      items: 12,
      totalEstimate: 2400
    },
    {
      id: "PR-2023-0015",
      requestedBy: "Sales Department",
      dateCreated: "2023-04-27",
      neededBy: "2023-05-15",
      status: "completed",
      priority: "medium",
      items: 5,
      totalEstimate: 46000
    },
    {
      id: "PR-2023-0014",
      requestedBy: "HR Department",
      dateCreated: "2023-04-25",
      neededBy: "2023-05-15",
      status: "rejected",
      priority: "low",
      items: 2,
      totalEstimate: 1200
    }
  ];

  // Mock top suppliers
  const topSuppliers = [
    {
      id: 1,
      name: "XYZ Electronics Ltd",
      totalOrders: 23,
      totalSpent: 138950,
      onTimeDelivery: 96,
      categories: ["Electronics", "IT Equipment"],
      activeContracts: 2
    },
    {
      id: 2,
      name: "Office Supplies Co",
      totalOrders: 45,
      totalSpent: 56780,
      onTimeDelivery: 98,
      categories: ["Office Supplies", "Stationery"],
      activeContracts: 1
    },
    {
      id: 3,
      name: "Global Technologies Inc",
      totalOrders: 12,
      totalSpent: 237500,
      onTimeDelivery: 92,
      categories: ["IT Equipment", "Software"],
      activeContracts: 3
    },
    {
      id: 4,
      name: "Industrial Supplies Ltd",
      totalOrders: 18,
      totalSpent: 112320,
      onTimeDelivery: 91,
      categories: ["Raw Materials", "Packaging"],
      activeContracts: 2
    }
  ];

  // Get status badge
  const getStatusBadge = (status: string) => {
    // Handle undefined or null values
    if (!status) return <Badge className="bg-amber-500">Pending</Badge>;
    
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-blue-500">Approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>;
      case "shipped":
      case "in transit":
        return <Badge className="bg-purple-500">Shipped</Badge>;
      case "received":
      case "delivered":
        return <Badge className="bg-green-500">Received</Badge>;
      case "completed":
      case "done":
      case "fulfilled":
        return <Badge className="bg-green-700">Completed</Badge>;
      case "rejected":
      case "cancelled":
      case "denied":
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    // Safely handle null or undefined values
    if (!priority) return <Badge className="bg-amber-500">Medium</Badge>;
    
    switch (priority.toLowerCase()) {
      case "high":
      case "urgent":
      case "critical":
        return <Badge className="bg-red-500">High</Badge>;
      case "medium":
      case "normal":
        return <Badge className="bg-amber-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // Get supplier name for each order
  const ordersWithSupplierNames = orders.map(order => {
    const supplier = suppliers.find(s => s.id === order.supplierId);
    return {
      ...order,
      supplierName: supplier?.name || 'Unknown Supplier'
    };
  });

  // Filter orders based on search term and status filter
  const filteredOrders = ordersWithSupplierNames.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Enhance purchase requests with requester details
  const requestsWithRequesterNames = requests.map(req => {
    // Add requester name - in a real implementation, this would come from users data
    return {
      ...req,
      requesterName: 'Department ' + (req.departmentId || 'General')
    };
  });

  // Filter requisitions based on search term and status filter
  const filteredRequisitions = requestsWithRequesterNames.filter(req => {
    const matchesSearch = 
      req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => {
    return supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Handle deleting a supplier
  const deleteSupplier = (supplierId: number) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplierMutation.mutate(supplierId);
    }
  };
  
  // Handle creating a new supplier
  const createSupplier = () => {
    setLocation("/purchase/suppliers/new");
  };
  
  // Handle editing a supplier
  const editSupplier = (supplierId: number) => {
    setLocation(`/purchase/suppliers/${supplierId}`);
  };

  // Handle viewing purchase order details
  const viewPurchaseOrder = (orderId: string) => {
    setLocation(`/purchase/orders/${orderId}`);
  };

  // Handle viewing purchase requisition details
  const viewRequisition = (reqId: string) => {
    setLocation(`/purchase/requisitions/${reqId}`);
  };

  // Handle creating a new purchase order
  const createPurchaseOrder = () => {
    setLocation("/purchase/orders/new");
  };

  // Handle creating a new purchase requisition
  const createRequisition = () => {
    setLocation("/purchase/requisitions/new");
  };

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Management</h1>
            <p className="text-muted-foreground">
              Manage purchase requisitions, orders, and supplier relationships
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button variant="outline" size="sm">
              <Cog className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm" onClick={createPurchaseOrder}>
              <PlusSquare className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Purchases</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(purchaseMetrics.totalPurchases)}</h2>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {purchaseMetrics.pendingOrders} pending orders
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approvals</p>
                  <h2 className="text-3xl font-bold">{purchaseMetrics.awaitingApproval}</h2>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-amber-500">
                {purchaseMetrics.awaitingApproval > 0 ? "Requires attention" : "All items approved"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Order Value</p>
                  <h2 className="text-3xl font-bold">{formatCurrency(purchaseMetrics.averageOrderValue)}</h2>
                </div>
                <div className="bg-green-500/10 p-2 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600">
                Based on last 30 days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">On-Time Delivery</p>
                  <h2 className="text-3xl font-bold">{purchaseMetrics.onTimeDelivery}%</h2>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {purchaseMetrics.pendingDeliveries} pending deliveries
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Management Tabs */}
        <Tabs
          defaultValue="overview"
          className="w-full"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="requisitions">Purchase Requisitions</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Purchase Activity</CardTitle>
                      <CardDescription>Monthly purchase volume and trends</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Last 12 Months
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="font-medium">Purchase Trend Analysis</p>
                    <p className="text-sm text-muted-foreground mt-1">(Chart showing monthly purchase data)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Overview</CardTitle>
                  <CardDescription>Key procurement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Suppliers</span>
                      <Badge className="bg-blue-500/10 text-blue-500">{purchaseMetrics.supplierCount}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Requisitions</span>
                      <Badge className="bg-amber-500/10 text-amber-500">{purchaseRequisitions.filter(r => r.status === "pending").length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Requisitions Created</span>
                      <Badge className="bg-primary/10 text-primary">{purchaseMetrics.totalRequisitions}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Approval Time</span>
                      <Badge className="bg-green-500/10 text-green-500">1.3 days</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Deliveries</span>
                      <Badge className="bg-purple-500/10 text-purple-500">{purchaseMetrics.pendingDeliveries}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-sm font-medium">Budget Utilization</span>
                      <Badge className="bg-green-500 text-white">78%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Purchase Orders</CardTitle>
                  <CardDescription>Latest created purchase orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrders.slice(0, 3).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.supplier}</TableCell>
                            <TableCell>{formatCurrency(order.amount)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => viewPurchaseOrder(order.id)}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentTab("orders")}>
                      View All Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Suppliers</CardTitle>
                  <CardDescription>Suppliers with highest purchase volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topSuppliers.slice(0, 4).map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {supplier.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{supplier.totalOrders} orders · {supplier.onTimeDelivery}% on time</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium">{formatCurrency(supplier.totalSpent)}</div>
                      </div>
                    ))}
                    <div className="flex justify-center mt-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentTab("suppliers")}>
                        View All Suppliers
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
                  <div>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>
                      View and manage all purchase orders
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        className="pl-8 w-full sm:w-[240px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={createPurchaseOrder}>
                      <PlusSquare className="h-4 w-4 mr-2" />
                      New Order
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No purchase orders found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Get started by creating your first purchase order"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button className="mt-4" onClick={createPurchaseOrder}>
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Create Purchase Order
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Delivery Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              <Button 
                                variant="link" 
                                className="p-0 h-auto font-medium" 
                                onClick={() => viewPurchaseOrder(order.id.toString())}
                              >
                                {order.orderNumber || `PO-${order.id}`}
                              </Button>
                            </TableCell>
                            <TableCell>{order.supplierName}</TableCell>
                            <TableCell>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                            <TableCell>{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not set'}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount || 0)}</TableCell>
                            <TableCell>{getStatusBadge(order.status || 'pending')}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => viewPurchaseOrder(order.id.toString())}>
                                  View
                                </Button>
                                {order.status === "pending" && (
                                  <Button variant="outline" size="sm">
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {(order.status === "approved" || order.status === "shipped") && (
                                  <Button variant="outline" size="sm">
                                    <PackageCheck className="h-4 w-4 mr-1" />
                                    Receive
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col sm:flex-row sm:justify-between items-center border-t p-4">
                <div className="text-sm text-muted-foreground mb-3 sm:mb-0">
                  Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Purchase Requisitions Tab */}
          <TabsContent value="requisitions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
                  <div>
                    <CardTitle>Purchase Requisitions</CardTitle>
                    <CardDescription>
                      View and manage all purchase requisitions
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search requisitions..."
                        className="pl-8 w-full sm:w-[240px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={createRequisition}>
                      <PlusSquare className="h-4 w-4 mr-2" />
                      New Requisition
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredRequisitions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No purchase requisitions found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Get started by creating your first purchase requisition"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button className="mt-4" onClick={createRequisition}>
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Create Requisition
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PR Number</TableHead>
                          <TableHead>Requested By</TableHead>
                          <TableHead>Date Created</TableHead>
                          <TableHead>Needed By</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequisitions.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">
                              <Button 
                                variant="link" 
                                className="p-0 h-auto font-medium" 
                                onClick={() => viewRequisition(req.id.toString())}
                              >
                                {req.requestNumber || `PR-${req.id}`}
                              </Button>
                            </TableCell>
                            <TableCell>{req.requesterName || 'Unknown'}</TableCell>
                            <TableCell>{new Date(req.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                            <TableCell>{req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : 'Not set'}</TableCell>
                            <TableCell>{getPriorityBadge(req.priority || 'medium')}</TableCell>
                            <TableCell>{getStatusBadge(req.status || 'pending')}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => viewRequisition(req.id.toString())}>
                                  View
                                </Button>
                                {req.status === "pending" && (
                                  <Button variant="outline" size="sm">
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {req.status === "approved" && (
                                  <Button variant="outline" size="sm">
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    Create PO
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col sm:flex-row sm:justify-between items-center border-t p-4">
                <div className="text-sm text-muted-foreground mb-3 sm:mb-0">
                  Showing {filteredRequisitions.length} requisition{filteredRequisitions.length !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
                  <div>
                    <CardTitle>Suppliers</CardTitle>
                    <CardDescription>
                      Manage supplier relationships and performance
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search suppliers..."
                        className="pl-8 w-full sm:w-[240px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button onClick={createSupplier}>
                      <PlusSquare className="h-4 w-4 mr-2" />
                      New Supplier
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SuppliersTable 
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Reports</CardTitle>
                  <CardDescription>
                    Analyze purchase trends and spending
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
                  <BarChart3 className="h-16 w-16 text-primary/40" />
                  <h3 className="text-xl font-semibold">Purchase Analysis</h3>
                  <p className="text-center text-muted-foreground max-w-md">
                    View detailed reports on purchase trends, supplier performance, and spending analysis.
                  </p>
                  <Button>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supplier Reports</CardTitle>
                  <CardDescription>
                    Analyze supplier performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
                  <Building2 className="h-16 w-16 text-primary/40" />
                  <h3 className="text-xl font-semibold">Supplier Performance</h3>
                  <p className="text-center text-muted-foreground max-w-md">
                    Track supplier performance, delivery times, quality metrics, and overall reliability.
                  </p>
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    View Suppliers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Reports</CardTitle>
                  <CardDescription>
                    Track budget utilization and forecasts
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
                  <DollarSign className="h-16 w-16 text-primary/40" />
                  <h3 className="text-xl font-semibold">Budget Monitoring</h3>
                  <p className="text-center text-muted-foreground max-w-md">
                    Analyze budget allocation, utilization, and variance across departments and categories.
                  </p>
                  <Button>
                    <PieChart className="h-4 w-4 mr-2" />
                    Budget Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>
                    Set up recurring reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
                  <CalendarDays className="h-16 w-16 text-primary/40" />
                  <h3 className="text-xl font-semibold">Automated Reporting</h3>
                  <p className="text-center text-muted-foreground max-w-md">
                    Schedule regular reports to be sent to stakeholders automatically.
                  </p>
                  <Button>
                    <Repeat className="h-4 w-4 mr-2" />
                    Manage Schedules
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>
                    Build customized reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
                  <LineChart className="h-16 w-16 text-primary/40" />
                  <h3 className="text-xl font-semibold">Report Builder</h3>
                  <p className="text-center text-muted-foreground max-w-md">
                    Create custom reports with specific metrics, filters, and visualizations.
                  </p>
                  <Button>
                    <Pencil className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>
                    Download reports in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
                  <ArrowDownUp className="h-16 w-16 text-primary/40" />
                  <h3 className="text-xl font-semibold">Data Export</h3>
                  <p className="text-center text-muted-foreground max-w-md">
                    Export reports in PDF, Excel, CSV or other formats for analysis and sharing.
                  </p>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Options
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Settings</CardTitle>
                <CardDescription>
                  Configure purchase management preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default-currency">Default Currency</Label>
                      <Select defaultValue="usd">
                        <SelectTrigger id="default-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                          <SelectItem value="jpy">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                      <Input type="number" id="tax-rate" placeholder="0.0" defaultValue="7.5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approval-workflow">Approval Workflow</Label>
                      <Select defaultValue="manager">
                        <SelectTrigger id="approval-workflow">
                          <SelectValue placeholder="Select workflow" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple (Single Approver)</SelectItem>
                          <SelectItem value="manager">Manager + Finance</SelectItem>
                          <SelectItem value="multi">Multi-level Approval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="po-prefix">Purchase Order Prefix</Label>
                      <Input id="po-prefix" placeholder="PO-" defaultValue="PO-" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pr-approval">Purchase Requisition Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when a purchase requisition needs approval
                        </p>
                      </div>
                      <Switch id="pr-approval" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="po-created">Purchase Order Created</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when a new purchase order is created
                        </p>
                      </div>
                      <Switch id="po-created" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="order-status">Order Status Changes</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when an order status changes (e.g., shipped, received)
                        </p>
                      </div>
                      <Switch id="order-status" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="budget-alerts">Budget Threshold Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when department spending approaches budget limits
                        </p>
                      </div>
                      <Switch id="budget-alerts" defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
};

export default PurchaseManagement;