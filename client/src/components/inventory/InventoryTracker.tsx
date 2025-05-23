import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  MinusCircle,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  PlusCircle,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Sample warehouse data
const warehouses = [
  {
    id: 1,
    name: "Main Warehouse",
    location: "123 Main Street, Cityville",
    capacity: 10000,
    utilization: 7500,
    bins: 150,
    manager: "John Smith",
    status: "Active"
  },
  {
    id: 2,
    name: "East Branch",
    location: "456 East Avenue, Townsville",
    capacity: 5000,
    utilization: 3200,
    bins: 80,
    manager: "Sarah Johnson",
    status: "Active"
  },
  {
    id: 3,
    name: "West Distribution Center",
    location: "789 West Road, Villageton",
    capacity: 15000,
    utilization: 9800,
    bins: 200,
    manager: "Michael Chen",
    status: "Active"
  }
];

// Sample inventory transactions
const inventoryTransactions = [
  {
    id: "TRX-001",
    date: "2023-05-15",
    type: "Stock In",
    product: "Enterprise Suite",
    quantity: 100,
    warehouse: "Main Warehouse",
    bin: "A12-B34",
    reference: "PO-2023-052",
    createdBy: "John Smith"
  },
  {
    id: "TRX-002",
    date: "2023-05-12",
    type: "Stock Out",
    product: "Professional Plan",
    quantity: 25,
    warehouse: "East Branch",
    bin: "C56-D78",
    reference: "SO-2023-045",
    createdBy: "Sarah Johnson"
  },
  {
    id: "TRX-003",
    date: "2023-05-10",
    type: "Adjustment",
    product: "Standard Plan",
    quantity: 5,
    warehouse: "Main Warehouse",
    bin: "E90-F12",
    reference: "ADJ-2023-007",
    createdBy: "Michael Chen"
  },
  {
    id: "TRX-004",
    date: "2023-05-08",
    type: "Transfer",
    product: "Enterprise Suite",
    quantity: 50,
    warehouse: "West Distribution Center",
    bin: "G34-H56",
    reference: "TRF-2023-012",
    createdBy: "Jane Wilson"
  },
  {
    id: "TRX-005",
    date: "2023-05-05",
    type: "Stock Return",
    product: "Implementation Services",
    quantity: 2,
    warehouse: "Main Warehouse",
    bin: "I78-J90",
    reference: "RET-2023-003",
    createdBy: "David Rodriguez"
  }
];

// Sample low stock items
const lowStockItems = [
  {
    id: "PRD-002",
    name: "Professional Plan",
    sku: "PRO-PLAN-001",
    stockLevel: 50,
    reorderLevel: 200,
    warehouse: "East Branch",
    bin: "C56-D78",
    lastRestock: "2023-04-15"
  },
  {
    id: "PRD-005",
    name: "Implementation Services",
    sku: "SVC-IMPL-001",
    stockLevel: 8,
    reorderLevel: 10,
    warehouse: "Main Warehouse",
    bin: "I78-J90",
    lastRestock: "2023-04-02"
  },
  {
    id: "PRD-007",
    name: "Support Plan",
    sku: "SVC-SUPP-001",
    stockLevel: 45,
    reorderLevel: 50,
    warehouse: "West Distribution Center",
    bin: "K12-L34",
    lastRestock: "2023-04-10"
  }
];

// Sample inventory movements for the chart
const inventoryMovements = [
  { month: "Jan", in: 500, out: 350 },
  { month: "Feb", in: 650, out: 400 },
  { month: "Mar", in: 400, out: 450 },
  { month: "Apr", in: 700, out: 600 },
  { month: "May", in: 800, out: 550 },
  { month: "Jun", in: 0, out: 0 }
];

const InventoryTracker = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState("stockIn");
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [isStockCountOpen, setIsStockCountOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter inventory transactions based on search term, type, and warehouse
  const filteredTransactions = inventoryTransactions.filter((transaction) => {
    const matchesSearch = 
      transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesWarehouse = warehouseFilter === "all" || transaction.warehouse === warehouseFilter;
    
    return matchesSearch && matchesType && matchesWarehouse;
  });

  // Handle transaction creation
  const handleCreateTransaction = () => {
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setShowTransactionDialog(false);
      toast({
        title: "Transaction recorded",
        description: `Inventory ${transactionType === "stockIn" ? "stock in" : transactionType === "stockOut" ? "stock out" : "adjustment"} has been recorded successfully`,
      });
    }, 1500);
  };

  // Handle warehouse dialog actions
  const handleWarehouseAction = () => {
    setWarehouseDialogOpen(false);
    toast({
      title: "Warehouse updated",
      description: "Warehouse information has been updated successfully",
    });
  };

  // Handle stock count
  const handleStockCount = () => {
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsStockCountOpen(false);
      toast({
        title: "Stock count completed",
        description: "Inventory has been updated based on the stock count",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Tracker</h2>
          <p className="text-muted-foreground">
            Track stock movements and warehouse inventory
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Stock In">Stock In</SelectItem>
                <SelectItem value="Stock Out">Stock Out</SelectItem>
                <SelectItem value="Adjustment">Adjustment</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Stock Return">Stock Return</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={warehouseFilter}
              onValueChange={setWarehouseFilter}
            >
              <SelectTrigger className="w-[150px]">
                <Warehouse className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.name}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PackagePlus className="h-4 w-4 mr-2" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Record Inventory Transaction</DialogTitle>
                  <DialogDescription>
                    Enter the details of the inventory movement
                  </DialogDescription>
                </DialogHeader>
                <Tabs
                  defaultValue="stockIn"
                  className="mt-4"
                  onValueChange={(value) => setTransactionType(value)}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="stockIn">
                      <PackagePlus className="h-4 w-4 mr-2" />
                      Stock In
                    </TabsTrigger>
                    <TabsTrigger value="stockOut">
                      <PackageMinus className="h-4 w-4 mr-2" />
                      Stock Out
                    </TabsTrigger>
                    <TabsTrigger value="adjustment">
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      Adjustment
                    </TabsTrigger>
                  </TabsList>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product" className="text-right">
                        Product
                      </Label>
                      <div className="col-span-3">
                        <Select>
                          <SelectTrigger id="product">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enterprise">Enterprise Suite</SelectItem>
                            <SelectItem value="professional">Professional Plan</SelectItem>
                            <SelectItem value="standard">Standard Plan</SelectItem>
                            <SelectItem value="basic">Basic Plan</SelectItem>
                            <SelectItem value="implementation">Implementation Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantity" className="text-right">
                        Quantity
                      </Label>
                      <div className="col-span-3">
                        <Input id="quantity" type="number" min="1" placeholder="Enter quantity" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="warehouse" className="text-right">
                        Warehouse
                      </Label>
                      <div className="col-span-3">
                        <Select>
                          <SelectTrigger id="warehouse">
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.name}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="bin" className="text-right">
                        Bin/Location
                      </Label>
                      <div className="col-span-3">
                        <Input id="bin" placeholder="Enter bin location" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="reference" className="text-right">
                        Reference
                      </Label>
                      <div className="col-span-3">
                        <Input id="reference" placeholder={
                          transactionType === "stockIn" ? "Purchase Order #" :
                          transactionType === "stockOut" ? "Sales Order #" :
                          "Adjustment Reference #"
                        } />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right">
                        Notes
                      </Label>
                      <div className="col-span-3">
                        <Input id="notes" placeholder="Additional information" />
                      </div>
                    </div>
                  </div>
                </Tabs>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleCreateTransaction} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Record Transaction"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsStockCountOpen(true)}>
                  <PackageCheck className="h-4 w-4 mr-2" />
                  Stock Count
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setWarehouseDialogOpen(true)}>
                  <Warehouse className="h-4 w-4 mr-2" />
                  Manage Warehouses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Truck className="h-4 w-4 mr-2" />
                  Manage Transfers
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Barcodes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Reports
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-base">{warehouse.name}</CardTitle>
                <Badge variant={warehouse.status === "Active" ? "default" : "outline"}>
                  {warehouse.status}
                </Badge>
              </div>
              <CardDescription>{warehouse.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Capacity Utilization</span>
                    <span className="font-medium">
                      {Math.round((warehouse.utilization / warehouse.capacity) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(warehouse.utilization / warehouse.capacity) * 100} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{warehouse.utilization} items</span>
                    <span>of {warehouse.capacity} capacity</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Bins/Locations</span>
                    <span className="font-medium">{warehouse.bins}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="font-medium">{warehouse.manager}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Inventory movements and adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="hidden lg:table-cell">Warehouse</TableHead>
                  <TableHead className="hidden lg:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.type === "Stock In" ? "default" :
                          transaction.type === "Stock Out" ? "destructive" :
                          transaction.type === "Adjustment" ? "secondary" :
                          transaction.type === "Transfer" ? "outline" : "secondary"
                        }>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{transaction.product}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {transaction.type === "Stock In" || transaction.type === "Stock Return" ? (
                            <PlusCircle className="h-4 w-4 text-green-500" />
                          ) : transaction.type === "Stock Out" ? (
                            <MinusCircle className="h-4 w-4 text-red-500" />
                          ) : transaction.type === "Transfer" ? (
                            <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArrowDownUp className="h-4 w-4 text-yellow-500" />
                          )}
                          {transaction.quantity}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{transaction.warehouse}</TableCell>
                      <TableCell className="hidden lg:table-cell">{transaction.reference}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Print receipt</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Reverse transaction</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock and Inventory Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>
                  Products that need reordering
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Truck className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Reorder Level</TableHead>
                    <TableHead className="hidden md:table-cell">Warehouse</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.sku}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.stockLevel <= 0 ? "destructive" : "secondary"}>
                          {item.stockLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{item.reorderLevel}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.warehouse}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Stats</CardTitle>
            <CardDescription>
              Stock movement analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <PackagePlus className="h-5 w-5" />
                    <span className="font-medium">Total Stock In</span>
                  </div>
                  <div className="text-2xl font-bold">2,450</div>
                  <div className="text-sm text-muted-foreground mt-1">Last 30 days</div>
                </div>
                <div className="bg-destructive/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <PackageMinus className="h-5 w-5" />
                    <span className="font-medium">Total Stock Out</span>
                  </div>
                  <div className="text-2xl font-bold">1,950</div>
                  <div className="text-sm text-muted-foreground mt-1">Last 30 days</div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Stock Movement</h3>
                    <p className="text-sm text-muted-foreground">In vs Out by month</p>
                  </div>
                  <Select defaultValue="6months">
                    <SelectTrigger className="w-[130px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="1year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="h-[200px] w-full bg-secondary/20 rounded-md flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                    <p>Inventory Movement Chart</p>
                    <p className="text-sm">(Stock In vs Stock Out visual representation)</p>
                  </div>
                </div>
                
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm">Stock In</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <span className="text-sm">Stock Out</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Count Dialog */}
      <Dialog open={isStockCountOpen} onOpenChange={setIsStockCountOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Physical Stock Count</DialogTitle>
            <DialogDescription>
              Record the results of a physical inventory count
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="count-date" className="text-right">
                Count Date
              </Label>
              <div className="col-span-3">
                <Input id="count-date" type="date" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="count-warehouse" className="text-right">
                Warehouse
              </Label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger id="count-warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[100px] text-center">System Qty</TableHead>
                    <TableHead className="w-[100px] text-center">Actual Qty</TableHead>
                    <TableHead className="w-[100px] text-center">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      Enterprise Suite<br />
                      <span className="text-xs text-muted-foreground">ENT-SUITE-001</span>
                    </TableCell>
                    <TableCell className="text-center">1000</TableCell>
                    <TableCell>
                      <Input type="number" className="w-20 mx-auto text-center" defaultValue={985} />
                    </TableCell>
                    <TableCell className="text-center text-red-500">-15</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Professional Plan<br />
                      <span className="text-xs text-muted-foreground">PRO-PLAN-001</span>
                    </TableCell>
                    <TableCell className="text-center">2000</TableCell>
                    <TableCell>
                      <Input type="number" className="w-20 mx-auto text-center" defaultValue={2010} />
                    </TableCell>
                    <TableCell className="text-center text-green-500">+10</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Standard Plan<br />
                      <span className="text-xs text-muted-foreground">STD-PLAN-001</span>
                    </TableCell>
                    <TableCell className="text-center">5000</TableCell>
                    <TableCell>
                      <Input type="number" className="w-20 mx-auto text-center" defaultValue={5000} />
                    </TableCell>
                    <TableCell className="text-center">0</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="count-notes" className="text-right">
                Notes
              </Label>
              <div className="col-span-3">
                <Input id="count-notes" placeholder="Additional information about the stock count" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockCountOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleStockCount} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit Count
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Management Dialog */}
      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Warehouse Management</DialogTitle>
            <DialogDescription>
              View and manage warehouse locations
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="warehouses" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="warehouses">
                <Warehouse className="h-4 w-4 mr-2" />
                Warehouses
              </TabsTrigger>
              <TabsTrigger value="locations">
                <PackageCheck className="h-4 w-4 mr-2" />
                Bin Locations
              </TabsTrigger>
            </TabsList>
            <TabsContent value="warehouses" className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium">Warehouse List</h3>
                  <p className="text-sm text-muted-foreground">Manage storage facilities</p>
                </div>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Warehouse
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[80px] text-center">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell>{warehouse.location}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={warehouse.status === "Active" ? "default" : "outline"}>
                            {warehouse.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="locations" className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium">Bin Locations</h3>
                  <p className="text-sm text-muted-foreground">Manage storage locations within warehouses</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="main">
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Warehouse</SelectItem>
                      <SelectItem value="east">East Branch</SelectItem>
                      <SelectItem value="west">West Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bin Code</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead className="text-center">Capacity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">A12-B34</TableCell>
                      <TableCell>Storage Zone A</TableCell>
                      <TableCell className="text-center">500</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">C56-D78</TableCell>
                      <TableCell>Storage Zone B</TableCell>
                      <TableCell className="text-center">350</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">E90-F12</TableCell>
                      <TableCell>Storage Zone C</TableCell>
                      <TableCell className="text-center">250</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWarehouseAction}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTracker;