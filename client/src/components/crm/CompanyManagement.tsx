import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  BarChart3,
  Building,
  Building2,
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
  Globe,
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
  TrendingUp,
  Upload,
  UserCircle,
  Users,
  DollarSign,
  Activity,
  Star,
  Target
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
import { Progress } from "@/components/ui/progress";

// Sample company data
const sampleCompanies = [
  {
    id: "CO-2023-001",
    name: "Acme Corporation",
    website: "https://acme.com",
    email: "contact@acme.com",
    phone: "+1 (555) 123-4567",
    industry: "Technology",
    size: "Enterprise",
    type: "Customer",
    status: "Active",
    address: "123 Main Street, New York, NY 10001",
    country: "United States",
    founded: "2015",
    revenue: 50000000,
    employees: 250,
    contacts: 5,
    activeDeals: 3,
    totalDeals: 15,
    dealValue: 2500000,
    lastActivity: "2023-12-01T10:30:00Z",
    createdAt: "2023-01-15T08:00:00Z",
    description: "Leading technology solutions provider specializing in enterprise software and cloud services.",
    notes: "Key enterprise customer with multiple ongoing projects. High priority account.",
    rating: 5,
    tags: ["VIP", "Enterprise", "Technology"]
  },
  {
    id: "CO-2023-002",
    name: "TechStart Inc.",
    website: "https://techstart.io",
    email: "hello@techstart.io",
    phone: "+1 (555) 234-5678",
    industry: "Software",
    size: "Startup",
    type: "Customer",
    status: "Active",
    address: "456 Market Street, San Francisco, CA 94103",
    country: "United States",
    founded: "2020",
    revenue: 2000000,
    employees: 25,
    contacts: 3,
    activeDeals: 2,
    totalDeals: 5,
    dealValue: 150000,
    lastActivity: "2023-11-30T14:20:00Z",
    createdAt: "2023-02-10T09:15:00Z",
    description: "Innovative startup developing AI-powered business automation tools.",
    notes: "Growing rapidly, potential for long-term partnership. Very responsive team.",
    rating: 4,
    tags: ["Startup", "AI", "High Growth"]
  },
  {
    id: "CO-2023-003",
    name: "Global Services Ltd.",
    website: "https://globalservices.com",
    email: "business@globalservices.com",
    phone: "+44 20 7123 4567",
    industry: "Professional Services",
    size: "Large",
    type: "Supplier",
    status: "Active",
    address: "789 Queen Street, London, UK",
    country: "United Kingdom",
    founded: "2010",
    revenue: 15000000,
    employees: 120,
    contacts: 4,
    activeDeals: 1,
    totalDeals: 8,
    dealValue: 800000,
    lastActivity: "2023-11-28T16:45:00Z",
    createdAt: "2023-02-20T11:30:00Z",
    description: "International consulting firm providing business process optimization and strategic planning.",
    notes: "Reliable supplier with excellent track record. Competitive pricing.",
    rating: 4,
    tags: ["International", "Consulting", "Reliable"]
  },
  {
    id: "CO-2023-004",
    name: "Innovative Solutions",
    website: "https://innovativesolutions.co",
    email: "info@innovativesolutions.co",
    phone: "+1 (555) 345-6789",
    industry: "Manufacturing",
    size: "Medium",
    type: "Customer",
    status: "Inactive",
    address: "321 Park Avenue, Chicago, IL 60601",
    country: "United States",
    founded: "2018",
    revenue: 8000000,
    employees: 85,
    contacts: 2,
    activeDeals: 0,
    totalDeals: 3,
    dealValue: 0,
    lastActivity: "2023-09-15T12:00:00Z",
    createdAt: "2023-03-05T10:20:00Z",
    description: "Manufacturing solutions provider focusing on lean production and quality improvement.",
    notes: "Account on hold - budget constraints. Follow up in Q2 next year.",
    rating: 3,
    tags: ["Manufacturing", "On Hold"]
  },
  {
    id: "CO-2023-005",
    name: "Digital Dynamics",
    website: "https://digitaldynamics.net",
    email: "contact@digitaldynamics.net",
    phone: "+1 (555) 456-7890",
    industry: "Digital Marketing",
    size: "Medium",
    type: "Partner",
    status: "Active",
    address: "555 Main Street, Austin, TX 78701",
    country: "United States",
    founded: "2019",
    revenue: 5000000,
    employees: 45,
    contacts: 6,
    activeDeals: 4,
    totalDeals: 12,
    dealValue: 750000,
    lastActivity: "2023-12-02T09:30:00Z",
    createdAt: "2023-03-15T13:45:00Z",
    description: "Full-service digital marketing agency specializing in B2B lead generation and conversion optimization.",
    notes: "Strategic partner for digital marketing initiatives. Excellent collaboration.",
    rating: 5,
    tags: ["Partner", "Marketing", "Strategic"]
  },
  {
    id: "CO-2023-006",
    name: "NextGen Technologies",
    website: "https://nextgentech.ai",
    email: "business@nextgentech.ai",
    phone: "+1 (555) 567-8901",
    industry: "Artificial Intelligence",
    size: "Startup",
    type: "Customer",
    status: "Prospect",
    address: "777 First Street, Seattle, WA 98101",
    country: "United States",
    founded: "2022",
    revenue: 500000,
    employees: 12,
    contacts: 2,
    activeDeals: 1,
    totalDeals: 1,
    dealValue: 100000,
    lastActivity: "2023-11-29T15:10:00Z",
    createdAt: "2023-04-20T14:30:00Z",
    description: "Cutting-edge AI research and development company focusing on machine learning solutions.",
    notes: "New prospect with high potential. Very interested in our enterprise AI platform.",
    rating: 4,
    tags: ["AI", "Prospect", "High Potential"]
  }
];

// Company size options
const companySizes = ["Startup", "Small", "Medium", "Large", "Enterprise"];

// Industry options
const industries = [
  "Technology", "Software", "Manufacturing", "Healthcare", "Finance", "Retail",
  "Professional Services", "Education", "Real Estate", "Construction",
  "Transportation", "Energy", "Media", "Telecommunications", "Government",
  "Non-profit", "Agriculture", "Hospitality", "Automotive", "Aerospace",
  "Biotechnology", "Pharmaceuticals", "Food & Beverage", "Entertainment",
  "Sports", "Fashion", "Jewelry", "Furniture", "Electronics", "Chemicals",
  "Mining", "Oil & Gas", "Utilities", "Insurance", "Banking", "Investment",
  "Legal", "Consulting", "Marketing", "Advertising", "Public Relations",
  "Human Resources", "Logistics", "Supply Chain", "E-commerce", "Gaming",
  "Social Media", "Artificial Intelligence", "Machine Learning", "Robotics",
  "Internet of Things", "Blockchain", "Cybersecurity", "Cloud Computing",
  "Digital Marketing", "Web Development", "Mobile Development", "Data Analytics"
];

// Company types
const companyTypes = ["Customer", "Supplier", "Partner", "Competitor", "Prospect"];

// Company status options
const companyStatuses = [
  { value: "Active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "Inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  { value: "Prospect", label: "Prospect", color: "bg-blue-100 text-blue-800" },
  { value: "Archived", label: "Archived", color: "bg-red-100 text-red-800" }
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

// Get status badge
const getStatusBadge = (status: string) => {
  const statusOption = companyStatuses.find(option => option.value === status);
  if (!statusOption) return null;
  
  return (
    <Badge className={statusOption.color}>
      {statusOption.label}
    </Badge>
  );
};

// Get company size icon
const getSizeIcon = (size: string) => {
  switch (size) {
    case "Startup":
      return <Building className="h-4 w-4 text-blue-500" />;
    case "Small":
      return <Building className="h-4 w-4 text-green-500" />;
    case "Medium":
      return <Building2 className="h-4 w-4 text-yellow-500" />;
    case "Large":
      return <Building2 className="h-4 w-4 text-orange-500" />;
    case "Enterprise":
      return <Building2 className="h-4 w-4 text-purple-500" />;
    default:
      return <Building className="h-4 w-4 text-gray-500" />;
  }
};

// Get rating stars
const getRatingStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${
        index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
      }`}
    />
  ));
};

const CompanyManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Query for companies data
  const { data: companiesData, isLoading, isError } = useQuery({
    queryKey: ["/api/crm/companies"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleCompanies);
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Mutation for creating/updating companies
  const companyMutation = useMutation({
    mutationFn: (companyData: any) => {
      // Simulate API call
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast({
        title: "Success",
        description: "Company has been saved successfully",
      });
    },
  });

  // Filter and sort companies
  const filteredCompanies = companiesData?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || company.type === typeFilter;
    const matchesStatus = statusFilter === "all" || company.status === statusFilter;
    const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
    const matchesSize = sizeFilter === "all" || company.size === sizeFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesIndustry && matchesSize;
  }).sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortField === "revenue") {
      return sortDirection === "asc" 
        ? a.revenue - b.revenue 
        : b.revenue - a.revenue;
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

  // Handle company creation
  const handleCreateCompany = () => {
    setShowCreateCompany(false);
    toast({
      title: "Company created",
      description: "The new company has been added successfully",
    });
  };

  // Handle viewing company details
  const handleViewCompany = (company: any) => {
    setSelectedCompany(company);
    setShowCompanyDetails(true);
  };

  // Handle editing company
  const handleEditCompany = (company: any) => {
    setSelectedCompany(company);
    setShowEditCompany(true);
  };

  // Handle import/export companies
  const handleImport = () => {
    setIsImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      setIsImporting(false);
      toast({
        title: "Import completed",
        description: "Companies have been imported successfully",
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
        description: "Companies have been exported to CSV",
      });
    }, 2000);
  };

  // Calculate metrics
  const totalCompanies = companiesData?.length || 0;
  const activeCompanies = companiesData?.filter(c => c.status === "Active").length || 0;
  const totalRevenue = companiesData?.reduce((sum, c) => sum + c.revenue, 0) || 0;
  const avgDealValue = companiesData?.reduce((sum, c) => sum + c.dealValue, 0) / totalCompanies || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error Loading Companies</h3>
          <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Companies</p>
                <h2 className="text-2xl font-bold">{totalCompanies}</h2>
              </div>
              <div className="bg-blue-500 p-2 rounded-full text-white">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Companies</p>
                <h2 className="text-2xl font-bold">{activeCompanies}</h2>
              </div>
              <div className="bg-green-500 p-2 rounded-full text-white">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+8%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <h2 className="text-2xl font-bold">{formatCurrency(totalRevenue)}</h2>
              </div>
              <div className="bg-purple-500 p-2 rounded-full text-white">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+15%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg Deal Value</p>
                <h2 className="text-2xl font-bold">{formatCurrency(avgDealValue)}</h2>
              </div>
              <div className="bg-orange-500 p-2 rounded-full text-white">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+22%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company Management</h2>
          <p className="text-muted-foreground">
            Manage your customer, supplier, and partner companies
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] md:w-[240px]"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <Tags className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {companyTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {companyStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
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
                  Import Companies
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Companies
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showCreateCompany} onOpenChange={setShowCreateCompany}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                  <DialogDescription>
                    Enter the company details to create a new entry.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="business">Business Details</TabsTrigger>
                    <TabsTrigger value="additional">Additional Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Company Name <span className="text-red-500">*</span></Label>
                        <Input id="name" placeholder="Enter company name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" type="url" placeholder="https://example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                        <Input id="email" type="email" placeholder="contact@company.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" placeholder="+1 (555) 123-4567" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Company Type <span className="text-red-500">*</span></Label>
                        <Select>
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                          <SelectContent>
                            {companyTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select defaultValue="Active">
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {companyStatuses.map(status => (
                              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select>
                          <SelectTrigger id="industry">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map(industry => (
                              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="size">Company Size</Label>
                        <Select>
                          <SelectTrigger id="size">
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizes.map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="founded">Founded Year</Label>
                        <Input id="founded" type="number" placeholder="2020" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employees">Employees</Label>
                        <Input id="employees" type="number" placeholder="100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="revenue">Annual Revenue ($)</Label>
                        <Input id="revenue" type="number" placeholder="1000000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rating">Rating</Label>
                        <Select>
                          <SelectTrigger id="rating">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Star</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="additional" className="pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" placeholder="Enter full address" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Company description" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea id="notes" placeholder="Internal notes about this company" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input id="tags" placeholder="Enter tags separated by commas" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowCreateCompany(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateCompany}>
                    Create Company
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies ({filteredCompanies?.length || 0})</CardTitle>
          <CardDescription>
            Overview of all companies in your CRM system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Company
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("revenue")}
                >
                  <div className="flex items-center">
                    Revenue
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies?.map((company) => (
                <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        {getSizeIcon(company.size)}
                        <span className="font-medium">{company.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{company.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.industry}</Badge>
                  </TableCell>
                  <TableCell>{company.type}</TableCell>
                  <TableCell>{getStatusBadge(company.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getSizeIcon(company.size)}
                      <span className="text-sm">{company.size}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(company.revenue)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{company.contacts}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium">{company.activeDeals} active</span>
                      <span className="text-xs text-muted-foreground">{company.totalDeals} total</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(company.rating)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Company Details Dialog */}
      <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          {selectedCompany && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getSizeIcon(selectedCompany.size)}
                    <div>
                      <DialogTitle className="text-2xl">{selectedCompany.name}</DialogTitle>
                      <DialogDescription className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{selectedCompany.industry}</Badge>
                        {getStatusBadge(selectedCompany.status)}
                        <Badge variant="secondary">{selectedCompany.type}</Badge>
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getRatingStars(selectedCompany.rating)}
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="deals">Deals</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Company Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Industry</Label>
                            <p className="font-medium">{selectedCompany.industry}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Size</Label>
                            <p className="font-medium">{selectedCompany.size}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Founded</Label>
                            <p className="font-medium">{selectedCompany.founded}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Employees</Label>
                            <p className="font-medium">{selectedCompany.employees}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Revenue</Label>
                            <p className="font-medium">{formatCurrency(selectedCompany.revenue)}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Deal Value</Label>
                            <p className="font-medium">{formatCurrency(selectedCompany.dealValue)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedCompany.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedCompany.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={selectedCompany.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedCompany.website}
                            </a>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <span className="text-sm">{selectedCompany.address}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{selectedCompany.description}</p>
                    </CardContent>
                  </Card>

                  {selectedCompany.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Internal Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{selectedCompany.notes}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedCompany.tags && selectedCompany.tags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="contacts" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Contacts ({selectedCompany.contacts})</CardTitle>
                      <CardDescription>All contacts associated with this company</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Contacts data will be loaded here</p>
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="deals" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Deals ({selectedCompany.totalDeals})</CardTitle>
                      <CardDescription>All deals and opportunities with this company</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Deals data will be loaded here</p>
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Deal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Timeline of interactions with this company</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Activity timeline will be loaded here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManagement;