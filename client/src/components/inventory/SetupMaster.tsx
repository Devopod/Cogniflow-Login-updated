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
  Box,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  Edit,
  FileCheck,
  FileText,
  Filter,
  FolderOpen,
  Layers,
  Loader2,
  PackageCheck,
  PackageOpen,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Settings2,
  ShoppingCart,
  Tag,
  Truck,
  Undo2,
  BookText,
  FileStack,
  FileDigit,
  FileWarning,
  FileOutput,
  FileInput,
  FilePenLine,
  LayoutList,
  CheckSquare,
  AlertTriangle,
  ListChecks,
  Info,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Sample prefixes data
const samplePrefixes = [
  {
    id: 1,
    module: "Quotations",
    prefix: "QUOT",
    nextNumber: 1025,
    digitLength: 4,
    separator: "-",
    includeYear: true,
    example: "QUOT-2023-1025",
    description: "Sales quotations and estimates",
    isActive: true,
    lastUpdated: "2023-04-15T14:30:00Z"
  },
  {
    id: 2,
    module: "Invoices",
    prefix: "INV",
    nextNumber: 4587,
    digitLength: 4,
    separator: "-",
    includeYear: true,
    example: "INV-2023-4587",
    description: "Customer invoices",
    isActive: true,
    lastUpdated: "2023-04-10T10:15:00Z"
  },
  {
    id: 3,
    module: "Purchase Orders",
    prefix: "PO",
    nextNumber: 782,
    digitLength: 4,
    separator: "-",
    includeYear: true,
    example: "PO-2023-0782",
    description: "Purchase orders to suppliers",
    isActive: true,
    lastUpdated: "2023-03-28T09:30:00Z"
  },
  {
    id: 4,
    module: "Bill of Materials",
    prefix: "BOM",
    nextNumber: 312,
    digitLength: 4,
    separator: "-",
    includeYear: false,
    example: "BOM-0312",
    description: "Product bill of materials",
    isActive: true,
    lastUpdated: "2023-04-05T11:45:00Z"
  },
  {
    id: 5,
    module: "Goods Receipt Note",
    prefix: "GRN",
    nextNumber: 645,
    digitLength: 4,
    separator: "-",
    includeYear: false,
    example: "GRN-0645",
    description: "Goods received from suppliers",
    isActive: true,
    lastUpdated: "2023-04-02T16:20:00Z"
  },
  {
    id: 6,
    module: "Goods Delivery Note",
    prefix: "GDN",
    nextNumber: 489,
    digitLength: 4,
    separator: "-",
    includeYear: false,
    example: "GDN-0489",
    description: "Goods delivered to customers",
    isActive: true,
    lastUpdated: "2023-03-30T15:10:00Z"
  },
  {
    id: 7,
    module: "Credit Notes",
    prefix: "CN",
    nextNumber: 152,
    digitLength: 4,
    separator: "-",
    includeYear: true,
    example: "CN-2023-0152",
    description: "Credit notes issued to customers",
    isActive: true,
    lastUpdated: "2023-04-12T10:55:00Z"
  },
  {
    id: 8,
    module: "Debit Notes",
    prefix: "DN",
    nextNumber: 87,
    digitLength: 4,
    separator: "-",
    includeYear: true,
    example: "DN-2023-0087",
    description: "Debit notes for supplier returns",
    isActive: true,
    lastUpdated: "2023-03-25T13:45:00Z"
  },
  {
    id: 9,
    module: "Stock Transfers",
    prefix: "ST",
    nextNumber: 246,
    digitLength: 4,
    separator: "-",
    includeYear: false,
    example: "ST-0246",
    description: "Internal stock transfers",
    isActive: true,
    lastUpdated: "2023-04-08T14:30:00Z"
  },
  {
    id: 10,
    module: "Delivery Challan",
    prefix: "DC",
    nextNumber: 378,
    digitLength: 4,
    separator: "-",
    includeYear: false,
    example: "DC-0378",
    description: "Delivery challans for customer shipments",
    isActive: true,
    lastUpdated: "2023-03-28T11:20:00Z"
  }
];

// Sample UI settings data
const sampleUISettings = [
  {
    id: 1,
    category: "General",
    settings: [
      {
        id: "pagination_size",
        name: "Default Pagination Size",
        value: "25",
        type: "select",
        options: ["10", "25", "50", "100"],
        description: "Number of items per page in tables"
      },
      {
        id: "date_format",
        name: "Date Format",
        value: "DD-MM-YYYY",
        type: "select",
        options: ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"],
        description: "Format for displaying dates"
      },
      {
        id: "enable_animations",
        name: "Enable UI Animations",
        value: true,
        type: "boolean",
        description: "Show animations in the interface"
      }
    ]
  },
  {
    id: 2,
    category: "Notifications",
    settings: [
      {
        id: "low_stock_threshold",
        name: "Low Stock Threshold",
        value: "10",
        type: "number",
        description: "When to show low stock notification"
      },
      {
        id: "notify_new_orders",
        name: "Notify on New Orders",
        value: true,
        type: "boolean",
        description: "Show notification for new orders"
      },
      {
        id: "order_sound",
        name: "Order Notification Sound",
        value: "bell",
        type: "select",
        options: ["bell", "chime", "alert", "none"],
        description: "Sound to play on new order"
      }
    ]
  },
  {
    id: 3,
    category: "Documents",
    settings: [
      {
        id: "pdf_paper_size",
        name: "PDF Paper Size",
        value: "A4",
        type: "select",
        options: ["A4", "Letter", "Legal"],
        description: "Default paper size for PDF documents"
      },
      {
        id: "default_pdf_orientation",
        name: "Default PDF Orientation",
        value: "portrait",
        type: "select",
        options: ["portrait", "landscape"],
        description: "Default orientation for PDF documents"
      },
      {
        id: "include_payment_instructions",
        name: "Include Payment Instructions",
        value: true,
        type: "boolean",
        description: "Show payment instructions on invoices"
      }
    ]
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

// Get module icon
const getModuleIcon = (module: string) => {
  switch (module) {
    case "Quotations":
      return <FilePenLine className="h-5 w-5 text-blue-600" />;
    case "Invoices":
      return <FileDigit className="h-5 w-5 text-green-600" />;
    case "Purchase Orders":
      return <ShoppingCart className="h-5 w-5 text-purple-600" />;
    case "Bill of Materials":
      return <Layers className="h-5 w-5 text-amber-600" />;
    case "Goods Receipt Note":
      return <FileInput className="h-5 w-5 text-indigo-600" />;
    case "Goods Delivery Note":
      return <FileOutput className="h-5 w-5 text-rose-600" />;
    case "Credit Notes":
      return <FileWarning className="h-5 w-5 text-red-600" />;
    case "Debit Notes":
      return <FileText className="h-5 w-5 text-orange-600" />;
    case "Stock Transfers":
      return <FolderOpen className="h-5 w-5 text-teal-600" />;
    case "Delivery Challan":
      return <Truck className="h-5 w-5 text-cyan-600" />;
    default:
      return <FileText className="h-5 w-5 text-gray-600" />;
  }
};

// Generate example prefix
const generateExample = (prefix: string, separator: string, includeYear: boolean, digitLength: number) => {
  const year = includeYear ? `${separator}${new Date().getFullYear()}` : "";
  const number = "1".padStart(digitLength, "0");
  return `${prefix}${year}${separator}${number}`;
};

const SetupMaster = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("prefixes");
  const [currentPrefix, setCurrentPrefix] = useState<any>(null);
  const [showPrefixDialog, setShowPrefixDialog] = useState(false);
  const [prefixFormData, setPrefixFormData] = useState({
    module: "",
    prefix: "",
    nextNumber: 1,
    digitLength: 4,
    separator: "-",
    includeYear: false
  });
  const [previewPrefix, setPreviewPrefix] = useState("");

  // Generate example preview when form data changes
  const updatePrefixPreview = () => {
    const { prefix, separator, includeYear, digitLength } = prefixFormData;
    if (prefix) {
      setPreviewPrefix(generateExample(prefix, separator, includeYear, digitLength));
    } else {
      setPreviewPrefix("");
    }
  };

  // Query for prefixes data
  const { data: prefixesData, isLoading: isPrefixesLoading, isError: isPrefixesError } = useQuery({
    queryKey: ["/api/settings/prefixes"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(samplePrefixes);
    },
  });

  // Query for UI settings data
  const { data: uiSettings, isLoading: isUiSettingsLoading, isError: isUiSettingsError } = useQuery({
    queryKey: ["/api/settings/ui-settings"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleUISettings);
    },
  });

  // Handle prefix form field change
  const handlePrefixFieldChange = (field: string, value: any) => {
    setPrefixFormData({
      ...prefixFormData,
      [field]: value
    });
    
    // Update preview after a short delay
    setTimeout(updatePrefixPreview, 10);
  };

  // Open prefix dialog for editing
  const openPrefixDialog = (prefix: any = null) => {
    if (prefix) {
      setCurrentPrefix(prefix);
      setPrefixFormData({
        module: prefix.module,
        prefix: prefix.prefix,
        nextNumber: prefix.nextNumber,
        digitLength: prefix.digitLength,
        separator: prefix.separator,
        includeYear: prefix.includeYear
      });
      setPreviewPrefix(prefix.example);
    } else {
      setCurrentPrefix(null);
      setPrefixFormData({
        module: "",
        prefix: "",
        nextNumber: 1,
        digitLength: 4,
        separator: "-",
        includeYear: false
      });
      setPreviewPrefix("");
    }
    setShowPrefixDialog(true);
  };

  // Handle prefix form submission
  const handlePrefixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: currentPrefix ? "Prefix Updated" : "Prefix Created",
      description: currentPrefix 
        ? `The prefix for ${currentPrefix.module} has been updated.` 
        : "A new document prefix has been created.",
    });
    
    setShowPrefixDialog(false);
  };

  // Handle UI setting change
  const handleSettingChange = (categoryId: number, settingId: string, value: any) => {
    // In a real app, you'd update the setting in the backend
    toast({
      title: "Setting Updated",
      description: "The UI setting has been updated successfully.",
    });
  };

  // Save all settings
  const saveAllSettings = () => {
    toast({
      title: "Settings Saved",
      description: "All settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Setup Master</h2>
          <p className="text-muted-foreground">
            Configure document prefixes and system settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Undo2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveAllSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="prefixes" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Document Prefixes
          </TabsTrigger>
          <TabsTrigger value="ui-settings" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            UI Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prefixes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Document Prefixes</CardTitle>
                  <CardDescription>
                    Configure the prefixes and numbering format for various documents
                  </CardDescription>
                </div>
                <Dialog open={showPrefixDialog} onOpenChange={setShowPrefixDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => openPrefixDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Prefix
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {currentPrefix ? `Edit Prefix: ${currentPrefix.module}` : "Add New Prefix"}
                      </DialogTitle>
                      <DialogDescription>
                        Configure how document numbers are generated for this module
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePrefixSubmit} className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="module">Module</Label>
                          <Select 
                            value={prefixFormData.module}
                            onValueChange={(value) => handlePrefixFieldChange("module", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Quotations">Quotations</SelectItem>
                              <SelectItem value="Invoices">Invoices</SelectItem>
                              <SelectItem value="Purchase Orders">Purchase Orders</SelectItem>
                              <SelectItem value="Bill of Materials">Bill of Materials</SelectItem>
                              <SelectItem value="Goods Receipt Note">Goods Receipt Note</SelectItem>
                              <SelectItem value="Goods Delivery Note">Goods Delivery Note</SelectItem>
                              <SelectItem value="Credit Notes">Credit Notes</SelectItem>
                              <SelectItem value="Debit Notes">Debit Notes</SelectItem>
                              <SelectItem value="Stock Transfers">Stock Transfers</SelectItem>
                              <SelectItem value="Delivery Challan">Delivery Challan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="prefix">Prefix Code</Label>
                          <Input 
                            id="prefix" 
                            placeholder="e.g., INV" 
                            value={prefixFormData.prefix}
                            onChange={(e) => handlePrefixFieldChange("prefix", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="digitLength">Number Length</Label>
                          <Select 
                            value={prefixFormData.digitLength.toString()}
                            onValueChange={(value) => handlePrefixFieldChange("digitLength", parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 digits (000)</SelectItem>
                              <SelectItem value="4">4 digits (0000)</SelectItem>
                              <SelectItem value="5">5 digits (00000)</SelectItem>
                              <SelectItem value="6">6 digits (000000)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="separator">Separator</Label>
                          <Select 
                            value={prefixFormData.separator}
                            onValueChange={(value) => handlePrefixFieldChange("separator", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select separator" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-">Hyphen (-)</SelectItem>
                              <SelectItem value="/">Forward Slash (/)</SelectItem>
                              <SelectItem value=".">Dot (.)</SelectItem>
                              <SelectItem value="_">Underscore (_)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nextNumber">Next Number</Label>
                          <Input 
                            id="nextNumber" 
                            type="number"
                            min="1"
                            placeholder="e.g., 1001" 
                            value={prefixFormData.nextNumber}
                            onChange={(e) => handlePrefixFieldChange("nextNumber", parseInt(e.target.value))}
                            required
                          />
                        </div>
                        
                        <div className="flex items-center justify-between h-full mt-6">
                          <Label htmlFor="includeYear" className="font-medium cursor-pointer">Include Year</Label>
                          <Switch 
                            id="includeYear" 
                            checked={prefixFormData.includeYear}
                            onCheckedChange={(checked) => handlePrefixFieldChange("includeYear", checked)}
                          />
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-muted/30">
                        <Label className="mb-2 block">Preview</Label>
                        <div className="flex justify-between items-center">
                          <div className="font-mono text-lg">{previewPrefix || "XXXX-0000"}</div>
                          <Badge variant="outline">Example Format</Badge>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPrefixDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {currentPrefix ? "Update Prefix" : "Create Prefix"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isPrefixesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isPrefixesError ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <div className="text-red-500">
                      <AlertTriangle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium">Error Loading Prefix Data</h3>
                    <p className="text-sm text-muted-foreground">
                      There was a problem loading the prefix configuration.
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Module</TableHead>
                        <TableHead>Prefix</TableHead>
                        <TableHead>Next Number</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prefixesData?.map((prefix) => (
                        <TableRow key={prefix.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getModuleIcon(prefix.module)}
                              <div className="font-medium">{prefix.module}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-medium">{prefix.prefix}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{prefix.nextNumber}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">{prefix.example}</TableCell>
                          <TableCell>{formatDate(prefix.lastUpdated)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openPrefixDialog(prefix)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="flex items-center w-full justify-between">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Changes to prefixes will only affect new documents
                </div>
                <Button onClick={saveAllSettings}>
                  Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ui-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>UI Settings</CardTitle>
                  <CardDescription>
                    Configure user interface parameters and behavior
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isUiSettingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isUiSettingsError ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <div className="text-red-500">
                      <AlertTriangle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium">Error Loading UI Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      There was a problem loading the UI settings.
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {uiSettings?.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <h3 className="font-medium text-lg">{category.category}</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">Setting</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {category.settings.map((setting) => (
                              <TableRow key={setting.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <div className="font-medium">{setting.name}</div>
                                </TableCell>
                                <TableCell>
                                  {setting.type === "boolean" ? (
                                    <Switch 
                                      checked={setting.value as boolean} 
                                      onCheckedChange={(checked) => handleSettingChange(category.id, setting.id, checked)}
                                    />
                                  ) : setting.type === "select" ? (
                                    <Select 
                                      value={setting.value as string}
                                      onValueChange={(value) => handleSettingChange(category.id, setting.id, value)}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {setting.options?.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input 
                                      value={setting.value as string} 
                                      onChange={(e) => handleSettingChange(category.id, setting.id, e.target.value)}
                                      className="w-[180px]"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {setting.description}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="flex items-center w-full justify-between">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Some settings may require a page refresh to take effect
                </div>
                <Button onClick={saveAllSettings}>
                  Save Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SetupMaster;