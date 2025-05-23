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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  CalendarIcon,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Package,
  PackageCheck,
  Plus,
  PrinterIcon,
  RefreshCw,
  Search,
  Settings,
  Truck,
  Trash2,
  Settings2,
  Edit,
  Box,
  Layers,
  AlertCircle,
  XCircle,
  CheckSquare,
  Clock,
} from "lucide-react";

// Sample GRN data
const sampleGRNs = [
  {
    id: "GRN-0001",
    poReference: "PO-0035",
    supplier: "TechPro Supplies",
    warehouse: "Main Warehouse",
    receivedBy: "John Smith",
    receivedDate: "2023-04-15T10:30:00Z",
    status: "Completed",
    notes: "All items received in good condition",
    items: [
      {
        id: 1,
        productId: "PROD-1001",
        productName: "Office Chair - Executive",
        ordered: 10,
        received: 10,
        unit: "Pieces",
        condition: "Good"
      },
      {
        id: 2,
        productId: "PROD-1002",
        productName: "Desk Lamp - Adjustable",
        ordered: 15,
        received: 15,
        unit: "Pieces",
        condition: "Good"
      }
    ]
  },
  {
    id: "GRN-0002",
    poReference: "PO-0036",
    supplier: "Office Essentials Ltd",
    warehouse: "Downtown Store",
    receivedBy: "Sarah Johnson",
    receivedDate: "2023-04-16T14:45:00Z",
    status: "Partially Received",
    notes: "Some items pending delivery next week",
    items: [
      {
        id: 3,
        productId: "PROD-2001",
        productName: "Filing Cabinet",
        ordered: 5,
        received: 3,
        unit: "Pieces",
        condition: "Good"
      },
      {
        id: 4,
        productId: "PROD-2002",
        productName: "Desktop Organizer",
        ordered: 20,
        received: 20,
        unit: "Pieces",
        condition: "Good"
      }
    ]
  },
  {
    id: "GRN-0003",
    poReference: "PO-0040",
    supplier: "Global Furniture Inc",
    warehouse: "Main Warehouse",
    receivedBy: "Michael Chen",
    receivedDate: "2023-04-20T09:15:00Z",
    status: "Completed",
    notes: "Delivery received ahead of schedule",
    items: [
      {
        id: 5,
        productId: "PROD-3001",
        productName: "Conference Table",
        ordered: 2,
        received: 2,
        unit: "Pieces",
        condition: "Good"
      },
      {
        id: 6,
        productId: "PROD-3002",
        productName: "Meeting Room Chairs",
        ordered: 12,
        received: 12,
        unit: "Pieces",
        condition: "Good"
      }
    ]
  },
  {
    id: "GRN-0004",
    poReference: "PO-0042",
    supplier: "Tech Solutions",
    warehouse: "Regional Depot",
    receivedBy: "Emma Wilson",
    receivedDate: "2023-04-22T11:30:00Z",
    status: "Issues Reported",
    notes: "Some items damaged during transit",
    items: [
      {
        id: 7,
        productId: "PROD-4001",
        productName: "Laptop Stand",
        ordered: 30,
        received: 30,
        unit: "Pieces",
        condition: "5 units damaged"
      },
      {
        id: 8,
        productId: "PROD-4002",
        productName: "Wireless Keyboard",
        ordered: 25,
        received: 20,
        unit: "Pieces",
        condition: "Good"
      }
    ]
  }
];

// Sample purchase orders for dropdown
const samplePurchaseOrders = [
  { id: "PO-0035", supplier: "TechPro Supplies" },
  { id: "PO-0036", supplier: "Office Essentials Ltd" },
  { id: "PO-0037", supplier: "Global Furniture Inc" },
  { id: "PO-0040", supplier: "Global Furniture Inc" },
  { id: "PO-0042", supplier: "Tech Solutions" },
  { id: "PO-0045", supplier: "Office Essentials Ltd" }
];

// Sample warehouses
const sampleWarehouses = [
  { id: 1, name: "Main Warehouse" },
  { id: 2, name: "Downtown Store" },
  { id: 3, name: "Regional Depot" },
  { id: 4, name: "East Wing Storage" }
];

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case "Partially Received":
      return <Badge className="bg-yellow-100 text-yellow-800">Partially Received</Badge>;
    case "Pending":
      return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    case "Issues Reported":
      return <Badge className="bg-red-100 text-red-800">Issues Reported</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};

const GoodsReceiptNote = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("list");
  const [showGRNDialog, setShowGRNDialog] = useState(false);
  const [currentGRN, setCurrentGRN] = useState<any>(null);
  const [grItems, setGRItems] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState("");

  // Query for GRN data
  const { data: grnsData, isLoading, isError } = useQuery({
    queryKey: ["/api/inventory/grns"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleGRNs);
    },
  });

  // Filter GRNs based on search and filters
  const filteredGRNs = grnsData?.filter(grn => {
    const matchesSearch = 
      grn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.poReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || grn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle GRN dialog open
  const openGRNDialog = (grn: any = null) => {
    setCurrentGRN(grn);
    if (grn) {
      setGRItems([...grn.items]);
      setSelectedPO(grn.poReference);
    } else {
      setGRItems([]);
      setSelectedPO("");
    }
    setShowGRNDialog(true);
  };

  // Add a new GR item
  const addGRItem = () => {
    const newItem = {
      id: Date.now(), // Temporary ID
      productId: "",
      productName: "",
      ordered: 0,
      received: 0,
      unit: "Pieces",
      condition: "Good"
    };
    setGRItems([...grItems, newItem]);
  };

  // Remove a GR item
  const removeGRItem = (id: number) => {
    setGRItems(grItems.filter(item => item.id !== id));
  };

  // Update GR item
  const updateGRItem = (id: number, field: string, value: any) => {
    setGRItems(grItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Handle PO selection
  const handlePOSelect = (poId: string) => {
    setSelectedPO(poId);
    // In a real app, you'd fetch the PO details and populate the GR items
    const mockItems = [
      {
        id: Date.now(),
        productId: "PROD-MOCK-1",
        productName: "Sample Product 1",
        ordered: 10,
        received: 0,
        unit: "Pieces",
        condition: "Good"
      },
      {
        id: Date.now() + 1,
        productId: "PROD-MOCK-2",
        productName: "Sample Product 2",
        ordered: 5,
        received: 0,
        unit: "Pieces",
        condition: "Good"
      }
    ];
    setGRItems(mockItems);
  };

  // Handle GRN form submission
  const handleGRNSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: currentGRN ? "GRN Updated" : "GRN Created",
      description: currentGRN 
        ? `Goods Receipt Note '${currentGRN.id}' has been updated.` 
        : "A new Goods Receipt Note has been created.",
    });
    
    setShowGRNDialog(false);
  };

  // View GRN details
  const viewGRNDetails = (grn: any) => {
    setCurrentGRN(grn);
    setCurrentTab("details");
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="list" 
        value={currentTab} 
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="list">GRN List</TabsTrigger>
          <TabsTrigger value="details" disabled={!currentGRN}>GRN Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search GRNs by ID, PO reference, or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Partially Received">Partially Received</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Issues Reported">Issues Reported</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                  
                  <Dialog open={showGRNDialog} onOpenChange={setShowGRNDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openGRNDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create GRN
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {currentGRN ? `Edit GRN: ${currentGRN.id}` : "Create New Goods Receipt Note"}
                        </DialogTitle>
                        <DialogDescription>
                          {currentGRN 
                            ? "Update the Goods Receipt Note information and items." 
                            : "Create a new Goods Receipt Note for received inventory."}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleGRNSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="grn-id">GRN ID</Label>
                              <Input
                                id="grn-id"
                                placeholder="Auto-generated"
                                defaultValue={currentGRN?.id || ""}
                                disabled={!!currentGRN}
                                className="bg-muted/50"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="po-reference">Purchase Order Reference</Label>
                              <Select 
                                value={selectedPO || (currentGRN?.poReference || "")}
                                onValueChange={handlePOSelect}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select purchase order" />
                                </SelectTrigger>
                                <SelectContent>
                                  {samplePurchaseOrders.map(po => (
                                    <SelectItem key={po.id} value={po.id}>
                                      {po.id} - {po.supplier}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="supplier">Supplier</Label>
                              <Input
                                id="supplier"
                                placeholder="Supplier name"
                                defaultValue={currentGRN?.supplier || ""}
                                disabled={!!selectedPO}
                                className={selectedPO ? "bg-muted/50" : ""}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="warehouse">Warehouse</Label>
                              <Select defaultValue={currentGRN?.warehouse || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sampleWarehouses.map(warehouse => (
                                    <SelectItem key={warehouse.id} value={warehouse.name}>
                                      {warehouse.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select defaultValue={currentGRN?.status || "Pending"}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Partially Received">Partially Received</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Issues Reported">Issues Reported</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="received-by">Received By</Label>
                              <Input
                                id="received-by"
                                placeholder="Name of receiver"
                                defaultValue={currentGRN?.receivedBy || ""}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Received Items</h3>
                            <Button type="button" size="sm" onClick={addGRItem} disabled={!selectedPO && !currentGRN}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </div>
                          
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product ID</TableHead>
                                  <TableHead>Product Name</TableHead>
                                  <TableHead className="w-[100px]">Ordered</TableHead>
                                  <TableHead className="w-[100px]">Received</TableHead>
                                  <TableHead className="w-[100px]">Unit</TableHead>
                                  <TableHead>Condition</TableHead>
                                  <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {grItems.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                      {!selectedPO && !currentGRN 
                                        ? "Please select a Purchase Order first" 
                                        : "No items added yet"}
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  grItems.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <Input
                                          value={item.productId}
                                          onChange={(e) => updateGRItem(item.id, "productId", e.target.value)}
                                          placeholder="Product ID"
                                          className="max-w-[150px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={item.productName}
                                          onChange={(e) => updateGRItem(item.id, "productName", e.target.value)}
                                          placeholder="Product name"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={item.ordered}
                                          onChange={(e) => updateGRItem(item.id, "ordered", Number(e.target.value))}
                                          className="max-w-[80px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={item.received}
                                          onChange={(e) => updateGRItem(item.id, "received", Number(e.target.value))}
                                          className="max-w-[80px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={item.unit}
                                          onValueChange={(value) => updateGRItem(item.id, "unit", value)}
                                        >
                                          <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Unit" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Pieces">Pieces</SelectItem>
                                            <SelectItem value="Boxes">Boxes</SelectItem>
                                            <SelectItem value="Pallets">Pallets</SelectItem>
                                            <SelectItem value="Kgs">Kgs</SelectItem>
                                            <SelectItem value="Liters">Liters</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={item.condition}
                                          onChange={(e) => updateGRItem(item.id, "condition", e.target.value)}
                                          placeholder="Condition"
                                          className="max-w-[150px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeGRItem(item.id)}
                                          className="h-8 w-8 text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <textarea 
                            id="notes"
                            className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                            placeholder="Additional notes about the receipt"
                            defaultValue={currentGRN?.notes || ""}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowGRNDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {currentGRN ? "Update GRN" : "Create GRN"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRNs Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Goods Receipt Notes</CardTitle>
                  <CardDescription>
                    {filteredGRNs?.length || 0} total records
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Refreshed", description: "GRN data has been refreshed." })}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">Error Loading Data</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      There was a problem loading the GRN data.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredGRNs?.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <PackageCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No GRNs Found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No Goods Receipt Notes match your search criteria.
                    </p>
                    <Button className="mt-4" onClick={() => openGRNDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create GRN
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GRN ID</TableHead>
                        <TableHead>PO Reference</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGRNs?.map((grn) => (
                        <TableRow key={grn.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewGRNDetails(grn)}>
                          <TableCell className="font-medium">{grn.id}</TableCell>
                          <TableCell>{grn.poReference}</TableCell>
                          <TableCell>{grn.supplier}</TableCell>
                          <TableCell>{grn.warehouse}</TableCell>
                          <TableCell>{getStatusBadge(grn.status)}</TableCell>
                          <TableCell>{formatDate(grn.receivedDate)}</TableCell>
                          <TableCell className="text-right">
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => viewGRNDetails(grn)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openGRNDialog(grn)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PackageCheck className="h-4 w-4 mr-2" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PrinterIcon className="h-4 w-4 mr-2" />
                                    Print
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredGRNs?.length || 0} of {grnsData?.length || 0} GRNs
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {currentGRN && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{currentGRN.id}</h2>
                  <p className="text-muted-foreground">
                    Purchase Order: {currentGRN.poReference} | Supplier: {currentGRN.supplier}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentTab("list")}>
                    Back to List
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openGRNDialog(currentGRN)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Received Items</CardTitle>
                    <CardDescription>
                      {currentGRN.items.length} item(s) in this receipt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead className="text-center">Ordered</TableHead>
                            <TableHead className="text-center">Received</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Condition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentGRN.items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono">{item.productId}</TableCell>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell className="text-center">{item.ordered}</TableCell>
                              <TableCell className="text-center">
                                <span className={item.received < item.ordered ? "text-amber-600" : "text-green-600"}>
                                  {item.received}
                                </span>
                              </TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>
                                {item.condition === "Good" ? (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Good
                                  </span>
                                ) : (
                                  <span className="text-amber-600">{item.condition}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Receipt Information</CardTitle>
                    <CardDescription>
                      Details and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Status</span>
                        <span>{getStatusBadge(currentGRN.status)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Warehouse</span>
                        <span>{currentGRN.warehouse}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Received By</span>
                        <span>{currentGRN.receivedBy}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Received Date</span>
                        <span>{formatDate(currentGRN.receivedDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Total Items</span>
                        <span>{currentGRN.items.reduce((sum: number, item: any) => sum + item.received, 0)} items</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2 border-t pt-6">
                    <h4 className="text-sm font-semibold">Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentGRN.notes}
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Receipt Timeline</CardTitle>
                  <CardDescription>
                    Activity history for this GRN
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <PackageCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Goods Received</p>
                        <p className="text-sm text-muted-foreground">Items received and inspected at warehouse</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(currentGRN.receivedDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Delivery Arrived</p>
                        <p className="text-sm text-muted-foreground">Supplier delivery arrived at warehouse</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(new Date(currentGRN.receivedDate).getTime() - 30 * 60000).toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <ClipboardCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">GRN Created</p>
                        <p className="text-sm text-muted-foreground">Initial GRN record created</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(new Date(currentGRN.receivedDate).getTime() - 2 * 60 * 60000).toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoodsReceiptNote;