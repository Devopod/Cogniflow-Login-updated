import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowUpDown,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit,
  Filter,
  LineChart,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  SearchIcon,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Type definitions
interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  minOrderQty: number;
  leadTime: number; // in days
  averageDailySales: number;
  supplier: string;
  location: string;
  lastOrdered: string;
  status: "normal" | "low" | "critical" | "overstock";
  autoReorder: boolean;
  isActive: boolean;
}

interface ReorderSettings {
  enableAutoReorder: boolean;
  defaultLeadTime: number;
  bufferPercentage: number;
  notificationThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// Sample data for demonstration
const sampleProducts: Product[] = [
  {
    id: 1,
    sku: "LAP-DEL-001",
    name: "Dell Latitude 5420",
    category: "Electronics",
    currentStock: 15,
    reorderLevel: 10,
    maxStock: 40,
    minOrderQty: 5,
    leadTime: 14,
    averageDailySales: 0.5,
    supplier: "XYZ Electronics Ltd",
    location: "Warehouse A",
    lastOrdered: "2023-04-15",
    status: "normal",
    autoReorder: true,
    isActive: true
  },
  {
    id: 2,
    sku: "DESK-001",
    name: "Executive Office Desk",
    category: "Furniture",
    currentStock: 5,
    reorderLevel: 8,
    maxStock: 25,
    minOrderQty: 3,
    leadTime: 21,
    averageDailySales: 0.2,
    supplier: "Office Furniture Co",
    location: "Warehouse B",
    lastOrdered: "2023-03-10",
    status: "low",
    autoReorder: true,
    isActive: true
  },
  {
    id: 3,
    sku: "PRINT-HP-002",
    name: "HP LaserJet Pro Printer",
    category: "Electronics",
    currentStock: 2,
    reorderLevel: 5,
    maxStock: 15,
    minOrderQty: 2,
    leadTime: 10,
    averageDailySales: 0.3,
    supplier: "XYZ Electronics Ltd",
    location: "Warehouse A",
    lastOrdered: "2023-04-02",
    status: "critical",
    autoReorder: true,
    isActive: true
  },
  {
    id: 4,
    sku: "CHAIR-ERG-005",
    name: "Ergonomic Office Chair",
    category: "Furniture",
    currentStock: 35,
    reorderLevel: 15,
    maxStock: 30,
    minOrderQty: 5,
    leadTime: 14,
    averageDailySales: 0.7,
    supplier: "Office Furniture Co",
    location: "Warehouse B",
    lastOrdered: "2023-04-20",
    status: "overstock",
    autoReorder: false,
    isActive: true
  },
  {
    id: 5,
    sku: "USB-DRIVE-16",
    name: "16GB USB Flash Drive",
    category: "Electronics",
    currentStock: 120,
    reorderLevel: 50,
    maxStock: 200,
    minOrderQty: 25,
    leadTime: 7,
    averageDailySales: 4.5,
    supplier: "Tech Supplies Inc",
    location: "Warehouse A",
    lastOrdered: "2023-04-05",
    status: "normal",
    autoReorder: true,
    isActive: true
  },
  {
    id: 6,
    sku: "TONER-HP-BLK",
    name: "HP Black Toner Cartridge",
    category: "Office Supplies",
    currentStock: 7,
    reorderLevel: 10,
    maxStock: 25,
    minOrderQty: 5,
    leadTime: 5,
    averageDailySales: 0.8,
    supplier: "Office Supplies Co",
    location: "Warehouse A",
    lastOrdered: "2023-04-10",
    status: "low",
    autoReorder: true,
    isActive: true
  },
  {
    id: 7,
    sku: "PAPER-A4-500",
    name: "A4 Paper 500 Sheets",
    category: "Office Supplies",
    currentStock: 0,
    reorderLevel: 20,
    maxStock: 100,
    minOrderQty: 10,
    leadTime: 3,
    averageDailySales: 2.5,
    supplier: "Office Supplies Co",
    location: "Warehouse A",
    lastOrdered: "2023-04-01",
    status: "critical",
    autoReorder: true,
    isActive: true
  },
  {
    id: 8,
    sku: "LAPTOP-BAG-001",
    name: "15.6-inch Laptop Bag",
    category: "Accessories",
    currentStock: 25,
    reorderLevel: 15,
    maxStock: 50,
    minOrderQty: 10,
    leadTime: 10,
    averageDailySales: 1.2,
    supplier: "Tech Accessories Ltd",
    location: "Warehouse C",
    lastOrdered: "2023-03-25",
    status: "normal",
    autoReorder: false,
    isActive: true
  }
];

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "normal":
      return <Badge className="bg-green-500">Normal</Badge>;
    case "low":
      return <Badge className="bg-amber-500">Low Stock</Badge>;
    case "critical":
      return <Badge className="bg-red-500">Critical</Badge>;
    case "overstock":
      return <Badge className="bg-blue-500">Overstock</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Calculate days until reorder
const calculateDaysUntilReorder = (product: Product) => {
  if (product.currentStock <= product.reorderLevel) return 0;
  if (product.averageDailySales <= 0) return 999; // Avoid division by zero
  
  const daysUntilReorder = Math.floor((product.currentStock - product.reorderLevel) / product.averageDailySales);
  return daysUntilReorder;
};

// Calculate coverage metrics
const calculateCoverageDays = (product: Product) => {
  if (product.averageDailySales <= 0) return Infinity;
  return Math.floor(product.currentStock / product.averageDailySales);
};

// Calculate optimal reorder quantity
const calculateOptimalReorderQty = (product: Product) => {
  // Simple calculation - can be enhanced with EOQ formula
  const optimalQty = Math.max(
    product.minOrderQty,
    Math.round((product.maxStock - product.currentStock) * 0.8)
  );
  return optimalQty;
};

// Generate PO suggestions based on reorder needs
const generatePOSuggestions = (products: Product[]) => {
  return products.filter(p => 
    p.isActive && p.autoReorder && 
    (p.status === "critical" || p.status === "low") && 
    (new Date().getTime() - new Date(p.lastOrdered).getTime() > 7 * 24 * 60 * 60 * 1000) // At least 7 days since last order
  );
};

const ReorderLevelManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [reorderSettings, setReorderSettings] = useState<ReorderSettings>({
    enableAutoReorder: true,
    defaultLeadTime: 14,
    bufferPercentage: 20,
    notificationThreshold: 30, // Percentage of reorder level to trigger notifications
    emailNotifications: true,
    pushNotifications: true
  });
  
  const [selectedTab, setSelectedTab] = useState<string>("inventory");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showEditProductDialog, setShowEditProductDialog] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [isGeneratingPO, setIsGeneratingPO] = useState<boolean>(false);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Get unique suppliers from products
  const suppliers = Array.from(new Set(products.map(p => p.supplier)));

  // Filter products based on search, status, and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get products that need reordering
  const reorderNeededProducts = products.filter(p => 
    p.isActive && (p.status === "critical" || p.status === "low")
  );

  // Get overstock products
  const overstockProducts = products.filter(p => 
    p.isActive && p.status === "overstock"
  );

  // Generate purchase order suggestions
  const poSuggestions = generatePOSuggestions(products);

  // Group PO suggestions by supplier
  const supplierGroups = poSuggestions.reduce((groups, product) => {
    const supplier = product.supplier;
    if (!groups[supplier]) {
      groups[supplier] = [];
    }
    groups[supplier].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  // Update product
  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    
    toast({
      title: "Product Updated",
      description: `Reorder levels for ${updatedProduct.name} have been updated.`,
    });
    
    setShowEditProductDialog(false);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct({ ...product });
    setShowEditProductDialog(true);
  };

  // Toggle auto-reorder for a product
  const toggleAutoReorder = (productId: number, value: boolean) => {
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, autoReorder: value } : p)
    );
    
    toast({
      title: value ? "Auto-Reorder Enabled" : "Auto-Reorder Disabled",
      description: `Auto-reorder has been ${value ? 'enabled' : 'disabled'} for the selected product.`,
    });
  };

  // Handle bulk reorder level update
  const handleBulkCalculation = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update reorder levels based on sales data and lead time
      const updatedProducts = products.map(product => {
        const dailyUsage = product.averageDailySales;
        const leadTimeDemand = dailyUsage * product.leadTime;
        const safetyStock = leadTimeDemand * (reorderSettings.bufferPercentage / 100);
        const calculatedReorderLevel = Math.ceil(leadTimeDemand + safetyStock);
        
        return {
          ...product,
          reorderLevel: calculatedReorderLevel,
          maxStock: Math.ceil(calculatedReorderLevel * 2)
        };
      });
      
      setProducts(updatedProducts);
      setIsLoading(false);
      
      toast({
        title: "Reorder Levels Updated",
        description: "All product reorder levels have been recalculated based on current sales data and lead times.",
      });
    }, 1500);
  };

  // Handle generating purchase orders
  const handleGeneratePO = () => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: "No Suppliers Selected",
        description: "Please select at least one supplier to generate purchase orders.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingPO(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, this would call an API to create actual purchase orders
      
      setIsGeneratingPO(false);
      
      toast({
        title: "Purchase Orders Generated",
        description: `Successfully created ${selectedSuppliers.length} purchase orders for the selected suppliers.`,
      });
      
      // Reset selected suppliers
      setSelectedSuppliers([]);
    }, 2000);
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Reorder level management settings have been updated.",
    });
  };

  // Helper to generate random history
  const generateRandomHistory = () => {
    const actions = ["Reorder Level Modified", "Automatic PO Generated", "Stock Level Updated", "Manual Adjustment"];
    const users = ["System", "John Smith", "Jane Doe", "Inventory Manager"];
    const dates = Array(10).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 5 - Math.floor(Math.random() * 5));
      return date.toISOString();
    });
    
    return Array(10).fill(0).map((_, i) => ({
      id: i + 1,
      action: actions[Math.floor(Math.random() * actions.length)],
      user: users[Math.floor(Math.random() * users.length)],
      timestamp: dates[i],
      details: `Changed from ${Math.floor(Math.random() * 10) + 5} to ${Math.floor(Math.random() * 20) + 10}`
    }));
  };

  // Generate random history entries for the selected product
  const productHistory = generateRandomHistory();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reorder Level Management</h2>
          <p className="text-muted-foreground">
            Manage inventory reorder points and automate purchase requisitions
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleBulkCalculation} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Calculate Optimal Levels
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-2/3">
          <CardHeader className="pb-3">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
              <CardTitle>Inventory Reorder Levels</CardTitle>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8 w-full md:w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="overstock">Overstock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No Products Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                    ? "No products match your current filters. Try adjusting your search or filter criteria."
                    : "Start by adding products and configuring their reorder levels."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Product</TableHead>
                      <TableHead className="text-center">Current Stock</TableHead>
                      <TableHead className="text-center">Reorder Level</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Lead Time</TableHead>
                      <TableHead className="text-center">Coverage</TableHead>
                      <TableHead className="text-center">Auto Reorder</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const daysUntilReorder = calculateDaysUntilReorder(product);
                      const coverageDays = calculateCoverageDays(product);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.sku}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-medium ${product.status === 'critical' ? 'text-red-500' : product.status === 'low' ? 'text-amber-500' : ''}`}>
                                {product.currentStock}
                              </span>
                              <span className="text-xs text-muted-foreground">units</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{product.reorderLevel}</span>
                              <span className="text-xs text-muted-foreground">min level</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(product.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{product.leadTime}</span>
                              <span className="text-xs text-muted-foreground">days</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              {coverageDays === Infinity ? (
                                <span className="font-medium">∞</span>
                              ) : (
                                <span className={`font-medium ${coverageDays < 7 ? 'text-red-500' : coverageDays < 14 ? 'text-amber-500' : 'text-green-500'}`}>
                                  {coverageDays}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">days</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={product.autoReorder} 
                              onCheckedChange={(checked) => toggleAutoReorder(product.id, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditProduct(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowHistoryDialog(true);
                                }}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    onClick={() => handleEditProduct(product)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Reorder Levels
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <LineChart className="h-4 w-4 mr-2" />
                                    View Consumption Trends
                                  </DropdownMenuItem>
                                  {(product.status === "critical" || product.status === "low") && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Purchase Order
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="w-full md:w-1/3 space-y-4">
          {/* Reorder Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Reorder Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    Critical
                  </span>
                  <Badge className="bg-red-500">
                    {products.filter(p => p.status === "critical").length}
                  </Badge>
                </div>
                <Progress value={
                  (products.filter(p => p.status === "critical").length / products.length) * 100
                } className="h-2 bg-red-100" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                    Low Stock
                  </span>
                  <Badge className="bg-amber-500">
                    {products.filter(p => p.status === "low").length}
                  </Badge>
                </div>
                <Progress value={
                  (products.filter(p => p.status === "low").length / products.length) * 100
                } className="h-2 bg-amber-100" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    Normal
                  </span>
                  <Badge className="bg-green-500">
                    {products.filter(p => p.status === "normal").length}
                  </Badge>
                </div>
                <Progress value={
                  (products.filter(p => p.status === "normal").length / products.length) * 100
                } className="h-2 bg-green-100" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center">
                    <TrendingDown className="h-4 w-4 text-blue-500 mr-2" />
                    Overstock
                  </span>
                  <Badge className="bg-blue-500">
                    {products.filter(p => p.status === "overstock").length}
                  </Badge>
                </div>
                <Progress value={
                  (products.filter(p => p.status === "overstock").length / products.length) * 100
                } className="h-2 bg-blue-100" />
              </div>
              
              <Separator className="my-2" />
              
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Purchase Order Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Purchase Order Suggestions</CardTitle>
              <CardDescription>
                Based on current stock levels and reorder points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(supplierGroups).length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">No purchase orders needed</p>
                  <p className="text-xs text-muted-foreground">
                    All inventory levels are currently sufficient
                  </p>
                </div>
              ) : (
                <>
                  {Object.entries(supplierGroups).map(([supplier, products]) => (
                    <div key={supplier} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Checkbox 
                            id={`supplier-${supplier}`} 
                            checked={selectedSuppliers.includes(supplier)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSuppliers(prev => [...prev, supplier]);
                              } else {
                                setSelectedSuppliers(prev => prev.filter(s => s !== supplier));
                              }
                            }}
                          />
                          <Label htmlFor={`supplier-${supplier}`} className="ml-2 font-medium">
                            {supplier}
                          </Label>
                        </div>
                        <Badge className="bg-blue-500">{products.length} Items</Badge>
                      </div>
                      <div className="space-y-1 mt-3 pl-6">
                        {products.slice(0, 3).map(product => (
                          <div key={product.id} className="flex justify-between items-center text-sm">
                            <span className="truncate" style={{ maxWidth: "180px" }}>{product.name}</span>
                            <span className="text-xs font-medium">
                              {product.currentStock} → {product.reorderLevel}
                            </span>
                          </div>
                        ))}
                        {products.length > 3 && (
                          <div className="text-xs text-muted-foreground text-right">
                            +{products.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    className="w-full"
                    disabled={selectedSuppliers.length === 0 || isGeneratingPO}
                    onClick={handleGeneratePO}
                  >
                    {isGeneratingPO ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Generate {selectedSuppliers.length} Purchase Orders
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Auto Reorder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Reorder Configuration</CardTitle>
          <CardDescription>
            Configure how the system handles automatic reordering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Reorder</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate purchase orders for low stock items
                  </p>
                </div>
                <Switch 
                  checked={reorderSettings.enableAutoReorder} 
                  onCheckedChange={(checked) => 
                    setReorderSettings(prev => ({ ...prev, enableAutoReorder: checked }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-lead-time">Default Lead Time (days)</Label>
                <Input 
                  id="default-lead-time" 
                  type="number" 
                  min="1" 
                  value={reorderSettings.defaultLeadTime}
                  onChange={(e) => 
                    setReorderSettings(prev => ({ 
                      ...prev, 
                      defaultLeadTime: Math.max(1, parseInt(e.target.value) || 1) 
                    }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buffer-percentage">Safety Stock Buffer (%)</Label>
                <Input 
                  id="buffer-percentage" 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={reorderSettings.bufferPercentage}
                  onChange={(e) => 
                    setReorderSettings(prev => ({ 
                      ...prev, 
                      bufferPercentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Extra stock to keep as buffer against supply chain delays and demand spikes
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-threshold">Notification Threshold (%)</Label>
                <Input 
                  id="notification-threshold" 
                  type="number" 
                  min="0" 
                  max="100"
                  value={reorderSettings.notificationThreshold}
                  onChange={(e) => 
                    setReorderSettings(prev => ({ 
                      ...prev, 
                      notificationThreshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) 
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Send notifications when stock level reaches this percentage of reorder level
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email alerts about low stock levels
                  </p>
                </div>
                <Switch 
                  checked={reorderSettings.emailNotifications} 
                  onCheckedChange={(checked) => 
                    setReorderSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send in-app notifications about low stock levels
                  </p>
                </div>
                <Switch 
                  checked={reorderSettings.pushNotifications} 
                  onCheckedChange={(checked) => 
                    setReorderSettings(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Reorder Levels</DialogTitle>
            <DialogDescription>
              Update reorder points and automatic ordering settings
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.sku} • {selectedProduct.category}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-stock">Current Stock</Label>
                  <Input 
                    id="current-stock" 
                    type="number" 
                    min="0" 
                    value={selectedProduct.currentStock}
                    onChange={(e) => 
                      setSelectedProduct(prev => 
                        prev ? { ...prev, currentStock: Math.max(0, parseInt(e.target.value) || 0) } : null
                      )
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reorder-level">Reorder Level</Label>
                  <Input 
                    id="reorder-level" 
                    type="number" 
                    min="0" 
                    value={selectedProduct.reorderLevel}
                    onChange={(e) => 
                      setSelectedProduct(prev => 
                        prev ? { ...prev, reorderLevel: Math.max(0, parseInt(e.target.value) || 0) } : null
                      )
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-stock">Maximum Stock</Label>
                  <Input 
                    id="max-stock" 
                    type="number" 
                    min="0" 
                    value={selectedProduct.maxStock}
                    onChange={(e) => 
                      setSelectedProduct(prev => 
                        prev ? { ...prev, maxStock: Math.max(0, parseInt(e.target.value) || 0) } : null
                      )
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min-order-qty">Minimum Order Quantity</Label>
                  <Input 
                    id="min-order-qty" 
                    type="number" 
                    min="1" 
                    value={selectedProduct.minOrderQty}
                    onChange={(e) => 
                      setSelectedProduct(prev => 
                        prev ? { ...prev, minOrderQty: Math.max(1, parseInt(e.target.value) || 1) } : null
                      )
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lead-time">Lead Time (days)</Label>
                  <Input 
                    id="lead-time" 
                    type="number" 
                    min="1" 
                    value={selectedProduct.leadTime}
                    onChange={(e) => 
                      setSelectedProduct(prev => 
                        prev ? { ...prev, leadTime: Math.max(1, parseInt(e.target.value) || 1) } : null
                      )
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="daily-sales">Avg. Daily Sales</Label>
                  <Input 
                    id="daily-sales" 
                    type="number" 
                    min="0" 
                    step="0.1"
                    value={selectedProduct.averageDailySales}
                    onChange={(e) => 
                      setSelectedProduct(prev => 
                        prev ? { 
                          ...prev, 
                          averageDailySales: Math.max(0, parseFloat(e.target.value) || 0)
                        } : null
                      )
                    }
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="auto-reorder" 
                  checked={selectedProduct.autoReorder}
                  onCheckedChange={(checked) => 
                    setSelectedProduct(prev => 
                      prev ? { ...prev, autoReorder: checked as boolean } : null
                    )
                  }
                />
                <Label htmlFor="auto-reorder">
                  Enable automatic reordering for this product
                </Label>
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                  Auto-Calculated Values
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Recommended Reorder Qty</p>
                    <p className="font-medium">{selectedProduct ? calculateOptimalReorderQty(selectedProduct) : 0} units</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stock Coverage</p>
                    <p className="font-medium">
                      {selectedProduct 
                        ? calculateCoverageDays(selectedProduct) === Infinity 
                          ? "∞" 
                          : `${calculateCoverageDays(selectedProduct)} days` 
                        : "0 days"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProductDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedProduct && updateProduct(selectedProduct)}
              disabled={!selectedProduct}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Reorder Level History</DialogTitle>
            <DialogDescription>
              {selectedProduct && `History of changes for ${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto my-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{entry.action}</TableCell>
                    <TableCell className="text-sm">{entry.details}</TableCell>
                    <TableCell className="text-sm">{entry.user}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReorderLevelManagement;