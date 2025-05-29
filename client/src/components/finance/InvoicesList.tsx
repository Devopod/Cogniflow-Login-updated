import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Invoice, Contact } from "@shared/schema";

// Extended invoice type that includes the contact relation
type InvoiceWithContact = Invoice & {
  contact?: Contact;
};
import { useInvoices } from "@/hooks/use-finance-data";
import { useFinanceAnalytics } from "@/hooks/use-finance-analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileDown,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InvoicesList() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch invoices
  const {
    data: invoices = [] as InvoiceWithContact[],
    isLoading,
    isError,
    refetch,
  } = useInvoices() as { data: InvoiceWithContact[], isLoading: boolean, isError: boolean, refetch: () => void };

  // Get finance analytics
  const analytics = useFinanceAnalytics(invoices);
  
  // Calculate invoice counts by status
  const invoiceCounts = useMemo(() => {
    const counts = {
      total: invoices.length,
      paid: 0,
      pending: 0,
      overdue: 0,
      draft: 0
    };
    
    invoices.forEach(invoice => {
      if (invoice.status === 'paid') counts.paid++;
      else if (invoice.status === 'pending') counts.pending++;
      else if (invoice.status === 'overdue') counts.overdue++;
      else if (invoice.status === 'draft') counts.draft++;
    });
    
    return counts;
  }, [invoices]);

  // Format dates
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
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

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter((invoice) => {
    // Get customer name from contact if available
    const customerName = invoice.contact?.firstName && invoice.contact?.lastName 
      ? `${invoice.contact.firstName} ${invoice.contact.lastName}`
      : invoice.contact?.company || 'Unknown';
    
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Create new invoice
  const handleCreateInvoice = () => {
    setLocation("/finance/invoices/new");
  };

  // View invoice details
  const handleViewInvoice = (invoiceId: number) => {
    setLocation(`/finance/invoices/${invoiceId}`);
  };
  
  // Mark invoice as paid
  const handleMarkAsPaid = (e: React.MouseEvent, invoiceId: number) => {
    e.stopPropagation();
    // In a real implementation, this would call an API to update the invoice status
    // For now, we'll just show a console message
    console.log(`Marking invoice ${invoiceId} as paid`);
    // After API call succeeds, you would refetch the data
    // refetch();
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-destructive">Failed to load invoices</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Total Invoices</span>
              <span className="text-2xl font-bold">{invoiceCounts.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="text-2xl font-bold text-green-600">{invoiceCounts.paid}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-2xl font-bold text-amber-600">{invoiceCounts.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Overdue</span>
              <span className="text-2xl font-bold text-red-600">{invoiceCounts.overdue}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Invoices table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invoices found. {searchTerm && `Try a different search term.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewInvoice(invoice.id)}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    {invoice.contact 
                      ? (invoice.contact.firstName && invoice.contact.lastName 
                          ? `${invoice.contact.firstName} ${invoice.contact.lastName}`
                          : invoice.contact.company || 'Unknown')
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount || 0)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewInvoice(invoice.id);
                        }}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Send className="h-4 w-4 mr-2" />
                          Send to customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {invoice.status !== 'paid' && (
                          <DropdownMenuItem onClick={(e) => handleMarkAsPaid(e, invoice.id)}>
                            Mark as paid
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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