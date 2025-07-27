import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowDownOnSquareIcon, 
  PaperAirplaneIcon, 
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalculatorIcon,
  LinkIcon,
  EyeIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { 
  useCreateInvoice, 
  useUpdateInvoice, 
  useInvoice, 
  useSendInvoice,
  useGenerateInvoicePDF,
  useCreatePaymentLink,
  useInvoiceWorkflow
} from "@/hooks/use-finance-data";
import { useContacts } from "@/hooks/use-contacts";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAIInvoiceAssistant } from "@/hooks/use-ai-invoice-assistant";

// Invoice form schema
const invoiceSchema = z.object({
  contactId: z.number().min(1, "Please select a customer"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentTerms: z.string().default("Due on Receipt"),
  currency: z.string().default("USD"),
  exchangeRate: z.number().default(1),
  taxInclusive: z.boolean().default(false),
  taxType: z.string().default("VAT"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
  recurringStartDate: z.string().optional(),
  recurringEndDate: z.string().optional(),
  recurringCount: z.number().optional(),
  autoReminderEnabled: z.boolean().default(false),
  lateFeeEnabled: z.boolean().default(false),
  lateFeeAmount: z.number().optional(),
  lateFeePercentage: z.number().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
    discountRate: z.number().min(0).max(100, "Discount rate must be between 0 and 100"),
  })).min(1, "At least one item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

const PAYMENT_TERMS = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Net 90",
  "Custom"
];

export default function NewInvoice() {
  const [location, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [lastSavedInvoiceId, setLastSavedInvoiceId] = useState<number | null>(null);

  // Get invoice ID from URL if editing
  const invoiceId = location.includes("/edit/") ? parseInt(location.split("/edit/")[1]) : null;
  const isEditing = !!invoiceId;

  // Hooks
  const { data: contacts } = useContacts();
  const { data: existingInvoice } = useInvoice(invoiceId || 0, { enabled: isEditing });
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const sendInvoice = useSendInvoice();
  const generatePDF = useGenerateInvoicePDF();
  const createPaymentLink = useCreatePaymentLink();
  const { suggestDescription, suggestPrice } = useAIInvoiceAssistant();

  // Use the enhanced workflow hook for the current invoice if editing
  const workflow = useInvoiceWorkflow(invoiceId || lastSavedInvoiceId || 0, {
    enabled: !!(invoiceId || lastSavedInvoiceId)
  });

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      contactId: 0,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      paymentTerms: "Net 30",
      currency: "USD",
      exchangeRate: 1,
      taxInclusive: false,
      taxType: "VAT",
      notes: "",
      termsAndConditions: "",
      isRecurring: false,
      autoReminderEnabled: false,
      lateFeeEnabled: false,
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          discountRate: 0,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedCurrency = form.watch("currency");
  const watchedTaxInclusive = form.watch("taxInclusive");
  const watchedIsRecurring = form.watch("isRecurring");

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    watchedItems.forEach((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discountRate) / 100;
      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxableAmount * item.taxRate) / 100;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    });

    const total = subtotal - totalDiscount + (watchedTaxInclusive ? 0 : totalTax);

    return {
      subtotal,
      totalDiscount,
      totalTax,
      total,
    };
  };

  const totals = calculateTotals();

  // Update currency symbol when currency changes
  useEffect(() => {
    const currency = CURRENCIES.find(c => c.code === watchedCurrency);
    if (currency) {
      setSelectedCurrency(currency);
    }
  }, [watchedCurrency]);

  // Load existing invoice data
  useEffect(() => {
    if (existingInvoice && isEditing) {
      form.reset({
        contactId: existingInvoice.contactId,
        invoiceDate: format(new Date(existingInvoice.invoiceDate), "yyyy-MM-dd"),
        dueDate: format(new Date(existingInvoice.dueDate), "yyyy-MM-dd"),
        paymentTerms: existingInvoice.paymentTerms || "Due on Receipt",
        currency: existingInvoice.currency || "USD",
        exchangeRate: existingInvoice.exchangeRate || 1,
        taxInclusive: existingInvoice.taxInclusive || false,
        taxType: existingInvoice.taxType || "VAT",
        notes: existingInvoice.notes || "",
        termsAndConditions: existingInvoice.termsAndConditions || "",
        isRecurring: existingInvoice.isRecurring || false,
        recurringFrequency: existingInvoice.recurringFrequency,
        recurringStartDate: existingInvoice.recurringStartDate ? format(new Date(existingInvoice.recurringStartDate), "yyyy-MM-dd") : undefined,
        recurringEndDate: existingInvoice.recurringEndDate ? format(new Date(existingInvoice.recurringEndDate), "yyyy-MM-dd") : undefined,
        recurringCount: existingInvoice.recurringCount,
        autoReminderEnabled: existingInvoice.autoReminderEnabled || false,
        lateFeeEnabled: existingInvoice.lateFeeEnabled || false,
        lateFeeAmount: existingInvoice.lateFeeAmount,
        lateFeePercentage: existingInvoice.lateFeePercentage,
        items: existingInvoice.items || [
          {
            description: "",
            quantity: 1,
            unitPrice: 0,
            taxRate: 0,
            discountRate: 0,
          }
        ],
      });
    }
  }, [existingInvoice, isEditing, form]);

  // Handle form submission
  const onSubmit = async (data: InvoiceFormData, action: "draft" | "send" | "schedule") => {
    try {
      setIsSubmitting(true);

      const invoiceData = {
        ...data,
        subtotal: totals.subtotal,
        taxAmount: totals.totalTax,
        discountAmount: totals.totalDiscount,
        totalAmount: totals.total,
        status: action === "draft" ? "Draft" : action === "schedule" ? "Scheduled" : "Sent",
        paymentStatus: "Pending",
      };

      let result;
      if (isEditing) {
        result = await updateInvoice.mutateAsync({
          id: invoiceId!,
          ...invoiceData,
        });
      } else {
        result = await createInvoice.mutateAsync(invoiceData);
        setLastSavedInvoiceId(result.id);
      }

      // Send invoice if requested
      if (action === "send" && result.id) {
        await sendInvoice.mutateAsync({
          invoiceId: result.id,
          sendEmail: true,
        });
      }

      navigate(`/finance/invoices/${result.id}`);
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      
      // Handle specific validation errors
      if (error?.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.field === 'contact_id') {
          form.setError('contactId', {
            type: 'manual',
            message: errorData.message || 'Please select a valid customer'
          });
        } else {
          // Generic validation error
          console.error('Validation error:', errorData.message);
        }
      } else {
        // Network or other errors
        console.error('Failed to save invoice. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced action handlers
  const handlePreviewPDF = async () => {
    const currentInvoiceId = invoiceId || lastSavedInvoiceId;
    if (!currentInvoiceId) {
      // Save draft first
      const formData = form.getValues();
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        taxAmount: totals.totalTax,
        discountAmount: totals.totalDiscount,
        totalAmount: totals.total,
        status: "Draft",
        paymentStatus: "Pending",
      };
      
      const result = await createInvoice.mutateAsync(invoiceData);
      setLastSavedInvoiceId(result.id);
      
      // Generate PDF
      await generatePDF.mutateAsync({ invoiceId: result.id });
    } else {
      await generatePDF.mutateAsync({ invoiceId: currentInvoiceId });
    }
  };

  const handleCreatePaymentLink = async () => {
    const currentInvoiceId = invoiceId || lastSavedInvoiceId;
    if (!currentInvoiceId) {
      // Save draft first
      const formData = form.getValues();
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        taxAmount: totals.totalTax,
        discountAmount: totals.totalDiscount,
        totalAmount: totals.total,
        status: "Draft",
        paymentStatus: "Pending",
      };
      
      const result = await createInvoice.mutateAsync(invoiceData);
      setLastSavedInvoiceId(result.id);
      
      // Create payment link
      const linkResult = await createPaymentLink.mutateAsync({ 
        invoiceId: result.id,
        customMessage: "Please pay this invoice at your convenience"
      });
      
      // Copy to clipboard
      if (linkResult.paymentUrl) {
        navigator.clipboard.writeText(linkResult.paymentUrl);
        // You could show a toast notification here
      }
    } else {
      const linkResult = await createPaymentLink.mutateAsync({ 
        invoiceId: currentInvoiceId,
        customMessage: "Please pay this invoice at your convenience"
      });
      
      if (linkResult.paymentUrl) {
        navigator.clipboard.writeText(linkResult.paymentUrl);
      }
    }
  };

  // Add new item
  const addItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discountRate: 0,
    });
  };

  // AI suggestion handlers
  const handleAISuggestion = async (index: number, type: "description" | "price") => {
    const item = watchedItems[index];
    if (type === "description" && item.description) {
      const suggestion = await suggestDescription(item.description);
      if (suggestion) {
        form.setValue(`items.${index}.description`, suggestion);
      }
    } else if (type === "price" && item.description) {
      const suggestion = await suggestPrice(item.description);
      if (suggestion) {
        form.setValue(`items.${index}.unitPrice`, suggestion);
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Edit Invoice" : "Create New Invoice"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update invoice details" : "Create a professional invoice for your customer"}
          </p>
        </div>
        <Badge variant={isEditing ? "secondary" : "default"}>
          {isEditing ? `Editing Invoice #${existingInvoice?.invoiceNumber}` : "New Invoice"}
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit((data) => onSubmit(data, "draft"))}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Customer & Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactId">Customer *</Label>
                    <Select
                      value={form.watch("contactId")?.toString()}
                      onValueChange={(value) => form.setValue("contactId", parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {contact.firstName && contact.lastName 
                              ? `${contact.firstName} ${contact.lastName}`
                              : contact.company || 'Unnamed Contact'
                            } - {contact.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.contactId && (
                      <p className="text-sm text-red-500">{form.formState.errors.contactId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={form.watch("currency")}
                      onValueChange={(value) => form.setValue("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      {...form.register("invoiceDate")}
                    />
                    {form.formState.errors.invoiceDate && (
                      <p className="text-sm text-red-500">{form.formState.errors.invoiceDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...form.register("dueDate")}
                    />
                    {form.formState.errors.dueDate && (
                      <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select
                      value={form.watch("paymentTerms")}
                      onValueChange={(value) => form.setValue("paymentTerms", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxType">Tax Type</Label>
                    <Select
                      value={form.watch("taxType")}
                      onValueChange={(value) => form.setValue("taxType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VAT">VAT</SelectItem>
                        <SelectItem value="GST">GST</SelectItem>
                        <SelectItem value="SALES_TAX">Sales Tax</SelectItem>
                        <SelectItem value="NONE">No Tax</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="taxInclusive"
                    checked={form.watch("taxInclusive")}
                    onCheckedChange={(checked) => form.setValue("taxInclusive", checked)}
                  />
                  <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  Line Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                      <div className="col-span-12 md:col-span-4">
                        <Label htmlFor={`items.${index}.description`}>Description *</Label>
                        <div className="flex gap-1">
                          <Input
                            placeholder="Item description"
                            {...form.register(`items.${index}.description`)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAISuggestion(index, "description")}
                            title="AI Suggestion"
                          >
                            ✨
                          </Button>
                        </div>
                        {form.formState.errors.items?.[index]?.description && (
                          <p className="text-sm text-red-500">{form.formState.errors.items[index]?.description?.message}</p>
                        )}
                      </div>

                      <div className="col-span-6 md:col-span-1">
                        <Label htmlFor={`items.${index}.quantity`}>Qty *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1"
                          {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <Label htmlFor={`items.${index}.unitPrice`}>Price *</Label>
                        <div className="flex gap-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              {selectedCurrency.symbol}
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAISuggestion(index, "price")}
                            title="AI Price Suggestion"
                          >
                            ✨
                          </Button>
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-1">
                        <Label htmlFor={`items.${index}.taxRate`}>Tax %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0"
                          {...form.register(`items.${index}.taxRate`, { valueAsNumber: true })}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-1">
                        <Label htmlFor={`items.${index}.discountRate`}>Disc %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0"
                          {...form.register(`items.${index}.discountRate`, { valueAsNumber: true })}
                        />
                      </div>

                      <div className="col-span-8 md:col-span-2">
                        <Label>Total</Label>
                        <div className="text-lg font-semibold text-right">
                          {selectedCurrency.symbol}{(
                            (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0) -
                            ((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0) * (watchedItems[index]?.discountRate || 0)) / 100 +
                            (watchedTaxInclusive ? 0 : (((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0) - ((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0) * (watchedItems[index]?.discountRate || 0)) / 100) * (watchedItems[index]?.taxRate || 0)) / 100)
                          ).toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-4 md:col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    className="w-full"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes for this invoice..."
                    {...form.register("notes")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea
                    id="termsAndConditions"
                    placeholder="Add terms and conditions..."
                    {...form.register("termsAndConditions")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Advanced Options
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide" : "Show"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-6">
                  {/* Recurring Invoice */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isRecurring"
                        checked={form.watch("isRecurring")}
                        onCheckedChange={(checked) => form.setValue("isRecurring", checked)}
                      />
                      <Label htmlFor="isRecurring">Recurring Invoice</Label>
                    </div>

                    {watchedIsRecurring && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="recurringFrequency">Frequency</Label>
                          <Select
                            value={form.watch("recurringFrequency")}
                            onValueChange={(value) => form.setValue("recurringFrequency", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recurringStartDate">Start Date</Label>
                          <Input
                            id="recurringStartDate"
                            type="date"
                            {...form.register("recurringStartDate")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recurringEndDate">End Date (Optional)</Label>
                          <Input
                            id="recurringEndDate"
                            type="date"
                            {...form.register("recurringEndDate")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recurringCount">Max Occurrences (Optional)</Label>
                          <Input
                            id="recurringCount"
                            type="number"
                            min="1"
                            placeholder="Unlimited"
                            {...form.register("recurringCount", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Reminders & Fees */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoReminderEnabled"
                        checked={form.watch("autoReminderEnabled")}
                        onCheckedChange={(checked) => form.setValue("autoReminderEnabled", checked)}
                      />
                      <Label htmlFor="autoReminderEnabled">Auto Payment Reminders</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="lateFeeEnabled"
                        checked={form.watch("lateFeeEnabled")}
                        onCheckedChange={(checked) => form.setValue("lateFeeEnabled", checked)}
                      />
                      <Label htmlFor="lateFeeEnabled">Late Fees</Label>
                    </div>

                    {form.watch("lateFeeEnabled") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="lateFeeAmount">Late Fee Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              {selectedCurrency.symbol}
                            </span>
                            <Input
                              id="lateFeeAmount"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...form.register("lateFeeAmount", { valueAsNumber: true })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lateFeePercentage">Late Fee Percentage</Label>
                          <Input
                            id="lateFeePercentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0"
                            {...form.register("lateFeePercentage", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalculatorIcon className="h-5 w-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{selectedCurrency.symbol}{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{selectedCurrency.symbol}{totals.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax {watchedTaxInclusive ? "(Inclusive)" : ""}:</span>
                    <span>{selectedCurrency.symbol}{totals.totalTax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{selectedCurrency.symbol}{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {watchedCurrency !== "USD" && (
                  <div className="space-y-2">
                    <Label htmlFor="exchangeRate">Exchange Rate (1 USD = ? {watchedCurrency})</Label>
                    <Input
                      id="exchangeRate"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="1.0000"
                      {...form.register("exchangeRate", { valueAsNumber: true })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <ArrowDownOnSquareIcon className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Saving..." : isEditing ? "Update Draft" : "Save as Draft"}
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((data) => onSubmit(data, "send"))}
                  >
                                            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Save & Send"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handlePreviewPDF}
                  disabled={generatePDF.isPending}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {generatePDF.isPending ? "Generating..." : "Preview PDF"}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleCreatePaymentLink}
                  disabled={createPaymentLink.isPending}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {createPaymentLink.isPending ? "Creating..." : "Payment Link"}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={form.handleSubmit((data) => onSubmit(data, "schedule"))}
                  disabled={isSubmitting}
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Schedule Send
                </Button>

                {/* Show workflow actions if invoice exists */}
                {workflow.invoice && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Invoice Actions</h4>
                      
                      {workflow.invoice.status === "Draft" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          onClick={() => workflow.sendInvoice.mutate({ 
                            invoiceId: workflow.invoice!.id,
                            sendEmail: true 
                          })}
                          disabled={workflow.sendInvoice.isPending}
                        >
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          {workflow.sendInvoice.isPending ? "Sending..." : "Send Now"}
                        </Button>
                      )}

                      {workflow.invoice.paymentStatus !== "Paid" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          onClick={() => workflow.createPaymentIntent.mutate({ 
                            invoiceId: workflow.invoice!.id 
                          })}
                          disabled={workflow.createPaymentIntent.isPending}
                        >
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                          {workflow.createPaymentIntent.isPending ? "Creating..." : "Payment Intent"}
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => workflow.generatePDF.mutate({ 
                          invoiceId: workflow.invoice!.id 
                        })}
                        disabled={workflow.generatePDF.isPending}
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        {workflow.generatePDF.isPending ? "Generating..." : "Download PDF"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Real-time Status */}
            {workflow.invoice && (
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={
                      workflow.invoice.status === "Paid" ? "default" :
                      workflow.invoice.status === "Sent" ? "secondary" :
                      workflow.invoice.status === "Overdue" ? "destructive" :
                      "outline"
                    }>
                      {workflow.invoice.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Payment:</span>
                    <Badge variant={
                      workflow.invoice.paymentStatus === "Paid" ? "default" :
                      workflow.invoice.paymentStatus === "Partially Paid" ? "secondary" :
                      "outline"
                    }>
                      {workflow.invoice.paymentStatus}
                    </Badge>
                  </div>

                  {workflow.invoice.pdfUrl && (
                    <div className="flex items-center justify-between">
                      <span>PDF:</span>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => window.open(workflow.invoice!.pdfUrl, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  )}

                  {workflow.invoice.emailSent && workflow.invoice.emailSentDate && (
                    <div className="text-xs text-muted-foreground">
                      Email sent: {format(new Date(workflow.invoice.emailSentDate), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Activity Feed */}
            {workflow.activities && workflow.activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workflow.activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{activity.activityType}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-muted-foreground">{activity.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {form.formState.errors.root && (
              <Alert>
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}