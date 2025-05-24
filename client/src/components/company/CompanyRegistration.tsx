import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { extendedCompanySchema } from "@shared/schema";
import { useCompany } from "@/hooks/use-company";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Define the company registration schema
const companyRegistrationSchema = z.object({
  // Basic Company Information
  legalName: z.string().min(2, "Legal business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  industryType: z.string().min(1, "Industry type is required"),
  country: z.string().min(1, "Country is required"),
  
  // Tax Identification Details
  taxIdNumber: z.string().optional(),
  taxRegistrationStatus: z.string().optional(),
  
  // Address Information
  principalBusinessAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    postalCode: z.string().min(1, "Postal/ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  addressProofType: z.string().optional(),
  
  // Bank Account Details
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingCode: z.string().optional(),
  bankAddress: z.string().optional(),
  
  // Authorized Signatory Information
  signatoryName: z.string().optional(),
  signatoryDesignation: z.string().optional(),
  signatoryTaxId: z.string().optional(),
  signatoryIdentificationNumber: z.string().optional(),
  signatoryContact: z.object({
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
  }).optional(),
  
  // Business Registration Documents
  businessRegistrationNumber: z.string().optional(),
  
  // Optional Details for ERP Customization
  businessSize: z.string().optional(),
  preferredLanguage: z.string().default("English"),
  currency: z.string().default("USD"),
  timeZone: z.string().optional(),
});

// Business types
const businessTypes = [
  "Sole Proprietorship",
  "Partnership",
  "Corporation",
  "Limited Liability Company (LLC)",
  "Limited Liability Partnership (LLP)",
  "Trust",
  "Non-Profit",
  "Other"
];

// Industry types
const industryTypes = [
  "Manufacturing",
  "Retail",
  "Services",
  "Technology",
  "Construction",
  "Healthcare",
  "Finance",
  "Education",
  "Agriculture",
  "Transportation",
  "Energy",
  "Entertainment",
  "Hospitality",
  "Real Estate",
  "Other"
];

// Countries
const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "South Africa",
  "Mexico",
  "Singapore",
  "United Arab Emirates",
  "Kenya",
  "Nigeria",
  "Other"
];

// Tax registration statuses
const taxRegistrationStatuses = [
  "Registered (Standard Taxpayer)",
  "Small Business Exemption",
  "Not Registered",
  "Special Status"
];

// Address proof types
const addressProofTypes = [
  "Ownership Document",
  "Lease Agreement",
  "Utility Bill",
  "Consent Letter",
  "Other"
];

// Business sizes
const businessSizes = [
  "Micro",
  "Small",
  "Medium",
  "Large"
];

// Languages
const languages = [
  "English",
  "Spanish",
  "Mandarin",
  "Hindi",
  "French",
  "Arabic",
  "Portuguese",
  "German",
  "Japanese",
  "Other"
];

// Currencies
const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "AED", name: "UAE Dirham" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "ZAR", name: "South African Rand" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" }
];

// Time zones
const timeZones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Johannesburg"
];

type CompanyRegistrationData = z.infer<typeof companyRegistrationSchema>;

export default function CompanyRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const companyStatus = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    addressProofDocument: null,
    bankDocument: null,
    signatoryPhoto: null,
    registrationCertificate: null,
    partnershipAgreement: null,
    proofOfAppointment: null,
    taxRegistrationCertificate: null,
    logo: null
  });

  // Form definition
  const form = useForm<CompanyRegistrationData>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: {
      legalName: "",
      businessType: "",
      email: "",
      phone: "",
      industryType: "",
      country: "",
      taxIdNumber: "",
      taxRegistrationStatus: "",
      principalBusinessAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
      },
      addressProofType: "",
      bankName: "",
      accountNumber: "",
      routingCode: "",
      bankAddress: "",
      signatoryName: "",
      signatoryDesignation: "",
      signatoryTaxId: "",
      signatoryIdentificationNumber: "",
      signatoryContact: {
        email: "",
        phone: ""
      },
      businessRegistrationNumber: "",
      businessSize: "",
      preferredLanguage: "English",
      currency: "USD",
      timeZone: ""
    }
  });

  // Calculate progress based on form completion
  const calculateProgress = () => {
    const formValues = form.getValues();
    let filledFields = 0;
    let totalFields = 0;
    
    // Count basic fields
    const basicFields = ['legalName', 'businessType', 'email', 'phone', 'industryType', 'country'];
    basicFields.forEach(field => {
      totalFields++;
      if (formValues[field as keyof CompanyRegistrationData]) filledFields++;
    });
    
    // Count address fields
    const addressFields = ['street', 'city', 'state', 'postalCode', 'country'];
    addressFields.forEach(field => {
      totalFields++;
      if (formValues.principalBusinessAddress && formValues.principalBusinessAddress[field as keyof typeof formValues.principalBusinessAddress]) {
        filledFields++;
      }
    });
    
    // Count tax fields
    totalFields += 2;
    if (formValues.taxIdNumber) filledFields++;
    if (formValues.taxRegistrationStatus) filledFields++;
    
    // Count bank fields
    const bankFields = ['bankName', 'accountNumber', 'routingCode', 'bankAddress'];
    bankFields.forEach(field => {
      totalFields++;
      if (formValues[field as keyof CompanyRegistrationData]) filledFields++;
    });
    
    // Count signatory fields
    const signatoryFields = ['signatoryName', 'signatoryDesignation', 'signatoryTaxId', 'signatoryIdentificationNumber'];
    signatoryFields.forEach(field => {
      totalFields++;
      if (formValues[field as keyof CompanyRegistrationData]) filledFields++;
    });
    
    // Count document uploads
    Object.keys(uploadedFiles).forEach(key => {
      totalFields++;
      if (uploadedFiles[key]) filledFields++;
    });
    
    return Math.round((filledFields / totalFields) * 100);
  };

  // Handle file uploads
  const handleFileUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFiles({
        ...uploadedFiles,
        [fieldName]: e.target.files[0]
      });
      
      // Update progress
      setTimeout(() => {
        setProgress(calculateProgress());
      }, 100);
      
      toast({
        title: "File uploaded",
        description: `${e.target.files[0].name} has been uploaded successfully.`
      });
    }
  };

  // Handle form submission
  const onSubmit = async (data: CompanyRegistrationData) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Add all files
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });
      
      // Send data to the server
      const response = await fetch("/api/company/register", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Company registration failed");
      }
      
      const companyData = await response.json();
      
      toast({
        title: "Registration successful",
        description: `${data.legalName} has been registered successfully!`,
      });
      
      // Force refresh company status before redirecting
      await companyStatus.refresh(true);
      
      // Force redirect to dashboard
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not register company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update progress when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setProgress(calculateProgress());
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Company Registration</h1>
          <p className="text-muted-foreground mt-2">
            Please provide your company details to complete the registration process
          </p>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Registration Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            All fields marked with an asterisk (*) are required. Other fields can be completed later.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tax">Tax Details</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              {/* Basic Company Information */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Company Information</CardTitle>
                    <CardDescription>
                      Enter the official details of your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Business Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter official business name" {...field} />
                            </FormControl>
                            <FormDescription>
                              As per registration documents in your country
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="company@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              Primary email for communication and verification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. +1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormDescription>
                              Include country code (e.g., +1 for USA, +91 for India)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="industryType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry Type <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {industryTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country of Operation <span className="text-red-500">*</span></FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Primary country where your business operates
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="businessSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Size</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select business size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessSizes.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Based on turnover or employee count
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="preferredLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Language</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {languages.map((language) => (
                                  <SelectItem key={language} value={language}>
                                    {language}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Currency</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencies.map((currency) => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.code} - {currency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For financial transactions
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="timeZone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Zone</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time zone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeZones.map((zone) => (
                                  <SelectItem key={zone} value={zone}>
                                    {zone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              For scheduling and reporting
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <div></div>
                      <Button type="button" onClick={() => setActiveTab("tax")}>
                        Next: Tax Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tax Identification Details */}
              <TabsContent value="tax" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Identification Details</CardTitle>
                    <CardDescription>
                      Enter your tax registration information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="taxIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Identification Number (TIN) or Equivalent</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., GSTIN, EIN, VAT Number, ABN" {...field} />
                          </FormControl>
                          <FormDescription>
                            Country-specific tax ID (e.g., GSTIN for India, EIN for USA)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="taxRegistrationStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Registration Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tax registration status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {taxRegistrationStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                        Back: Basic Info
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("address")}>
                        Next: Address
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Address Information */}
              <TabsContent value="address" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                    <CardDescription>
                      Enter your business address details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Principal Place of Business <span className="text-red-500">*</span></h3>
                      
                      <FormField
                        control={form.control}
                        name="principalBusinessAddress.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Enter street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="principalBusinessAddress.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="principalBusinessAddress.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter state or province" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="principalBusinessAddress.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal/ZIP Code <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Enter postal or ZIP code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="principalBusinessAddress.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {countries.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="addressProofType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Proof Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select address proof type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {addressProofTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Document type that proves your business address
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-2">
                        <FormLabel>Address Proof Document</FormLabel>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('addressProofDocument', e)}
                            className="flex-1"
                          />
                          {uploadedFiles.addressProofDocument && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>Uploaded</span>
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          Upload ownership document, lease agreement, utility bill, etc. (PDF/JPEG, max 5MB)
                        </FormDescription>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("tax")}>
                        Back: Tax Details
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("banking")}>
                        Next: Banking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Bank Account Details */}
              <TabsContent value="banking" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Account Details</CardTitle>
                    <CardDescription>
                      Enter your business banking information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bank name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter account number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="routingCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Routing/SWIFT/IFSC Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter routing code" {...field} />
                            </FormControl>
                            <FormDescription>
                              Bank routing code (e.g., SWIFT, IFSC, ABA)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bankAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter bank branch address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel>Bank Document</FormLabel>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('bankDocument', e)}
                          className="flex-1"
                        />
                        {uploadedFiles.bankDocument && (
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <span>✓</span>
                            <span>Uploaded</span>
                          </div>
                        )}
                      </div>
                      <FormDescription>
                        Upload cancelled check, bank statement, or equivalent (PDF/JPEG, max 5MB)
                      </FormDescription>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("address")}>
                        Back: Address
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("documents")}>
                        Next: Documents
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Documents and Signatory Information */}
              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Authorized Signatory Information</CardTitle>
                    <CardDescription>
                      Enter details of the primary authorized signatory
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="signatoryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter signatory's full name" {...field} />
                            </FormControl>
                            <FormDescription>
                              Name of the primary authorized signatory
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="signatoryDesignation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation/Status</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., CEO, Director, Owner" {...field} />
                            </FormControl>
                            <FormDescription>
                              Role in the company
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="signatoryTaxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Tax ID</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., SSN, PAN" {...field} />
                            </FormControl>
                            <FormDescription>
                              Country-specific personal ID
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="signatoryIdentificationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identification Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Director ID, Business ID" {...field} />
                            </FormControl>
                            <FormDescription>
                              Business-specific ID
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="signatoryContact.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter signatory's email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="signatoryContact.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter signatory's phone" {...field} />
                            </FormControl>
                            <FormDescription>
                              Include country code
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel>Photograph</FormLabel>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('signatoryPhoto', e)}
                          className="flex-1"
                        />
                        {uploadedFiles.signatoryPhoto && (
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <span>✓</span>
                            <span>Uploaded</span>
                          </div>
                        )}
                      </div>
                      <FormDescription>
                        Passport-sized photo (JPEG, max 100KB)
                      </FormDescription>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Business Registration Documents</CardTitle>
                    <CardDescription>
                      Upload official business registration documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="businessRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CIN, EIN, Company Number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Unique ID from your country's business registry
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <FormLabel>Incorporation/Registration Certificate</FormLabel>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('registrationCertificate', e)}
                            className="flex-1"
                          />
                          {uploadedFiles.registrationCertificate && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>Uploaded</span>
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          Proof of legal formation (PDF/JPEG, max 5MB)
                        </FormDescription>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Partnership Agreement (if applicable)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('partnershipAgreement', e)}
                            className="flex-1"
                          />
                          {uploadedFiles.partnershipAgreement && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>Uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Proof of Appointment</FormLabel>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('proofOfAppointment', e)}
                            className="flex-1"
                          />
                          {uploadedFiles.proofOfAppointment && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>Uploaded</span>
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          Authorization letter or resolution for the signatory
                        </FormDescription>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Tax Registration Certificate</FormLabel>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('taxRegistrationCertificate', e)}
                            className="flex-1"
                          />
                          {uploadedFiles.taxRegistrationCertificate && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>Uploaded</span>
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          For businesses registered for tax (e.g., GST, VAT)
                        </FormDescription>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Company Logo (Optional)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('logo', e)}
                            className="flex-1"
                          />
                          {uploadedFiles.logo && (
                            <div className="text-sm text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>Uploaded</span>
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          For branding invoices, dashboards, and reports (PNG/JPG, max 5MB)
                        </FormDescription>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("banking")}>
                        Back: Banking
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Complete Registration"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}