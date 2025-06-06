import React, { useState } from "react";
import { useAIInvoiceAssistant } from "@/hooks/use-ai-invoice-assistant";
import { Loader2, Wand } from "lucide-react";
import { useCompany } from "@/hooks/use-company";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateInvoice } from "@/hooks/use-finance-data";
import { useContacts, useCreateContact } from "@/hooks/use-crm-data";
import { useProducts } from "@/hooks/use-inventory-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Save, Send, Download, Eye, FileText, Calculator, ChevronsUpDown, Search, X, AlertCircle, Info, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the invoice form schema
const invoiceFormSchema = z.object({
  contactId: z.number({
    required_error: "Please select a customer",
  }),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  currency: z.string().default("USD"),
  status: z.string().default("draft"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().optional(),
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(0.01, "Quantity must be greater than 0"),
      unitPrice: z.number().min(0, "Unit price must be non-negative"),
      taxRate: z.number().default(0),
      discountRate: z.number().default(0),
      subtotal: z.number(),
      totalAmount: z.number(),
    })
  ).min(1, "At least one item is required"),
  subtotal: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.date().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Invoice Preview Component
function InvoicePreview({ data }: { data: InvoiceFormValues }) {
  const { data: contacts = [] } = useContacts();
  const { companyName } = useCompany();
  return (
    <div className="bg-white rounded-lg border shadow-sm p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">INVOICE</h1>
          <p className="text-muted-foreground">{data.invoiceNumber}</p>
        </div>
        <div className="text-right">
          {/* TODO: Add full company address and email from useCompany once available */}
          <p className="font-bold">{companyName || "Your Company Name"}</p>
          <p>123 Business Street</p>
          <p>City, State 12345</p>
          <p>contact@yourcompany.com</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-muted-foreground mb-2">Bill To:</h3>
          {data.contactId ? (() => {
            const contact = contacts.find(c => c.id === data.contactId);
            return contact ? (
              <>
                <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                {contact.company && <p>{contact.company}</p>}
                <p>{contact.address}</p>
                <p>{contact.city}, {contact.state} {contact.postalCode}</p>
                <p>{contact.email}</p>
              </>
            ) : (
              <p className="font-medium">Customer details not available</p>
            );
          })() : (
            <p className="font-medium">No customer selected</p>
          )}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">Invoice Date:</h3>
              <p>{format(data.issueDate, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">Due Date:</h3>
              <p>{format(data.dueDate, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">Status:</h3>
              <Badge className={
                data.status === "draft" ? "bg-gray-500" :
                data.status === "pending" ? "bg-amber-500" :
                data.status === "paid" ? "bg-green-500" :
                data.status === "overdue" ? "bg-red-500" : ""
              }>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </Badge>
            </div>
            {data.isRecurring && (
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">Recurring:</h3>
                <Badge variant="outline">
                  {data.recurringFrequency 
                    ? data.recurringFrequency.charAt(0).toUpperCase() + data.recurringFrequency.slice(1) 
                    : "Monthly"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="rounded-md border">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium">Item</th>
                <th className="h-12 px-4 text-right align-middle font-medium w-[100px]">Qty</th>
                <th className="h-12 px-4 text-right align-middle font-medium w-[150px]">Price</th>
                <th className="h-12 px-4 text-right align-middle font-medium w-[100px]">Tax</th>
                <th className="h-12 px-4 text-right align-middle font-medium w-[100px]">Discount</th>
                <th className="h-12 px-4 text-right align-middle font-medium w-[150px]">Amount</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {data.items.map((item, index) => (
                <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{item.description}</td>
                  <td className="p-4 align-middle text-right">{item.quantity}</td>
                  <td className="p-4 align-middle text-right">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: data.currency,
                    }).format(item.unitPrice)}
                  </td>
                  <td className="p-4 align-middle text-right">{item.taxRate}%</td>
                  <td className="p-4 align-middle text-right">{item.discountRate}%</td>
                  <td className="p-4 align-middle text-right font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: data.currency,
                    }).format(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency,
              }).format(data.subtotal)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency,
              }).format(data.taxAmount)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium">
              -{new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency,
              }).format(data.discountAmount)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between py-2">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: data.currency,
              }).format(data.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {(data.notes || data.terms) && (
        <div className="border-t pt-6 space-y-4">
          {data.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-muted-foreground">{data.notes}</p>
            </div>
          )}
          {data.terms && (
            <div>
              <h3 className="font-semibold mb-2">Terms & Conditions</h3>
              <p className="text-muted-foreground">{data.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewInvoicePage() {
  const [, navigate] = useLocation();
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [openContactCombobox, setOpenContactCombobox] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [previewMode, setPreviewMode] = useState(false);

  // Remove loading state and render invoice details page directly on invoice click
  // Assuming this is related to invoice list or navigation, so no loading state here
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const { mutate: createContact, isPending: isCreatingContact } = useCreateContact();
  const { data: contacts = [] } = useContacts();
  const { data: apiProducts = [] } = useProducts();
  
  // Sample products to use when no products are available from the API
  const sampleProducts = [
    {
      id: -1,
      name: "Web Development Service",
      description: "Professional web development service",
      price: 120,
      taxRate: 10,
      sku: "WEB-DEV-001"
    },
    {
      id: -2,
      name: "Mobile App Development",
      description: "Custom mobile application development",
      price: 150,
      taxRate: 10,
      sku: "MOB-DEV-001"
    },
    {
      id: -3,
      name: "UI/UX Design",
      description: "User interface and experience design",
      price: 95,
      taxRate: 10,
      sku: "DESIGN-001"
    },
    {
      id: -4,
      name: "SEO Optimization",
      description: "Search engine optimization service",
      price: 75,
      taxRate: 5,
      sku: "SEO-001"
    },
    {
      id: -5,
      name: "Content Writing",
      description: "Professional content writing service",
      price: 50,
      taxRate: 5,
      sku: "CONTENT-001"
    }
  ];
  
  // Use API products if available, otherwise use sample products
  const products = apiProducts.length > 0 ? apiProducts : sampleProducts;

  // Initialize form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      currency: "USD",
      status: "draft",
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          discountRate: 0,
          subtotal: 0,
          totalAmount: 0,
        },
      ],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      isRecurring: false,
    },
  });

  // Set up field array for invoice items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch form values for calculations
  const watchedItems = form.watch("items");
  const watchedCurrency = form.watch("currency");
  const watchedIsRecurring = form.watch("isRecurring");

  // Calculate totals whenever items change
  React.useEffect(() => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    watchedItems.forEach((item, index) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const taxRate = item.taxRate || 0;
      const discountRate = item.discountRate || 0;

      const itemSubtotal = quantity * unitPrice;
      const itemDiscount = itemSubtotal * (discountRate / 100);
      const itemTax = (itemSubtotal - itemDiscount) * (taxRate / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTax;

      // Update the item's calculated values
      form.setValue(`items.${index}.subtotal`, parseFloat(itemSubtotal.toFixed(2)));
      form.setValue(`items.${index}.totalAmount`, parseFloat(itemTotal.toFixed(2)));

      subtotal += itemSubtotal;
      taxAmount += itemTax;
      discountAmount += itemDiscount;
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    // Update the invoice totals
    form.setValue("subtotal", parseFloat(subtotal.toFixed(2)));
    form.setValue("taxAmount", parseFloat(taxAmount.toFixed(2)));
    form.setValue("discountAmount", parseFloat(discountAmount.toFixed(2)));
    form.setValue("totalAmount", parseFloat(totalAmount.toFixed(2)));
  }, [watchedItems, form]);

  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    // Calculate totals before submission
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = itemSubtotal * (item.discountRate / 100);
      return sum + ((itemSubtotal - itemDiscount) * (item.taxRate / 100));
    }, 0);
    const discountAmount = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * (item.discountRate / 100));
    }, 0);
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Prepare the invoice data
    const invoiceData = {
      ...data,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      // Format dates as ISO strings for the API
      issueDate: data.issueDate.toISOString(),
      dueDate: data.dueDate.toISOString(),
      recurringEndDate: data.recurringEndDate ? data.recurringEndDate.toISOString() : undefined,
    };

    console.log("Submitting invoice:", invoiceData);

    createInvoice(invoiceData, {
      onSuccess: () => {
        toast({
          title: "Invoice created",
          description: `Invoice ${data.invoiceNumber} has been created successfully.`,
        });
        navigate("/finance/invoices");
      },
      onError: (error) => {
        toast({
          title: "Error creating invoice",
          description: error.message || "There was an error creating the invoice. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Generate a unique invoice number
  function generateInvoiceNumber() {
    const prefix = "INV";
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}-${year}-${randomNum}`;
  }
  
  // Function to handle saving a new customer
  const handleSaveCustomer = () => {
    if (!newCustomer.firstName || !newCustomer.lastName) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }
    
    createContact(
      {
        // The userId will be set by the server based on the authenticated user
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        email: newCustomer.email,
        phone: newCustomer.phone,
        company: newCustomer.company,
        address: newCustomer.address,
        city: newCustomer.city,
        state: newCustomer.state,
        postalCode: newCustomer.postalCode,
        country: newCustomer.country,
        type: "customer", // Set the type to customer
      },
      {
        onSuccess: (newContact) => {
          toast({
            title: "Success",
            description: "Customer added successfully",
          });
          
          // Set the new contact as the selected contact in the invoice form
          form.setValue("contactId", newContact.id);
          
          // Reset the new customer form
          setNewCustomer({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            company: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          });
          
          // Close the dialog
          setIsAddingCustomer(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to add customer. Please try again.",
            variant: "destructive",
          });
          console.error("Error adding customer:", error);
        }
      }
    );
  };

  // Format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: watchedCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Add a new item to the invoice
  function addItem() {
    append({
      productId: undefined,  // Explicitly set to undefined for new items
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discountRate: 0,
      subtotal: 0,
      totalAmount: 0,
    });
    
    // Focus on the new item after a short delay
    setTimeout(() => {
      const newIndex = fields.length;
      setOpenProductCombobox(newIndex);
    }, 100);
  }

  // Handle product selection
  function handleProductSelect(productId: number, index: number) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      // Update product details
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitPrice`, product.price);
      form.setValue(`items.${index}.taxRate`, product.taxRate || 0);
      
      // Get current quantity (default to 1 if not set)
      const quantity = form.getValues(`items.${index}.quantity`) || 1;
      const discountRate = form.getValues(`items.${index}.discountRate`) || 0;
      
      // Calculate subtotal and total
      const subtotal = quantity * product.price;
      const discount = subtotal * (discountRate / 100);
      const tax = (subtotal - discount) * ((product.taxRate || 0) / 100);
      const total = subtotal - discount + tax;
      
      // Update calculated values
      form.setValue(`items.${index}.subtotal`, parseFloat(subtotal.toFixed(2)));
      form.setValue(`items.${index}.totalAmount`, parseFloat(total.toFixed(2)));
    }
    // Close the dropdown
    setOpenProductCombobox(null);
  }

  // AI Invoice Assistant hook
  const {
    loading: aiLoading,
    generateDescription,
    suggestPricing,
  } = useAIInvoiceAssistant();

  // Function to handle AI description generation for an item
  const handleGenerateDescription = async (index: number) => {
    const notes = form.getValues(`items.${index}.description`);
    if (!notes) {
      toast({
        title: "Error",
        description: "Please enter some notes to generate description",
        variant: "destructive",
      });
      return;
    }
    try {
      const description = await generateDescription(0, notes); // 0 or invoiceId if available
      form.setValue(`items.${index}.description`, description);
      toast({
        title: "AI Description Generated",
        description: "Invoice item description updated with AI suggestion",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI description",
        variant: "destructive",
      });
    }
  };

  // Function to handle AI pricing suggestion for an item
  const handleSuggestPricing = async (index: number) => {
    const productId = form.getValues(`items.${index}.productId`);
    const product = products.find((p) => p.id === productId);
    if (!product) {
      toast({
        title: "Error",
        description: "Please select a product to get pricing suggestion",
        variant: "destructive",
      });
      return;
    }
    try {
      const suggestion = await suggestPricing(0, product.name, product.price); // 0 or invoiceId if available
      // Parse suggested price from AI response (simple parse, can be improved)
      const match = suggestion.match(/\$?([0-9]+(\.[0-9]+)?)/);
      if (match) {
        const suggestedPrice = parseFloat(match[1]);
        form.setValue(`items.${index}.unitPrice`, suggestedPrice);
        toast({
          title: "AI Pricing Suggestion",
          description: `Suggested price: $${suggestedPrice.toFixed(2)}`,
        });
      } else {
        toast({
          title: "AI Pricing Suggestion",
          description: suggestion,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI pricing suggestion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice for your customer</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/finance/invoices")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isPending}
          >
            {isPending ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Invoice
              </>
            )}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <InvoicePreview data={form.getValues()} />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Customer & Invoice Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                    <CardDescription>Select an existing customer or create a new one</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="contactId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Customer</FormLabel>
                            <Popover open={openContactCombobox} onOpenChange={setOpenContactCombobox}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openContactCombobox}
                                    className="justify-between w-full"
                                  >
                                    {field.value
                                      ? contacts.find((contact) => contact.id === field.value)?.firstName + " " + 
                                        contacts.find((contact) => contact.id === field.value)?.lastName
                                      : "Select customer..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search customer..." />
                                  <CommandEmpty>
                                    <div className="py-6 text-center">
                                      <p className="text-sm text-muted-foreground mb-2">No customer found</p>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setIsAddingCustomer(true)}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Customer
                                      </Button>
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {contacts.map((contact) => (
                                      <CommandItem
                                        key={contact.id}
                                        value={contact.id.toString()}
                                        onSelect={() => {
                                          form.setValue("contactId", contact.id);
                                          setOpenContactCombobox(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span>{contact.firstName} {contact.lastName}</span>
                                          <span className="text-xs text-muted-foreground">{contact.email}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <div className="p-2 border-t">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => setIsAddingCustomer(true)}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add New Customer
                                    </Button>
                                  </div>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("contactId") && (() => {
                        const contact = contacts.find((c) => c.id === form.watch("contactId"));
                        if (!contact) return null;
                        return (
                          <div className="bg-muted p-4 rounded-md">
                            <h4 className="font-medium mb-2">Customer Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Contact</p>
                                <p>{contact.firstName} {contact.lastName}</p>
                                <p>{contact.email}</p>
                                <p>{contact.phone}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Billing Address</p>
                                <p>{contact.address}</p>
                                <p>{contact.city}, {contact.state} {contact.postalCode}</p>
                                <p>{contact.country}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Enter the basic invoice information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Issue Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="isRecurring"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Recurring Invoice</FormLabel>
                                <FormDescription>
                                  Set this invoice to repeat automatically
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {watchedIsRecurring && (
                        <>
                          <FormField
                            control={form.control}
                            name="recurringFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recurringEndDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>End Date (Optional)</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>No end date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                      disabled={(date) => date < new Date()}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Leave empty for indefinite recurring
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                    <CardDescription>Add products or services to your invoice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-md border overflow-auto">
                        <div className="min-w-[900px]">
                          <table className="w-full caption-bottom text-sm">
                          <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <th className="h-12 px-4 text-left align-middle font-medium">Item</th>
                              <th className="h-12 px-4 text-center align-middle font-medium w-[140px]">Qty</th>
                              <th className="h-12 px-4 text-center align-middle font-medium w-[160px]">Price</th>
                              <th className="h-12 px-4 text-center align-middle font-medium w-[140px]">Tax %</th>
                              <th className="h-12 px-4 text-center align-middle font-medium w-[140px]">Disc %</th>
                              <th className="h-12 px-4 text-center align-middle font-medium w-[160px]">Amount</th>
                              <th className="h-12 w-[50px] px-4 align-middle font-medium"></th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {fields.map((field, index) => (
                              <tr key={field.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-2 align-middle">
                                  <div className="space-y-2">
                                    <Popover 
                                      open={openProductCombobox === index} 
                                      onOpenChange={(open) => {
                                        setOpenProductCombobox(open ? index : null);
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between"
                                        >
                                          {(() => {
                                            const productId = form.watch(`items.${index}.productId`);
                                            if (productId) {
                                              const selectedProduct = products.find(p => p.id === productId);
                                              return selectedProduct ? selectedProduct.name : "Select product...";
                                            }
                                            return "Select product...";
                                          })()}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                          <CommandInput placeholder="Search product..." />
                                          <CommandEmpty>
                                            <div className="p-2 text-center">
                                              <p>No product found</p>
                                              <p className="text-xs text-muted-foreground mt-1">
                                                Try searching for a different term or select from the list below
                                              </p>
                                            </div>
                                          </CommandEmpty>
                                          <CommandGroup heading="Available Products">
                                            {products.map((product) => (
                                              <CommandItem
                                                key={product.id}
                                                value={product.name}
                                                onSelect={() => {
                                                  handleProductSelect(product.id, index);
                                                }}
                                                className="cursor-pointer"
                                              >
                                                <div className="flex flex-col w-full">
                                                  <div className="flex justify-between items-center w-full">
                                                    <span className="font-medium">{product.name}</span>
                                                    <span className="font-semibold">{formatCurrency(product.price)}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center w-full text-xs text-muted-foreground mt-1">
                                                    <span>{product.description || "No description"}</span>
                                                    <span>SKU: {product.sku || "N/A"}</span>
                                                  </div>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                <Input
                                  placeholder="Description"
                                  {...form.register(`items.${index}.description`)}
                                />
                                <div className="mt-1 flex space-x-2">
                                  <Button 
                                    size="xs" 
                                    variant="outline" 
                                    onClick={() => handleGenerateDescription(index)}
                                    disabled={aiLoading}
                                  >
                                    {aiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Wand className="h-4 w-4" />}
                                    Generate Description
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    variant="outline" 
                                    onClick={() => handleSuggestPricing(index)}
                                    disabled={aiLoading}
                                  >
                                    {aiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Wand className="h-4 w-4" />}
                                    Suggest Pricing
                                  </Button>
                                </div>
                              </div>
                            </td>
                                <td className="p-2 align-middle">
                                  <div className="flex items-center">
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-r-none border-r-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.quantity`) || 0;
                                        if (currentValue > 0.01) {
                                          form.setValue(`items.${index}.quantity`, Math.max(0.01, currentValue - 1), { shouldValidate: true });
                                        }
                                      }}
                                    >
                                      <span className="font-bold">-</span>
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      className="rounded-none text-center h-8 w-16 px-1"
                                      {...form.register(`items.${index}.quantity`, {
                                        valueAsNumber: true,
                                      })}
                                    />
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-l-none border-l-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.quantity`) || 0;
                                        form.setValue(`items.${index}.quantity`, currentValue + 1, { shouldValidate: true });
                                      }}
                                    >
                                      <span className="font-bold">+</span>
                                    </Button>
                                  </div>
                                </td>
                                <td className="p-2 align-middle">
                                  <div className="flex items-center">
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-r-none border-r-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.unitPrice`) || 0;
                                        if (currentValue > 0) {
                                          form.setValue(`items.${index}.unitPrice`, Math.max(0, currentValue - 1), { shouldValidate: true });
                                        }
                                      }}
                                    >
                                      <span className="font-bold">-</span>
                                    </Button>
                                    <div className="relative">
                                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="rounded-none text-center h-8 pl-6 w-20 px-1"
                                        {...form.register(`items.${index}.unitPrice`, {
                                          valueAsNumber: true,
                                        })}
                                      />
                                    </div>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-l-none border-l-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.unitPrice`) || 0;
                                        form.setValue(`items.${index}.unitPrice`, currentValue + 1, { shouldValidate: true });
                                      }}
                                    >
                                      <span className="font-bold">+</span>
                                    </Button>
                                  </div>
                                </td>
                                <td className="p-2 align-middle">
                                  <div className="flex items-center">
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-r-none border-r-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.taxRate`) || 0;
                                        if (currentValue > 0) {
                                          form.setValue(`items.${index}.taxRate`, Math.max(0, currentValue - 1), { shouldValidate: true });
                                        }
                                      }}
                                    >
                                      <span className="font-bold">-</span>
                                    </Button>
                                    <div className="relative">
                                      <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="rounded-none text-center h-8 pl-6 w-16 px-1"
                                        {...form.register(`items.${index}.taxRate`, {
                                          valueAsNumber: true,
                                        })}
                                      />
                                    </div>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-l-none border-l-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.taxRate`) || 0;
                                        form.setValue(`items.${index}.taxRate`, Math.min(100, currentValue + 1), { shouldValidate: true });
                                      }}
                                    >
                                      <span className="font-bold">+</span>
                                    </Button>
                                  </div>
                                </td>
                                <td className="p-2 align-middle">
                                  <div className="flex items-center">
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-r-none border-r-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.discountRate`) || 0;
                                        if (currentValue > 0) {
                                          form.setValue(`items.${index}.discountRate`, Math.max(0, currentValue - 1), { shouldValidate: true });
                                        }
                                      }}
                                    >
                                      <span className="font-bold">-</span>
                                    </Button>
                                    <div className="relative">
                                      <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="rounded-none text-center h-8 pl-6 w-16 px-1"
                                        {...form.register(`items.${index}.discountRate`, {
                                          valueAsNumber: true,
                                        })}
                                      />
                                    </div>
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-6 rounded-l-none border-l-0 px-0"
                                      onClick={() => {
                                        const currentValue = form.getValues(`items.${index}.discountRate`) || 0;
                                        form.setValue(`items.${index}.discountRate`, Math.min(100, currentValue + 1), { shouldValidate: true });
                                      }}
                                    >
                                      <span className="font-bold">+</span>
                                    </Button>
                                  </div>
                                </td>
                                <td className="p-2 align-middle">
                                  <div className="flex items-center justify-center">
                                    <div className="relative w-full">
                                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <div className="h-8 rounded border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors text-center pl-6 w-full">
                                        {formatCurrency(form.watch(`items.${index}.totalAmount`) || 0)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2 align-middle">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-muted-foreground">
                          {fields.length} {fields.length === 1 ? 'item' : 'items'} in invoice
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-medium"
                          onClick={addItem}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Another Item
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes & Terms</CardTitle>
                    <CardDescription>Add additional information to your invoice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any notes for the customer (e.g., 'Thank you for your business')"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              These notes will be displayed on the invoice
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Terms & Conditions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your terms and conditions"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Standard terms and conditions for this invoice
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column - Summary */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Invoice Summary</CardTitle>
                    <CardDescription>Review your invoice details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatCurrency(form.watch("subtotal") || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">{formatCurrency(form.watch("taxAmount") || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium">-{formatCurrency(form.watch("discountAmount") || 0)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-2">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-semibold">{formatCurrency(form.watch("totalAmount") || 0)}</span>
                      </div>

                      <div className="rounded-lg bg-muted p-4 mt-6">
                        <h4 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Invoice Status
                        </h4>
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">
                                    <div className="flex items-center">
                                      <Badge variant="outline" className="mr-2">Draft</Badge>
                                      <span>Save as draft</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pending">
                                    <div className="flex items-center">
                                      <Badge className="bg-amber-500 mr-2">Pending</Badge>
                                      <span>Mark as pending</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="sent">
                                    <div className="flex items-center">
                                      <Badge className="bg-blue-500 mr-2">Sent</Badge>
                                      <span>Mark as sent</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Set the current status of this invoice
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
                      {isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Invoice
                        </>
                      )}
                    </Button>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button variant="outline" className="w-full" type="button">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" className="w-full" type="button">
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer to add to this invoice
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                placeholder="Doe" 
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                placeholder="+1 (555) 123-4567" 
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input 
                id="company" 
                placeholder="Acme Inc." 
                value={newCustomer.company}
                onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
              />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                placeholder="123 Main St, Apt 4B" 
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                placeholder="New York" 
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State/Province</Label>
              <Input 
                id="state" 
                placeholder="NY" 
                value={newCustomer.state}
                onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input 
                id="postalCode" 
                placeholder="10001" 
                value={newCustomer.postalCode}
                onChange={(e) => setNewCustomer({...newCustomer, postalCode: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                placeholder="United States" 
                value={newCustomer.country}
                onChange={(e) => setNewCustomer({...newCustomer, country: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCustomer(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveCustomer} 
              disabled={isCreatingContact || !newCustomer.firstName || !newCustomer.lastName}
            >
              {isCreatingContact ? "Saving..." : "Save Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Label component for the dialog
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
}

// Label component for the dialog