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
  Building,
  Check,
  Copy,
  Download,
  Edit,
  FileCheck,
  FileText,
  Filter,
  Globe,
  Home,
  Image,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Settings,
  Settings2,
  ShoppingCart,
  Star,
  StarOff,
  Tag,
  Trash2,
  Upload,
  User,
  AlignCenter,
  AlignLeft,
  AlignRight,
  BoldIcon,
  ItalicIcon,
  Underline,
  CheckSquare,
  Palette,
  Columns,
  FileImage,
  Truck,
  FileCode,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Sample branding template data
const sampleTemplates = [
  {
    id: 1,
    name: "Default Letterhead",
    isDefault: true,
    lastUpdated: "2023-04-15T14:30:00Z",
    createdBy: "Admin User",
    companyName: "CogniFlow ERP Solutions",
    logo: "/company-logo.png",
    slogan: "Transforming Business Operations",
    primaryColor: "#4f46e5",
    secondaryColor: "#6366f1",
    address: "123 Business Park, Suite 456\nTechnology City, TC 12345",
    phone: "+1 (123) 456-7890",
    email: "info@cogniflow-erp.com",
    website: "www.cogniflow-erp.com",
    registrationNumber: "REG12345678",
    taxIdentificationNumber: "TAX9876543210",
    footerText: "Thank you for your business!",
    termsAndConditions: "1. All prices are in USD unless otherwise specified.\n2. Payment is due within 30 days of invoice date.\n3. Late payments are subject to a 1.5% monthly interest charge."
  },
  {
    id: 2,
    name: "Invoice Template",
    isDefault: false,
    lastUpdated: "2023-03-25T11:20:00Z",
    createdBy: "Finance Manager",
    companyName: "CogniFlow ERP Solutions",
    logo: "/company-logo.png",
    slogan: "Transforming Business Operations",
    primaryColor: "#4f46e5",
    secondaryColor: "#6366f1",
    address: "123 Business Park, Suite 456\nTechnology City, TC 12345",
    phone: "+1 (123) 456-7890",
    email: "billing@cogniflow-erp.com",
    website: "www.cogniflow-erp.com",
    registrationNumber: "REG12345678",
    taxIdentificationNumber: "TAX9876543210",
    footerText: "Thank you for your business!",
    termsAndConditions: "1. All prices are in USD unless otherwise specified.\n2. Payment is due within 30 days of invoice date.\n3. Late payments are subject to a 1.5% monthly interest charge."
  },
  {
    id: 3,
    name: "Quotation Template",
    isDefault: false,
    lastUpdated: "2023-04-02T09:15:00Z",
    createdBy: "Sales Manager",
    companyName: "CogniFlow ERP Solutions",
    logo: "/company-logo.png",
    slogan: "Transforming Business Operations",
    primaryColor: "#047857",
    secondaryColor: "#10b981",
    address: "123 Business Park, Suite 456\nTechnology City, TC 12345",
    phone: "+1 (123) 456-7890",
    email: "sales@cogniflow-erp.com",
    website: "www.cogniflow-erp.com",
    registrationNumber: "REG12345678",
    taxIdentificationNumber: "TAX9876543210",
    footerText: "We look forward to working with you!",
    termsAndConditions: "1. This quotation is valid for 30 days from the date of issue.\n2. Prices are subject to change without notice.\n3. Delivery times are approximate and not guaranteed."
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

const BrandingMaster = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("templates");
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  
  // Letterhead design state
  const [headerAlignment, setHeaderAlignment] = useState("center");
  const [showSlogan, setShowSlogan] = useState(true);
  const [showRegistrationNumbers, setShowRegistrationNumbers] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");
  
  // For preview on template dialog
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Query for template data
  const { data: templatesData, isLoading, isError } = useQuery({
    queryKey: ["/api/branding/templates"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleTemplates);
    },
  });

  // Open template dialog
  const openTemplateDialog = (template: any = null) => {
    if (template) {
      setCurrentTemplate(template);
      setPreviewTemplate({...template});
      
      // Set design options based on template
      setHeaderAlignment(template.headerAlignment || "center");
      setShowSlogan(template.showSlogan !== false);
      setShowRegistrationNumbers(template.showRegistrationNumbers !== false);
      setShowFooter(template.showFooter !== false);
      setPrimaryColor(template.primaryColor || "#4f46e5");
      setSecondaryColor(template.secondaryColor || "#6366f1");
    } else {
      const defaultTemplate = {
        name: "",
        isDefault: false,
        companyName: "Your Company Name",
        logo: "/company-logo.png",
        slogan: "Your Company Slogan",
        primaryColor: "#4f46e5",
        secondaryColor: "#6366f1",
        address: "123 Your Street\nYour City, YC 12345",
        phone: "+1 (123) 456-7890",
        email: "info@yourcompany.com",
        website: "www.yourcompany.com",
        registrationNumber: "REG12345678",
        taxIdentificationNumber: "TAX9876543210",
        footerText: "Thank you for your business!",
        termsAndConditions: "Enter your terms and conditions here."
      };
      
      setCurrentTemplate(null);
      setPreviewTemplate(defaultTemplate);
      
      // Reset design options to defaults
      setHeaderAlignment("center");
      setShowSlogan(true);
      setShowRegistrationNumbers(true);
      setShowFooter(true);
      setPrimaryColor("#4f46e5");
      setSecondaryColor("#6366f1");
    }
    
    setShowTemplateDialog(true);
  };

  // Set as default template
  const setAsDefault = (template: any) => {
    toast({
      title: "Default Template Updated",
      description: `${template.name} has been set as the default template.`
    });
  };

  // Update design settings for preview
  const updatePreviewSetting = (setting: string, value: any) => {
    setPreviewTemplate({
      ...previewTemplate,
      [setting]: value
    });
  };

  // Handle template form submission
  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: currentTemplate ? "Template Updated" : "Template Created",
      description: currentTemplate 
        ? `The letterhead template '${currentTemplate.name}' has been updated.` 
        : "A new letterhead template has been created.",
    });
    
    setShowTemplateDialog(false);
  };

  // Preview template as PDF
  const previewAsPDF = (template: any) => {
    toast({
      title: "PDF Preview",
      description: "Generating PDF preview of the letterhead template.",
    });
  };

  // Delete template
  const deleteTemplate = (template: any) => {
    toast({
      title: "Template Deleted",
      description: `The letterhead template '${template.name}' has been deleted.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branding Master</h2>
          <p className="text-muted-foreground">
            Manage company letterhead and document branding
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => openTemplateDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {currentTemplate ? `Edit Template: ${currentTemplate.name}` : "Create New Letterhead Template"}
                </DialogTitle>
                <DialogDescription>
                  Design your company letterhead for business documents
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTemplateSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Template Info */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g., Default Letterhead" 
                        value={previewTemplate?.name || ""}
                        onChange={(e) => updatePreviewSetting("name", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input 
                        id="companyName" 
                        placeholder="Your Company Name" 
                        value={previewTemplate?.companyName || ""}
                        onChange={(e) => updatePreviewSetting("companyName", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slogan">Company Slogan</Label>
                      <Input 
                        id="slogan" 
                        placeholder="Your Company Slogan" 
                        value={previewTemplate?.slogan || ""}
                        onChange={(e) => updatePreviewSetting("slogan", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo">Company Logo</Label>
                      <div className="border rounded-md p-4 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="bg-muted/50 rounded-md p-4 mb-2 inline-block">
                            <FileImage className="h-10 w-10 text-muted-foreground mx-auto" />
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Upload your company logo</span>
                          </div>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Upload className="h-4 w-4 mr-2" />
                            Select Image
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <div 
                            className="h-8 w-8 rounded-md border cursor-pointer" 
                            style={{ backgroundColor: primaryColor }}
                          ></div>
                          <Input
                            id="primaryColor"
                            value={primaryColor}
                            onChange={(e) => {
                              setPrimaryColor(e.target.value);
                              updatePreviewSetting("primaryColor", e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <div 
                            className="h-8 w-8 rounded-md border cursor-pointer" 
                            style={{ backgroundColor: secondaryColor }}
                          ></div>
                          <Input
                            id="secondaryColor"
                            value={secondaryColor}
                            onChange={(e) => {
                              setSecondaryColor(e.target.value);
                              updatePreviewSetting("secondaryColor", e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">Layout Options</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="headerAlignment">Header Alignment</Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant={headerAlignment === "left" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              setHeaderAlignment("left");
                              updatePreviewSetting("headerAlignment", "left");
                            }}
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant={headerAlignment === "center" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              setHeaderAlignment("center");
                              updatePreviewSetting("headerAlignment", "center");
                            }}
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant={headerAlignment === "right" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              setHeaderAlignment("right");
                              updatePreviewSetting("headerAlignment", "right");
                            }}
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showSlogan" className="cursor-pointer">Show Slogan</Label>
                        <Switch 
                          id="showSlogan" 
                          checked={showSlogan}
                          onCheckedChange={(checked) => {
                            setShowSlogan(checked);
                            updatePreviewSetting("showSlogan", checked);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showRegistrationNumbers" className="cursor-pointer">Show Registration Numbers</Label>
                        <Switch 
                          id="showRegistrationNumbers" 
                          checked={showRegistrationNumbers}
                          onCheckedChange={(checked) => {
                            setShowRegistrationNumbers(checked);
                            updatePreviewSetting("showRegistrationNumbers", checked);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showFooter" className="cursor-pointer">Show Footer</Label>
                        <Switch 
                          id="showFooter" 
                          checked={showFooter}
                          onCheckedChange={(checked) => {
                            setShowFooter(checked);
                            updatePreviewSetting("showFooter", checked);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Middle Column - Company Details */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="address">Company Address</Label>
                      <textarea 
                        id="address"
                        className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                        placeholder="Enter company address"
                        value={previewTemplate?.address || ""}
                        onChange={(e) => updatePreviewSetting("address", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        placeholder="e.g., +1 (123) 456-7890" 
                        value={previewTemplate?.phone || ""}
                        onChange={(e) => updatePreviewSetting("phone", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="e.g., info@company.com" 
                        value={previewTemplate?.email || ""}
                        onChange={(e) => updatePreviewSetting("email", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        placeholder="e.g., www.company.com" 
                        value={previewTemplate?.website || ""}
                        onChange={(e) => updatePreviewSetting("website", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">Registration Number</Label>
                      <Input 
                        id="registrationNumber" 
                        placeholder="e.g., REG12345678" 
                        value={previewTemplate?.registrationNumber || ""}
                        onChange={(e) => updatePreviewSetting("registrationNumber", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxIdentificationNumber">Tax ID Number</Label>
                      <Input 
                        id="taxIdentificationNumber" 
                        placeholder="e.g., TAX9876543210" 
                        value={previewTemplate?.taxIdentificationNumber || ""}
                        onChange={(e) => updatePreviewSetting("taxIdentificationNumber", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="footerText">Footer Text</Label>
                      <Input 
                        id="footerText" 
                        placeholder="e.g., Thank you for your business!" 
                        value={previewTemplate?.footerText || ""}
                        onChange={(e) => updatePreviewSetting("footerText", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Right Column - Preview */}
                  <div className="space-y-2">
                    <Label>Letterhead Preview</Label>
                    <div className="border rounded-md p-4 bg-white">
                      <div className={`text-${headerAlignment} mb-6 pb-6 border-b`} style={{ borderColor: primaryColor }}>
                        <div className="bg-gray-200 h-16 w-24 mx-auto mb-3 flex items-center justify-center text-xs text-gray-500">
                          Logo
                        </div>
                        <div className="font-bold text-lg" style={{ color: primaryColor }}>
                          {previewTemplate?.companyName || "Company Name"}
                        </div>
                        {showSlogan && (
                          <div className="text-sm italic mt-1" style={{ color: secondaryColor }}>
                            {previewTemplate?.slogan || "Company Slogan"}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4 flex justify-between text-xs text-gray-600">
                        <div>
                          <div className="flex items-center mb-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>Address:</span>
                          </div>
                          <div className="pl-4">
                            {previewTemplate?.address?.split('\n').map((line: string, i: number) => (
                              <div key={i}>{line}</div>
                            )) || "Company Address"}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{previewTemplate?.phone || "Phone Number"}</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{previewTemplate?.email || "Email Address"}</span>
                          </div>
                          <div className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            <span>{previewTemplate?.website || "Website"}</span>
                          </div>
                        </div>
                      </div>
                      
                      {showRegistrationNumbers && (
                        <div className="text-xs text-gray-600 mb-4 border-t border-b py-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                          <div className="flex justify-between">
                            <span>Registration No: {previewTemplate?.registrationNumber || "REG12345678"}</span>
                            <span>Tax ID: {previewTemplate?.taxIdentificationNumber || "TAX9876543210"}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-gray-100 p-4 text-gray-600 text-xs rounded">
                        <div className="text-center font-medium mb-1">DOCUMENT CONTENT AREA</div>
                        <div className="border-t border-dashed border-gray-300 pt-2">
                          This area will contain the actual document content.
                        </div>
                      </div>
                      
                      {showFooter && (
                        <div className="mt-6 pt-3 border-t text-xs text-center" style={{ borderColor: primaryColor, color: secondaryColor }}>
                          {previewTemplate?.footerText || "Thank you for your business!"}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                      <textarea 
                        id="termsAndConditions"
                        className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-xs"
                        placeholder="Enter terms and conditions"
                        value={previewTemplate?.termsAndConditions || ""}
                        onChange={(e) => updatePreviewSetting("termsAndConditions", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        These terms will appear at the bottom of documents using this template.
                      </p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {currentTemplate ? "Update Template" : "Create Template"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Letterhead Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Letterhead Templates</CardTitle>
                  <CardDescription>
                    Manage templates for company letterhead and documents
                  </CardDescription>
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
                    <FileText className="h-12 w-12 text-red-500 mx-auto" />
                    <h3 className="text-lg font-medium">Error Loading Templates</h3>
                    <p className="text-sm text-muted-foreground">
                      There was a problem loading the letterhead templates.
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : templatesData?.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-medium">No Templates Found</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your first letterhead template to get started.
                    </p>
                    <Button className="mt-4" onClick={() => openTemplateDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templatesData?.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                      <div className="h-40 border-b bg-white p-4 flex flex-col items-center justify-center">
                        <div className="text-center border-b pb-2 w-full" style={{ borderColor: template.primaryColor || '#4f46e5' }}>
                          <div className="bg-gray-200 h-8 w-16 mx-auto mb-1"></div>
                          <div className="font-bold text-sm" style={{ color: template.primaryColor || '#4f46e5' }}>
                            {template.companyName}
                          </div>
                          <div className="text-xs italic mt-1" style={{ color: template.secondaryColor || '#6366f1' }}>
                            {template.slogan}
                          </div>
                        </div>
                        <div className="w-full text-[0.5rem] text-gray-400 mt-2 flex justify-between">
                          <div>Address details...</div>
                          <div>Contact info...</div>
                        </div>
                      </div>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-xs">
                              Last updated {formatDate(template.lastUpdated)}
                            </CardDescription>
                          </div>
                          {template.isDefault && (
                            <Badge className="bg-green-100 text-green-800">Default</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openTemplateDialog(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => previewAsPDF(template)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {!template.isDefault && (
                            <Button size="sm" variant="ghost" onClick={() => setAsDefault(template)}>
                              <Star className="h-4 w-4 mr-2" />
                              Set Default
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteTemplate(template)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {/* Add New Template Card */}
                  <Card className="flex flex-col items-center justify-center h-full border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Create New Template</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Design a new letterhead or document template
                      </p>
                      <Button onClick={() => openTemplateDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Letterhead Usage</CardTitle>
              <CardDescription>
                How letterhead templates are used in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border rounded-md p-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Quotations</h3>
                      <p className="text-sm text-muted-foreground">
                        Create professional quotes with your branded letterhead
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-green-100 p-2 rounded-full">
                      <FileCode className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Invoices</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate branded invoices for customer billing
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Purchase Orders</h3>
                      <p className="text-sm text-muted-foreground">
                        Send purchase orders with your company branding
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Truck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Delivery Notes</h3>
                      <p className="text-sm text-muted-foreground">
                        Create delivery documents with your branding
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Receipts</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate branded receipts for customers
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-red-100 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Reports</h3>
                      <p className="text-sm text-muted-foreground">
                        Create professional business reports
                      </p>
                    </div>
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

export default BrandingMaster;