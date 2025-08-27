import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useInvoices } from "@/hooks/use-finance-data";
import { useContacts } from "@/hooks/use-contacts";
import { useInvoiceFilters } from "@/hooks/use-invoice-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Search, FileDown, Filter, ArrowUpDown, Eye, Calendar as CalendarIcon, X, Download, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { Invoice } from "@shared/schema";
import { WebSocketManager } from "@/lib/websocket";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useDeleteInvoice } from "@/hooks/use-finance-data";

export function InvoiceList() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  
  // Fetch invoices
  const { data: invoices = [], isLoading, refetch } = useInvoices();
  
  // Fetch contacts for customer names
  const { data: contacts = [] } = useContacts();
  
  // Set up WebSocket for real-time updates
  useEffect(() => {
    // Connect to the global invoices WebSocket
    const wsClient = WebSocketManager.getConnection('invoices', 'all');
    
    // Subscribe to invoice updates
    const unsubscribeInvoiceCreated = wsClient.on('invoice_created', () => {
      refetch();
    });
    
    const unsubscribeInvoiceUpdated = wsClient.on('invoice_updated', () => {
      refetch();
    });
    
    const unsubscribeInvoiceDeleted = wsClient.on('invoice_deleted', () => {
      refetch();
    });
    
    const unsubscribePaymentAdded = wsClient.on('payment_added', () => {
      refetch();
    });
    
    return () => {
      unsubscribeInvoiceCreated();
      unsubscribeInvoiceUpdated();
      unsubscribeInvoiceDeleted();
      unsubscribePaymentAdded();
    };
  }, [refetch]);
  
  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const contactName = getContactName(invoice.contactId);
      
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        contactName.toLowerCase().includes(searchLower) ||
        (invoice.status ?? "").toLowerCase().includes(searchLower) ||
        formatCurrency(invoice.totalAmount).toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = !statusFilter || (invoice.status ?? "") === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      let comparison = 0;
      
      switch (sortField) {
        case "invoiceNumber":
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case "customer":
          comparison = getContactName(a.contactId).localeCompare(getContactName(b.contactId));
          break;
        case "issueDate":
          comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "amount":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "status":
          comparison = (a.status ?? "").localeCompare(b.status ?? "");
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return sortDirection === "asc" ? comparison : -comparison;
    });
  
  // Helper function to get contact name
  function getContactName(contactId: number | null): string {
    if (contactId === null) return "Unknown";
    
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return "Unknown";
    
    return contact.firstName && contact.lastName 
      ? `${contact.firstName} ${contact.lastName}` 
      : contact.company || "Unknown";
  }
  
  // Helper function to format date
  function formatDate(dateString: string): string {
    return format(new Date(dateString), "MMM dd, yyyy");
  }
  
  // Helper function to get status badge
  function getStatusBadge(status: string): JSX.Element {
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
  }
  
  // Helper function to toggle sort
  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }
  
  // Calculate summary statistics
  const totalInvoices = filteredInvoices.length;
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalPaid = filteredInvoices.reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
  const totalOutstanding = totalAmount - totalPaid;
  const overdueInvoices = filteredInvoices.filter(
    invoice => invoice.status?.toLowerCase() !== "paid" && invoice.status?.toLowerCase() !== "draft" && new Date(invoice.dueDate) < new Date()
  ).length;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading invoices...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button onClick={() => setLocation("/finance/invoices/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueInvoices}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select
          value={statusFilter || ""}
          onValueChange={(value) => setStatusFilter(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
      
      {/* Invoices table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] cursor-pointer" onClick={() => toggleSort("invoiceNumber")}>
                <div className="flex items-center">
                  Invoice Number
                  {sortField === "invoiceNumber" && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("customer")}>
                <div className="flex items-center">
                  Customer
                  {sortField === "customer" && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("issueDate")}>
                <div className="flex items-center">
                  Issue Date
                  {sortField === "issueDate" && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("dueDate")}>
                <div className="flex items-center">
                  Due Date
                  {sortField === "dueDate" && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("amount")}>
                <div className="flex items-center justify-end">
                  Amount
                  {sortField === "amount" && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                <div className="flex items-center">
                  Status
                  {sortField === "status" && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invoices found. Create your first invoice to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice: Invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/finance/invoices/${invoice.id}`)}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{getContactName(invoice.contactId)}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status ?? "")}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/finance/invoices/${invoice.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Dialog open={deleteDialogOpen && selectedInvoice?.id === invoice.id} onOpenChange={(open) => {
                      setDeleteDialogOpen(open);
                      if (!open) setSelectedInvoice(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                            setDeleteDialogOpen(true);
                          }}
                          aria-label="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Invoice</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete invoice <b>{invoice.invoiceNumber}</b>? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" disabled={isDeleting}>Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => {
                              if (!invoice.id) return;
                              deleteInvoice(invoice.id, {
                                onSuccess: () => {
                                  setDeleteDialogOpen(false);
                                  setSelectedInvoice(null);
                                },
                              });
                            }}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}