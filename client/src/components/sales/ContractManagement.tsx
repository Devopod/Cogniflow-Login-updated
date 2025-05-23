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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  Lock,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash,
  Upload,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Sample data for contracts
const contracts = [
  {
    id: "CON-2023-001",
    client: "Acme Corporation",
    contractType: "SaaS Subscription",
    status: "Active",
    startDate: "2023-01-15",
    endDate: "2024-01-14",
    value: "$45,000.00",
    renewalType: "Auto-renew",
    owner: "Sarah Johnson"
  },
  {
    id: "CON-2023-002",
    client: "TechStart Inc.",
    contractType: "Implementation Services",
    status: "Draft",
    startDate: "2023-02-01",
    endDate: "2023-05-31",
    value: "$28,500.00",
    renewalType: "One-time",
    owner: "Michael Chen"
  },
  {
    id: "CON-2023-003",
    client: "Global Services Ltd.",
    contractType: "Enterprise License",
    status: "Pending Approval",
    startDate: "2023-03-10",
    endDate: "2026-03-09",
    value: "$120,000.00",
    renewalType: "Manual renewal",
    owner: "David Rodriguez"
  },
  {
    id: "CON-2023-004",
    client: "Innovative Solutions",
    contractType: "Support Plan",
    status: "Expired",
    startDate: "2022-04-01",
    endDate: "2023-03-31",
    value: "$12,000.00",
    renewalType: "Auto-renew",
    owner: "Emma Wilson"
  },
  {
    id: "CON-2023-005",
    client: "Digital Dynamics",
    contractType: "Consulting Services",
    status: "Active",
    startDate: "2023-05-15",
    endDate: "2023-11-14",
    value: "$35,000.00",
    renewalType: "One-time",
    owner: "James Taylor"
  },
  {
    id: "CON-2023-006",
    client: "NextGen Technologies",
    contractType: "SaaS Subscription",
    status: "Pending Signature",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    value: "$24,000.00",
    renewalType: "Auto-renew",
    owner: "Sarah Johnson"
  },
  {
    id: "CON-2023-007",
    client: "Strategic Systems",
    contractType: "Enterprise License",
    status: "Active",
    startDate: "2023-01-01",
    endDate: "2025-12-31",
    value: "$95,000.00",
    renewalType: "Manual renewal",
    owner: "Michael Chen"
  }
];

// Template contracts for quick creation
const contractTemplates = [
  { id: 1, name: "SaaS Subscription - Monthly", description: "Standard monthly subscription contract" },
  { id: 2, name: "SaaS Subscription - Annual", description: "Standard annual subscription with discount" },
  { id: 3, name: "Enterprise License Agreement", description: "Multi-year enterprise license with support" },
  { id: 4, name: "Implementation Services", description: "Fixed-price implementation services contract" },
  { id: 5, name: "Consulting Services", description: "Time and materials consulting services contract" },
];

// Renewal reminder settings
const renewalSettings = [
  { id: 1, period: "30 days before", isEnabled: true },
  { id: 2, period: "60 days before", isEnabled: true },
  { id: 3, period: "90 days before", isEnabled: false },
];

const ContractManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Filter contracts based on search term and status
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = 
      contract.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle viewing contract details
  const handleViewContract = (contract: any) => {
    setSelectedContract(contract);
    setShowContractDetails(true);
  };

  // Handle contract creation
  const handleCreateContract = () => {
    setShowCreateContract(false);
    toast({
      title: "Contract created",
      description: "The contract has been created successfully",
    });
  };

  // Calculate days until renewal
  const getDaysUntilRenewal = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get badge variant based on contract status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Active":
        return "default";
      case "Draft":
        return "outline";
      case "Pending Approval":
      case "Pending Signature":
        return "secondary";
      case "Expired":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contract Management</h2>
          <p className="text-muted-foreground">
            Manage client contracts, track renewals, and monitor contract performance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px] md:w-[300px]"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Pending Signature">Pending Signature</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showCreateContract} onOpenChange={setShowCreateContract}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
                <DialogDescription>
                  Enter the contract details or use a template to get started quickly.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Contract Details</TabsTrigger>
                  <TabsTrigger value="templates">Use Template</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">Client</Label>
                        <Select>
                          <SelectTrigger id="client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acme">Acme Corporation</SelectItem>
                            <SelectItem value="techstart">TechStart Inc.</SelectItem>
                            <SelectItem value="global">Global Services Ltd.</SelectItem>
                            <SelectItem value="innovative">Innovative Solutions</SelectItem>
                            <SelectItem value="digital">Digital Dynamics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract-type">Contract Type</Label>
                        <Select>
                          <SelectTrigger id="contract-type">
                            <SelectValue placeholder="Select contract type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saas">SaaS Subscription</SelectItem>
                            <SelectItem value="enterprise">Enterprise License</SelectItem>
                            <SelectItem value="implementation">Implementation Services</SelectItem>
                            <SelectItem value="support">Support Plan</SelectItem>
                            <SelectItem value="consulting">Consulting Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract-value">Contract Value</Label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            $
                          </span>
                          <Input id="contract-value" className="pl-7" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="renewal-type">Renewal Type</Label>
                        <Select>
                          <SelectTrigger id="renewal-type">
                            <SelectValue placeholder="Select renewal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-renew</SelectItem>
                            <SelectItem value="manual">Manual renewal</SelectItem>
                            <SelectItem value="one-time">One-time (No renewal)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input id="start-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input id="end-date" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner">Contract Owner</Label>
                        <Select>
                          <SelectTrigger id="owner">
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sarah">Sarah Johnson</SelectItem>
                            <SelectItem value="michael">Michael Chen</SelectItem>
                            <SelectItem value="david">David Rodriguez</SelectItem>
                            <SelectItem value="emma">Emma Wilson</SelectItem>
                            <SelectItem value="james">James Taylor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select defaultValue="draft">
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending-approval">Pending Approval</SelectItem>
                            <SelectItem value="pending-signature">Pending Signature</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="notes">Contract Notes</Label>
                    <Textarea id="notes" placeholder="Enter any additional notes or terms..." />
                  </div>
                </TabsContent>
                <TabsContent value="templates" className="pt-4">
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Template Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right w-[100px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contractTemplates.map((template) => (
                            <TableRow key={template.id}>
                              <TableCell className="font-medium">{template.name}</TableCell>
                              <TableCell>{template.description}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <Copy className="h-4 w-4 mr-1" />
                                  Use
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Using a template will pre-fill the contract details that you can then customize as needed.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowCreateContract(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleCreateContract}>
                  Create Contract
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Contract List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Contract List</CardTitle>
          <CardDescription>
            Manage your active and upcoming contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Contract ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Value</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="hidden md:table-cell">End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.id}</TableCell>
                    <TableCell>{contract.client}</TableCell>
                    <TableCell>{contract.contractType}</TableCell>
                    <TableCell className="hidden lg:table-cell">{contract.value}</TableCell>
                    <TableCell className="hidden md:table-cell">{contract.startDate}</TableCell>
                    <TableCell className="hidden md:table-cell">{contract.endDate}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(contract.status)}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{contract.owner}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit contract
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Send for signature
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Lock className="h-4 w-4 mr-2" />
                            Change status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Renew contract
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete contract
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      {selectedContract && (
        <Dialog open={showContractDetails} onOpenChange={setShowContractDetails}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Contract Details: {selectedContract.id}</DialogTitle>
              <DialogDescription>
                {selectedContract.client} - {selectedContract.contractType}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Contract Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="history">History & Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Client</p>
                      <p className="text-sm font-medium">{selectedContract.client}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Contract Type</p>
                      <p className="text-sm font-medium">{selectedContract.contractType}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Value</p>
                      <p className="text-sm font-medium">{selectedContract.value}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={getStatusBadge(selectedContract.status)}>
                        {selectedContract.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="text-sm font-medium">{selectedContract.startDate}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p className="text-sm font-medium">{selectedContract.endDate}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Renewal Type</p>
                      <p className="text-sm font-medium">{selectedContract.renewalType}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Contract Owner</p>
                      <p className="text-sm font-medium">{selectedContract.owner}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Contract Timeline</h4>
                  <div className="relative pt-4">
                    <div className="absolute left-0 top-0 w-full h-2 bg-gray-200 rounded">
                      <div 
                        className="absolute left-0 top-0 h-2 bg-primary rounded"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, 
                            100 - (getDaysUntilRenewal(selectedContract.endDate) / 365 * 100)
                          ))}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-4 text-xs">
                      <div>Start: {selectedContract.startDate}</div>
                      <div className="text-primary font-medium">
                        {getDaysUntilRenewal(selectedContract.endDate) > 0 ? 
                          `${getDaysUntilRenewal(selectedContract.endDate)} days remaining` : 
                          'Contract expired'}
                      </div>
                      <div>End: {selectedContract.endDate}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-2 justify-end">
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Contract
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button size="sm">
                    {selectedContract.status === "Expired" ? (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Renew Contract
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send for Signature
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Contract Documents</h4>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Date Uploaded</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              Master_Agreement.pdf
                            </div>
                          </TableCell>
                          <TableCell>2023-01-10</TableCell>
                          <TableCell>Contract Document</TableCell>
                          <TableCell>1.2 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              Service_Level_Agreement.pdf
                            </div>
                          </TableCell>
                          <TableCell>2023-01-12</TableCell>
                          <TableCell>SLA</TableCell>
                          <TableCell>850 KB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-green-500" />
                              Signed_Contract.pdf
                            </div>
                          </TableCell>
                          <TableCell>2023-01-15</TableCell>
                          <TableCell>Signed Document</TableCell>
                          <TableCell>1.5 MB</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="pt-4 space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Contract History</h4>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-accent/50 p-4 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary p-2 rounded-full h-fit">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Contract signed by client</p>
                            <Badge variant="outline" className="text-xs">Status changed</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Jan 15, 2023 • System</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-accent/50 p-4 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 p-2 rounded-full h-fit">
                          <Send className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Contract sent for signature</p>
                            <Badge variant="outline" className="text-xs">Status changed</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Jan 12, 2023 • Sarah Johnson</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-accent/50 p-4 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="bg-purple-100 p-2 rounded-full h-fit">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Contract approved by legal team</p>
                          <p className="text-xs text-muted-foreground mt-1">Jan 11, 2023 • Legal Department</p>
                          <p className="text-sm mt-2">Approved with minor changes to section 3.2 regarding payment terms.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-accent/50 p-4 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="bg-green-100 p-2 rounded-full h-fit">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Contract draft created</p>
                            <Badge variant="outline" className="text-xs">Created</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Jan 10, 2023 • Sarah Johnson</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
            <CardDescription>
              Contracts that need attention in the next 90 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts
                .filter(contract => 
                  getDaysUntilRenewal(contract.endDate) > 0 && 
                  getDaysUntilRenewal(contract.endDate) <= 90
                )
                .sort((a, b) => 
                  getDaysUntilRenewal(a.endDate) - getDaysUntilRenewal(b.endDate)
                )
                .slice(0, 4)
                .map(contract => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{contract.client}</div>
                      <div className="text-sm text-muted-foreground">
                        {contract.contractType} • {contract.id}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant={
                        getDaysUntilRenewal(contract.endDate) <= 30 ? "destructive" : 
                        getDaysUntilRenewal(contract.endDate) <= 60 ? "secondary" : 
                        "outline"
                      }>
                        {getDaysUntilRenewal(contract.endDate)} days
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        Expires: {contract.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              {contracts.filter(contract => 
                  getDaysUntilRenewal(contract.endDate) > 0 && 
                  getDaysUntilRenewal(contract.endDate) <= 90
                ).length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No upcoming renewals in the next 90 days
                </div>
              )}
              <div className="text-center mt-2">
                <Button variant="outline" size="sm">
                  View All Renewals
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>Renewal Settings</CardTitle>
              <CardDescription>
                Configure automatic renewal reminders
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Save Changes
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md divide-y">
                {renewalSettings.map(setting => (
                  <div key={setting.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{setting.period}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`email-${setting.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked
                        />
                        <Label htmlFor={`email-${setting.id}`} className="text-sm">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`system-${setting.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked
                        />
                        <Label htmlFor={`system-${setting.id}`} className="text-sm">
                          System
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <input
                          type="checkbox"
                          id={`enabled-${setting.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={setting.isEnabled}
                        />
                        <Label htmlFor={`enabled-${setting.id}`} className="text-sm">
                          Enabled
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Custom email notification recipients</span>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Renewal reminder emails will be sent to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Contract owner</li>
                  <li>Account manager</li>
                  <li>Additional configured recipients</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractManagement;