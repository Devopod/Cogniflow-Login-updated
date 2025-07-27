import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUpdateInvoice, useInvoice, useSendInvoice } from "@/hooks/use-finance-data";
import { useContacts } from "@/hooks/use-contacts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Printer, Send, FileDown, Edit, CreditCard, AlertTriangle, CheckCircle2, Clock, Copy, RefreshCw, ExternalLink, UserIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceWithItems, Payment } from "@shared/schema";
import { useCreatePayment } from "@/hooks/use-payments";
import { format } from "date-fns";
import { useRealTimeInvoice } from "@/hooks/use-real-time-invoice";
import { useWebSocket } from '@/hooks/use-websocket';

export function InvoiceDetailPage({ invoiceId }: { invoiceId: number | null }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  
  // State for email dialog
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Partial<Invoice>>({});
  
  // Use direct invoice data as a fallback
  const { 
    data: directInvoice, 
    isLoading: directInvoiceLoading, 
    error: directInvoiceError 
  } = useInvoice(invoiceId);
  
  // Use real-time invoice data with WebSocket support
  const { 
    invoice: realtimeInvoice, 
    payments: invoicePayments, 
    isLoading: realtimeLoading, 
    error: realtimeError, 
    refresh: refetch, 
    totalPaid: realtimeTotalPaid, 
    balance: realtimeBalanceDue, 
    isPaid: realtimeIsPaid, 
    isOverdue: realtimeIsOverdue 
  } = useRealTimeInvoice(invoiceId);
  
  // Use either realtime data or direct data
  const invoice = realtimeInvoice || directInvoice;
  const isLoading = (directInvoiceLoading && !directInvoice) || (realtimeLoading && !realtimeInvoice);
  const isError = directInvoiceError || realtimeError; // Changed from && to ||
  const totalPaid = realtimeTotalPaid || 0;
  const balanceDue = realtimeBalanceDue || (invoice ? invoice.totalAmount - totalPaid : 0);
  const isPaid = realtimeIsPaid || balanceDue <= 0;
  const isOverdue = realtimeIsOverdue || (invoice ? new Date(invoice.dueDate) < new Date() && !isPaid && invoice.status?.toLowerCase() !== 'draft' : false);
  
  // Set a timeout to stop showing loading state after 5 seconds
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !invoice) {
        setLoadingTimedOut(true);
      }
    }, 10000); // Increased timeout to 10 seconds
    
    return () => clearTimeout(timer);
  }, [isLoading, invoice]);
  
  // Log for debugging
  useEffect(() => {
    console.log("Invoice detail page - invoiceId:", invoiceId);
    console.log("Direct invoice data:", directInvoice);
    console.log("Realtime invoice data:", realtimeInvoice);
    console.log("Combined invoice data:", invoice);
    console.log("Loading state (combined):", isLoading);
    console.log("  - Direct Invoice Loading:", directInvoiceLoading);
    console.log("  - Realtime Hook Loading:", realtimeLoading);
    console.log("Error state (combined):", isError);
    console.log("  - Direct Invoice Error:", directInvoiceError);
    console.log("  - Realtime Hook Error:", realtimeError);
    console.log("Loading timed out:", loadingTimedOut);
  }, [invoiceId, directInvoice, realtimeInvoice, invoice, isLoading, isError, loadingTimedOut, directInvoiceLoading, realtimeLoading, directInvoiceError, realtimeError]);
  
  // Fetch contacts for customer information
  const { data: contacts = [] } = useContacts();
  
  // Mutations
  const updateInvoice = useUpdateInvoice();
  const createPayment = useCreatePayment();
  const sendInvoice = useSendInvoice();
  // Listen for invoice_sent WebSocket event
  useWebSocket('invoice_sent', (event) => {
    if (event.invoiceId === invoiceId) {
      refetch();
      toast({ title: 'Invoice Sent', description: 'The invoice was sent to the client.' });
    }
  });
  
  // Initialize edit form when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      setEditedInvoice(invoice);
      
      // Pre-fill email dialog if contact has email
      const contact = contacts.find(c => c.id === invoice.contactId);
      if (contact?.email) {
        setEmailTo(contact.email);
        setEmailSubject(`Invoice ${invoice.invoiceNumber} from Your Company`);
        let body = `Dear ${contact.firstName || contact.company},\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.totalAmount)}.\n\nDue date: ${format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}.`;
        if (invoice.payment_portal_token) {
          const paymentLink = `${window.location.origin}/invoices/view/${invoice.payment_portal_token}`;
          body += `\n\nYou can view and pay your invoice online here: ${paymentLink}`;
        }
        body += `\n\nThank you for your business.\n\nRegards,\nYour Company`;
        setEmailBody(body);
      }
    }
  }, [invoice, contacts]);
  
  // Calculate payment status
  const paymentStatus = !invoice ? 'unknown' : 
                        isPaid ? 'paid' : 
                        totalPaid > 0 ? 'partial' : 
                        invoice.status?.toLowerCase() === 'draft' ? 'draft' :
                        isOverdue ? 'overdue' : 'pending';
  
  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!invoice) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const paymentData = {
        amount,
        paymentMethod,
        reference: paymentReference,
        description: paymentNote,
        relatedDocumentType: 'invoice',
        relatedDocumentId: invoice.id,
        contactId: invoice.contactId
      };
      
      await createPayment.mutateAsync(paymentData);
      
      // Update invoice status if fully paid
      if (amount >= balanceDue) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          status: 'paid',
          amountPaid: invoice.totalAmount
        });
      } else if (amount > 0 && invoice.status !== 'partial') {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          status: 'partial',
          amountPaid: totalPaid + amount
        });
      }
      
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNote("");
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(amount)} has been recorded.`,
      });
      
      refetch();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error recording the payment.",
        variant: "destructive"
      });
    }
  };
  
  // State for email sending
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Handle sending email
  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTo.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSendingEmail(true);
    try {
      // Call the backend API to send the invoice email with custom email
      const response = await fetch(`/api/invoices/${invoice!.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailTo.trim(),
          subject: emailSubject || `Invoice ${invoice!.invoiceNumber}`,
          message: emailBody || `Please find attached your invoice ${invoice!.invoiceNumber}. You can view and pay online using the link in the email.`
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success !== false) {
        toast({
          title: "Email Sent Successfully! 📧",
          description: `Invoice ${invoice!.invoiceNumber} has been sent to ${emailTo} with payment link.`,
        });
        
        setIsEmailDialogOpen(false);
        // Clear the form
        setEmailTo("");
        setEmailSubject("");
        setEmailBody("");
        refetch();
      } else {
        throw new Error(result.message || result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Email Failed ❌",
        description: error?.message || "There was an error sending the email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // State for saving invoice
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  
  // Handle save edited invoice
  const handleSaveInvoice = async () => {
    setIsSavingInvoice(true);
    try {
      await updateInvoice.mutateAsync({
        id: invoice!.id,
        ...editedInvoice
      });
      
      setIsEditMode(false);
      toast({
        title: "Invoice Updated",
        description: "The invoice has been updated successfully.",
      });
      
      refetch();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the invoice.",
        variant: "destructive"
      });
    } finally {
      setIsSavingInvoice(false);
    }
  };
  
  // State for changing status
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  
  // Handle invoice status change
  const handleStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    try {
      await updateInvoice.mutateAsync({
        id: invoice!.id,
        status: newStatus
      });
      
      toast({
        title: "Status Updated",
        description: `Invoice status changed to ${newStatus}.`,
      });
      
      refetch();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the status.",
        variant: "destructive"
      });
    } finally {
      setIsChangingStatus(false);
    }
  };
  
  // Format dates
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMMM dd, yyyy');
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "partial":
        return <Badge className="bg-blue-500">Partially Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get customer name
  const getCustomerName = () => {
    if (!invoice || !invoice.contactId) return "No Customer Assigned";
    
    // If invoice has direct contact data from backend
    if (invoice.contact) {
      return invoice.contact.firstName && invoice.contact.lastName 
        ? `${invoice.contact.firstName} ${invoice.contact.lastName}` 
        : invoice.contact.company || "Customer";
    }
    
    // Fallback to contacts array
    const contact = contacts.find(c => c.id === invoice.contactId);
    if (!contact) return "Customer Not Found";
    
    return contact.firstName && contact.lastName 
      ? `${contact.firstName} ${contact.lastName}` 
      : contact.company || "Unknown Customer";
  };
  
  // Get customer details
  const getCustomerDetails = () => {
    if (!invoice) {
      return (
        <div className="space-y-1">
          <p className="text-muted-foreground">No invoice data available</p>
        </div>
      );
    }
    
    // Show loading state while contacts are being fetched
    if (contacts.length === 0 && !invoice.contact) {
      return (
        <div className="space-y-1">
          <p className="text-muted-foreground">Loading customer details...</p>
        </div>
      );
    }
    
    // If invoice has contact data directly (from backend enhancement)
    if (invoice.contact) {
      const contact = invoice.contact;
      return (
        <div className="space-y-1">
          <p className="font-medium text-green-700">
            ✅ {contact.firstName && contact.lastName 
              ? `${contact.firstName} ${contact.lastName}` 
              : contact.company || 'Customer'}
          </p>
          {contact.company && contact.firstName && <p className="text-sm text-gray-600">{contact.company}</p>}
          {contact.email && <p className="text-sm">{contact.email}</p>}
          {contact.phone && <p className="text-sm">{contact.phone}</p>}
          {contact.address && <p className="text-sm">{contact.address}</p>}
          {(contact.city || contact.state || contact.postalCode) && (
            <p className="text-sm">
              {contact.city}{contact.city && contact.state ? ", " : ""}{contact.state} {contact.postalCode}
            </p>
          )}
          {contact.country && <p className="text-sm">{contact.country}</p>}
        </div>
      );
    }
    
    // Fallback to contacts array
    if (invoice.contactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === invoice.contactId);
      if (contact) {
        return (
          <div className="space-y-1">
            <p className="font-medium">{contact.firstName && contact.lastName 
              ? `${contact.firstName} ${contact.lastName}` 
              : contact.company || 'N/A'}</p>
            {contact.company && contact.firstName && <p>{contact.company}</p>}
            {contact.email && <p>{contact.email}</p>}
            {contact.phone && <p>{contact.phone}</p>}
            {contact.address && <p>{contact.address}</p>}
            {(contact.city || contact.state || contact.postalCode) && (
              <p>
                {contact.city}{contact.city && contact.state ? ", " : ""}{contact.state} {contact.postalCode}
              </p>
            )}
            {contact.country && <p>{contact.country}</p>}
          </div>
        );
      }
    }
    
    // If no contact found, show contact ID or default message
    return (
      <div className="space-y-1">
        <p className="text-muted-foreground">
          {invoice.contactId ? `Contact ID: ${invoice.contactId} (Not found)` : 'No customer assigned'}
        </p>
        <p className="text-sm text-amber-600">
          ⚠️ This invoice needs a customer to send emails
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={async () => {
            try {
              const response = await fetch(`/api/invoices/${invoice.id}/fix-contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              if (response.ok) {
                toast({ title: 'Customer Assigned', description: 'A default customer has been assigned to this invoice.' });
                refetch(); // Refresh the invoice data
              } else {
                toast({ title: 'Failed', description: 'Could not assign customer.', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Error', description: 'Failed to assign customer.', variant: 'destructive' });
            }
          }}
        >
          Assign Default Customer
        </Button>
      </div>
    );
  };
  
  // State for duplicating invoice
  const [isDuplicatingInvoice, setIsDuplicatingInvoice] = useState(false);
  
  // Handle duplicate invoice
  const handleDuplicateInvoice = async () => {
    setIsDuplicatingInvoice(true);
    if (!invoice) return;
    
    try {
      // Create a new invoice number
      const newInvoiceNumber = `INV-${new Date().getFullYear()}-${uuidv4().substring(0, 8)}`;
      
      // Create a new invoice with the same details but a new number and dates
      const newInvoice = {
        ...invoice,
        id: undefined,
        invoiceNumber: newInvoiceNumber,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        amountPaid: 0,
        notes: invoice.notes ? `${invoice.notes}\n[Duplicated from Invoice #${invoice.invoiceNumber}]` : `[Duplicated from Invoice #${invoice.invoiceNumber}]`
      };
      
      // Navigate to the new invoice page with the data
      setLocation(`/finance/invoices/new?duplicate=true&data=${encodeURIComponent(JSON.stringify(newInvoice))}`);
    } catch (error) {
      console.error("Error duplicating invoice:", error);
      toast({
        title: "Duplication Failed",
        description: "There was an error duplicating the invoice.",
        variant: "destructive"
      });
      setIsDuplicatingInvoice(false);
    }
  };
  
  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    
    setIsDeletingInvoice(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
      
      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoice.invoiceNumber} has been deleted successfully.`,
      });
      
      // Navigate back to invoices list
      setLocation("/finance/invoices");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the invoice.",
        variant: "destructive"
      });
      setIsDeletingInvoice(false);
    }
  };
  
  // Show error state first if an error has occurred, or if loading timed out without direct data
  if ((isError || loadingTimedOut) && !directInvoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {isError && !loadingTimedOut ? "Error Loading Invoice" :
           loadingTimedOut ? "Loading Timed Out" : "Invoice Not Found"}
        </h2>
        <p className="text-muted-foreground mb-4">
          {isError && !loadingTimedOut ? "An error occurred while trying to load the invoice details. Please try again." :
           loadingTimedOut
            ? "The request is taking longer than expected. Please try again."
            : "The invoice you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <div className="flex gap-4">
          {(isError || loadingTimedOut) && (
            <Button onClick={() => {
              setLoadingTimedOut(false);
              // Potentially reset error states in hooks if applicable, then refetch
              refetch();
              window.location.reload(); // Force a full reload as a last resort
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button onClick={() => setLocation("/finance/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  // Then, show loading state if still loading, not timed out, and no invoice data yet
  // Removed loading state UI to render invoice details page directly
  // if (isLoading && !invoice && !directInvoice) { // Added !directInvoice here as well for consistency
  //   return (
  //     <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
  //       <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
  //       <h2 className="text-2xl font-bold mb-2">
  //         {loadingTimedOut ? "Loading Timed Out" : "Invoice Not Found"}
  //       </h2>
  //       <p className="text-muted-foreground mb-4">
  //         {loadingTimedOut 
  //           ? "The request is taking longer than expected. Please try again."
  //           : "The invoice you're looking for doesn't exist or you don't have permission to view it."}
  //       </p>
  //       <div className="flex gap-4">
  //         {loadingTimedOut && (
  //           <Button onClick={() => {
  //             setLoadingTimedOut(false);
  //             refetch();
  //             window.location.reload(); // Force a full reload as a last resort
  //           }}>
  //             <RefreshCw className="h-4 w-4 mr-2" />
  //             Try Again
  //           </Button>
  //         )}
  //         <Button onClick={() => setLocation("/finance/invoices")}>
  //           <ArrowLeft className="h-4 w-4 mr-2" />
  //           Back to Invoices
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }
  
  
  return (
    <div className="container mx-auto py-6">
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="outline" onClick={() => setLocation("/finance/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold ml-4">
            Invoice {invoice?.invoiceNumber || 'N/A'}
            <span className="ml-2">{getStatusBadge(paymentStatus)}</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!isEditMode ? (
            <>
              <Button variant="outline" onClick={handleDuplicateInvoice} disabled={isDuplicatingInvoice}>
                {isDuplicatingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                Duplicate
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {!isEditMode && (
                <Button
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(true)}
                  disabled={sendInvoice.isLoading}
                >
                  {sendInvoice.isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Email
                </Button>
              )}
              {invoice?.payment_portal_token && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/invoices/view/${invoice.payment_portal_token}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeletingInvoice}
              >
                {isDeletingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                Delete
              </Button>
              {paymentStatus !== 'paid' && (
                <Button onClick={() => setIsPaymentDialogOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveInvoice} disabled={isSavingInvoice}>
                {isSavingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                {isEditMode ? "Edit invoice information" : "View invoice information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditMode ? (
                <>
                  {/* View mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer information */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill To:</h3>
                      {getCustomerDetails()}
                    </div>
                    
                    {/* Invoice information */}
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Invoice Number:</span>
                          <span>{invoice?.invoiceNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Issue Date:</span>
                          <span>{invoice?.issueDate ? formatDate(invoice.issueDate) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                          <span>{invoice?.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Status:</span>
                          <span>{getStatusBadge(paymentStatus)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Payment Terms:</span>
                          <span>{invoice?.terms || "Due on receipt"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Invoice items */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice?.items ? invoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">No items found for this invoice</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}>Subtotal</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice?.subtotal || 0)}</TableCell>
                        </TableRow>
                        {invoice?.taxAmount && invoice.taxAmount > 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>Tax</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice?.taxAmount || 0)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice?.totalAmount || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3}>Amount Paid</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalPaid)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3}>Balance Due</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(balanceDue)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                  
                  {/* Notes */}
                  {invoice?.notes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes:</h3>
                      <p className="text-sm whitespace-pre-line">{invoice?.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Edit mode */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input
                          id="invoiceNumber"
                          value={editedInvoice.invoiceNumber || ""}
                          onChange={(e) => setEditedInvoice({...editedInvoice, invoiceNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={editedInvoice.status || ""}
                          onValueChange={(value) => setEditedInvoice({...editedInvoice, status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="partial">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="issueDate">Issue Date</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={editedInvoice.issueDate?.split('T')[0] || ""}
                          onChange={(e) => setEditedInvoice({...editedInvoice, issueDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={editedInvoice.dueDate?.split('T')[0] || ""}
                          onChange={(e) => setEditedInvoice({...editedInvoice, dueDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Input
                          id="paymentTerms"
                          value={editedInvoice.terms || ""}
                          onChange={(e) => setEditedInvoice({...editedInvoice, terms: e.target.value})}
                          placeholder="e.g., Net 30"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editedInvoice.notes || ""}
                        onChange={(e) => setEditedInvoice({...editedInvoice, notes: e.target.value})}
                        rows={4}
                      />
                    </div>
                    
                    {/* Note: In a real implementation, you would also allow editing line items */}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Payments and activity */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="payments">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    {invoicePayments.length === 0 
                      ? "No payments recorded" 
                      : `${invoicePayments.length} payment${invoicePayments.length !== 1 ? 's' : ''} recorded`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invoicePayments.length === 0 ? (
                    <div className="text-center py-6">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">No payments have been recorded yet.</p>
                      {paymentStatus !== 'paid' && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsPaymentDialogOpen(true)}
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoicePayments.map((payment: Payment) => (
                        <div key={payment.id} className="border rounded-md p-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{payment.paymentMethod.replace('_', ' ')}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                              {payment.reference && (
                                <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(payment.amount)}</p>
                            </div>
                          </div>
                          {payment.description && (
                            <p className="text-sm mt-2">{payment.description}</p>
                          )}
                        </div>
                      ))}
                      
                      {paymentStatus !== 'paid' && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setIsPaymentDialogOpen(true)}
                        >
                          Record Another Payment
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="font-bold">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="font-bold">{formatCurrency(balanceDue)}</p>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>Recent activity for this invoice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoice && (
                      <div className="border-l-2 border-primary pl-4 py-1">
                        <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                        <p>Invoice created</p>
                      </div>
                    )}
                    
                    {invoicePayments.map((payment) => (
                      <div key={payment.id} className="border-l-2 border-primary pl-4 py-1">
                        <p className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                        <p>Payment of {formatCurrency(payment.amount)} recorded</p>
                        {payment.description && <p className="text-sm">{payment.description}</p>}
                      </div>
                    ))}
                    
                    {/* In a real implementation, you would show more activity types */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for invoice {invoice?.invoiceNumber || 'selected invoice'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="method" className="text-right">
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reference" className="text-right">
                Reference
              </Label>
              <Input
                id="reference"
                placeholder="Transaction ID, Check #, etc."
                className="col-span-3"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="note" className="text-right pt-2">
                Note
              </Label>
              <Textarea
                id="note"
                placeholder="Add a note about this payment"
                className="col-span-3"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={createPayment.isPending}>
              {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Invoice via Email
            </DialogTitle>
            <DialogDescription>
              Send Invoice {invoice?.invoiceNumber} to your customer with payment link included.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emailTo">
                Customer Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emailTo"
                type="email"
                placeholder="customer@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Invoice and payment link will be sent to this email address
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Subject (Optional)</Label>
              <Input
                id="emailSubject"
                placeholder={`Invoice ${invoice?.invoiceNumber} from Your Company`}
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailBody">Personal Message (Optional)</Label>
              <Textarea
                id="emailBody"
                placeholder="Add a personal message to include with the invoice..."
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                A professional invoice template will be used automatically
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Quick Fill:</h4>
              <div className="flex flex-wrap gap-2">
                {invoice?.contact?.email && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEmailTo(invoice.contact.email)}
                  >
                    Use: {invoice.contact.email}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEmailSubject(`Invoice ${invoice?.invoiceNumber} - Payment Due`);
                    setEmailBody("Dear Customer,\n\nI hope this email finds you well. Please find your invoice attached. You can view and pay online using the secure payment link included in this email.\n\nThank you for your business!\n\nBest regards");
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail || !emailTo.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoice?.invoiceNumber}? This action cannot be undone and will remove the invoice from all related modules including sales, finance, and reporting.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteInvoice}
              disabled={isDeletingInvoice}
            >
              {isDeletingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}