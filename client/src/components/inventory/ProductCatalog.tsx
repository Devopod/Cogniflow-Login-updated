import { useState } from "react";
import { useProducts } from '@/hooks/use-inventory-data';
import { useWebSocket } from '@/hooks/use-websocket';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowDownUp,
  ArrowUpRight,
  BarChart,
  Box,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  GitBranch,
  History,
  Image,
  Layers,
  Loader2,
  MoreHorizontal,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  QrCode,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Trash,
  TrendingUp,
  Upload,
  Warehouse,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Sample product categories
const productCategories = [
  { id: 1, name: "Electronics", count: 24 },
  { id: 2, name: "Office Supplies", count: 18 },
  { id: 3, name: "Furniture", count: 12 },
  { id: 4, name: "Machinery", count: 8 },
  { id: 5, name: "Raw Materials", count: 15 },
  { id: 6, name: "IT Equipment", count: 20 },
  { id: 7, name: "Safety Gear", count: 9 },
];

// Static product data removed - now using dynamic data from API

// Low stock products will be calculated inside the component using dynamic data

// Product units
const productUnits = [
  "Each",
  "Pack",
  "Box",
  "Carton",
  "Pallet",
  "Kg",
  "Gram",
  "Liter",
  "Meter",
  "Square Meter",
  "Cubic Meter",
  "Hour",
  "Day",
  "Set",
  "Pair",
  "Case",
  "Drum",
  "Bundle",
  "Roll",
  "Sheet"
];

// Tax rates
const taxRates = [
  { id: 1, name: "Standard Rate", rate: 10 },
  { id: 2, name: "Reduced Rate", rate: 5 },
  { id: 3, name: "Zero Rate", rate: 0 },
  { id: 4, name: "Export", rate: 0 },
  { id: 5, name: "Special Rate", rate: 7 },
];

// Warehouse locations
const locations = [
  { id: 1, name: "Warehouse A", zone: "Main Storage" },
  { id: 2, name: "Warehouse B", zone: "Main Storage" },
  { id: 3, name: "Warehouse C", zone: "Office Supplies" },
  { id: 4, name: "Secure Warehouse", zone: "High Value" },
  { id: 5, name: "Material Warehouse", zone: "Raw Materials" },
];

// Suppliers
const suppliers = [
  { id: 1, name: "TechSource Inc.", leadTime: 7, rating: 4.5 },
  { id: 2, name: "Furniture Plus", leadTime: 14, rating: 4.2 },
  { id: 3, name: "Office Supplies Direct", leadTime: 3, rating: 4.7 },
  { id: 4, name: "Enterprise IT Solutions", leadTime: 21, rating: 3.9 },
  { id: 5, name: "SafetyFirst Supplies", leadTime: 4, rating: 4.4 },
  { id: 6, name: "Metal Supply Co.", leadTime: 14, rating: 4.0 },
];

interface Product {
  id: string;
  name?: string;
  sku?: string;
  category?: string;
  stockQuantity?: number;
  reorderPoint?: number;
  unitPrice: number;
  costPrice: number;
  status?: string;
  description?: string;
  barcode?: string;
  dimensions?: string;
  weight?: number;
  supplier?: string;
  leadTime?: number;
  created?: string;
  updated?: string;
  customFields?: Record<string, string>;
  notes?: string;
  images?: string[];
  attachments?: Array<{ name: string; size: string }>;
  hasVariants?: boolean;
  variants?: Array<{ id: string; name: string; sku: string; stockQuantity?: number; stock?: number }>;
  available?: number;
  allocated?: number;
  location?: string;
  reorderQuantity?: number;
  taxRate?: number;
}

const ProductCatalog = () => {
  const { toast } = useToast();
  
  // Dynamic data hooks
  const { data: products = [], isLoading: isLoadingProducts } = useProducts({ limit: 100 });
  
  // Real-time updates via WebSocket for inventory changes
  useWebSocket({
    resource: 'inventory',
    invalidateQueries: [['products'], ['lowStockItems']]
  });

  // Calculate low stock products using dynamic data
  const lowStockProducts = products.filter((product: Product) =>
    (product.stockQuantity || 0) <= ((product.reorderPoint || 0) + 5)
  );
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [stockUpdateType, setStockUpdateType] = useState<"adjustment" | "transfer">("adjustment");
  
  // Filter and sort products
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a: Product, b: Product) => {
    // Handle sorting
    if (sortField === "name") {
      return sortOrder === "asc"
        ? (a.name || '').localeCompare(b.name || '')
        : (b.name || '').localeCompare(a.name || '');
    } else if (sortField === "stock") {
      return sortOrder === "asc"
        ? (a.stockQuantity || 0) - (b.stockQuantity || 0)
        : (b.stockQuantity || 0) - (a.stockQuantity || 0);
    } else if (sortField === "price") {
      return sortOrder === "asc"
        ? a.unitPrice - b.unitPrice
        : b.unitPrice - a.unitPrice;
    }
    return 0;
  });
  
  // Toggle sorting
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  
  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };
  
  // Check if all products are selected
  const allSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;
  
  // Toggle all products selection
  const toggleAllSelection = () => {
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((product: Product) => product.id));
    }
  };
  
  // View product details
  const viewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };
  
  // Create product
  const handleCreateProduct = () => {
    setShowCreateProduct(false);
    toast({
      title: "Product created",
      description: "The new product has been added to the catalog",
    });
  };
  
  // Import products
  const handleImportProducts = () => {
    setIsLoading(true);
    
    // Simulate import process
    setTimeout(() => {
      setIsLoading(false);
      setShowImportDialog(false);
      toast({
        title: "Import completed",
        description: "8 products have been imported successfully",
      });
    }, 2000);
  };

  // Update stock
  const handleStockUpdate = () => {
    setShowStockUpdate(false);
    toast({
      title: "Stock updated",
      description: `Stock ${stockUpdateType === "adjustment" ? "adjustment" : "transfer"} has been recorded successfully`,
    });
  };
  
  // Generate barcode
  const generateBarcode = () => {
    toast({
      title: "Barcode generated",
      description: "Product barcode has been generated and saved",
    });
  };
  
  // Export products
  const handleExportProducts = () => {
    toast({
      title: "Export started",
      description: "Products are being exported to CSV",
    });
  };
  
  // Advanced inventory features that go beyond Zoho
  const handleAIBasedForecasting = () => {
    toast({
      title: "AI Forecasting",
      description: "AI-based inventory demand forecasting initiated",
    });
  };
  
  const handleSupplyChainOptimization = () => {
    toast({
      title: "Supply Chain Optimization",
      description: "Analyzing supply chain efficiency with ML models",
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
          <p className="text-muted-foreground">
            Manage your inventory products and categories
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] md:w-[280px]"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {productCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setShowStockUpdate(true)}>
                  <PackageOpen className="h-4 w-4 mr-2" />
                  Update Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generateBarcode}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Barcode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportProducts}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Products
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>AI-Powered Features</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleAIBasedForecasting}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  AI Demand Forecasting
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSupplyChainOptimization}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Supply Chain Optimization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Import Products</DialogTitle>
                  <DialogDescription>
                    Upload a CSV or Excel file with your product data
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm font-medium mb-1">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports CSV, XLSX (max 10MB)
                    </p>
                    <Button size="sm" variant="outline">
                      Select File
                    </Button>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-2">Options</h4>
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox id="update-existing" defaultChecked />
                      <Label htmlFor="update-existing">Update existing products</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="skip-header" defaultChecked />
                      <Label htmlFor="skip-header">First row contains headers</Label>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">Download Template</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get our product import template with required fields and format
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleImportProducts} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      "Import Products"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the product details to add to your inventory
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="attributes">Attributes</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="productName">Product Name <span className="text-red-500">*</span></Label>
                        <Input id="productName" placeholder="Enter product name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU <span className="text-red-500">*</span></Label>
                        <Input id="sku" placeholder="Enter stock keeping unit" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                        <Select>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {productCategories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode / UPC</Label>
                        <div className="flex gap-2">
                          <Input id="barcode" placeholder="Enter barcode or UPC" className="flex-grow" />
                          <Button variant="outline" size="icon" title="Generate Barcode">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Enter product description" rows={4} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit of Measure</Label>
                        <Select defaultValue="Each">
                          <SelectTrigger id="unit">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {productUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select defaultValue="Active">
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Discontinued">Discontinued</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="inventory" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="initialStock">Initial Stock <span className="text-red-500">*</span></Label>
                        <Input id="initialStock" type="number" min="0" defaultValue="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                        <Select>
                          <SelectTrigger id="location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.name}>
                                {location.name} ({location.zone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Reorder Level</Label>
                        <Input id="reorderLevel" type="number" min="0" defaultValue="10" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reorderQty">Reorder Quantity</Label>
                        <Input id="reorderQty" type="number" min="0" defaultValue="20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Select>
                          <SelectTrigger id="supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.name}>
                                {supplier.name} (Lead time: {supplier.leadTime} days)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leadTime">Lead Time (days)</Label>
                        <Input id="leadTime" type="number" min="0" defaultValue="7" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="hasVariants">Has Variants/Versions</Label>
                          <Switch id="hasVariants" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enable this if the product comes in different variants like colors, sizes, etc.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="pricing" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Unit Price <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input id="unitPrice" type="number" min="0" step="0.01" className="pl-7" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="costPrice">Cost Price <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input id="costPrice" type="number" min="0" step="0.01" className="pl-7" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax Rate</Label>
                        <Select>
                          <SelectTrigger id="taxRate">
                            <SelectValue placeholder="Select tax rate" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRates.map((tax) => (
                              <SelectItem key={tax.id} value={tax.rate.toString()}>
                                {tax.name} ({tax.rate}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input id="wholesalePrice" type="number" min="0" step="0.01" className="pl-7" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minPrice">Minimum Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input id="minPrice" type="number" min="0" step="0.01" className="pl-7" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input id="discount" type="number" min="0" max="100" defaultValue="0" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="attributes" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input id="weight" type="number" min="0" step="0.01" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dimensions">Dimensions (LxWxH cm)</Label>
                        <Input id="dimensions" placeholder="e.g., 30x20x10" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Custom Fields</Label>
                        <div className="border rounded-md p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Field name" defaultValue="Warranty" />
                            <Input placeholder="Field value" defaultValue="1 year" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Field name" defaultValue="Material" />
                            <Input placeholder="Field value" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="Field name" defaultValue="Color" />
                            <Input placeholder="Field value" />
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Field
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" placeholder="Additional notes about this product" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="images" className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="block mb-2">Product Images</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border-2 border-dashed rounded-lg p-6 text-center h-[180px] flex flex-col items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Primary Image</p>
                            <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to upload</p>
                            <Button variant="outline" size="sm">Upload Image</Button>
                          </div>
                          <div className="border-2 border-dashed rounded-lg p-6 text-center h-[180px] flex flex-col items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Additional Image</p>
                            <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to upload</p>
                            <Button variant="outline" size="sm">Upload Image</Button>
                          </div>
                          <div className="border-2 border-dashed rounded-lg p-6 text-center h-[180px] flex flex-col items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Additional Image</p>
                            <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to upload</p>
                            <Button variant="outline" size="sm">Upload Image</Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="block mb-2">Attachments</Label>
                        <div className="border rounded-md p-4">
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-medium">Upload Documents</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Upload product manuals, specifications, certifications, etc.
                            </p>
                            <Button variant="outline" size="sm">Upload Files</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setShowCreateProduct(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleCreateProduct}>
                    Add Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-400">Low Stock Alert</h4>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                {lowStockProducts.length} products are at or below reorder level and need attention.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockProducts.slice(0, 3).map((product: Product) => (
                  <Badge key={product.id} variant="outline" className="bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200">
                    {product.name}: {product.stockQuantity || 0} in stock
                  </Badge>
                ))}
                {lowStockProducts.length > 3 && (
                  <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/40">
                    +{lowStockProducts.length - 3} more
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                View All Low Stock Items
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage your product catalog and inventory
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="bulkSelectAll" className="sr-only">Select All</Label>
              <Checkbox
                id="bulkSelectAll"
                checked={allSelected}
                onCheckedChange={toggleAllSelection}
                aria-label="Select all products"
              />
              <Button variant="outline" size="sm" className="h-8" disabled={selectedProducts.length === 0}>
                <Trash className="h-4 w-4 mr-2" />
                Delete ({selectedProducts.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <span className="sr-only">Select</span>
                  </TableHead>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                    <div className="flex items-center">
                      Product Name
                      {sortField === "name" && (
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("stock")}>
                    <div className="flex items-center">
                      Stock
                      {sortField === "stock" && (
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("price")}>
                    <div className="flex items-center">
                      Price
                      {sortField === "price" && (
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No products found. Try adjusting your filters or search term.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product: Product) => (
                    <TableRow key={product.id} className={(product.stockQuantity || 0) <= (product.reorderPoint || 0) ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.id}</div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{product.stockQuantity || 0}</div>
                          {(product.stockQuantity || 0) <= (product.reorderPoint || 0) ? (
                            <div className="text-xs text-destructive font-medium">Low Stock</div>
                          ) : (product.stockQuantity || 0) <= (product.reorderPoint || 0) + 5 ? (
                            <div className="text-xs text-amber-600 dark:text-amber-500 font-medium">Getting Low</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${product.unitPrice.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Cost: ${product.costPrice.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === "Active" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewProductDetails(product)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowStockUpdate(true)}>
                              <PackageOpen className="h-4 w-4 mr-2" />
                              Update stock
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <History className="h-4 w-4 mr-2" />
                              View history
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash className="h-4 w-4 mr-2 text-red-600" />
                              Delete product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
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

      {/* Category and Inventory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventory Performance</CardTitle>
            <CardDescription>
              Stock levels and turnover analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
              <BarChart className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="font-medium">Inventory Value by Category</p>
              <p className="text-sm text-muted-foreground mt-1">(Chart showing inventory value distribution)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-xs text-muted-foreground">Total Items</h3>
                <p className="text-2xl font-bold mt-1">306</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% this month
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="text-xs text-muted-foreground">Low Stock Items</h3>
                <p className="text-2xl font-bold mt-1">{lowStockProducts.length}</p>
                <p className="text-xs text-destructive flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +3 since last week
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="text-xs text-muted-foreground">Inventory Value</h3>
                <p className="text-2xl font-bold mt-1">$142,580</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5.3% this month
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="text-xs text-muted-foreground">Turnover Rate</h3>
                <p className="text-2xl font-bold mt-1">4.3x</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +0.5 vs last quarter
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              Distribution across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-primary opacity-${(category.count / 24) * 100}`}></div>
                    <span>{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.count}</span>
                    <span className="text-xs text-muted-foreground">items</span>
                  </div>
                </div>
              ))}
              <Separator className="my-4" />
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name || 'Product Details'}</DialogTitle>
              <DialogDescription>
                {selectedProduct.id || 'N/A'} • {selectedProduct.sku || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Product Description</h3>
                      <p className="text-sm">{selectedProduct.description || 'No description available'}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-2">Basic Information</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Category:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.category || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Status:</dt>
                            <dd className="text-sm font-medium">
                              <Badge variant={(selectedProduct.status || 'Inactive') === "Active" ? "default" : "secondary"}>
                                {selectedProduct.status || 'Inactive'}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Barcode:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.barcode || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Dimensions:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.dimensions || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Weight:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.weight ? `${selectedProduct.weight} kg` : 'N/A'}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Vendor Information</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Supplier:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.supplier || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Lead Time:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.leadTime ? `${selectedProduct.leadTime} days` : 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Created On:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.created || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Last Updated:</dt>
                            <dd className="text-sm font-medium">{selectedProduct.updated || 'N/A'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Custom Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedProduct.customFields || {}).map(([key, value]) => (
                          <div key={key} className="border rounded-md p-3">
                            <h4 className="text-xs text-muted-foreground uppercase">{key}</h4>
                            <p className="font-medium mt-1">{value as string}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Notes</h3>
                      <div className="border rounded-md p-3">
                        <p className="text-sm">{selectedProduct.notes || 'No notes available'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="border rounded-md">
                      <div className="aspect-square bg-muted rounded-t-md flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Primary Image</h4>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {selectedProduct.images?.slice(0, 3).map((image: string, index: number) => (
                            <div key={index} className="h-12 w-12 bg-muted rounded-sm flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Attachments</h4>
                      {selectedProduct.attachments && selectedProduct.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {selectedProduct.attachments?.map((attachment, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-primary" />
                                <span className="text-sm">{attachment.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{attachment.size}</span>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground text-sm">No attachments</p>
                        </div>
                      )}
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">AI-Powered Insights</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/20 rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Demand Forecast</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Our AI predicts a 15% increase in demand for this product next quarter based on historical data and market trends.
                          </p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Suggested Reorder</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Optimal reorder quantity: 18 units (based on lead time, storage costs, and projected demand)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="stock" className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-3">Current Stock</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-3xl font-bold">{selectedProduct.stockQuantity || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Units</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Available:</span>
                            <span className="font-medium">{selectedProduct.available || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Allocated:</span>
                            <span className="font-medium">{selectedProduct.allocated || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Location:</span>
                            <span className="font-medium">{selectedProduct.location || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Stock Status</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Current Level</span>
                            <span className="font-medium">
                              {(((selectedProduct.stockQuantity || 0) / ((selectedProduct.reorderPoint || 1) * 2)) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress
                            value={((selectedProduct.stockQuantity || 0) / ((selectedProduct.reorderPoint || 1) * 2)) * 100}
                            className="h-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Reorder Level</p>
                            <p className="text-lg font-bold">{selectedProduct.reorderPoint || 0}</p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Reorder Qty</p>
                            <p className="text-lg font-bold">{selectedProduct.reorderQuantity || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button onClick={() => {
                            setStockUpdateType("adjustment");
                            setShowStockUpdate(true);
                          }}>
                            Update Stock
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setStockUpdateType("transfer");
                            setShowStockUpdate(true);
                          }}>
                            Transfer Stock
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-3">Stock Movement</h3>
                      <div className="h-[140px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <BarChart className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Stock level trends over time</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Recent Transactions</h3>
                        <Button variant="outline" size="sm">
                          <History className="h-4 w-4 mr-2" />
                          View All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 border rounded-md">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-sm">Stock Adjustment</p>
                              <p className="text-xs text-muted-foreground">April 20, 2023</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">+5 units</p>
                              <p className="text-xs text-muted-foreground">Warehouse A</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2 border rounded-md">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-sm">Sales Order #SO-2023-045</p>
                              <p className="text-xs text-muted-foreground">April 15, 2023</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-destructive">-2 units</p>
                              <p className="text-xs text-muted-foreground">Warehouse A</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2 border rounded-md">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-sm">Purchase Order #PO-2023-028</p>
                              <p className="text-xs text-muted-foreground">April 10, 2023</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">+15 units</p>
                              <p className="text-xs text-muted-foreground">Warehouse A</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="variants" className="pt-4 space-y-6">
                {selectedProduct.hasVariants ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Product Variants</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variant</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProduct.variants?.map((variant) => (
                            <TableRow key={variant.id}>
                              <TableCell className="font-medium">{variant.name}</TableCell>
                              <TableCell>{variant.sku}</TableCell>
                              <TableCell>{variant.stockQuantity || variant.stock || 0}</TableCell>
                              <TableCell>
                                <Badge variant={(variant.stockQuantity || variant.stock || 0) > 0 ? "default" : "secondary"}>
                                  {(variant.stockQuantity || variant.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="col-span-2 border rounded-md p-4">
                        <h3 className="font-medium mb-3">Variant Attributes</h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="mb-2 block">Memory</Label>
                            <div className="flex gap-2">
                              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">16GB RAM</Badge>
                              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">32GB RAM</Badge>
                              <Button variant="outline" size="sm" className="h-6">
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="mb-2 block">Storage</Label>
                            <div className="flex gap-2">
                              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">512GB SSD</Badge>
                              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">1TB SSD</Badge>
                              <Button variant="outline" size="sm" className="h-6">
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="mb-2 block">Color</Label>
                            <div className="flex gap-2">
                              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">Silver</Badge>
                              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">Black</Badge>
                              <Button variant="outline" size="sm" className="h-6">
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-3">Variant Options</h3>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Pricing
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Box className="h-4 w-4 mr-2" />
                            Generate Combinations
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <PackageOpen className="h-4 w-4 mr-2" />
                            Update All Stock
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-md">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Variants</h3>
                    <p className="text-muted-foreground mb-4">
                      This product doesn't have any variants. Variants are useful for products that come in different sizes, colors, or configurations.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variants
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="pricing" className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Pricing Information</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Cost Price</p>
                            <p className="text-lg font-bold">${selectedProduct.costPrice.toFixed(2)}</p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Unit Price</p>
                            <p className="text-lg font-bold">${selectedProduct.unitPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex-1 p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Profit Margin</p>
                            <p className="text-lg font-bold">
                              {(((selectedProduct.unitPrice - selectedProduct.costPrice) / selectedProduct.unitPrice) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Tax Rate</p>
                            <p className="text-lg font-bold">{selectedProduct.taxRate || 0}%</p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Tax Amount</p>
                            <p className="text-lg font-bold">
                              ${(selectedProduct.unitPrice * ((selectedProduct.taxRate || 0) / 100)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Price History</h3>
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <BarChart className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Price changes over time</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Special Pricing</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Wholesale Price</p>
                            <p className="text-lg font-bold">${(selectedProduct.unitPrice * 0.8).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-1">For orders ≥ 10 units</p>
                          </div>
                          <div className="p-3 border rounded-md">
                            <p className="text-xs text-muted-foreground">Minimum Price</p>
                            <p className="text-lg font-bold">${(selectedProduct.costPrice * 1.1).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-1">10% above cost</p>
                          </div>
                        </div>
                        <div className="p-3 border rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium">Volume Discounts</p>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Tier
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 bg-muted/20 rounded-md flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">10-24 units</p>
                                <p className="text-xs text-muted-foreground">5% discount</p>
                              </div>
                              <p className="text-sm font-medium">${(selectedProduct.unitPrice * 0.95).toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-muted/20 rounded-md flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">25-49 units</p>
                                <p className="text-xs text-muted-foreground">10% discount</p>
                              </div>
                              <p className="text-sm font-medium">${(selectedProduct.unitPrice * 0.9).toFixed(2)}</p>
                            </div>
                            <div className="p-2 bg-muted/20 rounded-md flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">50+ units</p>
                                <p className="text-xs text-muted-foreground">15% discount</p>
                              </div>
                              <p className="text-sm font-medium">${(selectedProduct.unitPrice * 0.85).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Customer-Specific Pricing</h3>
                      <div className="p-3 bg-muted/20 rounded-md mb-3">
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">Acme Corporation</p>
                          <p className="text-sm font-medium">${(selectedProduct.unitPrice * 0.9).toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">10% discount on all orders</p>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer Pricing
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">AI-Powered Price Optimization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/20 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Recommended Price</span>
                        </div>
                        <p className="text-md font-bold">${(selectedProduct.unitPrice * 1.05).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on market analysis, competitor pricing, and demand elasticity modeling, a 5% price increase is projected to increase profit margins without significantly impacting sales volume.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/20 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <GitBranch className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Competitive Analysis</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your current price point is 8% below the market average for similar products. The closest competitor price is $1,399.99 with inferior specifications.
                        </p>
                      </div>
                      <Button className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Apply AI Recommendations
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="pt-4 space-y-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Date & Time</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Old Value</TableHead>
                        <TableHead className="text-right">New Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">15 Apr 2023, 14:35</div>
                        </TableCell>
                        <TableCell>Price Updated</TableCell>
                        <TableCell>Sarah Johnson</TableCell>
                        <TableCell className="text-right">$1,199.99</TableCell>
                        <TableCell className="text-right">$1,299.99</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">10 Apr 2023, 10:12</div>
                        </TableCell>
                        <TableCell>Stock Adjustment</TableCell>
                        <TableCell>Michael Chen</TableCell>
                        <TableCell className="text-right">18</TableCell>
                        <TableCell className="text-right">23</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">28 Mar 2023, 16:48</div>
                        </TableCell>
                        <TableCell>Description Updated</TableCell>
                        <TableCell>Emma Wilson</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">15 Mar 2023, 09:22</div>
                        </TableCell>
                        <TableCell>Reorder Level Changed</TableCell>
                        <TableCell>David Rodriguez</TableCell>
                        <TableCell className="text-right">5</TableCell>
                        <TableCell className="text-right">10</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">10 Feb 2023, 11:05</div>
                        </TableCell>
                        <TableCell>Product Created</TableCell>
                        <TableCell>Sarah Johnson</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setShowProductDetails(false)}>
                Close
              </Button>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
              <Button>
                <Box className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={showStockUpdate} onOpenChange={setShowStockUpdate}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {stockUpdateType === "adjustment" ? "Stock Adjustment" : "Stock Transfer"}
            </DialogTitle>
            <DialogDescription>
              {stockUpdateType === "adjustment" 
                ? "Update the inventory stock levels for this product" 
                : "Transfer stock between warehouse locations"}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue={stockUpdateType} onValueChange={(value) => setStockUpdateType(value as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="adjustment">Adjustment</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
            <TabsContent value="adjustment" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="product">Product</Label>
                    <Select defaultValue={selectedProduct?.id || ""}>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 w-[140px]">
                    <Label htmlFor="currentStock">Current Stock</Label>
                    <Input id="currentStock" value={selectedProduct?.stockQuantity || 0} disabled />
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-3">Adjust Stock</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjustmentType">Adjustment Type</Label>
                      <Select defaultValue="increment">
                        <SelectTrigger id="adjustmentType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="increment">Add Stock (+)</SelectItem>
                          <SelectItem value="decrement">Remove Stock (-)</SelectItem>
                          <SelectItem value="set">Set to Value</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" type="number" min="0" defaultValue="1" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="reason">Reason for Adjustment</Label>
                    <Select defaultValue="purchase">
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase Order Received</SelectItem>
                        <SelectItem value="returned">Customer Return</SelectItem>
                        <SelectItem value="damaged">Damaged Goods</SelectItem>
                        <SelectItem value="correction">Inventory Correction</SelectItem>
                        <SelectItem value="theft">Theft or Loss</SelectItem>
                        <SelectItem value="expired">Expired Items</SelectItem>
                        <SelectItem value="other">Other (Please Specify)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Enter any additional details about this adjustment" />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="transfer" className="pt-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="transferProduct">Product</Label>
                    <Select defaultValue={selectedProduct?.id || ""}>
                      <SelectTrigger id="transferProduct">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 w-[140px]">
                    <Label htmlFor="transferCurrentStock">Available</Label>
                    <Input id="transferCurrentStock" value={selectedProduct?.available || 0} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceLocation">From Location</Label>
                    <Select defaultValue={selectedProduct?.location || ""}>
                      <SelectTrigger id="sourceLocation">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destinationLocation">To Location</Label>
                    <Select>
                      <SelectTrigger id="destinationLocation">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferQuantity">Quantity to Transfer</Label>
                  <Input id="transferQuantity" type="number" min="1" max={selectedProduct?.available || 1} defaultValue="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferReasonNotes">Reason / Notes</Label>
                  <Textarea id="transferReasonNotes" placeholder="Enter reason for transfer and any additional notes" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowStockUpdate(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleStockUpdate}>
              {stockUpdateType === "adjustment" ? "Update Stock" : "Transfer Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCatalog;