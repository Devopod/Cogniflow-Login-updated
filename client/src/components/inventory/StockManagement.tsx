import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowDownUp,
  Check,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  Filter,
  History,
  Loader2,
  Package,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Upload,
  AlertCircle as WarningCircle,
  X,
  XCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Sample stock data
const stockItems = [
  {
    id: 1,
    sku: "LAP-DEL-001",
    name: "Dell Latitude 5420",
    category: "Electronics",
    currentStock: 42,
    reorderLevel: 10,
    unitPrice: 899.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section A, Shelf 3",
    lastUpdated: "2023-05-01T13:45:00Z",
    status: "In Stock",
    supplierName: "Dell Technologies",
    purchasePrice: 750,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 10,
    pendingDeliveries: 5,
    averageDailySales: 0.8,
    daysUntilReorder: 40,
    notifications: [],
  },
  {
    id: 2,
    sku: "DESK-001",
    name: "Executive Office Desk",
    category: "Furniture",
    currentStock: 7,
    reorderLevel: 5,
    unitPrice: 349.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section D, Floor Area",
    lastUpdated: "2023-04-28T10:15:00Z",
    status: "In Stock",
    supplierName: "Office Furnishings Ltd",
    purchasePrice: 220,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 0,
    pendingDeliveries: 0,
    averageDailySales: 0.2,
    daysUntilReorder: 10,
    notifications: [],
  },
  {
    id: 3,
    sku: "PRINT-HP-002",
    name: "HP LaserJet Pro Printer",
    category: "Electronics",
    currentStock: 3,
    reorderLevel: 5,
    unitPrice: 249.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section A, Shelf 5",
    lastUpdated: "2023-04-30T09:30:00Z",
    status: "Low Stock",
    supplierName: "HP Inc.",
    purchasePrice: 180,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 5,
    pendingDeliveries: 0,
    averageDailySales: 0.5,
    daysUntilReorder: 0,
    notifications: [
      {
        id: 1,
        type: "low_stock",
        message: "Item is below reorder level",
        date: "2023-04-30T09:30:00Z",
        isRead: false,
      }
    ],
  },
  {
    id: 4,
    sku: "CHAIR-ERG-005",
    name: "Ergonomic Office Chair",
    category: "Furniture",
    currentStock: 15,
    reorderLevel: 8,
    unitPrice: 189.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section D, Floor Area",
    lastUpdated: "2023-04-29T14:00:00Z",
    status: "In Stock",
    supplierName: "Ergonomics Plus",
    purchasePrice: 110,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 2,
    pendingDeliveries: 0,
    averageDailySales: 0.3,
    daysUntilReorder: 23,
    notifications: [],
  },
  {
    id: 5,
    sku: "USB-DRIVE-16",
    name: "16GB USB Flash Drive",
    category: "Electronics",
    currentStock: 78,
    reorderLevel: 20,
    unitPrice: 12.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section B, Shelf 1",
    lastUpdated: "2023-04-27T11:20:00Z",
    status: "In Stock",
    supplierName: "Memory Technologies",
    purchasePrice: 7.50,
    expiryDate: null,
    batchNumber: "BT-2023-042",
    serialNumber: null,
    pendingOrders: 0,
    pendingDeliveries: 0,
    averageDailySales: 1.2,
    daysUntilReorder: 48,
    notifications: [],
  },
  {
    id: 6,
    sku: "TONER-HP-BLK",
    name: "HP Black Toner Cartridge",
    category: "Office Supplies",
    currentStock: 2,
    reorderLevel: 10,
    unitPrice: 79.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section B, Shelf 4",
    lastUpdated: "2023-04-28T16:45:00Z",
    status: "Low Stock",
    supplierName: "HP Inc.",
    purchasePrice: 60,
    expiryDate: "2024-06-30T00:00:00Z",
    batchNumber: "T-2023-15",
    serialNumber: null,
    pendingOrders: 15,
    pendingDeliveries: 0,
    averageDailySales: 0.7,
    daysUntilReorder: 0,
    notifications: [
      {
        id: 2,
        type: "low_stock",
        message: "Item is below reorder level",
        date: "2023-04-28T16:45:00Z",
        isRead: false,
      }
    ],
  },
  {
    id: 7,
    sku: "PAPER-A4-500",
    name: "A4 Paper 500 Sheets",
    category: "Office Supplies",
    currentStock: 0,
    reorderLevel: 15,
    unitPrice: 6.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section C, Shelf 2",
    lastUpdated: "2023-04-26T08:30:00Z",
    status: "Out of Stock",
    supplierName: "Paper Supplies Co.",
    purchasePrice: 4.50,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 25,
    pendingDeliveries: 50,
    averageDailySales: 2.5,
    daysUntilReorder: 0,
    notifications: [
      {
        id: 3,
        type: "out_of_stock",
        message: "Item is out of stock",
        date: "2023-04-26T08:30:00Z",
        isRead: true,
      }
    ],
  },
  {
    id: 8,
    sku: "LAPTOP-BAG-001",
    name: "15.6-inch Laptop Bag",
    category: "Accessories",
    currentStock: 12,
    reorderLevel: 5,
    unitPrice: 34.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section B, Shelf 3",
    lastUpdated: "2023-04-29T13:10:00Z",
    status: "In Stock",
    supplierName: "Accessory Wholesalers",
    purchasePrice: 22,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 3,
    pendingDeliveries: 0,
    averageDailySales: 0.4,
    daysUntilReorder: 17,
    notifications: [],
  },
  {
    id: 9,
    sku: "PENS-BLUE-BOX",
    name: "Blue Ballpoint Pens (Box of 50)",
    category: "Office Supplies",
    currentStock: 4,
    reorderLevel: 5,
    unitPrice: 15.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section C, Shelf 1",
    lastUpdated: "2023-04-30T15:20:00Z",
    status: "Low Stock",
    supplierName: "Office Depot",
    purchasePrice: 10,
    expiryDate: null,
    batchNumber: "PS-2023-102",
    serialNumber: null,
    pendingOrders: 2,
    pendingDeliveries: 5,
    averageDailySales: 0.6,
    daysUntilReorder: 0,
    notifications: [
      {
        id: 4,
        type: "low_stock",
        message: "Item is below reorder level",
        date: "2023-04-30T15:20:00Z",
        isRead: false,
      }
    ],
  },
  {
    id: 10,
    sku: "MONITOR-24",
    name: "24-inch LED Monitor",
    category: "Electronics",
    currentStock: 9,
    reorderLevel: 3,
    unitPrice: 159.99,
    warehouseId: 1,
    warehouseName: "Main Warehouse",
    location: "Section A, Shelf 2",
    lastUpdated: "2023-04-27T14:45:00Z",
    status: "In Stock",
    supplierName: "ViewTech Displays",
    purchasePrice: 120,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    pendingOrders: 0,
    pendingDeliveries: 0,
    averageDailySales: 0.3,
    daysUntilReorder: 20,
    notifications: [],
  }
];

// Sample stock movement history
const stockMovementHistory = [
  {
    id: 1,
    stockId: 3,
    productName: "HP LaserJet Pro Printer",
    type: "Sales Order",
    reference: "SO-2023-1042",
    quantity: -2,
    previousStock: 5,
    newStock: 3,
    date: "2023-04-30T09:30:00Z",
    user: "Sarah Johnson",
    notes: "Order #1042 - Customer: ABC Corporation"
  },
  {
    id: 2,
    stockId: 6,
    productName: "HP Black Toner Cartridge",
    type: "Sales Order",
    reference: "SO-2023-1038",
    quantity: -3,
    previousStock: 5,
    newStock: 2,
    date: "2023-04-28T16:45:00Z",
    user: "James Wilson",
    notes: "Order #1038 - Customer: XYZ Ltd"
  },
  {
    id: 3,
    stockId: 7,
    productName: "A4 Paper 500 Sheets",
    type: "Sales Order",
    reference: "SO-2023-1035",
    quantity: -8,
    previousStock: 8,
    newStock: 0,
    date: "2023-04-26T08:30:00Z",
    user: "Emma Davis",
    notes: "Order #1035 - Customer: Legal Partners LLP"
  },
  {
    id: 4,
    stockId: 1,
    productName: "Dell Latitude 5420",
    type: "Purchase Order",
    reference: "PO-2023-089",
    quantity: 10,
    previousStock: 32,
    newStock: 42,
    date: "2023-05-01T13:45:00Z",
    user: "Michael Brown",
    notes: "PO #089 received - Supplier: Dell Technologies"
  },
  {
    id: 5,
    stockId: 9,
    productName: "Blue Ballpoint Pens (Box of 50)",
    type: "Stock Adjustment",
    reference: "ADJ-2023-021",
    quantity: -1,
    previousStock: 5,
    newStock: 4,
    date: "2023-04-30T15:20:00Z",
    user: "Admin",
    notes: "Inventory count adjustment"
  },
  {
    id: 6,
    stockId: 2,
    productName: "Executive Office Desk",
    type: "Purchase Order",
    reference: "PO-2023-085",
    quantity: 3,
    previousStock: 4,
    newStock: 7,
    date: "2023-04-28T10:15:00Z",
    user: "Michael Brown",
    notes: "PO #085 received - Supplier: Office Furnishings Ltd"
  },
  {
    id: 7,
    stockId: 10,
    productName: "24-inch LED Monitor",
    type: "Sales Order",
    reference: "SO-2023-1030",
    quantity: -2,
    previousStock: 11,
    newStock: 9,
    date: "2023-04-27T14:45:00Z",
    user: "Sarah Johnson",
    notes: "Order #1030 - Customer: Tech Solutions Inc"
  }
];

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Stock status indicator component
const StockStatus = ({ status }: { status: string }) => {
  let color = "bg-gray-500 text-white";
  let icon = null;
  
  switch (status) {
    case "In Stock":
      color = "bg-green-500 text-white";
      icon = <Check className="h-3.5 w-3.5 mr-1" />;
      break;
    case "Low Stock":
      color = "bg-amber-500 text-white";
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      break;
    case "Out of Stock":
      color = "bg-red-500 text-white";
      icon = <X className="h-3.5 w-3.5 mr-1" />;
      break;
    case "Backordered":
      color = "bg-blue-500 text-white";
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      break;
    default:
      break;
  }
  
  return (
    <Badge className={`flex items-center ${color}`}>
      {icon}
      {status}
    </Badge>
  );
};

// Movement type indicator component
const MovementType = ({ type }: { type: string }) => {
  let color = "bg-gray-500 text-white";
  let icon = null;
  
  switch (type) {
    case "Purchase Order":
      color = "bg-green-500 text-white";
      icon = <ShoppingCart className="h-3.5 w-3.5 mr-1" />;
      break;
    case "Sales Order":
      color = "bg-blue-500 text-white";
      icon = <FileText className="h-3.5 w-3.5 mr-1" />;
      break;
    case "Stock Transfer":
      color = "bg-purple-500 text-white";
      icon = <ArrowDownUp className="h-3.5 w-3.5 mr-1" />;
      break;
    case "Stock Adjustment":
      color = "bg-amber-500 text-white";
      icon = <Edit className="h-3.5 w-3.5 mr-1" />;
      break;
    default:
      break;
  }
  
  return (
    <Badge className={`flex items-center ${color}`}>
      {icon}
      {type}
    </Badge>
  );
};

// Quantity change component
const QuantityChange = ({ quantity }: { quantity: number }) => {
  const isPositive = quantity > 0;
  const color = isPositive ? "text-green-600" : "text-red-600";
  const prefix = isPositive ? "+" : "";
  
  return (
    <div className={`flex items-center ${color} font-medium`}>
      {prefix}{quantity}
    </div>
  );
};

