import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBillOfMaterials } from "@/hooks/use-dynamic-data";
import { useWebSocket } from '@/hooks/use-websocket';
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

// Dynamic BOM data will be fetched from backend

const BillOfMaterials = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentBOM, setCurrentBOM] = useState<any>(null);
  const [componentItems, setComponentItems] = useState<any[]>([]);

  // Dynamic BOM data with real-time updates
  const { data: bomsData = [], isLoading, error } = useBillOfMaterials();
  
  // Dynamic products data
  const { data: productsData = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  // Set up WebSocket for real-time updates
  useWebSocket({
    resource: 'bill-of-materials',
    resourceId: 'all',
    invalidateQueries: [['bill-of-materials'], ['products']]
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading bill of materials...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p>Error loading bill of materials: {error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Filter BOMs based on search and filters
  const filteredBOMs = bomsData?.filter(bom => {
    const matchesSearch = 
      bom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || bom.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Handle BOM dialog open
  const openBOMDialog = (bom: any = null) => {
    setCurrentBOM(bom);
    if (bom) {
      setComponentItems([...bom.components]);
    } else {
      setComponentItems([]);
    }
    setShowEditDialog(true);
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
    
    setShowEditDialog(false);
  };

  // View BOM details
  const viewBOMDetails = (bom: any) => {
    setCurrentBOM(bom);
    setComponentItems([...bom.components]); // Ensure components are loaded for details view
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="list" 
        value={currentBOM ? "details" : "list"} 
        onValueChange={currentBOM ? () => {} : undefined}
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
                  
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openBOMDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create BOM
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Create New Bill of Materials
                        </DialogTitle>
                        <DialogDescription>
                          Create a new Bill of Materials with component details.
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
                                disabled={true}
                                className="bg-muted/50"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="product">Product</Label>
                              <Select defaultValue="">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {productsData.map(product => (
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
                                defaultValue="1.0"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select defaultValue="Pending">
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
                          <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Create BOM
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
              {filteredBOMs?.length === 0 ? (
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
                  <Button variant="outline" size="sm" onClick={() => setCurrentBOM(null)}>
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
                      {currentBOM.components?.length || 0} component items
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
                        <span>{currentBOM.components?.length || 0} items</span>
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