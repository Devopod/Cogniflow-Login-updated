import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Archive,
  ArrowDownUp,
  CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger, 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { useQuery } from '@tanstack/react-query';
import { useProducts } from '@/hooks/use-inventory-data';
import { useWebSocket } from '@/hooks/use-websocket';

// Purchase orders will be fetched from backend

// Payment terms
const paymentTerms = [
  "Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt", "50% Advance", "Custom"
];

// Shipping methods
const shippingMethods = [
  "Standard Shipping", "Express Shipping", "Overnight", "UPS Ground", "FedEx", "DHL", "Freight", "Pickup"
];

// Helper function for status badges
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Draft":
      return <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Draft</Badge>;
    case "Pending":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Pending</Badge>;
    case "Approved":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Approved</Badge>;
    case "Partially Received":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Partially Received</Badge>;
    case "Received":
      return <Badge className="bg-green-500 text-white">Received</Badge>;
    case "Cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Helper function for payment status badges
const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case "Paid":
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    case "Partially Paid":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Partially Paid</Badge>;
    case "Pending":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Pending</Badge>;
    case "Not Invoiced":
      return <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Not Invoiced</Badge>;
    case "Overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Main component
const PurchaseOrders = () => {
  const { toast } = useToast();
  
  // Dynamic data hooks
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/purchase/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/purchase/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      return data.suppliers || data; // normalize
    }
  });

  const { data: products = [], isLoading: isLoadingProducts } = useProducts({ limit: 200 });
  
  // Real-time updates via WebSocket
  useWebSocket({
    resource: 'purchase',
    invalidateQueries: [['/api/purchase/suppliers'], ['/api/inventory/products'], ['/api/purchase/orders']]
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [showPODetails, setShowPODetails] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [newPOItems, setNewPOItems] = useState<any[]>([{ id: 1, productId: "", quantity: 1, unitPrice: 0, total: 0 }]);
  const [selectedSupplierForNewPO, setSelectedSupplierForNewPO] = useState<string>("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>();
  
  // Backend-driven purchase orders
  const { data: poResponse, isLoading: isLoadingPOs } = useQuery({
    queryKey: ['/api/purchase/orders', { status: statusFilter, supplierId: selectedSupplier }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedSupplier) params.append('supplierId', selectedSupplier);
      const res = await fetch(`/api/purchase/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch purchase orders');
      return res.json();
    }
  });

  const purchaseOrders = poResponse?.orders || [];

  // Filter purchase orders (client-side extras like search and date)
  const filteredPOs = purchaseOrders.filter((po: any) => {
    // Search filter
    const supplierName = po?.supplier?.name || po.supplierName || '';
    const poId = po?.order?.orderNumber || po.id || '';
    const matchesSearch = 
      String(poId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(supplierName).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    if (dateRange.from) {
      const poDate = new Date(po?.order?.orderDate || po.dateCreated || po.createdAt);
      if (dateRange.to) {
        matchesDate = poDate >= dateRange.from && poDate <= dateRange.to;
      } else {
        matchesDate = poDate >= dateRange.from;
      }
    }
    
    return matchesSearch && matchesDate;
  });
  
  // View purchase order details
  const viewPODetails = (po: any) => {
    setSelectedPO(po);
    setShowPODetails(true);
  };
  
  // Calculate totals for new PO
  const calculateItemTotal = (item: any) => {
    return item.quantity * item.unitPrice;
  };
  
  // Add a new item to the new PO
  const addNewItem = () => {
    const newItem = {
      id: newPOItems.length + 1,
      productId: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setNewPOItems([...newPOItems, newItem]);
  };
  
  // Remove an item from the new PO
  const removeItem = (itemId: number) => {
    if (newPOItems.length > 1) {
      setNewPOItems(newPOItems.filter(item => item.id !== itemId));
    } else {
      toast({
        title: "Cannot remove item",
        description: "A purchase order must have at least one item",
        variant: "destructive",
      });
    }
  };
  
  // Update item details
  const updateItem = (itemId: number, field: string, value: any) => {
    const updatedItems = newPOItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // If product ID changed, update unitPrice from products
        if (field === "productId" && value) {
          const selectedProduct = products.find(p => p.id === value);
          if (selectedProduct) {
            updatedItem.unitPrice = selectedProduct.unitPrice;
          }
        }
        
        // Recalculate total
        if (field === "productId" || field === "quantity" || field === "unitPrice") {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setNewPOItems(updatedItems);
  };
  
  // Calculate total amount for new PO
  const calculateTotalAmount = () => {
    return newPOItems.reduce((sum, item) => sum + item.total, 0);
  };
  
  // Create purchase order
  const handleCreatePO = async () => {
    // Validation
    if (!selectedSupplierForNewPO) {
      toast({ title: "Supplier required", description: "Please select a supplier", variant: "destructive" });
      return;
    }
    if (newPOItems.some(item => !item.productId)) {
      toast({ title: "Incomplete items", description: "Please select products for all items", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        supplierId: Number(selectedSupplierForNewPO),
        expectedDeliveryDate: expectedDeliveryDate?.toISOString() || null,
        items: newPOItems.map(i => ({ productId: Number(i.productId), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }))
      };
      const res = await fetch('/api/purchase/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create purchase order');
      toast({ title: "Purchase order created", description: "Purchase order has been created successfully" });
      setShowCreatePO(false);
      setSelectedSupplierForNewPO("");
      setNewPOItems([{ id: 1, productId: "", quantity: 1, unitPrice: 0, total: 0 }]);
      setExpectedDeliveryDate(undefined);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || 'Failed to create purchase order', variant: 'destructive' });
    }
  };

  // Mark as received
  const markAsReceived = () => {
    toast({
      title: "Order received",
      description: `Purchase order ${selectedPO?.id} has been marked as received`,
    });
    setShowPODetails(false);
  };
  
  // Print purchase order
  const printPO = () => {
    toast({
      title: "Printing purchase order",
      description: `Preparing ${selectedPO?.id} for printing`,
    });
  };
  
  // Send to supplier
  const sendToSupplier = () => {
    toast({
      title: "Sent to supplier",
      description: `Purchase order ${selectedPO?.id} has been sent to ${selectedPO?.supplierName}`,
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">
            Manage your purchase orders and supplier transactions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] md:w-[280px]"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Partially Received">Partially Received</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 h-10">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "From Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "To Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                            initialFocus
                            disabled={(date) => dateRange.from ? date < dateRange.from : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select
                      value={selectedSupplier}
                      onValueChange={setSelectedSupplier}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Suppliers</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    className="text-sm h-8" 
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setSelectedSupplier("");
                    }}
                  >
                    Reset Filters
                  </Button>
                  <Button className="text-sm h-8">Apply Filters</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={showCreatePO} onOpenChange={setShowCreatePO}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                  <DialogTitle>Create Purchase Order</DialogTitle>
                  <DialogDescription>
                    Create a new purchase order for suppliers. Fill in all required information.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="items">Items</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping & Notes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="poSupplier">Supplier <span className="text-red-500">*</span></Label>
                        <Select
                          value={selectedSupplierForNewPO}
                          onValueChange={setSelectedSupplierForNewPO}
                        >
                          <SelectTrigger id="poSupplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedSupplierForNewPO && (
                        <div className="space-y-2">
                          <Label>Contact Information</Label>
                          <div className="border rounded-md p-3 text-sm space-y-1">
                            {(() => {
                              const supplier = suppliers.find(s => s.id.toString() === selectedSupplierForNewPO);
                              return supplier ? (
                                <>
                                  <p><span className="font-medium">Contact:</span> {supplier.contactPerson}</p>
                                  <p><span className="font-medium">Email:</span> {supplier.email}</p>
                                  <p><span className="font-medium">Phone:</span> {supplier.phone}</p>
                                  <p><span className="font-medium">Terms:</span> {supplier.paymentTerms}</p>
                                </>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="poDate">Order Date</Label>
                        <Input id="poDate" type="text" value={format(new Date(), "MMM dd, yyyy")} disabled />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select defaultValue="Net 30">
                          <SelectTrigger id="paymentTerms">
                            <SelectValue placeholder="Select payment terms" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentTerms.map((term) => (
                              <SelectItem key={term} value={term}>
                                {term}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !expectedDeliveryDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {expectedDeliveryDate ? format(expectedDeliveryDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={expectedDeliveryDate}
                              onSelect={setExpectedDeliveryDate}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="poReference">Reference Number (Optional)</Label>
                        <Input id="poReference" placeholder="REQ-2023-042" />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="items" className="pt-4">
                    <div className="space-y-4">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40%]">Product</TableHead>
                              <TableHead className="w-[15%]">Quantity</TableHead>
                              <TableHead className="w-[20%]">Unit Price</TableHead>
                              <TableHead className="w-[20%]">Total</TableHead>
                              <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newPOItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Select
                                    value={item.productId}
                                    onValueChange={(value) => updateItem(item.id, "productId", value)}
                                  >
                                    <SelectTrigger id={`product-${item.id}`}>
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name} ({product.sku})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="pl-7"
                                      value={item.unitPrice}
                                      onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    ${calculateItemTotal(item).toFixed(2)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                    disabled={newPOItems.length === 1}
                                  >
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={addNewItem}
                        >
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                        
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                          <div className="text-2xl font-bold">${calculateTotalAmount().toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="shipping" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="shippingAddress">Shipping Address</Label>
                        <Textarea
                          id="shippingAddress"
                          rows={3}
                          defaultValue="1234 Business Park, Suite 100, San Francisco, CA 94107"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="shippingMethod">Shipping Method</Label>
                        <Select defaultValue="Standard Shipping">
                          <SelectTrigger id="shippingMethod">
                            <SelectValue placeholder="Select shipping method" />
                          </SelectTrigger>
                          <SelectContent>
                            {shippingMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="shippingCost">Shipping Cost (Optional)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input id="shippingCost" type="number" min="0" step="0.01" className="pl-7" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="poNotes">Notes</Label>
                        <Textarea
                          id="poNotes"
                          rows={3}
                          placeholder="Additional notes or special instructions for this purchase order..."
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label>Attachments (Optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">
                            Drag and drop files here, or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Supports PDF, DOCX, XLSX, PNG, JPG, etc. (max 5MB)
                          </p>
                          <Button variant="outline" size="sm">
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setShowCreatePO(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleCreatePO}>
                    Create Purchase Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Purchase orders table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            Manage orders from suppliers and track their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No purchase orders found. Try adjusting your filters or create a new order.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.id}</TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell>{po.dateCreated}</TableCell>
                      <TableCell>${po.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(po.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewPODetails(po)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            {po.status !== "Cancelled" && po.status !== "Received" && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit order
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send to supplier
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {po.status === "Approved" || po.status === "Pending" ? (
                              <DropdownMenuItem>
                                <PackageCheck className="h-4 w-4 mr-2" />
                                Mark as received
                              </DropdownMenuItem>
                            ) : null}
                            {po.status === "Draft" ? (
                              <DropdownMenuItem>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Submit for approval
                              </DropdownMenuItem>
                            ) : null}
                            {po.status !== "Cancelled" && po.status !== "Received" ? (
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Cancel order
                              </DropdownMenuItem>
                            ) : null}
                            {po.status === "Cancelled" ? (
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy to new
                              </DropdownMenuItem>
                            ) : null}
                            {po.status === "Received" && po.paymentStatus !== "Paid" ? (
                              <DropdownMenuItem>
                                <FileCheck className="h-4 w-4 mr-2" />
                                Record payment
                              </DropdownMenuItem>
                            ) : null}
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
            Showing {filteredPOs.length} of {purchaseOrders.length} purchase orders
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

      {/* Purchase order details dialog */}
      {selectedPO && (
        <Dialog open={showPODetails} onOpenChange={setShowPODetails}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-xl">{selectedPO.id}</DialogTitle>
                  <DialogDescription>
                    Created on {selectedPO.dateCreated}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedPO.status)}
                  {getPaymentStatusBadge(selectedPO.paymentStatus)}
                </div>
              </div>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Supplier</p>
                        <p className="font-medium">{selectedPO.supplierName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Payment Terms</p>
                        <p className="font-medium">{selectedPO.terms}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Expected Delivery</p>
                        <p className="font-medium">{selectedPO.expectedDelivery || "Not specified"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Actual Delivery</p>
                        <p className="font-medium">{selectedPO.actualDelivery || "Not delivered yet"}</p>
                      </div>
                      {selectedPO.shipping && (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Shipping Method</p>
                            <p className="font-medium">{selectedPO.shipping.method}</p>
                          </div>
                          {selectedPO.shipping.trackingNumber && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Tracking Number</p>
                              <p className="font-medium">{selectedPO.shipping.trackingNumber}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Shipping Address</h3>
                      <p className="text-sm">
                        {selectedPO.shipping?.address || "No shipping address specified"}
                      </p>
                    </div>
                    
                    {selectedPO.receivingNotes && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Receiving Notes</h3>
                        <div className="p-3 border rounded-md bg-muted/20">
                          <p className="text-sm">{selectedPO.receivingNotes}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedPO.notes && (
                      <div className="space-y-2">
                        <h3 className="font-medium">Notes</h3>
                        <div className="p-3 border rounded-md">
                          <p className="text-sm">{selectedPO.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">${selectedPO.totalAmount.toFixed(2)}</span>
                        </div>
                        {selectedPO.shipping?.cost && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span className="font-medium">${selectedPO.shipping.cost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span className="font-medium">${(selectedPO.totalAmount * 0.08).toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="font-medium">Total</span>
                          <span className="font-bold">
                            ${(selectedPO.totalAmount + (selectedPO.shipping?.cost || 0) + (selectedPO.totalAmount * 0.08)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Related Documents</h3>
                      {selectedPO.relatedDocuments && selectedPO.relatedDocuments.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPO.relatedDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-sm font-medium">{doc.type} {doc.id}</p>
                                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                                </div>
                              </div>
                              {doc.amount && (
                                <span className="text-sm font-medium">${doc.amount.toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No related documents</p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <Button onClick={printPO} variant="outline" className="w-full">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Purchase Order
                      </Button>
                      {selectedPO.status === "Approved" && (
                        <Button onClick={sendToSupplier} variant="outline" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send to Supplier
                        </Button>
                      )}
                      {(selectedPO.status === "Approved" || selectedPO.status === "Pending") && (
                        <Button onClick={markAsReceived} className="w-full">
                          <PackageCheck className="h-4 w-4 mr-2" />
                          Mark as Received
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="items" className="pt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.productId}</div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">${selectedPO.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="pt-4">
                {selectedPO.approvalWorkflow ? (
                  <div className="space-y-4">
                    <h3 className="font-medium">Approval Workflow</h3>
                    <div className="relative">
                      <div className="absolute left-3 top-4 bottom-3 w-0.5 bg-muted"></div>
                      <div className="space-y-6 ml-6">
                        {selectedPO.approvalWorkflow.map((step, index) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-6 top-0">
                              {step.status === "Completed" ? (
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              ) : step.status === "Pending" ? (
                                <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Clock className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-muted-foreground flex items-center justify-center">
                                  <XCircle className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{step.step}</div>
                              <div className="text-xs text-muted-foreground">
                                {step.status === "Pending" ? (
                                  "Awaiting approval"
                                ) : (
                                  <>
                                    {step.user} - {step.date}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No History Available</h3>
                    <p className="text-muted-foreground">
                      This purchase order doesn't have any recorded history or approval workflow.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="documents" className="pt-4">
                {selectedPO.attachments && selectedPO.attachments.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-medium">Attachments</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPO.attachments.map((attachment, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-muted p-2 rounded">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium">{attachment.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-muted-foreground">{attachment.type} · {attachment.size}</p>
                                <p className="text-xs text-muted-foreground">{attachment.date}</p>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Document
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Documents Available</h3>
                    <p className="text-muted-foreground mb-4">
                      This purchase order doesn't have any attached documents.
                    </p>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Purchase Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                <h2 className="text-3xl font-bold">{purchaseOrders.length}</h2>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Orders</p>
                <h2 className="text-3xl font-bold">
                  {purchaseOrders.filter(po => po.status === "Pending" || po.status === "Approved").length}
                </h2>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Awaiting delivery
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Spent</p>
                <h2 className="text-3xl font-bold">
                  ${purchaseOrders
                      .filter(po => po.status === "Received" || po.status === "Partially Received")
                      .reduce((sum, po) => sum + po.totalAmount, 0)
                      .toFixed(2)}
                </h2>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Year to date
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Delivery Time</p>
                <h2 className="text-3xl font-bold">8.5 days</h2>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-full">
                <Truck className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              From order to receipt
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI-Powered Insights Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>AI-Powered Purchasing Insights</CardTitle>
              <CardDescription>
                Advanced analytics and recommendations for optimizing your procurement process
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <h3 className="text-lg font-medium">Supply Chain Prediction</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Based on historical data and market conditions, we predict a 12% increase in raw material costs next quarter. Consider increasing inventory of key materials.
              </p>
              <Button variant="link" className="px-0 mt-2">View detailed forecast</Button>
            </div>
            
            <div className="p-4 border rounded-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <RefreshCw className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
              <h3 className="text-lg font-medium">Supplier Optimization</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Consolidating orders from Office Supplies Direct could save approximately 15% through bulk discounts. Consider negotiating new contract terms.
              </p>
              <Button variant="link" className="px-0 mt-2">View supplier analysis</Button>
            </div>
            
            <div className="p-4 border rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
              <h3 className="text-lg font-medium">Risk Assessment</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enterprise IT Solutions has had delivery delays on 40% of recent orders. Consider diversifying suppliers for critical IT equipment.
              </p>
              <Button variant="link" className="px-0 mt-2">View risk report</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrders;