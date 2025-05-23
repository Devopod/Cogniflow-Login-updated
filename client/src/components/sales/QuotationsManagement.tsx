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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileDown,
  FileText,
  Filter,
  History,
  Loader2,
  MailCheck,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SendHorizonal,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Type definitions for our data
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  contactPerson: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: number;
  description?: string;
  category: string;
  inStock: number;
}

interface QuotationItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
}

interface Quotation {
  id: number;
  quotationNumber: string;
  customerId: number;
  customerName: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  issueDate: string;
  expiryDate: string;
  totalAmount: number;
  createdBy: string;
  notes?: string;
  items: QuotationItem[];
  termsAndConditions?: string;
  history?: QuotationHistory[];
}

interface QuotationHistory {
  id: number;
  quotationId: number;
  action: string;
  timestamp: string;
  user: string;
  comment?: string;
}

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "draft":
      return <Badge className="bg-slate-500">Draft</Badge>;
    case "sent":
      return <Badge className="bg-blue-500">Sent</Badge>;
    case "accepted":
      return <Badge className="bg-green-500">Accepted</Badge>;
    case "declined":
      return <Badge className="bg-red-500">Declined</Badge>;
    case "expired":
      return <Badge className="bg-amber-500">Expired</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Sample data
const sampleQuotations: Quotation[] = [
  {
    id: 1,
    quotationNumber: "QUOT-2023-0001",
    customerId: 1,
    customerName: "ABC Corporation",
    status: "accepted",
    issueDate: "2023-05-01T10:30:00Z",
    expiryDate: "2023-05-31T23:59:59Z",
    totalAmount: 4859.97,
    createdBy: "Admin User",
    notes: "Quotation for office equipment upgrade",
    items: [
      {
        id: 1,
        productId: 3,
        productName: "HP LaserJet Pro Printer",
        quantity: 2,
        unitPrice: 249.99,
        discount: 10,
        tax: 7,
        total: 499.98
      },
      {
        id: 2,
        productId: 4,
        productName: "Ergonomic Office Chair",
        quantity: 10,
        unitPrice: 189.99,
        discount: 5,
        tax: 7,
        total: 1899.90
      },
      {
        id: 3,
        productId: 10,
        productName: "24-inch LED Monitor",
        quantity: 15,
        unitPrice: 159.99,
        discount: 5,
        tax: 7,
        total: 2399.85
      }
    ],
    termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 15 working days\n3. Payment terms: 50% advance, 50% on delivery",
    history: [
      {
        id: 1,
        quotationId: 1,
        action: "Created",
        timestamp: "2023-05-01T10:30:00Z",
        user: "Admin User"
      },
      {
        id: 2,
        quotationId: 1,
        action: "Sent",
        timestamp: "2023-05-01T11:15:00Z",
        user: "Admin User"
      },
      {
        id: 3,
        quotationId: 1,
        action: "Viewed",
        timestamp: "2023-05-02T14:22:00Z",
        user: "Customer"
      },
      {
        id: 4,
        quotationId: 1,
        action: "Accepted",
        timestamp: "2023-05-05T09:45:00Z",
        user: "Customer",
        comment: "We accept the terms and would like to proceed with the order"
      }
    ]
  },
  {
    id: 2,
    quotationNumber: "QUOT-2023-0002",
    customerId: 2,
    customerName: "XYZ Ltd",
    status: "sent",
    issueDate: "2023-05-08T14:15:00Z",
    expiryDate: "2023-06-07T23:59:59Z",
    totalAmount: 9349.50,
    createdBy: "Sales Rep",
    notes: "Quotation for office furniture",
    items: [
      {
        id: 4,
        productId: 2,
        productName: "Executive Office Desk",
        quantity: 12,
        unitPrice: 349.99,
        discount: 7,
        tax: 7,
        total: 4199.88
      },
      {
        id: 5,
        productId: 4,
        productName: "Ergonomic Office Chair",
        quantity: 20,
        unitPrice: 189.99,
        discount: 10,
        tax: 7,
        total: 3799.80
      },
      {
        id: 6,
        productId: 8,
        productName: "15.6-inch Laptop Bag",
        quantity: 25,
        unitPrice: 34.99,
        discount: 0,
        tax: 7,
        total: 874.75
      }
    ],
    termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 20 working days\n3. Payment terms: 30% advance, 70% on delivery",
    history: [
      {
        id: 5,
        quotationId: 2,
        action: "Created",
        timestamp: "2023-05-08T14:15:00Z",
        user: "Sales Rep"
      },
      {
        id: 6,
        quotationId: 2,
        action: "Sent",
        timestamp: "2023-05-08T16:30:00Z",
        user: "Sales Rep"
      },
      {
        id: 7,
        quotationId: 2,
        action: "Viewed",
        timestamp: "2023-05-10T11:45:00Z",
        user: "Customer"
      }
    ]
  },
  {
    id: 3,
    quotationNumber: "QUOT-2023-0003",
    customerId: 3,
    customerName: "Tech Solutions Inc",
    status: "draft",
    issueDate: "2023-05-10T09:20:00Z",
    expiryDate: "2023-06-09T23:59:59Z",
    totalAmount: 12459.75,
    createdBy: "Admin User",
    notes: "Quotation for IT equipment",
    items: [
      {
        id: 7,
        productId: 1,
        productName: "Dell Latitude 5420",
        quantity: 10,
        unitPrice: 899.99,
        discount: 5,
        tax: 7,
        total: 8999.90
      },
      {
        id: 8,
        productId: 10,
        productName: "24-inch LED Monitor",
        quantity: 15,
        unitPrice: 159.99,
        discount: 3,
        tax: 7,
        total: 2399.85
      },
      {
        id: 9,
        productId: 5,
        productName: "16GB USB Flash Drive",
        quantity: 100,
        unitPrice: 12.99,
        discount: 15,
        tax: 7,
        total: 1299.00
      }
    ],
    termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 15 working days\n3. Payment terms: 40% advance, 60% on delivery",
    history: [
      {
        id: 8,
        quotationId: 3,
        action: "Created",
        timestamp: "2023-05-10T09:20:00Z",
        user: "Admin User"
      }
    ]
  },
  {
    id: 4,
    quotationNumber: "QUOT-2023-0004",
    customerId: 4,
    customerName: "Global Services LLC",
    status: "expired",
    issueDate: "2023-04-01T13:45:00Z",
    expiryDate: "2023-04-30T23:59:59Z",
    totalAmount: 5648.25,
    createdBy: "Sales Manager",
    notes: "Quotation for office supplies",
    items: [
      {
        id: 10,
        productId: 7,
        productName: "A4 Paper 500 Sheets",
        quantity: 100,
        unitPrice: 6.99,
        discount: 10,
        tax: 7,
        total: 699.00
      },
      {
        id: 11,
        productId: 9,
        productName: "Blue Ballpoint Pens (Box of 50)",
        quantity: 30,
        unitPrice: 15.99,
        discount: 5,
        tax: 7,
        total: 479.70
      },
      {
        id: 12,
        productId: 6,
        productName: "HP Black Toner Cartridge",
        quantity: 50,
        unitPrice: 79.99,
        discount: 7,
        tax: 7,
        total: 3999.50
      }
    ],
    termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 7 working days\n3. Payment terms: 100% on delivery",
    history: [
      {
        id: 9,
        quotationId: 4,
        action: "Created",
        timestamp: "2023-04-01T13:45:00Z",
        user: "Sales Manager"
      },
      {
        id: 10,
        quotationId: 4,
        action: "Sent",
        timestamp: "2023-04-01T15:20:00Z",
        user: "Sales Manager"
      },
      {
        id: 11,
        quotationId: 4,
        action: "Viewed",
        timestamp: "2023-04-05T10:30:00Z",
        user: "Customer"
      },
      {
        id: 12,
        quotationId: 4,
        action: "Expired",
        timestamp: "2023-05-01T00:00:00Z",
        user: "System"
      }
    ]
  },
  {
    id: 5,
    quotationNumber: "QUOT-2023-0005",
    customerId: 5,
    customerName: "City Hospital",
    status: "declined",
    issueDate: "2023-04-15T11:20:00Z",
    expiryDate: "2023-05-15T23:59:59Z",
    totalAmount: 15780.45,
    createdBy: "Sales Rep",
    notes: "Quotation for medical office equipment",
    items: [
      {
        id: 13,
        productId: 3,
        productName: "HP LaserJet Pro Printer",
        quantity: 5,
        unitPrice: 249.99,
        discount: 0,
        tax: 7,
        total: 1249.95
      },
      {
        id: 14,
        productId: 1,
        productName: "Dell Latitude 5420",
        quantity: 15,
        unitPrice: 899.99,
        discount: 5,
        tax: 7,
        total: 13499.85
      },
      {
        id: 15,
        productId: 10,
        productName: "24-inch LED Monitor",
        quantity: 8,
        unitPrice: 159.99,
        discount: 10,
        tax: 7,
        total: 1279.92
      }
    ],
    termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 15 working days\n3. Payment terms: 50% advance, 50% on delivery",
    history: [
      {
        id: 13,
        quotationId: 5,
        action: "Created",
        timestamp: "2023-04-15T11:20:00Z",
        user: "Sales Rep"
      },
      {
        id: 14,
        quotationId: 5,
        action: "Sent",
        timestamp: "2023-04-15T13:45:00Z",
        user: "Sales Rep"
      },
      {
        id: 15,
        quotationId: 5,
        action: "Viewed",
        timestamp: "2023-04-17T09:15:00Z",
        user: "Customer"
      },
      {
        id: 16,
        quotationId: 5,
        action: "Declined",
        timestamp: "2023-04-20T14:30:00Z",
        user: "Customer",
        comment: "We have decided to go with another supplier due to budget constraints"
      }
    ]
  }
];

// Sample customers for use in the form
const sampleCustomers: Customer[] = [
  { id: 1, name: "ABC Corporation", email: "contact@abccorp.com", phone: "123-456-7890", company: "ABC Corporation", address: "123 Business Park, Suite 456, Business City, BC 12345", contactPerson: "John Smith" },
  { id: 2, name: "XYZ Ltd", email: "info@xyzltd.com", phone: "987-654-3210", company: "XYZ Ltd", address: "456 Industrial Avenue, Tech City, TC 67890", contactPerson: "Jane Doe" },
  { id: 3, name: "Tech Solutions Inc", email: "sales@techsolutions.com", phone: "555-123-4567", company: "Tech Solutions Inc", address: "789 Technology Drive, Innovation City, IC 54321", contactPerson: "David Johnson" },
  { id: 4, name: "Global Services LLC", email: "info@globalservices.com", phone: "444-555-6666", company: "Global Services LLC", address: "321 Corporate Blvd, Enterprise City, EC 98765", contactPerson: "Sarah Williams" },
  { id: 5, name: "City Hospital", email: "procurement@cityhospital.org", phone: "777-888-9999", company: "City Hospital", address: "1000 Health Avenue, Medical City, MC 11223", contactPerson: "Dr. Robert Brown" }
];

// Sample products for use in the form
const sampleProducts: Product[] = [
  { id: 1, name: "Dell Latitude 5420", sku: "LAP-DEL-001", unitPrice: 899.99, description: "Business laptop with Intel Core i5, 16GB RAM, 512GB SSD", category: "Electronics", inStock: 42 },
  { id: 2, name: "Executive Office Desk", sku: "DESK-001", unitPrice: 349.99, description: "Premium wooden office desk, 160x80cm", category: "Furniture", inStock: 7 },
  { id: 3, name: "HP LaserJet Pro Printer", sku: "PRINT-HP-002", unitPrice: 249.99, description: "Monochrome laser printer with duplex printing", category: "Electronics", inStock: 3 },
  { id: 4, name: "Ergonomic Office Chair", sku: "CHAIR-ERG-005", unitPrice: 189.99, description: "Adjustable office chair with lumbar support", category: "Furniture", inStock: 15 },
  { id: 5, name: "16GB USB Flash Drive", sku: "USB-DRIVE-16", unitPrice: 12.99, description: "USB 3.0 flash drive, 16GB capacity", category: "Electronics", inStock: 78 },
  { id: 6, name: "HP Black Toner Cartridge", sku: "TONER-HP-BLK", unitPrice: 79.99, description: "Original HP toner cartridge, black", category: "Office Supplies", inStock: 2 },
  { id: 7, name: "A4 Paper 500 Sheets", sku: "PAPER-A4-500", unitPrice: 6.99, description: "A4 printing paper, 80gsm, 500 sheets per ream", category: "Office Supplies", inStock: 0 },
  { id: 8, name: "15.6-inch Laptop Bag", sku: "LAPTOP-BAG-001", unitPrice: 34.99, description: "Padded laptop bag with shoulder strap", category: "Accessories", inStock: 12 },
  { id: 9, name: "Blue Ballpoint Pens (Box of 50)", sku: "PENS-BLUE-BOX", unitPrice: 15.99, description: "Medium point ballpoint pens, blue ink, box of 50", category: "Office Supplies", inStock: 4 },
  { id: 10, name: "24-inch LED Monitor", sku: "MONITOR-24", unitPrice: 159.99, description: "Full HD LED monitor, 24-inch display", category: "Electronics", inStock: 9 }
];

const QuotationsManagement = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState<"active" | "all" | "drafts">("active");
  const [showNewQuotationDialog, setShowNewQuotationDialog] = useState(false);
  const [showViewQuotationDialog, setShowViewQuotationDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [quotationSearchTerm, setQuotationSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Form state for creating a new quotation
  const [newQuotation, setNewQuotation] = useState({
    customerId: 0,
    items: [] as { productId: number; quantity: number; unitPrice: number; discount?: number }[],
    notes: "",
    expiryDays: 30,
    termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 15 working days\n3. Payment terms: 50% advance, 50% on delivery"
  });
  
  // Query for quotations data
  const { data: quotations, isLoading, isError } = useQuery({
    queryKey: ["/api/quotations"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleQuotations);
    }
  });
  
  // Filter quotations based on tab and search term
  const filteredQuotations = quotations?.filter(quotation => {
    // Filter by tab
    if (currentTab === "active" && (quotation.status === "expired" || quotation.status === "declined")) {
      return false;
    }
    
    if (currentTab === "drafts" && quotation.status !== "draft") {
      return false;
    }
    
    // Filter by search term
    const matchesSearch = 
      quotation.quotationNumber.toLowerCase().includes(quotationSearchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(quotationSearchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Filter customers based on search term
  const filteredCustomers = sampleCustomers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );
  
  // Calculate total for quotation items
  const calculateItemTotal = (item: { quantity: number; unitPrice: number; discount?: number }) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = item.discount ? (subtotal * item.discount / 100) : 0;
    return subtotal - discountAmount;
  };
  
  // Calculate total amount for a new quotation
  const calculateTotalAmount = () => {
    return newQuotation.items.reduce((total, item) => {
      return total + calculateItemTotal(item);
    }, 0);
  };
  
  // Add a product to the quotation
  const addProductToQuotation = (productId: number) => {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;
    
    setNewQuotation(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId,
          quantity: 1,
          unitPrice: product.unitPrice,
          discount: 0
        }
      ]
    }));
  };
  
  // Remove a product from the quotation
  const removeProductFromQuotation = (index: number) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  
  // Update a product quantity in the quotation
  const updateProductQuantity = (index: number, quantity: number) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };
  
  // Update a product discount in the quotation
  const updateProductDiscount = (index: number, discount: number) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, discount } : item
      )
    }));
  };
  
  // Reset the form
  const resetForm = () => {
    setNewQuotation({
      customerId: 0,
      items: [],
      notes: "",
      expiryDays: 30,
      termsAndConditions: "1. Quotation valid for 30 days\n2. Delivery within 15 working days\n3. Payment terms: 50% advance, 50% on delivery"
    });
    setCustomerSearchTerm("");
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    
    if (newQuotation.customerId === 0) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this quotation.",
        variant: "destructive",
      });
      return;
    }
    
    if (newQuotation.items.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one product to this quotation.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, you'd call an API to save the quotation
    toast({
      title: asDraft ? "Draft Saved" : "Quotation Created",
      description: asDraft 
        ? "The quotation has been saved as a draft." 
        : "The quotation has been created and is ready to send.",
    });
    
    setShowNewQuotationDialog(false);
    resetForm();
  };
  
  // View quotation details
  const viewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowViewQuotationDialog(true);
  };
  
  // Send a quotation to customer
  const sendQuotation = (quotation: Quotation) => {
    // In a real app, you'd call an API to send the quotation via email
    toast({
      title: "Quotation Sent",
      description: `Quotation ${quotation.quotationNumber} has been sent to ${quotation.customerName}.`,
    });
  };
  
  // Convert a quotation to an order
  const convertToOrder = (quotation: Quotation) => {
    // In a real app, you'd call an API to convert the quotation to an order
    toast({
      title: "Converting to Order",
      description: `Quotation ${quotation.quotationNumber} is being converted to a sales order.`,
    });
  };
  
  // Create PDF for a quotation
  const createPDF = (quotation: Quotation) => {
    // In a real app, you'd call an API to generate a PDF
    toast({
      title: "Generating PDF",
      description: `Creating PDF document for quotation ${quotation.quotationNumber}.`,
    });
  };
  
  // Mark quotation as accepted
  const markAsAccepted = (quotation: Quotation) => {
    // In a real app, you'd call an API to update the quotation status
    toast({
      title: "Quotation Accepted",
      description: `Quotation ${quotation.quotationNumber} has been marked as accepted.`,
    });
  };
  
  // Mark quotation as declined
  const markAsDeclined = (quotation: Quotation) => {
    // In a real app, you'd call an API to update the quotation status
    toast({
      title: "Quotation Declined",
      description: `Quotation ${quotation.quotationNumber} has been marked as declined.`,
    });
  };
  
  // Delete a quotation
  const deleteQuotation = (quotation: Quotation) => {
    // In a real app, you'd call an API to delete the quotation
    toast({
      title: "Quotation Deleted",
      description: `Quotation ${quotation.quotationNumber} has been deleted.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quotations Management</h2>
          <p className="text-muted-foreground">
            Create, send, and track customer quotations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showNewQuotationDialog} onOpenChange={setShowNewQuotationDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowNewQuotationDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quotation</DialogTitle>
                <DialogDescription>
                  Create a new quotation for a customer
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-6 py-4">
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Customer Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="customer-search">Search Customers</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-search"
                          placeholder="Search by name, company, or contact person"
                          className="pl-8"
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4">
                                No customers found. Try a different search term.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <TableRow key={customer.id} className={newQuotation.customerId === customer.id ? "bg-muted/50" : ""}>
                                <TableCell>
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      className={`rounded-full w-6 h-6 flex items-center justify-center ${newQuotation.customerId === customer.id ? "bg-primary text-white" : "border"}`}
                                      onClick={() => setNewQuotation(prev => ({ ...prev, customerId: customer.id }))}
                                    >
                                      {newQuotation.customerId === customer.id && <Check className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>{customer.contactPerson}</TableCell>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell>{customer.phone}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Products</h3>
                    <div className="flex flex-col gap-2">
                      <Label>Select Products</Label>
                      <Select onValueChange={(value) => addProductToQuotation(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {sampleProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {formatCurrency(product.unitPrice)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newQuotation.items.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="w-[120px] text-center">Quantity</TableHead>
                              <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                              <TableHead className="w-[120px] text-center">Discount %</TableHead>
                              <TableHead className="w-[120px] text-right">Total</TableHead>
                              <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newQuotation.items.map((item, index) => {
                              const product = sampleProducts.find(p => p.id === item.productId);
                              if (!product) return null;
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{product.name}</TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                                      className="w-16 mx-auto text-center"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.discount || 0}
                                      onChange={(e) => updateProductDiscount(index, parseInt(e.target.value) || 0)}
                                      className="w-16 mx-auto text-center"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(calculateItemTotal(item))}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => removeProductFromQuotation(index)}
                                      className="h-8 w-8 p-0 text-red-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow>
                              <TableCell colSpan={4} className="text-right font-medium">Total Amount:</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(calculateTotalAmount())}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border rounded-md p-8 flex flex-col items-center justify-center text-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
                        <h4 className="text-lg font-medium mb-1">No Products Added</h4>
                        <p className="text-muted-foreground mb-4">
                          Add products to the quotation using the dropdown above.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quotation Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Quotation Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry-days">Expiry (Days)</Label>
                        <Select 
                          value={newQuotation.expiryDays.toString()}
                          onValueChange={(value) => setNewQuotation(prev => ({ ...prev, expiryDays: parseInt(value) }))}
                        >
                          <SelectTrigger id="expiry-days">
                            <SelectValue placeholder="Select expiry period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="45">45 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Enter any additional notes for this quotation"
                          rows={3}
                          value={newQuotation.notes}
                          onChange={(e) => setNewQuotation(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="terms">Terms and Conditions</Label>
                      <Textarea
                        id="terms"
                        placeholder="Enter terms and conditions for this quotation"
                        rows={5}
                        value={newQuotation.termsAndConditions}
                        onChange={(e) => setNewQuotation(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="flex justify-between">
                  <div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={(e) => handleSubmit(e, true)}
                    >
                      Save as Draft
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowNewQuotationDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={(e) => handleSubmit(e, false)}>
                      Create & Send
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as "active" | "all" | "drafts")}>
        <TabsList className="mb-6">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Active Quotations
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Drafts
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Quotations
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>
                {currentTab === "active" 
                  ? "Active Quotations" 
                  : currentTab === "drafts" 
                    ? "Draft Quotations" 
                    : "All Quotations"}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotations..."
                    className="pl-8 w-[250px]"
                    value={quotationSearchTerm}
                    onChange={(e) => setQuotationSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-10 text-center">
                <div className="space-y-3">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="text-lg font-medium">Error Loading Quotations</h3>
                  <p className="text-sm text-muted-foreground">
                    There was a problem loading the quotations.
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredQuotations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Quotations Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentTab === "active" 
                    ? "You don't have any active quotations." 
                    : currentTab === "drafts"
                      ? "You don't have any draft quotations."
                      : "No quotations match your search criteria."}
                </p>
                <Button className="mt-4" onClick={() => { resetForm(); setShowNewQuotationDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quotation
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotations?.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">
                          <Button 
                            variant="link" 
                            className="px-0 font-medium"
                            onClick={() => viewQuotation(quotation)}
                          >
                            {quotation.quotationNumber}
                          </Button>
                        </TableCell>
                        <TableCell>{quotation.customerName}</TableCell>
                        <TableCell>{formatDate(quotation.issueDate)}</TableCell>
                        <TableCell>{formatDate(quotation.expiryDate)}</TableCell>
                        <TableCell>{formatCurrency(quotation.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Manage Quotation</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => viewQuotation(quotation)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {quotation.status === "draft" && (
                                <DropdownMenuItem onClick={() => sendQuotation(quotation)}>
                                  <SendHorizonal className="h-4 w-4 mr-2" />
                                  Send to Customer
                                </DropdownMenuItem>
                              )}
                              {quotation.status === "draft" && (
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Quotation
                                </DropdownMenuItem>
                              )}
                              {quotation.status === "sent" && (
                                <DropdownMenuItem onClick={() => markAsAccepted(quotation)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Accepted
                                </DropdownMenuItem>
                              )}
                              {quotation.status === "sent" && (
                                <DropdownMenuItem onClick={() => markAsDeclined(quotation)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Mark as Declined
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => createPDF(quotation)}>
                                <FileDown className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              {quotation.status === "accepted" && (
                                <DropdownMenuItem onClick={() => convertToOrder(quotation)}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Convert to Order
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteQuotation(quotation)}
                              >
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
          <CardFooter className="border-t p-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredQuotations?.length || 0} quotation{filteredQuotations?.length !== 1 ? 's' : ''} shown
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Tabs>
      
      {/* View Quotation Dialog */}
      <Dialog open={showViewQuotationDialog} onOpenChange={setShowViewQuotationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedQuotation && (
            <>
              <DialogHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <DialogTitle className="text-xl">
                    Quotation: {selectedQuotation.quotationNumber}
                  </DialogTitle>
                  <div>
                    {getStatusBadge(selectedQuotation.status)}
                  </div>
                </div>
                <DialogDescription>
                  Issued on {formatDate(selectedQuotation.issueDate)} - Expires on {formatDate(selectedQuotation.expiryDate)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">From</h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">CogniFlow ERP Solutions</p>
                      <p>123 Business Park, Suite 456</p>
                      <p>Technology City, TC 12345</p>
                      <p>Phone: +1 (123) 456-7890</p>
                      <p>Email: info@cogniflow-erp.com</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">To</h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{selectedQuotation.customerName}</p>
                      {/* In a real app, you'd display the full customer details */}
                      <p>Customer address line 1</p>
                      <p>Customer address line 2</p>
                      <p>Phone: Customer phone</p>
                      <p>Email: Customer email</p>
                    </div>
                  </div>
                </div>
                
                {/* Quotation Items */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-center">Discount</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuotation.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-center">{item.discount ? `${item.discount}%` : '-'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-medium">Total:</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(selectedQuotation.totalAmount)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Notes and Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <div className="rounded-md border p-3 bg-muted/40 text-sm">
                      <p>{selectedQuotation.notes || 'No notes added to this quotation.'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Terms and Conditions</h3>
                    <div className="rounded-md border p-3 bg-muted/40 text-sm whitespace-pre-line">
                      <p>{selectedQuotation.termsAndConditions}</p>
                    </div>
                  </div>
                </div>
                
                {/* History */}
                {selectedQuotation.history && selectedQuotation.history.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">History</h3>
                    <div className="space-y-3">
                      {selectedQuotation.history.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-md">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            entry.action === 'Created' || entry.action === 'Sent' ? 'bg-blue-500/10 text-blue-500' :
                            entry.action === 'Viewed' ? 'bg-amber-500/10 text-amber-500' :
                            entry.action === 'Accepted' ? 'bg-green-500/10 text-green-500' :
                            entry.action === 'Declined' ? 'bg-red-500/10 text-red-500' :
                            entry.action === 'Expired' ? 'bg-slate-500/10 text-slate-500' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {entry.action === 'Created' && <Plus className="h-4 w-4" />}
                            {entry.action === 'Sent' && <SendHorizonal className="h-4 w-4" />}
                            {entry.action === 'Viewed' && <Eye className="h-4 w-4" />}
                            {entry.action === 'Accepted' && <Check className="h-4 w-4" />}
                            {entry.action === 'Declined' && <X className="h-4 w-4" />}
                            {entry.action === 'Expired' && <Clock className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap justify-between gap-2">
                              <p className="text-sm font-medium">{entry.action}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">By {entry.user}</p>
                            {entry.comment && (
                              <div className="mt-1 p-2 bg-muted/30 rounded-md text-xs">
                                "{entry.comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
                <div className="flex gap-2 w-full sm:w-auto">
                  {selectedQuotation.status === "draft" && (
                    <Button className="w-full sm:w-auto" onClick={() => sendQuotation(selectedQuotation)}>
                      <SendHorizonal className="h-4 w-4 mr-2" />
                      Send to Customer
                    </Button>
                  )}
                  {selectedQuotation.status === "sent" && (
                    <Button className="w-full sm:w-auto" onClick={() => markAsAccepted(selectedQuotation)}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Accepted
                    </Button>
                  )}
                  {selectedQuotation.status === "accepted" && (
                    <Button className="w-full sm:w-auto" onClick={() => convertToOrder(selectedQuotation)}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert to Order
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto" 
                    onClick={() => createPDF(selectedQuotation)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto" 
                    onClick={() => setShowViewQuotationDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationsManagement;