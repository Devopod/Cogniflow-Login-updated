import { useEffect, useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Tag,
  Trash,
  TrendingUp,
  Users,
  User,
  Package
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
import { useDeals } from "@/hooks/use-crm-data";

// Backend data via useDeals()
/* Sample deal data (removed)
const deals = [
  {
    id: "DEAL-2023-001",
    name: "Enterprise Suite License",
    customer: "Acme Corporation",
    value: 42500,
    stage: "Negotiation",
    probability: 75,
    expectedCloseDate: "2023-06-15",
    owner: "Sarah Johnson",
    createdAt: "2023-03-10",
    lastActivity: "2023-05-05",
    tags: ["Enterprise", "License"],
    notes: "Decision committee meeting scheduled for June 5th.",
    contacts: [
      { id: "CT-2023-001", name: "John Smith", email: "john.smith@example.com", phone: "+1 (555) 123-4567", role: "Decision Maker" }
    ],
    activities: [
      { id: 1, type: "Call", date: "2023-05-05", summary: "Discussed final terms and pricing structure", user: "Sarah Johnson" },
      { id: 2, type: "Email", date: "2023-04-25", summary: "Sent revised proposal with updated pricing", user: "Sarah Johnson" },
      { id: 3, type: "Meeting", date: "2023-04-10", summary: "Product demo for technical team", user: "Michael Chen" }
    ]
  },
  {
    id: "DEAL-2023-002",
    name: "Professional Implementation",
    customer: "TechStart Inc.",
    value: 15000,
    stage: "Proposal",
    probability: 50,
    expectedCloseDate: "2023-06-30",
    owner: "Michael Chen",
    createdAt: "2023-04-02",
    lastActivity: "2023-05-02",
    tags: ["Services", "Implementation"],
    notes: "Need to address concerns about timeline and resource allocation.",
    contacts: [
      { id: "CT-2023-002", name: "Sarah Johnson", email: "sarah.johnson@example.com", phone: "+1 (555) 234-5678", role: "Technical Lead" }
    ],
    activities: [
      { id: 4, type: "Email", date: "2023-05-02", summary: "Provided timeline estimates for implementation phases", user: "Michael Chen" },
      { id: 5, type: "Meeting", date: "2023-04-20", summary: "Requirements gathering session", user: "Michael Chen" }
    ]
  },
  {
    id: "DEAL-2023-003",
    name: "Standard Plan Subscription",
    customer: "Digital Dynamics",
    value: 8800,
    stage: "Discovery",
    probability: 25,
    expectedCloseDate: "2023-07-15",
    owner: "Emma Wilson",
    createdAt: "2023-04-10",
    lastActivity: "2023-04-22",
    tags: ["Subscription", "Standard"],
    notes: "Initial discussions about team collaboration features.",
    contacts: [
      { id: "CT-2023-005", name: "James Taylor", email: "james.taylor@example.com", phone: "+1 (555) 567-8901", role: "Evaluator" }
    ],
    activities: [
      { id: 6, type: "Call", date: "2023-04-22", summary: "Introductory call to understand business needs", user: "Emma Wilson" }
    ]
  },
  {
    id: "DEAL-2023-004",
    name: "Support Plan Renewal",
    customer: "Innovative Solutions",
    value: 5200,
    stage: "Closed Won",
    probability: 100,
    expectedCloseDate: "2023-05-01",
    owner: "David Rodriguez",
    createdAt: "2023-03-15",
    lastActivity: "2023-05-01",
    tags: ["Renewal", "Support"],
    notes: "Annual support plan renewal completed.",
    contacts: [
      { id: "CT-2023-004", name: "Emma Wilson", email: "emma.wilson@example.com", phone: "+1 (555) 456-7890", role: "Operations" }
    ],
    activities: [
      { id: 7, type: "Email", date: "2023-05-01", summary: "Sent confirmation of renewal and invoice", user: "David Rodriguez" },
      { id: 8, type: "Call", date: "2023-04-15", summary: "Discussed support plan options", user: "David Rodriguez" }
    ]
  },
  {
    id: "DEAL-2023-005",
    name: "Enterprise Implementation",
    customer: "Global Services Ltd.",
    value: 65000,
    stage: "Closed Lost",
    probability: 0,
    expectedCloseDate: "2023-04-30",
    owner: "Sarah Johnson",
    createdAt: "2023-02-10",
    lastActivity: "2023-04-12",
    tags: ["Enterprise", "Implementation"],
    notes: "Lost to competitor due to pricing concerns.",
    contacts: [
      { id: "CT-2023-003", name: "Michael Chen", email: "michael.chen@example.com", phone: "+1 (555) 345-6789", role: "Procurement" }
    ],
    activities: [
      { id: 9, type: "Email", date: "2023-04-12", summary: "Received notification that they selected a different vendor", user: "Sarah Johnson" },
      { id: 10, type: "Meeting", date: "2023-03-20", summary: "Final presentation to decision committee", user: "Sarah Johnson" }
    ]
  },
  {
    id: "DEAL-2023-006",
    name: "Premium Support Plan",
    customer: "NextGen Technologies",
    value: 12000,
    stage: "Qualified",
    probability: 40,
    expectedCloseDate: "2023-07-10",
    owner: "Michael Chen",
    createdAt: "2023-04-25",
    lastActivity: "2023-05-04",
    tags: ["Support", "Premium"],
    notes: "Interested in 24/7 support options.",
    contacts: [
      { id: "CT-2023-007", name: "Linda Garcia", email: "linda.garcia@example.com", phone: "+1 (555) 789-0123", role: "IT Manager" }
    ],
    activities: [
      { id: 11, type: "Call", date: "2023-05-04", summary: "Discussed support SLAs and response times", user: "Michael Chen" }
    ]
  },
  {
    id: "DEAL-2023-007",
    name: "Custom Development",
    customer: "Strategic Systems",
    value: 28500,
    stage: "Negotiation",
    probability: 70,
    expectedCloseDate: "2023-06-20",
    owner: "Emma Wilson",
    createdAt: "2023-03-28",
    lastActivity: "2023-05-06",
    tags: ["Custom", "Development"],
    notes: "Final scope definition in progress.",
    contacts: [
      { id: "CT-2023-008", name: "Robert Lee", email: "robert.lee@example.com", phone: "+1 (555) 890-1234", role: "Product Manager" }
    ],
    activities: [
      { id: 12, type: "Meeting", date: "2023-05-06", summary: "Technical scoping session with development team", user: "Emma Wilson" },
      { id: 13, type: "Email", date: "2023-04-18", summary: "Sent preliminary project plan", user: "Emma Wilson" }
    ]
  }
];
*/

// Deal stage options
const dealStages = [
  { id: "discovery", name: "Discovery", order: 1, color: "bg-blue-500" },
  { id: "qualified", name: "Qualified", order: 2, color: "bg-indigo-500" },
  { id: "proposal", name: "Proposal", order: 3, color: "bg-purple-500" },
  { id: "negotiation", name: "Negotiation", order: 4, color: "bg-yellow-500" },
  { id: "closedWon", name: "Closed Won", order: 5, color: "bg-green-500" },
  { id: "closedLost", name: "Closed Lost", order: 5, color: "bg-red-500" }
];

// Sample users for owner selection
const users = [
  { id: 1, name: "Sarah Johnson" },
  { id: 2, name: "Michael Chen" },
  { id: 3, name: "David Rodriguez" },
  { id: 4, name: "Emma Wilson" }
];

// Sample contacts for contact selection
const contacts = [
  { id: "CT-2023-001", name: "John Smith", company: "Acme Corporation" },
  { id: "CT-2023-002", name: "Sarah Johnson", company: "TechStart Inc." },
  { id: "CT-2023-003", name: "Michael Chen", company: "Global Services Ltd." },
  { id: "CT-2023-004", name: "Emma Wilson", company: "Innovative Solutions" },
  { id: "CT-2023-005", name: "James Taylor", company: "Digital Dynamics" },
  { id: "CT-2023-007", name: "Linda Garcia", company: "NextGen Technologies" },
  { id: "CT-2023-008", name: "Robert Lee", company: "Strategic Systems" }
];

// Sample companies for customer selection
const companies = [
  { id: 1, name: "Acme Corporation" },
  { id: 2, name: "TechStart Inc." },
  { id: 3, name: "Global Services Ltd." },
  { id: 4, name: "Innovative Solutions" },
  { id: 5, name: "Digital Dynamics" },
  { id: 6, name: "NextGen Technologies" },
  { id: 7, name: "Strategic Systems" }
];

const DealManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showDealDetails, setShowDealDetails] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isExporting, setIsExporting] = useState(false);

  // Load backend deals
  const { data: dealsData, isLoading, error } = useDeals();
  const deals = Array.isArray(dealsData) ? dealsData : [] as any[];

  // Filter deals based on search term, stage, and owner
  const filteredDeals = deals.filter((deal: any) => {
    const matchesSearch = 
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
    const matchesOwner = ownerFilter === "all" || deal.owner === ownerFilter;
    
    return matchesSearch && matchesStage && matchesOwner;
  });

  // Group deals by stage for kanban view
  const dealsByStage = dealStages.map(stage => ({
    ...stage,
    deals: deals.filter(deal => 
      deal.stage.toLowerCase() === stage.name.toLowerCase() &&
      (searchTerm === "" || 
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (ownerFilter === "all" || deal.owner === ownerFilter)
    )
  }));

  // Calculate sales metrics
  const totalDealValue = filteredDeals
    .filter(deal => deal.stage !== "Closed Lost")
    .reduce((sum, deal) => sum + deal.value, 0);

  const weightedDealValue = filteredDeals
    .filter(deal => deal.stage !== "Closed Lost")
    .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

  const openDealsCount = filteredDeals
    .filter(deal => deal.stage !== "Closed Won" && deal.stage !== "Closed Lost")
    .length;

  const closedWonValue = filteredDeals
    .filter(deal => deal.stage === "Closed Won")
    .reduce((sum, deal) => sum + deal.value, 0);
  
  // Handle deal creation
  const handleCreateDeal = () => {
    setShowCreateDeal(false);
    toast({
      title: "Deal created",
      description: "The new deal has been added successfully",
    });
  };

  // Handle viewing deal details
  const handleViewDeal = (deal: any) => {
    setSelectedDeal(deal);
    setShowDealDetails(true);
  };

  // Handle adding activity
  const handleAddActivity = () => {
    setIsAddingActivity(false);
    
    if (selectedDeal) {
      toast({
        title: "Activity added",
        description: `New activity added to deal: ${selectedDeal.name}`,
      });
    }
  };

  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Export completed",
        description: "Deals have been exported to CSV",
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">Failed to load deals</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deal Management</h2>
          <p className="text-muted-foreground">
            Track and manage your sales pipeline and opportunities
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] md:w-[240px]"
              />
            </div>
            <Select
              value={stageFilter}
              onValueChange={setStageFilter}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {dealStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.name}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ownerFilter}
              onValueChange={setOwnerFilter}
            >
              <SelectTrigger className="w-[140px]">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="border rounded-md flex">
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("list")}
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "kanban" ? "default" : "ghost"} 
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("kanban")}
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Deals
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team Goals
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showCreateDeal} onOpenChange={setShowCreateDeal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Enter the deal details to add it to your pipeline
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="details" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Deal Details</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dealName">Deal Name <span className="text-red-500">*</span></Label>
                        <Input id="dealName" placeholder="Enter deal name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
                        <Select>
                          <SelectTrigger id="customer">
                            <SelectValue placeholder="Select customer" />
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
                        <Label htmlFor="stage">Stage <span className="text-red-500">*</span></Label>
                        <Select defaultValue="Discovery">
                          <SelectTrigger id="stage">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {dealStages
                              .filter(stage => stage.name !== "Closed Won" && stage.name !== "Closed Lost")
                              .map((stage) => (
                                <SelectItem key={stage.id} value={stage.name}>
                                  {stage.name}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value">Deal Value <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            $
                          </span>
                          <Input id="value" className="pl-7" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="probability">Probability (%)</Label>
                        <Input id="probability" type="number" min="0" max="100" defaultValue="50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                        <Input id="expectedCloseDate" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner">Deal Owner</Label>
                        <Select>
                          <SelectTrigger id="owner">
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.name}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" placeholder="Enter any additional notes about this deal" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="contacts" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Related Contacts</h3>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact
                        </Button>
                      </div>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select contact" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {contacts.map((contact) => (
                                      <SelectItem key={contact.id} value={contact.id}>
                                        {contact.name} ({contact.company})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input placeholder="Role in deal" />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add contacts associated with this deal. They will be notified about deal progress.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="products" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Products/Services</h3>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </Button>
                      </div>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="enterprise">Enterprise Suite License</SelectItem>
                                    <SelectItem value="professional">Professional Plan</SelectItem>
                                    <SelectItem value="standard">Standard Plan</SelectItem>
                                    <SelectItem value="implementation">Implementation Services</SelectItem>
                                    <SelectItem value="support">Support Plan</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input type="number" min="1" defaultValue="1" className="w-16" />
                              </TableCell>
                              <TableCell>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    $
                                  </span>
                                  <Input className="pl-7 w-24" defaultValue="0.00" />
                                </div>
                              </TableCell>
                              <TableCell>$0.00</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-between p-4 border rounded-md bg-muted/40">
                        <span className="font-medium">Total Value:</span>
                        <span className="font-bold">$0.00</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setShowCreateDeal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleCreateDeal}>
                    Create Deal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Export Status */}
      {isExporting && (
        <div className="bg-muted p-4 rounded-md flex items-center space-x-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="font-medium">Exporting Deals...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while your deals are being exported to CSV.
            </p>
          </div>
        </div>
      )}

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Pipeline Value</p>
                <h2 className="text-2xl font-bold">${totalDealValue.toLocaleString()}</h2>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Across {filteredDeals.length} opportunities
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Weighted Pipeline</p>
                <h2 className="text-2xl font-bold">${weightedDealValue.toLocaleString()}</h2>
              </div>
              <div className="bg-indigo-400/10 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Based on probability
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Open Deals</p>
                <h2 className="text-2xl font-bold">{openDealsCount}</h2>
              </div>
              <div className="bg-yellow-400/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              In active sales process
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Won This Month</p>
                <h2 className="text-2xl font-bold">${closedWonValue.toLocaleString()}</h2>
              </div>
              <div className="bg-green-400/10 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals List or Kanban View */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Deals</CardTitle>
            <CardDescription>
              Your sales opportunities pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Deal Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="hidden md:table-cell">Stage</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <span>Probability</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Close Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No deals found. Try adjusting your filters or search term.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <div className="font-medium">{deal.name}</div>
                          <div className="text-sm text-muted-foreground">{deal.id}</div>
                        </TableCell>
                        <TableCell>{deal.customer}</TableCell>
                        <TableCell className="font-medium">
                          ${deal.value.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={
                            deal.stage === "Closed Won" ? "default" :
                            deal.stage === "Closed Lost" ? "destructive" :
                            deal.stage === "Negotiation" ? "secondary" :
                            "outline"
                          }>
                            {deal.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress value={deal.probability} className="h-2 w-12" />
                            <span>{deal.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {deal.expectedCloseDate}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{deal.owner}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDeal(deal)}>
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit deal
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Create quotation
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add activity
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-green-500">
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                Mark as won
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">
                                <Trash className="h-4 w-4 mr-2 text-red-500" />
                                Delete deal
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
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Deal Pipeline</h3>
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {dealsByStage.map((stage) => (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-72 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h4 className="font-medium">{stage.name}</h4>
                    <Badge variant="outline">{stage.deals.length}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${stage.deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  {stage.deals.map((deal) => (
                    <Card 
                      key={deal.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewDeal(deal)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{deal.name}</div>
                        <div className="text-sm text-muted-foreground">{deal.customer}</div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm font-medium">${deal.value.toLocaleString()}</div>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span>{deal.expectedCloseDate}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3" />
                            <span>{deal.owner}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {deal.probability}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stage.deals.length === 0 && (
                    <div className="h-20 border border-dashed rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No deals</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deal Details Dialog */}
      {selectedDeal && (
        <Dialog open={showDealDetails} onOpenChange={setShowDealDetails}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Deal Details</DialogTitle>
              <DialogDescription>
                {selectedDeal.id} • Created on {selectedDeal.createdAt}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedDeal.name}</h3>
                      <div className="text-muted-foreground">{selectedDeal.customer}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Deal Value</span>
                        <span className="font-bold">${selectedDeal.value.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Stage</span>
                        <Badge variant={
                          selectedDeal.stage === "Closed Won" ? "default" :
                          selectedDeal.stage === "Closed Lost" ? "destructive" :
                          selectedDeal.stage === "Negotiation" ? "secondary" :
                          "outline"
                        }>
                          {selectedDeal.stage}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Probability</span>
                        <span className="font-medium">{selectedDeal.probability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expected Close Date</span>
                        <span>{selectedDeal.expectedCloseDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Deal Owner</span>
                        <span>{selectedDeal.owner}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Notes</h4>
                      <p className="text-sm">{selectedDeal.notes}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDeal.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Deal Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            {selectedDeal.stage === "Closed Won" ? (
                              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="font-medium">Deal Won!</p>
                                  <p className="text-sm text-muted-foreground">
                                    This deal has been successfully closed.
                                  </p>
                                </div>
                              </div>
                            ) : selectedDeal.stage === "Closed Lost" ? (
                              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-md flex items-center gap-2">
                                <Trash className="h-5 w-5 text-red-600" />
                                <div>
                                  <p className="font-medium">Deal Lost</p>
                                  <p className="text-sm text-muted-foreground">
                                    This deal was not successful.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Progress</span>
                                  <span className="font-medium">
                                    {
                                      selectedDeal.stage === "Discovery" ? "20%" :
                                      selectedDeal.stage === "Qualified" ? "40%" :
                                      selectedDeal.stage === "Proposal" ? "60%" :
                                      selectedDeal.stage === "Negotiation" ? "80%" : "0%"
                                    }
                                  </span>
                                </div>
                                <Progress value={
                                  selectedDeal.stage === "Discovery" ? 20 :
                                  selectedDeal.stage === "Qualified" ? 40 :
                                  selectedDeal.stage === "Proposal" ? 60 :
                                  selectedDeal.stage === "Negotiation" ? 80 : 0
                                } className="h-2" />
                              </>
                            )}
                          </div>
                          
                          <div className="flex justify-between pt-2">
                            <span className="text-sm text-muted-foreground">Last Activity</span>
                            <span className="text-sm">{selectedDeal.lastActivity}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm">Change Stage</Button>
                            {selectedDeal.stage !== "Closed Won" && selectedDeal.stage !== "Closed Lost" && (
                              <div className="flex gap-2">
                                <Button variant="default" size="sm">
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Won
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash className="h-4 w-4 mr-2" />
                                  Mark as Lost
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">Next Steps</CardTitle>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedDeal.stage === "Closed Won" ? (
                            <div className="text-center py-2">
                              <Check className="h-5 w-5 text-green-500 mx-auto mb-1" />
                              <p className="text-sm">All steps completed!</p>
                            </div>
                          ) : selectedDeal.stage === "Closed Lost" ? (
                            <div className="text-center py-2">
                              <Trash className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                              <p className="text-sm text-muted-foreground">No active steps</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" className="h-4 w-4" />
                                  <span className="text-sm">Schedule follow-up call</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Tomorrow</span>
                              </div>
                              <div className="flex justify-between items-center p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" className="h-4 w-4" />
                                  <span className="text-sm">Send proposal document</span>
                                </div>
                                <span className="text-xs text-muted-foreground">3 days</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Activity Timeline</h3>
                  <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Activity
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add Activity</DialogTitle>
                        <DialogDescription>
                          Record a new activity for this deal
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="activity-type" className="text-right">
                            Type
                          </Label>
                          <div className="col-span-3">
                            <Select>
                              <SelectTrigger id="activity-type">
                                <SelectValue placeholder="Select activity type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="call">Call</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="note">Note</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="activity-date" className="text-right">
                            Date
                          </Label>
                          <div className="col-span-3">
                            <Input
                              id="activity-date"
                              type="date"
                              defaultValue={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="activity-summary" className="text-right">
                            Summary
                          </Label>
                          <div className="col-span-3">
                            <Textarea
                              id="activity-summary"
                              placeholder="Brief description of the activity"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingActivity(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleAddActivity}>
                          Add Activity
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-4">
                  {selectedDeal.activities.length === 0 ? (
                    <div className="text-center p-6 border border-dashed rounded-md">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium">No activities yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Record your first activity with this deal.
                      </p>
                    </div>
                  ) : (
                    selectedDeal.activities.map((activity: any) => (
                      <div key={activity.id} className="border-l-2 border-primary pl-4 pb-4 relative">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {activity.type}
                              </Badge>
                              <span className="font-medium">{activity.summary}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              By {activity.user}
                            </p>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{activity.date}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="contacts" className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Related Contacts</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDeal.contacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No contacts associated with this deal.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedDeal.contacts.map((contact: any) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">{contact.name}</TableCell>
                            <TableCell>{contact.role}</TableCell>
                            <TableCell>
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
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="products" className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Products & Services</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <div className="flex flex-col items-center">
                            <Package className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No products added to this deal yet.</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Product
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between p-4 border rounded-md bg-muted/40">
                  <span className="font-medium">Deal Total Value:</span>
                  <span className="font-bold">${selectedDeal.value.toLocaleString()}</span>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DealManagement;