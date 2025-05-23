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
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit,
  FileText,
  Filter,
  Folders,
  Laptop,
  Layers,
  Loader2,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";

// Sample product groups data
const sampleProductGroups = [
  {
    id: 1,
    code: "FURN",
    name: "Furniture",
    description: "Office furniture including desks, chairs, and cabinets",
    status: "Active",
    parentGroup: null,
    createdAt: "2023-03-10T09:00:00Z",
    updatedAt: "2023-04-15T14:30:00Z",
    productsCount: 58,
    taxRate: 18,
  },
  {
    id: 2,
    code: "FURN-CH",
    name: "Office Chairs",
    description: "All types of office chairs",
    status: "Active",
    parentGroup: "Furniture",
    createdAt: "2023-03-12T11:20:00Z",
    updatedAt: "2023-04-10T10:15:00Z",
    productsCount: 24,
    taxRate: 18,
  },
  {
    id: 3,
    code: "FURN-DSK",
    name: "Desks",
    description: "Office desks and workstations",
    status: "Active",
    parentGroup: "Furniture",
    createdAt: "2023-03-15T13:45:00Z",
    updatedAt: "2023-03-28T09:30:00Z",
    productsCount: 18,
    taxRate: 18,
  },
  {
    id: 4,
    code: "FURN-CAB",
    name: "Cabinets",
    description: "Filing and storage cabinets",
    status: "Active",
    parentGroup: "Furniture",
    createdAt: "2023-03-20T10:30:00Z",
    updatedAt: "2023-04-05T11:45:00Z",
    productsCount: 16,
    taxRate: 18,
  },
  {
    id: 5,
    code: "TECH",
    name: "Technology",
    description: "Computer and office technology items",
    status: "Active",
    parentGroup: null,
    createdAt: "2023-03-05T08:15:00Z",
    updatedAt: "2023-04-02T16:20:00Z",
    productsCount: 42,
    taxRate: 12,
  },
  {
    id: 6,
    code: "TECH-COMP",
    name: "Computers",
    description: "Desktop and laptop computers",
    status: "Active",
    parentGroup: "Technology",
    createdAt: "2023-03-08T09:40:00Z",
    updatedAt: "2023-03-30T15:10:00Z",
    productsCount: 15,
    taxRate: 12,
  },
  {
    id: 7,
    code: "TECH-ACC",
    name: "Computer Accessories",
    description: "Accessories for computers and laptops",
    status: "Active",
    parentGroup: "Technology",
    createdAt: "2023-03-10T14:25:00Z",
    updatedAt: "2023-04-12T10:55:00Z",
    productsCount: 27,
    taxRate: 12,
  },
  {
    id: 8,
    code: "SUPP",
    name: "Office Supplies",
    description: "General office supplies and stationery",
    status: "Active",
    parentGroup: null,
    createdAt: "2023-02-28T11:30:00Z",
    updatedAt: "2023-03-25T13:45:00Z",
    productsCount: 86,
    taxRate: 5,
  },
  {
    id: 9,
    code: "SUPP-PAP",
    name: "Paper Products",
    description: "Paper, notebooks, and related items",
    status: "Active",
    parentGroup: "Office Supplies",
    createdAt: "2023-03-02T10:15:00Z",
    updatedAt: "2023-04-08T14:30:00Z",
    productsCount: 32,
    taxRate: 5,
  },
  {
    id: 10,
    code: "SUPP-WRT",
    name: "Writing Instruments",
    description: "Pens, pencils, and other writing tools",
    status: "Active",
    parentGroup: "Office Supplies",
    createdAt: "2023-03-05T09:50:00Z",
    updatedAt: "2023-03-28T11:20:00Z",
    productsCount: 28,
    taxRate: 5,
  },
  {
    id: 11,
    code: "SUPP-ORG",
    name: "Organizers",
    description: "Folders, binders, and organizing tools",
    status: "Active",
    parentGroup: "Office Supplies",
    createdAt: "2023-03-08T13:40:00Z",
    updatedAt: "2023-04-10T09:15:00Z",
    productsCount: 26,
    taxRate: 5,
  },
  {
    id: 12,
    code: "LIGHT",
    name: "Lighting",
    description: "Office lighting solutions",
    status: "Inactive",
    parentGroup: null,
    createdAt: "2023-02-25T14:10:00Z",
    updatedAt: "2023-03-20T10:30:00Z",
    productsCount: 12,
    taxRate: 18,
  }
];

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "Inactive":
      return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
    case "Draft":
      return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};

