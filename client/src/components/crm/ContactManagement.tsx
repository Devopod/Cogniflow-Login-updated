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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpDown,
  BarChart3 as BarChart,
  Building,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Share2,
  Tags,
  Trash,
  Upload,
  UserCircle,
  UserPlus,
  Users
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

// Sample contact data
const contacts = [
  {
    id: "CT-2023-001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    position: "CEO",
    type: "Customer",
    status: "Active",
    source: "Manual",
    address: "123 Main Street, New York, NY 10001",
    createdAt: "2023-01-15",
    notes: "Key decision maker for enterprise deals"
  },
  {
    id: "CT-2023-002",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 234-5678",
    company: "TechStart Inc.",
    position: "CTO",
    type: "Customer",
    status: "Active",
    source: "Website",
    address: "456 Market Street, San Francisco, CA 94103",
    createdAt: "2023-02-10",
    notes: "Interested in our professional plan"
  },
  {
    id: "CT-2023-003",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@example.com",
    phone: "+1 (555) 345-6789",
    company: "Global Services Ltd.",
    position: "Procurement Manager",
    type: "Supplier",
    status: "Active",
    source: "Referral",
    address: "789 Queen Street, Toronto, ON M5V 2A3, Canada",
    createdAt: "2023-02-20",
    notes: "Supplies custom hardware components"
  },
  {
    id: "CT-2023-004",
    firstName: "Emma",
    lastName: "Wilson",
    email: "emma.wilson@example.com",
    phone: "+1 (555) 456-7890",
    company: "Innovative Solutions",
    position: "Director of Operations",
    type: "Customer",
    status: "Inactive",
    source: "Manual",
    address: "321 Park Avenue, Chicago, IL 60601",
    createdAt: "2023-03-05",
    notes: "Account on hold - follow up in Q3"
  },
  {
    id: "CT-2023-005",
    firstName: "James",
    lastName: "Taylor",
    email: "james.taylor@example.com",
    phone: "+1 (555) 567-8901",
    company: "Digital Dynamics",
    position: "Sales Director",
    type: "Customer",
    status: "Active",
    source: "Google Form",
    address: "555 Main Street, Austin, TX 78701",
    createdAt: "2023-03-15",
    notes: "Potential strategic partnership opportunity"
  },
  {
    id: "CT-2023-006",
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@example.com",
    phone: "+1 (555) 678-9012",
    company: "Supply Chain Experts",
    position: "CEO",
    type: "Supplier",
    status: "Active",
    source: "Facebook Lead",
    address: "888 Collins Street, Melbourne, VIC 3000, Australia",
    createdAt: "2023-04-05",
    notes: "Premium logistics supplier"
  },
  {
    id: "CT-2023-007",
    firstName: "Linda",
    lastName: "Garcia",
    email: "linda.garcia@example.com",
    phone: "+1 (555) 789-0123",
    company: "NextGen Technologies",
    position: "IT Manager",
    type: "Customer",
    status: "Active",
    source: "Excel Import",
    address: "777 First Street, Seattle, WA 98101",
    createdAt: "2023-04-20",
    notes: "Interested in enterprise solution"
  }
];

// Sample companies (for selection in forms)
const companies = [
  { id: 1, name: "Acme Corporation", type: "Customer" },
  { id: 2, name: "TechStart Inc.", type: "Customer" },
  { id: 3, name: "Global Services Ltd.", type: "Supplier" },
  { id: 4, name: "Innovative Solutions", type: "Customer" },
  { id: 5, name: "Digital Dynamics", type: "Customer" },
  { id: 6, name: "Supply Chain Experts", type: "Supplier" },
  { id: 7, name: "NextGen Technologies", type: "Customer" }
];

// Lead source options
const leadSources = [
  "Manual", 
  "Website", 
  "Facebook", 
  "Google Form", 
  "Excel Import", 
  "Referral", 
  "Trade Show", 
  "Cold Call"
];

const ContactManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter contacts based on search term, type, and status
  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle contact creation
  const handleCreateContact = () => {
    setShowCreateContact(false);
    toast({
      title: "Contact created",
      description: "The new contact has been added successfully",
    });
  };

  // Handle viewing contact details
  const handleViewContact = (contact: any) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };

  // Handle import/export contacts
  const handleImport = () => {
    setIsImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      setIsImporting(false);
      toast({
        title: "Import completed",
        description: "Contacts have been imported successfully",
      });
    }, 2000);
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Export completed",
        description: "Contacts have been exported to CSV",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contact Management</h2>
          <p className="text-muted-foreground">
            Manage customers, leads, and suppliers in one place
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] md:w-[240px]"
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
                <SelectItem value="Customer">Customers</SelectItem>
                <SelectItem value="Supplier">Suppliers</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[130px]">
                <Tags className="h-4 w-4 mr-2" />
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Contacts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Contacts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showCreateContact} onOpenChange={setShowCreateContact}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Enter the contact details to create a new entry.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="additional">Additional Info</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                        <Input id="firstName" placeholder="Enter first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                        <Input id="lastName" placeholder="Enter last name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                        <Input id="email" type="email" placeholder="Enter email address" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" placeholder="Enter phone number" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Contact Type <span className="text-red-500">*</span></Label>
                        <Select>
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Customer">Customer</SelectItem>
                            <SelectItem value="Supplier">Supplier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="source">Lead Source</Label>
                        <Select>
                          <SelectTrigger id="source">
                            <SelectValue placeholder="Select lead source" />
                          </SelectTrigger>
                          <SelectContent>
                            {leadSources.map((source) => (
                              <SelectItem key={source} value={source}>{source}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="company" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Select>
                          <SelectTrigger id="company">
                            <SelectValue placeholder="Select or enter company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.name}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Job Position</Label>
                        <Input id="position" placeholder="Enter job position" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" placeholder="Enter full address" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="additional" className="pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select defaultValue="Active">
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" placeholder="Enter any additional notes about this contact" className="h-20" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setShowCreateContact(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleCreateContact}>
                    Add Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Import/Export Status */}
      {(isImporting || isExporting) && (
        <div className="bg-muted p-4 rounded-md flex items-center space-x-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="font-medium">
              {isImporting ? "Importing Contacts..." : "Exporting Contacts..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {isImporting ? "Please wait while your contacts are being imported." : "Please wait while your contacts are being exported."}
            </p>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Manage your customer and supplier contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email/Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No contacts found. Try adjusting your filters or search term.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-sm text-muted-foreground">{contact.id}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{contact.email}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{contact.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>{contact.company}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{contact.position}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contact.type === "Customer" ? "default" : "secondary"}>
                          {contact.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{contact.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contact.status === "Active" ? "default" : "outline"}>
                          {contact.status}
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
                            <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit contact
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Create quote
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              View deals
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                              <Trash className="h-4 w-4 mr-2 text-red-500" />
                              Delete contact
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
      </Card>

      {/* Contact Details Dialog */}
      {selectedContact && (
        <Dialog open={showContactDetails} onOpenChange={setShowContactDetails}>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
              <DialogDescription>
                {selectedContact.id} • Created on {selectedContact.createdAt}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="deals">Related Deals</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                        {selectedContact.firstName?.charAt(0) || ''}{selectedContact.lastName?.charAt(0) || ''}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedContact.firstName} {selectedContact.lastName}</h3>
                        <div className="text-sm text-muted-foreground">{selectedContact.position} at {selectedContact.company}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Email</div>
                          <div>{selectedContact.email}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Phone</div>
                          <div>{selectedContact.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Address</div>
                          <div>{selectedContact.address}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Key Information</CardTitle>
                      </CardHeader>
                      <CardContent className="py-0 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Contact Type</span>
                          <Badge variant={selectedContact.type === "Customer" ? "default" : "secondary"}>
                            {selectedContact.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={selectedContact.status === "Active" ? "default" : "outline"}>
                            {selectedContact.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Lead Source</span>
                          <Badge variant="outline">{selectedContact.source}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Created On</span>
                          <span className="text-sm">{selectedContact.createdAt}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Notes</CardTitle>
                      </CardHeader>
                      <CardContent className="py-0">
                        <p className="text-sm">{selectedContact.notes || "No notes available for this contact."}</p>
                      </CardContent>
                    </Card>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="pt-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Activity Timeline</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="border-l-2 border-primary pl-4 pb-6 relative">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Contact created</p>
                        <p className="text-sm text-muted-foreground mt-1">Initial contact information added</p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{selectedContact.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-l-2 border-muted pl-4 pb-6 relative">
                    <div className="absolute w-3 h-3 bg-muted rounded-full -left-[7px] top-0"></div>
                    <div className="text-center p-6">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No recent activities.</p>
                      <p className="text-sm text-muted-foreground mt-1">Activities will appear here when created.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="deals" className="pt-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Related Deals</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deal
                  </Button>
                </div>
                
                {selectedContact.type === "Customer" ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Deal Name</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Enterprise Suite License</TableCell>
                            <TableCell>$42,500</TableCell>
                            <TableCell>
                              <Badge>Negotiation</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Professional Implementation</TableCell>
                            <TableCell>$15,000</TableCell>
                            <TableCell>
                              <Badge variant="outline">Proposal</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-muted/30 rounded-md p-6 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No deals for suppliers</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This contact is a supplier. Purchase orders will be available in a future update.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Company and Contact Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Contact Sources</CardTitle>
                <CardDescription>Where your contacts are coming from</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Last 30 Days
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-80 bg-muted/20 rounded-md flex flex-col items-center justify-center">
              <BarChart className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="font-medium">Contact Source Distribution</p>
              <p className="text-sm text-muted-foreground mt-1">(Chart showing lead source distribution)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 border rounded-md">
                <div className="text-sm text-muted-foreground">Manual</div>
                <div className="text-xl font-bold mt-1">42%</div>
              </div>
              <div className="text-center p-3 border rounded-md">
                <div className="text-sm text-muted-foreground">Website</div>
                <div className="text-xl font-bold mt-1">27%</div>
              </div>
              <div className="text-center p-3 border rounded-md">
                <div className="text-sm text-muted-foreground">Facebook</div>
                <div className="text-xl font-bold mt-1">18%</div>
              </div>
              <div className="text-center p-3 border rounded-md">
                <div className="text-sm text-muted-foreground">Other</div>
                <div className="text-xl font-bold mt-1">13%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Contact Breakdown</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-6">
                <div className="relative inline-block">
                  <div className="h-32 w-32 rounded-full border-8 border-primary flex items-center justify-center">
                    <span className="text-3xl font-bold">{contacts.length}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                    {contacts.filter(c => c.type === "Customer").length}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="text-sm">Suppliers</span>
                    </div>
                    <div className="font-bold">
                      {contacts.filter(c => c.type === "Supplier").length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-secondary"></div>
                      <span className="text-sm">Customers</span>
                    </div>
                    <div className="font-bold">
                      {contacts.filter(c => c.type === "Customer").length}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active contacts</span>
                  <span className="text-sm font-medium">
                    {contacts.filter(c => c.status === "Active").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Inactive contacts</span>
                  <span className="text-sm font-medium">
                    {contacts.filter(c => c.status === "Inactive").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Added this month</span>
                  <span className="text-sm font-medium">2</span>
                </div>
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Import Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactManagement;