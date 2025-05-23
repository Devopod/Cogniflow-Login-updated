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
  PackageOpen,
  Plus,
  PrinterIcon,
  RefreshCw,
  Search,
  Settings,
  Truck,
  TruckIcon,
  Trash2,
  Settings2,
  Edit,
  Box,
  Layers,
  AlertCircle,
  ExternalLink,
  CheckSquare,
  Clock,
  Building,
} from "lucide-react";

// Sample GDN data
const sampleGDNs = [
  {
    id: "GDN-0001",
    invoiceReference: "INV-0045",
    deliveryRef: "DEL-0025",
    customer: "Global Enterprises Inc.",
    warehouse: "Main Warehouse",
    deliveryDate: "2023-04-18T09:30:00Z",
    status: "Delivered",
    deliveryMethod: "Company Vehicle",
    deliveryAddress: "123 Corporate Plaza, Business District, City",
    notes: "Delivered on schedule, received by J. Thompson",
    items: [
      {
        id: 1,
        productId: "PROD-1001",
        productName: "Office Chair - Executive",
        quantity: 5,
        unit: "Pieces"
      },
      {
        id: 2,
        productId: "PROD-1002",
        productName: "Desk Lamp - Adjustable",
        quantity: 8,
        unit: "Pieces"
      }
    ]
  },
  {
    id: "GDN-0002",
    invoiceReference: "INV-0047",
    deliveryRef: "DEL-0026",
    customer: "TechSolutions Ltd.",
    warehouse: "Downtown Store",
    deliveryDate: "2023-04-20T14:00:00Z",
    status: "In Transit",
    deliveryMethod: "Courier Service",
    deliveryAddress: "456 Tech Park, Innovation Hub, City",
    notes: "Estimated delivery by EOD",
    items: [
      {
        id: 3,
        productId: "PROD-2001",
        productName: "Filing Cabinet",
        quantity: 2,
        unit: "Pieces"
      },
      {
        id: 4,
        productId: "PROD-2002",
        productName: "Desktop Organizer",
        quantity: 10,
        unit: "Pieces"
      }
    ]
  },
  {
    id: "GDN-0003",
    invoiceReference: "INV-0050",
    deliveryRef: "DEL-0028",
    customer: "Hospitality Group",
    warehouse: "Main Warehouse",
    deliveryDate: "2023-04-22T11:15:00Z",
    status: "Delivered",
    deliveryMethod: "Third-party Logistics",
    deliveryAddress: "789 Hospitality Avenue, Downtown, City",
    notes: "Delivery confirmed by customer via email",
    items: [
      {
        id: 5,
        productId: "PROD-3001",
        productName: "Conference Table",
        quantity: 1,
        unit: "Pieces"
      },
      {
        id: 6,
        productId: "PROD-3002",
        productName: "Meeting Room Chairs",
        quantity: 8,
        unit: "Pieces"
      },
      {
        id: 7,
        productId: "PROD-3003",
        productName: "Projector Screen",
        quantity: 1,
        unit: "Pieces"
      }
    ]
  },
  {
    id: "GDN-0004",
    invoiceReference: "INV-0053",
    deliveryRef: "DEL-0030",
    customer: "Education Institute",
    warehouse: "Regional Depot",
    deliveryDate: "2023-04-25T08:45:00Z",
    status: "Scheduled",
    deliveryMethod: "Company Vehicle",
    deliveryAddress: "321 Learning Lane, Education District, City",
    notes: "Customer requested morning delivery",
    items: [
      {
        id: 8,
        productId: "PROD-4001",
        productName: "Student Desk",
        quantity: 20,
        unit: "Pieces"
      },
      {
        id: 9,
        productId: "PROD-4002",
        productName: "Whiteboard",
        quantity: 5,
        unit: "Pieces"
      }
    ]
  }
];

// Sample invoices for dropdown
const sampleInvoices = [
  { id: "INV-0045", customer: "Global Enterprises Inc." },
  { id: "INV-0047", customer: "TechSolutions Ltd." },
  { id: "INV-0050", customer: "Hospitality Group" },
  { id: "INV-0053", customer: "Education Institute" },
  { id: "INV-0055", customer: "Healthcare Solutions" }
];

// Sample warehouses
const sampleWarehouses = [
  { id: 1, name: "Main Warehouse" },
  { id: 2, name: "Downtown Store" },
  { id: 3, name: "Regional Depot" },
  { id: 4, name: "East Wing Storage" }
];

// Sample delivery methods
const deliveryMethods = [
  "Company Vehicle",
  "Courier Service",
  "Third-party Logistics",
  "Customer Pickup"
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
    case "Delivered":
      return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
    case "In Transit":
      return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
    case "Scheduled":
      return <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
    case "Cancelled":
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};

const GoodsDeliveryNote = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("list");
  const [showGDNDialog, setShowGDNDialog] = useState(false);
  const [currentGDN, setCurrentGDN] = useState<any>(null);
  const [gdnItems, setGdnItems] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");

  // Query for GDN data
  const { data: gdnsData, isLoading, isError } = useQuery({
    queryKey: ["/api/inventory/gdns"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleGDNs);
    },
  });

  // Filter GDNs based on search and filters
  const filteredGDNs = gdnsData?.filter(gdn => {
    const matchesSearch = 
      gdn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gdn.invoiceReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gdn.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || gdn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle GDN dialog open
  const openGDNDialog = (gdn: any = null) => {
    setCurrentGDN(gdn);
    if (gdn) {
      setGdnItems([...gdn.items]);
      setSelectedInvoice(gdn.invoiceReference);
    } else {
      setGdnItems([]);
      setSelectedInvoice("");
    }
    setShowGDNDialog(true);
  };

  // Add a new GDN item
  const addGDNItem = () => {
    const newItem = {
      id: Date.now(), // Temporary ID
      productId: "",
      productName: "",
      quantity: 1,
      unit: "Pieces"
    };
    setGdnItems([...gdnItems, newItem]);
  };

  // Remove a GDN item
  const removeGDNItem = (id: number) => {
    setGdnItems(gdnItems.filter(item => item.id !== id));
  };

  // Update GDN item
  const updateGDNItem = (id: number, field: string, value: any) => {
    setGdnItems(gdnItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Handle Invoice selection
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    // In a real app, you'd fetch the invoice details and populate the GDN items
    const mockItems = [
      {
        id: Date.now(),
        productId: "PROD-MOCK-1",
        productName: "Sample Product 1",
        quantity: 5,
        unit: "Pieces"
      },
      {
        id: Date.now() + 1,
        productId: "PROD-MOCK-2",
        productName: "Sample Product 2",
        quantity: 3,
        unit: "Pieces"
      }
    ];
    setGdnItems(mockItems);
  };

  // Handle GDN form submission
  const handleGDNSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: currentGDN ? "GDN Updated" : "GDN Created",
      description: currentGDN 
        ? `Goods Delivery Note '${currentGDN.id}' has been updated.` 
        : "A new Goods Delivery Note has been created.",
    });
    
    setShowGDNDialog(false);
  };

  // View GDN details
  const viewGDNDetails = (gdn: any) => {
    setCurrentGDN(gdn);
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
          <TabsTrigger value="list">GDN List</TabsTrigger>
          <TabsTrigger value="details" disabled={!currentGDN}>GDN Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search GDNs by ID, invoice, or customer..."
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
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                  
                  <Dialog open={showGDNDialog} onOpenChange={setShowGDNDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openGDNDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create GDN
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {currentGDN ? `Edit GDN: ${currentGDN.id}` : "Create New Goods Delivery Note"}
                        </DialogTitle>
                        <DialogDescription>
                          {currentGDN 
                            ? "Update the Goods Delivery Note information and items." 
                            : "Create a new Goods Delivery Note for outgoing inventory."}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleGDNSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="gdn-id">GDN ID</Label>
                              <Input
                                id="gdn-id"
                                placeholder="Auto-generated"
                                defaultValue={currentGDN?.id || ""}
                                disabled={!!currentGDN}
                                className="bg-muted/50"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="invoice-reference">Invoice Reference</Label>
                              <Select 
                                value={selectedInvoice || (currentGDN?.invoiceReference || "")}
                                onValueChange={handleInvoiceSelect}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select invoice" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sampleInvoices.map(invoice => (
                                    <SelectItem key={invoice.id} value={invoice.id}>
                                      {invoice.id} - {invoice.customer}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="customer">Customer</Label>
                              <Input
                                id="customer"
                                placeholder="Customer name"
                                defaultValue={currentGDN?.customer || ""}
                                disabled={!!selectedInvoice}
                                className={selectedInvoice ? "bg-muted/50" : ""}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="delivery-ref">Delivery Reference</Label>
                              <Input
                                id="delivery-ref"
                                placeholder="e.g., DEL-0001"
                                defaultValue={currentGDN?.deliveryRef || ""}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="warehouse">Source Warehouse</Label>
                              <Select defaultValue={currentGDN?.warehouse || ""}>
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
                              <Select defaultValue={currentGDN?.status || "Scheduled"}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                                  <SelectItem value="In Transit">In Transit</SelectItem>
                                  <SelectItem value="Delivered">Delivered</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="delivery-method">Delivery Method</Label>
                              <Select defaultValue={currentGDN?.deliveryMethod || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select delivery method" />
                                </SelectTrigger>
                                <SelectContent>
                                  {deliveryMethods.map(method => (
                                    <SelectItem key={method} value={method}>
                                      {method}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="delivery-date">Delivery Date</Label>
                              <Input
                                id="delivery-date"
                                type="datetime-local"
                                defaultValue={currentGDN?.deliveryDate 
                                  ? new Date(currentGDN.deliveryDate).toISOString().slice(0, 16) 
                                  : new Date().toISOString().slice(0, 16)}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="delivery-address">Delivery Address</Label>
                          <textarea 
                            id="delivery-address"
                            className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background"
                            placeholder="Full delivery address"
                            defaultValue={currentGDN?.deliveryAddress || ""}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Delivery Items</h3>
                            <Button type="button" size="sm" onClick={addGDNItem} disabled={!selectedInvoice && !currentGDN}>
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
                                  <TableHead className="w-[120px]">Quantity</TableHead>
                                  <TableHead className="w-[120px]">Unit</TableHead>
                                  <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {gdnItems.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                      {!selectedInvoice && !currentGDN 
                                        ? "Please select an Invoice first" 
                                        : "No items added yet"}
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  gdnItems.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <Input
                                          value={item.productId}
                                          onChange={(e) => updateGDNItem(item.id, "productId", e.target.value)}
                                          placeholder="Product ID"
                                          className="max-w-[150px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={item.productName}
                                          onChange={(e) => updateGDNItem(item.id, "productName", e.target.value)}
                                          placeholder="Product name"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) => updateGDNItem(item.id, "quantity", Number(e.target.value))}
                                          className="max-w-[80px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={item.unit}
                                          onValueChange={(value) => updateGDNItem(item.id, "unit", value)}
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
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeGDNItem(item.id)}
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
                            className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background"
                            placeholder="Additional notes about the delivery"
                            defaultValue={currentGDN?.notes || ""}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowGDNDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {currentGDN ? "Update GDN" : "Create GDN"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GDNs Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Goods Delivery Notes</CardTitle>
                  <CardDescription>
                    {filteredGDNs?.length || 0} total records
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Refreshed", description: "GDN data has been refreshed." })}>
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
                      There was a problem loading the GDN data.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredGDNs?.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <TruckIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No GDNs Found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No Goods Delivery Notes match your search criteria.
                    </p>
                    <Button className="mt-4" onClick={() => openGDNDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create GDN
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GDN ID</TableHead>
                        <TableHead>Invoice Ref</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Delivery Method</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGDNs?.map((gdn) => (
                        <TableRow key={gdn.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewGDNDetails(gdn)}>
                          <TableCell className="font-medium">{gdn.id}</TableCell>
                          <TableCell>{gdn.invoiceReference}</TableCell>
                          <TableCell>{gdn.customer}</TableCell>
                          <TableCell>{formatDate(gdn.deliveryDate)}</TableCell>
                          <TableCell>{getStatusBadge(gdn.status)}</TableCell>
                          <TableCell>{gdn.deliveryMethod}</TableCell>
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
                                  <DropdownMenuItem onClick={() => viewGDNDetails(gdn)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openGDNDialog(gdn)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PackageOpen className="h-4 w-4 mr-2" />
                                    Update Status
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
                Showing {filteredGDNs?.length || 0} of {gdnsData?.length || 0} GDNs
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
          {currentGDN && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{currentGDN.id}</h2>
                  <p className="text-muted-foreground">
                    Invoice: {currentGDN.invoiceReference} | Customer: {currentGDN.customer}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentTab("list")}>
                    Back to List
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openGDNDialog(currentGDN)}>
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
                    <CardTitle>Delivery Items</CardTitle>
                    <CardDescription>
                      {currentGDN.items.length} item(s) in this delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentGDN.items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono">{item.productId}</TableCell>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={2} className="text-right font-medium">Total Items:</TableCell>
                            <TableCell className="text-center font-medium">
                              {currentGDN.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                    <CardDescription>
                      Details and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Status</span>
                        <span>{getStatusBadge(currentGDN.status)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Warehouse</span>
                        <span>{currentGDN.warehouse}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Delivery Method</span>
                        <span>{currentGDN.deliveryMethod}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Delivery Date</span>
                        <span>{formatDate(currentGDN.deliveryDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Delivery Ref</span>
                        <span>{currentGDN.deliveryRef}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-sm font-medium">Delivery Address</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {currentGDN.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2 border-t pt-6">
                    <h4 className="text-sm font-semibold">Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentGDN.notes}
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Timeline</CardTitle>
                  <CardDescription>
                    Activity history for this GDN
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentGDN.status === "Delivered" && (
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Delivered</p>
                          <p className="text-sm text-muted-foreground">Delivery confirmed at destination</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(currentGDN.deliveryDate)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(currentGDN.status === "Delivered" || currentGDN.status === "In Transit") && (
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">In Transit</p>
                          <p className="text-sm text-muted-foreground">Goods in transit to customer</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(new Date(new Date(currentGDN.deliveryDate).getTime() - 1 * 60 * 60000).toISOString())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <PackageOpen className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Prepared for Shipping</p>
                        <p className="text-sm text-muted-foreground">Items packed and ready for dispatch</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(new Date(currentGDN.deliveryDate).getTime() - 3 * 60 * 60000).toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <ClipboardCheck className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">GDN Created</p>
                        <p className="text-sm text-muted-foreground">Goods Delivery Note created</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(new Date(currentGDN.deliveryDate).getTime() - 24 * 60 * 60000).toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Related Documents</CardTitle>
                  <CardDescription>
                    Documents associated with this delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-md">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Invoice {currentGDN.invoiceReference}</h4>
                        <p className="text-sm text-muted-foreground">PDF, 156KB</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-md">
                        <Building className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Customer Profile</h4>
                        <p className="text-sm text-muted-foreground">Customer details</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md flex items-center gap-3">
                      <div className="bg-red-100 p-3 rounded-md">
                        <TruckIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Delivery Slip</h4>
                        <p className="text-sm text-muted-foreground">PDF, 98KB</p>
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

export default GoodsDeliveryNote;