const ProductGroup = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [currentProductGroup, setCurrentProductGroup] = useState<any>(null);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hierarchyView, setHierarchyView] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

  // Query for product groups data
  const { data: groupsData, isLoading, isError } = useQuery({
    queryKey: ["/api/inventory/product-groups"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleProductGroups);
    },
  });

  // Filter and sort groups
  const filteredGroups = groupsData?.filter(group => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || group.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    
    if (sortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === "code") {
      comparison = a.code.localeCompare(b.code);
    } else if (sortField === "productsCount") {
      comparison = a.productsCount - b.productsCount;
    } else if (sortField === "updatedAt") {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Get root groups and their children for hierarchy view
  const rootGroups = groupsData?.filter(group => group.parentGroup === null);
  
  const getChildGroups = (parentName: string) => {
    return groupsData?.filter(group => group.parentGroup === parentName) || [];
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle dialog open
  const openDialog = (group: any = null) => {
    setCurrentProductGroup(group);
    setShowDialog(true);
  };

  // Toggle expanded state for groups in hierarchy view
  const toggleExpand = (groupId: number) => {
    if (expandedGroups.includes(groupId)) {
      setExpandedGroups(expandedGroups.filter(id => id !== groupId));
    } else {
      setExpandedGroups([...expandedGroups, groupId]);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: currentProductGroup ? "Product Group Updated" : "Product Group Created",
      description: currentProductGroup 
        ? `The product group '${currentProductGroup.name}' has been updated successfully.` 
        : "A new product group has been created successfully.",
    });
    
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Group Management</h2>
          <p className="text-muted-foreground">
            Organize products into hierarchical groups for better organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setHierarchyView(!hierarchyView)}>
            {hierarchyView ? (
              <>
                <Layers className="h-4 w-4 mr-2" />
                List View
              </>
            ) : (
              <>
                <Folders className="h-4 w-4 mr-2" />
                Hierarchy View
              </>
            )}
          </Button>
          
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New Product Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {currentProductGroup ? "Edit Product Group" : "Create New Product Group"}
                </DialogTitle>
                <DialogDescription>
                  {currentProductGroup 
                    ? "Update the product group details below." 
                    : "Enter the details of the new product group."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Group Code</Label>
                    <Input 
                      id="code" 
                      placeholder="e.g., FURN" 
                      defaultValue={currentProductGroup?.code || ""}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique code for the product group
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g., Furniture" 
                      defaultValue={currentProductGroup?.name || ""}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent Group</Label>
                    <Select defaultValue={currentProductGroup?.parentGroup || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Root Group)</SelectItem>
                        {rootGroups?.map(group => (
                          <SelectItem key={group.id} value={group.name}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Optional parent group for hierarchy
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue={currentProductGroup?.status || "Active"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input 
                    id="taxRate" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.01"
                    placeholder="e.g., 18" 
                    defaultValue={currentProductGroup?.taxRate || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default tax rate for this group (optional)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea 
                    id="description"
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                    placeholder="Describe the product group"
                    defaultValue={currentProductGroup?.description || ""}
                  />
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {currentProductGroup ? "Update Group" : "Create Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product groups..."
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
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Groups Table or Hierarchy View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Product Groups</CardTitle>
              <CardDescription>
                {filteredGroups?.length || 0} total groups
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Refreshed", description: "Product group data has been refreshed." })}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
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
                <div className="text-red-500">
                  <Folders className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium">Error Loading Product Groups</h3>
                <p className="text-sm text-muted-foreground">
                  There was a problem loading the product group data.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : filteredGroups?.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div className="space-y-3">
                <Folders className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">No Product Groups Found</h3>
                <p className="text-sm text-muted-foreground">
                  No product groups match your search criteria.
                </p>
                <Button onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Product Group
                </Button>
              </div>
            </div>
          ) : hierarchyView ? (
            // Hierarchy Tree View
            <div className="rounded-md border">
              <div className="p-4 border-b bg-muted/30">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm">
                  <div className="col-span-5">Group Name</div>
                  <div className="col-span-2">Code</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-2 text-center">Products</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>
              <div className="divide-y">
                {rootGroups?.map(group => (
                  <div key={group.id}>
                    <div className="p-4 hover:bg-muted/50">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center">
                          <button 
                            className="mr-2 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpand(group.id)}
                          >
                            {expandedGroups.includes(group.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronUp className="h-4 w-4" />
                            }
                          </button>
                          <div className="font-medium">{group.name}</div>
                        </div>
                        <div className="col-span-2 font-mono text-sm">{group.code}</div>
                        <div className="col-span-1 text-center">{getStatusBadge(group.status)}</div>
                        <div className="col-span-2 text-center">{group.productsCount}</div>
                        <div className="col-span-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDialog(group)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                View Products
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                    
                    {/* Child Groups */}
                    {expandedGroups.includes(group.id) && getChildGroups(group.name).map(childGroup => (
                      <div key={childGroup.id} className="p-4 pl-10 hover:bg-muted/50 bg-muted/10">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-5 flex items-center">
                            <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div className="font-medium">{childGroup.name}</div>
                          </div>
                          <div className="col-span-2 font-mono text-sm">{childGroup.code}</div>
                          <div className="col-span-1 text-center">{getStatusBadge(childGroup.status)}</div>
                          <div className="col-span-2 text-center">{childGroup.productsCount}</div>
                          <div className="col-span-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDialog(childGroup)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  View Products
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // List View Table
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center">
                        Code
                        {sortField === "code" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === "name" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Parent Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 text-center"
                      onClick={() => handleSort("productsCount")}
                    >
                      <div className="flex items-center justify-center">
                        Products
                        {sortField === "productsCount" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("updatedAt")}
                    >
                      <div className="flex items-center">
                        Last Updated
                        {sortField === "updatedAt" && (
                          sortDirection === "asc" ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups?.map((group) => (
                    <TableRow key={group.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono">{group.code}</TableCell>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        {group.parentGroup ? (
                          <div className="flex items-center gap-1">
                            <Folders className="h-4 w-4 text-muted-foreground" />
                            <span>{group.parentGroup}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Root Group</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(group.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{group.productsCount}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(group.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDialog(group)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              View Products
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredGroups?.length || 0} of {groupsData?.length || 0} product groups
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
    </div>
  );
};

export default ProductGroup;