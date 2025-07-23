import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBillOfMaterials } from "@/hooks/use-dynamic-data";
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
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Package,
  Plus,
  PrinterIcon,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Settings2,
  Edit,
  Box,
  Layers,
  AlertCircle,
} from "lucide-react";

// Sample BOM data
const sampleBOMs = [
  {
    id: "BOM-0001",
    name: "Deluxe Office Chair",
    description: "Ergonomic office chair with adjustable features",
    status: "Active",
    version: "1.0",
    createdAt: "2023-03-15T09:00:00Z",
    updatedAt: "2023-04-02T14:30:00Z",
    productId: "PROD-1234",
    components: [
      {
        id: 1,
        name: "Chair Base",
        sku: "CB-001",
        quantity: 1,
        unit: "Piece",
        description: "5-star base with casters"
      },
      {
        id: 2,
        name: "Gas Lift",
        sku: "GL-002",
        quantity: 1,
        unit: "Piece",
        description: "Pneumatic height adjustment"
      },
      {
        id: 3,
        name: "Seat Cushion",
        sku: "SC-003",
        quantity: 1,
        unit: "Piece",
        description: "Foam seat cushion with fabric"
      },
      {
        id: 4,
        name: "Back Rest",
        sku: "BR-004",
        quantity: 1,
        unit: "Piece",
        description: "Ergonomic back support"
      },
      {
        id: 5,
        name: "Arm Rests",
        sku: "AR-005",
        quantity: 2,
        unit: "Piece",
        description: "Adjustable arm rests"
      },
      {
        id: 6,
        name: "Screws (M8)",
        sku: "SR-006",
        quantity: 12,
        unit: "Piece",
        description: "Mounting screws"
      }
    ]
  },
  {
    id: "BOM-0002",
    name: "Executive Desk",
    description: "Premium executive desk with drawers",
    status: "Active",
    version: "1.2",
    createdAt: "2023-02-10T11:15:00Z",
    updatedAt: "2023-04-05T09:45:00Z",
    productId: "PROD-2345",
    components: [
      {
        id: 7,
        name: "Desktop Surface",
        sku: "DS-007",
        quantity: 1,
        unit: "Piece",
        description: "Laminated desktop surface"
      },
      {
        id: 8,
        name: "Drawer Unit",
        sku: "DU-008",
        quantity: 2,
        unit: "Piece",
        description: "Drawer unit with 3 drawers"
      },
      {
        id: 9,
        name: "Desk Legs",
        sku: "DL-009",
        quantity: 4,
        unit: "Piece",
        description: "Steel desk legs"
      }
    ]
  },
  {
    id: "BOM-0003",
    name: "Conference Table",
    description: "Large conference table for meeting rooms",
    status: "Pending",
    version: "1.0",
    createdAt: "2023-04-01T13:20:00Z",
    updatedAt: "2023-04-01T13:20:00Z",
    productId: "PROD-3456",
    components: [
      {
        id: 10,
        name: "Table Top",
        sku: "TT-010",
        quantity: 1,
        unit: "Piece",
        description: "Large wooden table top"
      },
      {
        id: 11,
        name: "Table Base",
        sku: "TB-011",
        quantity: 1,
        unit: "Piece",
        description: "Metal base"
      }
    ]
  },
  {
    id: "BOM-0004",
    name: "Filing Cabinet",
    description: "Metal filing cabinet with 4 drawers",
    status: "Active",
    version: "2.1",
    createdAt: "2023-01-20T10:30:00Z",
    updatedAt: "2023-03-15T11:45:00Z",
    productId: "PROD-4567",
    components: [
      {
        id: 12,
        name: "Cabinet Shell",
        sku: "CS-012",
        quantity: 1,
        unit: "Piece",
        description: "Metal cabinet shell"
      },
      {
        id: 13,
        name: "Drawer Unit",
        sku: "DU-013",
        quantity: 4,
        unit: "Piece",
        description: "Filing drawer with rails"
      },
      {
        id: 14,
        name: "Lock Mechanism",
        sku: "LM-014",
        quantity: 1,
        unit: "Set",
        description: "Central locking mechanism"
      }
    ]
  }
];

// Sample products for dropdown
const sampleProducts = [
  { id: "PROD-1234", name: "Deluxe Office Chair" },
  { id: "PROD-2345", name: "Executive Desk" },
  { id: "PROD-3456", name: "Conference Table" },
  { id: "PROD-4567", name: "Filing Cabinet" },
  { id: "PROD-5678", name: "Bookshelf" },
  { id: "PROD-6789", name: "Reception Desk" }
];

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "Pending":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case "Inactive":
      return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};

const BillOfMaterials = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("list");
  const [showBOMDialog, setShowBOMDialog] = useState(false);
  const [currentBOM, setCurrentBOM] = useState<any>(null);
  const [componentItems, setComponentItems] = useState<any[]>([]);

  // Query for BOM data with real-time updates
  const { data: bomsData, isLoading, error: isError } = useBillOfMaterials();

  // Filter BOMs based on search and filters
  const filteredBOMs = bomsData?.filter(bom => {
    const matchesSearch = 
      bom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || bom.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle BOM dialog open
  const openBOMDialog = (bom: any = null) => {
    setCurrentBOM(bom);
    if (bom) {
      setComponentItems([...bom.components]);
    } else {
      setComponentItems([]);
    }
    setShowBOMDialog(true);
  };

  // Add a new component item to BOM
  const addComponentItem = () => {
    const newItem = {
      id: Date.now(), // Temporary ID
      name: "",
      sku: "",
      quantity: 1,
      unit: "Piece",
      description: ""
    };
    setComponentItems([...componentItems, newItem]);
  };

  // Remove a component item from BOM
  const removeComponentItem = (id: number) => {
    setComponentItems(componentItems.filter(item => item.id !== id));
  };

  // Update component item
  const updateComponentItem = (id: number, field: string, value: any) => {
    setComponentItems(componentItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Handle BOM form submission
  const handleBOMSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: currentBOM ? "BOM Updated" : "BOM Created",
      description: currentBOM 
        ? `Bill of Materials '${currentBOM.id}' has been updated.` 
        : "A new Bill of Materials has been created.",
    });
    
    setShowBOMDialog(false);
  };

  // View BOM details
  const viewBOMDetails = (bom: any) => {
    setCurrentBOM(bom);
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
          <TabsTrigger value="list">BOM List</TabsTrigger>
          <TabsTrigger value="details" disabled={!currentBOM}>BOM Details</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search BOMs..."
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
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                  
                  <Dialog open={showBOMDialog} onOpenChange={setShowBOMDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openBOMDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create BOM
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {currentBOM ? `Edit BOM: ${currentBOM.id}` : "Create New Bill of Materials"}
                        </DialogTitle>
                        <DialogDescription>
                          {currentBOM 
                            ? "Update the Bill of Materials information and components." 
                            : "Create a new Bill of Materials with component details."}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBOMSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="bom-id">BOM ID</Label>
                              <Input
                                id="bom-id"
                                placeholder="Auto-generated"
                                defaultValue={currentBOM?.id || ""}
                                disabled={!!currentBOM}
                                className="bg-muted/50"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="product">Product</Label>
                              <Select defaultValue={currentBOM?.productId || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sampleProducts.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="name">BOM Name</Label>
                              <Input
                                id="name"
                                placeholder="Enter BOM name"
                                defaultValue={currentBOM?.name || ""}
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="version">Version</Label>
                              <Input
                                id="version"
                                placeholder="e.g., 1.0"
                                defaultValue={currentBOM?.version || "1.0"}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select defaultValue={currentBOM?.status || "Pending"}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Input
                                id="description"
                                placeholder="Enter description"
                                defaultValue={currentBOM?.description || ""}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Components</h3>
                            <Button type="button" size="sm" onClick={addComponentItem}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Component
                            </Button>
                          </div>
                          
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item Name</TableHead>
                                  <TableHead>SKU</TableHead>
                                  <TableHead className="w-[120px]">Quantity</TableHead>
                                  <TableHead className="w-[100px]">Unit</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {componentItems.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                      No components added yet. Add components using the button above.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  componentItems.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <Input
                                          value={item.name}
                                          onChange={(e) => updateComponentItem(item.id, "name", e.target.value)}
                                          placeholder="Component name"
                                          className="max-w-[200px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={item.sku}
                                          onChange={(e) => updateComponentItem(item.id, "sku", e.target.value)}
                                          placeholder="SKU code"
                                          className="max-w-[120px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) => updateComponentItem(item.id, "quantity", Number(e.target.value))}
                                          className="max-w-[80px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={item.unit}
                                          onValueChange={(value) => updateComponentItem(item.id, "unit", value)}
                                        >
                                          <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Unit" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Piece">Piece</SelectItem>
                                            <SelectItem value="Set">Set</SelectItem>
                                            <SelectItem value="Meter">Meter</SelectItem>
                                            <SelectItem value="Liter">Liter</SelectItem>
                                            <SelectItem value="Kg">Kg</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={item.description}
                                          onChange={(e) => updateComponentItem(item.id, "description", e.target.value)}
                                          placeholder="Description"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeComponentItem(item.id)}
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
                        
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowBOMDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {currentBOM ? "Update BOM" : "Create BOM"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOMs Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bills of Materials</CardTitle>
                  <CardDescription>
                    {filteredBOMs?.length || 0} total records
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Refreshed", description: "BOM data has been refreshed." })}>
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
                      There was a problem loading the BOM data.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredBOMs?.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No BOMs Found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No Bill of Materials records match your search criteria.
                    </p>
                    <Button className="mt-4" onClick={() => openBOMDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create BOM
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>BOM ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBOMs?.map((bom) => (
                        <TableRow key={bom.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewBOMDetails(bom)}>
                          <TableCell className="font-medium">{bom.id}</TableCell>
                          <TableCell>{bom.name}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{bom.description}</TableCell>
                          <TableCell>{getStatusBadge(bom.status)}</TableCell>
                          <TableCell>v{bom.version}</TableCell>
                          <TableCell>{formatDate(bom.updatedAt)}</TableCell>
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
                                  <DropdownMenuItem onClick={() => viewBOMDetails(bom)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openBOMDialog(bom)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
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
                Showing {filteredBOMs?.length || 0} of {bomsData?.length || 0} BOMs
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
          {currentBOM && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{currentBOM.name}</h2>
                  <p className="text-muted-foreground">
                    BOM ID: {currentBOM.id} | Version: {currentBOM.version}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentTab("list")}>
                    Back to List
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openBOMDialog(currentBOM)}>
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
                    <CardTitle>Components</CardTitle>
                    <CardDescription>
                      {currentBOM.components.length} component items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Component Name</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentBOM.components.map((component: any) => (
                            <TableRow key={component.id}>
                              <TableCell className="font-mono">{component.sku}</TableCell>
                              <TableCell className="font-medium">{component.name}</TableCell>
                              <TableCell className="text-center">{component.quantity}</TableCell>
                              <TableCell>{component.unit}</TableCell>
                              <TableCell className="max-w-[300px] truncate">{component.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>BOM Information</CardTitle>
                    <CardDescription>
                      Details and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Status</span>
                        <span>{getStatusBadge(currentBOM.status)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Product ID</span>
                        <span className="font-mono text-sm">{currentBOM.productId}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Version</span>
                        <span>v{currentBOM.version}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Created On</span>
                        <span>{formatDate(currentBOM.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Last Update</span>
                        <span>{formatDate(currentBOM.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Component Count</span>
                        <span>{currentBOM.components.length} items</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2 border-t pt-6">
                    <h4 className="text-sm font-semibold">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentBOM.description}
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Related Documents</CardTitle>
                  <CardDescription>
                    Documents associated with this BOM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-md">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Assembly Instructions</h4>
                        <p className="text-sm text-muted-foreground">PDF, 2.3MB</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-md">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Quality Specs</h4>
                        <p className="text-sm text-muted-foreground">PDF, 1.1MB</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md flex items-center gap-3">
                      <div className="bg-red-100 p-3 rounded-md">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Safety Guidelines</h4>
                        <p className="text-sm text-muted-foreground">PDF, 0.8MB</p>
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

export default BillOfMaterials;