const StockManagement = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("stock");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [showStockHistoryDrawer, setShowStockHistoryDrawer] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [showReorderLevelDialog, setShowReorderLevelDialog] = useState(false);
  const [newReorderLevel, setNewReorderLevel] = useState(0);

  // Fetch stock data
  const { data: stockData, isLoading, isError } = useQuery({
    queryKey: ["/api/inventory/stock"],
    queryFn: () => {
      // Mock data for now
      return Promise.resolve(stockItems);
    }
  });

  // Fetch stock movement history
  const { data: movementHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["/api/inventory/stock/history", selectedStockId],
    queryFn: () => {
      // Filter by selected stock ID or return all if none selected
      const filtered = selectedStockId
        ? stockMovementHistory.filter(item => item.stockId === selectedStockId)
        : stockMovementHistory;
      return Promise.resolve(filtered);
    },
    enabled: currentTab === "history" || showStockHistoryDrawer
  });

  // Get unique categories for filter
  const categories = stockData 
    ? ["all", ...new Set(stockData.map((item: any) => item.category))]
    : ["all"];

  // Filter the stock data based on search term and filters
  const filteredStock = stockData ? stockData.filter((item: any) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

  // Open adjustment dialog for a specific item
  const openAdjustDialog = (item: any) => {
    setCurrentItem(item);
    setAdjustQuantity(0);
    setAdjustReason("");
    setShowAdjustDialog(true);
  };

  // Open history drawer for a specific item
  const openHistoryDrawer = (itemId: number) => {
    setSelectedStockId(itemId);
    setShowStockHistoryDrawer(true);
  };

  // Open reorder level dialog for a specific item
  const openReorderLevelDialog = (item: any) => {
    setCurrentItem(item);
    setNewReorderLevel(item.reorderLevel);
    setShowReorderLevelDialog(true);
  };

  // Handle stock adjustment submission
  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustQuantity) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a non-zero quantity to adjust.",
        variant: "destructive",
      });
      return;
    }
    
    if (!adjustReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for this adjustment.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, you'd call an API endpoint to adjust the stock
    toast({
      title: "Stock adjusted",
      description: `Adjusted ${currentItem.name} by ${adjustQuantity > 0 ? '+' : ''}${adjustQuantity} units.`,
    });
    
    setShowAdjustDialog(false);
  };

  // Handle reorder level update
  const handleUpdateReorderLevel = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReorderLevel < 0) {
      toast({
        title: "Invalid reorder level",
        description: "Reorder level cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, you'd call an API endpoint to update reorder level
    toast({
      title: "Reorder level updated",
      description: `Updated reorder level for ${currentItem.name} to ${newReorderLevel}.`,
    });
    
    setShowReorderLevelDialog(false);
  };

  // Create purchase order for low stock items
  const createPurchaseOrder = () => {
    const lowStockItems = stockData ? stockData.filter((item: any) => 
      item.status === "Low Stock" || item.status === "Out of Stock"
    ) : [];
    
    if (lowStockItems.length === 0) {
      toast({
        title: "No items to reorder",
        description: "There are no items that need reordering at this time.",
      });
      return;
    }
    
    // In a real app, you'd redirect to the PO creation screen
    toast({
      title: "Purchase order created",
      description: `Created a purchase order for ${lowStockItems.length} low stock items.`,
    });
  };

  // Mark notification as read
  const markNotificationAsRead = (stockId: number, notificationId: number) => {
    // In a real app, you'd call an API endpoint to mark notification as read
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    });
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    // In a real app, you'd call an API endpoint to mark all notifications as read
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Management</h2>
          <p className="text-muted-foreground">
            Track inventory levels, movements, and reorder points
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={createPurchaseOrder}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
          <Button onClick={() => setCurrentTab("stock")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Current Stock
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Movement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, SKU or supplier..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex items-center gap-2">
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === "all" ? "All Categories" : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        <SelectItem value="Backordered">Backordered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h3 className="text-lg font-medium">Error Loading Stock Data</h3>
                    <p className="text-sm text-muted-foreground">
                      There was a problem loading the inventory stock data.
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">No Items Found</h3>
                    <p className="text-sm text-muted-foreground">
                      No inventory items match your search criteria.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setStatusFilter("all");
                    }}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[220px]">Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Current Stock</TableHead>
                        <TableHead className="text-center">Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStock.map((item: any) => (
                        <TableRow key={item.id} className={
                          item.status === "Out of Stock" ? "bg-red-50" : 
                          item.status === "Low Stock" ? "bg-amber-50" : ""
                        }>
                          <TableCell className="font-medium flex items-start gap-2">
                            <div className="flex-shrink-0 mt-1">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div>{item.name}</div>
                              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                                <span>{item.warehouseName}</span>
                                <span>•</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-default underline decoration-dotted underline-offset-2">
                                      {item.location}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Location: {item.location}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {item.notifications.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <div className="cursor-pointer flex items-center text-amber-600">
                                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                          <span>{item.notifications.length} {item.notifications.length === 1 ? "alert" : "alerts"}</span>
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[300px] p-0">
                                        <div className="px-4 py-2 border-b">
                                          <div className="font-medium">Stock Alerts</div>
                                          <div className="text-xs text-muted-foreground">
                                            For {item.name}
                                          </div>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                          {item.notifications.map((notification: any) => (
                                            <div key={notification.id} className="px-4 py-2 border-b last:border-0 flex items-start gap-2">
                                              <div className="text-amber-500 mt-0.5">
                                                <AlertCircle className="h-4 w-4" />
                                              </div>
                                              <div className="flex-1">
                                                <div className="text-sm">{notification.message}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {formatDate(notification.date)}
                                                </div>
                                              </div>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => markNotificationAsRead(item.id, notification.id)}
                                                className="h-8 px-2"
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="px-4 py-2 border-t">
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full"
                                            onClick={markAllNotificationsAsRead}
                                          >
                                            Mark All as Read
                                          </Button>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium">{item.currentStock}</div>
                            {item.pendingDeliveries > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-default">
                                    <div className="text-xs text-green-600 flex items-center justify-center gap-0.5">
                                      <Truck className="h-3 w-3" />
                                      +{item.pendingDeliveries}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{item.pendingDeliveries} units arriving soon</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Badge 
                                variant="outline" 
                                className="font-medium cursor-pointer"
                                onClick={() => openReorderLevelDialog(item)}
                              >
                                {item.reorderLevel}
                              </Badge>
                            </div>
                            {item.daysUntilReorder > 0 && (
                              <div className="text-xs text-muted-foreground">
                                ~{item.daysUntilReorder} days left
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <StockStatus status={item.status} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Manage Item</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openAdjustDialog(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Adjust Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openHistoryDrawer(item.id)}>
                                  <History className="h-4 w-4 mr-2" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openReorderLevelDialog(item)}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Set Reorder Level
                                </DropdownMenuItem>
                                {(item.status === "Low Stock" || item.status === "Out of Stock") && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <ShoppingCart className="h-4 w-4 mr-2" />
                                      Create PO for This Item
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t py-4 px-6 flex flex-col sm:flex-row justify-between">
              <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
                {filteredStock.length} out of {stockData?.length || 0} items shown
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">In Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Low Stock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Out of Stock</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Stock Movement History</CardTitle>
                  <CardDescription>
                    Track all inventory changes and transactions
                  </CardDescription>
                </div>
                <Select 
                  value={selectedStockId?.toString() || "all"}
                  onValueChange={(value) => setSelectedStockId(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {stockData?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : movementHistory?.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <History className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">No Movement History</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStockId ? "This product has no movement history." : "There is no stock movement history to display."}
                    </p>
                    {selectedStockId && (
                      <Button variant="outline" onClick={() => setSelectedStockId(null)}>
                        Show All Products
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Date & Time</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-center">Quantity Δ</TableHead>
                        <TableHead className="text-center">Stock Before</TableHead>
                        <TableHead className="text-center">Stock After</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementHistory?.map((movement: any) => (
                        <TableRow key={movement.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(movement.date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {movement.productName}
                          </TableCell>
                          <TableCell>
                            <MovementType type={movement.type} />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{movement.reference}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <QuantityChange quantity={movement.quantity} />
                          </TableCell>
                          <TableCell className="text-center">
                            {movement.previousStock}
                          </TableCell>
                          <TableCell className="text-center">
                            {movement.newStock}
                          </TableCell>
                          <TableCell>
                            {movement.user}
                            {movement.notes && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="ml-1 cursor-default">
                                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{movement.notes}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t py-4 px-6">
              <div className="flex gap-4 items-center">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter History
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Quantity</DialogTitle>
            <DialogDescription>
              Adjust the current stock level for {currentItem?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current-stock">Current Stock Level</Label>
                <Input
                  id="current-stock"
                  value={currentItem?.currentStock || 0}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adjustment">Adjustment Quantity</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="adjustment"
                      type="number"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Enter quantity to add or remove"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    New Total: <span className="font-medium">{(currentItem?.currentStock || 0) + adjustQuantity}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a positive number to add stock or a negative number to remove stock.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Input
                  id="reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="E.g., Inventory count, damaged goods, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Adjust Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reorder Level Dialog */}
      <Dialog open={showReorderLevelDialog} onOpenChange={setShowReorderLevelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reorder Level</DialogTitle>
            <DialogDescription>
              Update the reorder level for {currentItem?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateReorderLevel} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current-level">Current Reorder Level</Label>
                <Input
                  id="current-level"
                  value={currentItem?.reorderLevel || 0}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-level">New Reorder Level</Label>
                <Input
                  id="new-level"
                  type="number"
                  min="0"
                  value={newReorderLevel}
                  onChange={(e) => setNewReorderLevel(parseInt(e.target.value) || 0)}
                  placeholder="Enter new reorder level"
                />
                <p className="text-sm text-muted-foreground">
                  The system will alert you when stock falls below this level.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-calculate" className="flex-1">
                  Auto-calculate based on sales data
                </Label>
                <Switch id="auto-calculate" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReorderLevelDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Reorder Level
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock History Drawer */}
      <Dialog open={showStockHistoryDrawer} onOpenChange={setShowStockHistoryDrawer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Movement History</DialogTitle>
            <DialogDescription>
              {stockData?.find((item: any) => item.id === selectedStockId)?.name || "All Products"}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-center">Quantity Δ</TableHead>
                  <TableHead className="text-center">Stock Before</TableHead>
                  <TableHead className="text-center">Stock After</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isHistoryLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : movementHistory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No movement history found
                    </TableCell>
                  </TableRow>
                ) : (
                  movementHistory?.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(movement.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.productName}
                      </TableCell>
                      <TableCell>
                        <MovementType type={movement.type} />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{movement.reference}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <QuantityChange quantity={movement.quantity} />
                      </TableCell>
                      <TableCell className="text-center">
                        {movement.previousStock}
                      </TableCell>
                      <TableCell className="text-center">
                        {movement.newStock}
                      </TableCell>
                      <TableCell>
                        {movement.user}
                        {movement.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="ml-1 cursor-default">
                                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{movement.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockHistoryDrawer(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;