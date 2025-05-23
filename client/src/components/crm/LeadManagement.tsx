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
  ArrowUp,
  ArrowDown,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Search,
  Trash2,
  Edit,
  ChevronDown,
  Facebook,
  Mail,
  Globe,
  FileSpreadsheet,
  FileText,
  PieChart,
  BarChart
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample leads data
const sampleLeads = [
  {
    id: 1,
    name: "John Smith",
    company: "Acme Corporation",
    email: "john.smith@acme.com",
    phone: "+1 (123) 456-7890",
    source: "Website",
    status: "New",
    createdAt: "2023-05-01T08:30:00Z",
    notes: "Interested in enterprise plan",
    assignedTo: "Sarah Johnson",
    lastActivity: "2023-05-02T10:15:00Z"
  },
  {
    id: 2,
    name: "Emily Davis",
    company: "TechStart Inc.",
    email: "emily.davis@techstart.com",
    phone: "+1 (234) 567-8901",
    source: "Facebook Ad",
    status: "Contacted",
    createdAt: "2023-04-28T14:45:00Z",
    notes: "Responded to follow-up email",
    assignedTo: "Michael Chen",
    lastActivity: "2023-05-01T15:20:00Z"
  },
  {
    id: 3,
    name: "Robert Wilson",
    company: "Global Services Ltd.",
    email: "robert.wilson@globalservices.com",
    phone: "+1 (345) 678-9012",
    source: "Google Form",
    status: "Qualified",
    createdAt: "2023-04-25T11:00:00Z",
    notes: "Scheduled demo for next week",
    assignedTo: "Emma Wilson",
    lastActivity: "2023-05-02T09:45:00Z"
  },
  {
    id: 4,
    name: "Lisa Thompson",
    company: "Digital Dynamics",
    email: "lisa.thompson@digitaldynamics.com",
    phone: "+1 (456) 789-0123",
    source: "LinkedIn",
    status: "Unqualified",
    createdAt: "2023-04-27T16:30:00Z",
    notes: "Budget constraints",
    assignedTo: "David Rodriguez",
    lastActivity: "2023-04-30T11:10:00Z"
  },
  {
    id: 5,
    name: "Michael Brown",
    company: "Innovative Solutions",
    email: "michael.brown@innovative.com",
    phone: "+1 (567) 890-1234",
    source: "Referral",
    status: "Contacted",
    createdAt: "2023-04-29T09:15:00Z",
    notes: "Referred by existing customer",
    assignedTo: "Sarah Johnson",
    lastActivity: "2023-05-01T13:40:00Z"
  },
  {
    id: 6,
    name: "Jennifer Garcia",
    company: "Modern Manufacturing",
    email: "jennifer.garcia@modernmfg.com",
    phone: "+1 (678) 901-2345",
    source: "Trade Show",
    status: "New",
    createdAt: "2023-05-02T10:00:00Z",
    notes: "Met at industry expo",
    assignedTo: "Michael Chen",
    lastActivity: "2023-05-02T10:00:00Z"
  },
  {
    id: 7,
    name: "David Martinez",
    company: "Retail Innovations",
    email: "david.martinez@retailinnov.com",
    phone: "+1 (789) 012-3456",
    source: "Website",
    status: "Qualified",
    createdAt: "2023-04-26T13:20:00Z",
    notes: "Looking for POS integration solution",
    assignedTo: "Emma Wilson",
    lastActivity: "2023-05-01T16:25:00Z"
  },
  {
    id: 8,
    name: "Michelle Johnson",
    company: "Healthcare Solutions",
    email: "michelle.johnson@healthsol.com",
    phone: "+1 (890) 123-4567",
    source: "Google Form",
    status: "New",
    createdAt: "2023-05-02T09:45:00Z",
    notes: "Interested in compliance features",
    assignedTo: "David Rodriguez",
    lastActivity: "2023-05-02T09:45:00Z"
  }
];

// Sample lead sources data
const leadSources = [
  { id: 1, name: "Website", count: 24, percentage: 30 },
  { id: 2, name: "Facebook Ad", count: 15, percentage: 19 },
  { id: 3, name: "Google Form", count: 18, percentage: 22 },
  { id: 4, name: "LinkedIn", count: 8, percentage: 10 },
  { id: 5, name: "Referral", count: 12, percentage: 15 },
  { id: 6, name: "Trade Show", count: 3, percentage: 4 }
];

// Lead status options
const leadStatusOptions = [
  { value: "New", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "Contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "Qualified", label: "Qualified", color: "bg-green-100 text-green-800" },
  { value: "Unqualified", label: "Unqualified", color: "bg-red-100 text-red-800" }
];

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Get source icon
const getSourceIcon = (source: string) => {
  switch (source) {
    case "Website":
      return <Globe className="h-4 w-4 text-blue-500" />;
    case "Facebook Ad":
      return <Facebook className="h-4 w-4 text-blue-600" />;
    case "Google Form":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "LinkedIn":
      return <Globe className="h-4 w-4 text-blue-700" />;
    case "Referral":
      return <Mail className="h-4 w-4 text-purple-500" />;
    case "Trade Show":
      return <FileText className="h-4 w-4 text-green-500" />;
    default:
      return <Globe className="h-4 w-4 text-gray-500" />;
  }
};

// Get status badge
const getStatusBadge = (status: string) => {
  const statusOption = leadStatusOptions.find(option => option.value === status);
  if (!statusOption) return null;
  
  return (
    <Badge className={statusOption.color}>
      {statusOption.label}
    </Badge>
  );
};

const LeadManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [currentLead, setCurrentLead] = useState<any>(null);

  // Query for leads data
  const { data: leadsData, isLoading, isError } = useQuery({
    queryKey: ["/api/crm/leads"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleLeads);
    },
  });

  // Query for lead sources data
  const { data: sourcesData, isLoading: isLoadingSourcesData } = useQuery({
    queryKey: ["/api/crm/lead-sources"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(leadSources);
    },
  });

  // Filter and sort leads
  const filteredLeads = leadsData?.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  }).sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortField === "company") {
      return sortDirection === "asc" 
        ? a.company.localeCompare(b.company) 
        : b.company.localeCompare(a.company);
    } else if (sortField === "createdAt") {
      return sortDirection === "asc" 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Open lead form dialog
  const openLeadForm = (lead: any = null) => {
    setCurrentLead(lead);
    setShowLeadDialog(true);
  };

  // Handle import form submission
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Import Started",
      description: "Your leads are being imported in the background.",
    });
    setShowImportDialog(false);
  };

  // Handle lead form submission
  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: currentLead ? "Lead Updated" : "Lead Created",
      description: currentLead 
        ? "The lead has been successfully updated." 
        : "A new lead has been successfully created.",
    });
    setShowLeadDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Management</h2>
          <p className="text-muted-foreground">
            Manage customer and supplier leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Leads</DialogTitle>
                <DialogDescription>
                  Import leads from various sources or upload an Excel file.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleImportSubmit} className="space-y-6 py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="importSource">Import Source</Label>
                    <Select defaultValue="excel">
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel Template</SelectItem>
                        <SelectItem value="googleForm">Google Forms</SelectItem>
                        <SelectItem value="metaForm">Meta Forms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="file">Upload File</Label>
                    <div className="mt-2 flex items-center justify-center border-2 border-dashed rounded-md p-6">
                      <div className="text-center">
                        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <div className="flex flex-col items-center text-sm">
                          <span className="text-muted-foreground">
                            Drag and drop a file or
                          </span>
                          <Label 
                            htmlFor="file-upload" 
                            className="cursor-pointer text-primary hover:underline"
                          >
                            browse
                          </Label>
                          <input 
                            id="file-upload" 
                            type="file" 
                            className="hidden" 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Max file size: 10MB (.xlsx, .csv)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="leadsource">Default Lead Source</Label>
                    <Select defaultValue="import">
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="google">Google Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Import Leads</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openLeadForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {currentLead ? "Edit Lead" : "Add New Lead"}
                </DialogTitle>
                <DialogDescription>
                  {currentLead 
                    ? "Update the lead information below."
                    : "Enter the new lead details below."
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLeadSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Full name" 
                      defaultValue={currentLead?.name || ""} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      placeholder="Company name" 
                      defaultValue={currentLead?.company || ""} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Email address" 
                      defaultValue={currentLead?.email || ""} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      placeholder="Phone number" 
                      defaultValue={currentLead?.phone || ""} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Lead Source</Label>
                    <Select defaultValue={currentLead?.source || "Website"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Facebook Ad">Facebook Ad</SelectItem>
                        <SelectItem value="Google Form">Google Form</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Trade Show">Trade Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue={currentLead?.status || "New"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea 
                    id="notes"
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                    placeholder="Additional notes"
                    defaultValue={currentLead?.notes || ""}
                  />
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowLeadDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {currentLead ? "Update Lead" : "Create Lead"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
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
                      {leadStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={sourceFilter}
                    onValueChange={setSourceFilter}
                  >
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {leadSources.map(source => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
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

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Leads</CardTitle>
                  <CardDescription>
                    {filteredLeads?.length || 0} total leads
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Refreshed", description: "Lead data has been refreshed." })}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
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
                    <p className="text-lg font-medium">Error loading leads</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      There was a problem loading the lead data. Please try again.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredLeads?.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <p className="text-lg font-medium">No leads found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or add new leads.
                    </p>
                    <Button className="mt-4" onClick={() => openLeadForm()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center">
                            Name
                            {sortField === "name" && (
                              sortDirection === "asc" ? 
                              <ArrowUp className="ml-2 h-4 w-4" /> : 
                              <ArrowDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("company")}
                        >
                          <div className="flex items-center">
                            Company
                            {sortField === "company" && (
                              sortDirection === "asc" ? 
                              <ArrowUp className="ml-2 h-4 w-4" /> : 
                              <ArrowDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center">
                            Date Added
                            {sortField === "createdAt" && (
                              sortDirection === "asc" ? 
                              <ArrowUp className="ml-2 h-4 w-4" /> : 
                              <ArrowDown className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads?.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-muted-foreground">{lead.phone}</div>
                          </TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getSourceIcon(lead.source)}
                              <span>{lead.source}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(lead.status)}</TableCell>
                          <TableCell className="text-sm">{formatDate(lead.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openLeadForm(lead)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Add Note
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
                Showing {filteredLeads?.length || 0} of {leadsData?.length || 0} leads
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Leads</p>
                    <h2 className="text-3xl font-bold">{leadsData?.length || 0}</h2>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  From all sources
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">New This Month</p>
                    <h2 className="text-3xl font-bold">{12}</h2>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <ArrowUpDown className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <span className="text-green-600">+33%</span> from last month
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Conversion Rate</p>
                    <h2 className="text-3xl font-bold">24.8%</h2>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <ArrowUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <span className="text-green-600">+5.2%</span> from last month
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Response Time</p>
                    <h2 className="text-3xl font-bold">4.2h</h2>
                  </div>
                  <div className="bg-amber-100 p-2 rounded-full">
                    <RefreshCw className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <span className="text-red-600">+0.5h</span> from last month
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Lead Source Distribution</CardTitle>
                <CardDescription>Where your leads are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center mb-6">
                  <PieChart className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="font-medium">Lead Source Distribution</p>
                  <p className="text-sm text-muted-foreground mt-1">(Visualized chart showing distribution of leads by source)</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {leadSources.map(source => (
                    <div key={source.id} className="p-4 border rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        {getSourceIcon(source.name)}
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="text-2xl font-bold">{source.count}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">{source.percentage}%</span>
                        <div className="w-32 h-2 bg-muted rounded overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${source.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Lead Status Breakdown</CardTitle>
                <CardDescription>Current lead pipeline status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {leadStatusOptions.map((status, index) => {
                    // Calculate mock counts and percentages
                    const count = index === 0 ? 18 : index === 1 ? 24 : index === 2 ? 15 : 5;
                    const percentage = count / 62 * 100;
                    
                    return (
                      <div key={status.value} className="space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={status.color}>{status.label}</Badge>
                            <span className="text-sm font-medium">{count} leads</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-8 border-t pt-6">
                  <h3 className="font-medium mb-4">Top Converting Sources</h3>
                  <div className="space-y-4">
                    {leadSources.slice(0, 3).map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(source.name)}
                          <span>{source.name}</span>
                        </div>
                        <Badge variant="outline">{32 - index * 5}% conversion</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Lead Trend Analysis</CardTitle>
              <CardDescription>Monthly lead acquisition and conversion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                <BarChart className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="font-medium">Lead Acquisition Trend</p>
                <p className="text-sm text-muted-foreground mt-1">(Visualized chart showing lead acquisition over time)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>Configure lead source integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-md p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Facebook className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Meta Forms Integration</h3>
                      <p className="text-sm text-muted-foreground">Import leads directly from Facebook forms</p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="border rounded-md p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-600" />
                    <div>
                      <h3 className="font-medium">Google Forms Integration</h3>
                      <p className="text-sm text-muted-foreground">Automatically import Google Form submissions</p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="border rounded-md p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-medium">Excel Import Templates</h3>
                      <p className="text-sm text-muted-foreground">Download and configure Excel import templates</p>
                    </div>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>
                
                <div className="border rounded-md p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Globe className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Website Lead Capture</h3>
                      <p className="text-sm text-muted-foreground">Configure website contact form integration</p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Lead Assignment Rules</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Round Robin Assignment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Source-based Assignment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Territory-based Assignment</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Email notifications for new leads</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>In-app notifications for lead updates</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadManagement;