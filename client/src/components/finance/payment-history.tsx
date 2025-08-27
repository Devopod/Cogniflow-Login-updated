import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Clock, CheckCircle, AlertTriangle, FileText, DollarSign, Trash2, Edit, Loader2, RefreshCw, FileDown, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatPaymentMethod, formatRelativeTime } from "@/lib/format";
import { format } from "date-fns";
import { Payment, Invoice } from "@shared/schema";
import { useDeletePayment, useInvoicePayments } from "@/hooks/use-payments";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm } from "./payment-form";

interface PaymentHistoryProps {
  invoice: Invoice;
  payments: Payment[];
  totalPaid: number;
  balanceDue: number;
  onRefresh?: () => void;
}

export function PaymentHistory({ invoice, payments, totalPaid, balanceDue, onRefresh }: PaymentHistoryProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const { toast } = useToast();
  const { mutate: deletePayment, isLoading: isDeleting } = useDeletePayment();
  
  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy");
  };
  
  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="h-4 w-4 mr-1" />;
      case "cash":
        return <DollarSign className="h-4 w-4 mr-1" />;
      default:
        return <DollarSign className="h-4 w-4 mr-1" />;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-4 w-4 mr-1" />
            Paid
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-4 w-4 mr-1" />
            Partial
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Overdue
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="outline">
            <FileText className="h-4 w-4 mr-1" />
            {status}
          </Badge>
        );
    }
  };
  
  // Handle payment recorded
  const handlePaymentRecorded = () => {
    setIsPaymentDialogOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Handle delete payment
  const handleDeletePayment = () => {
    if (!selectedPayment) return;
    
    deletePayment(selectedPayment.id, {
      onSuccess: () => {
        toast({
          title: "Payment Deleted",
          description: `Payment of ${formatCurrency(selectedPayment.amount)} has been deleted.`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedPayment(null);
        if (onRefresh) {
          onRefresh();
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to delete payment: ${error.message}`,
          variant: "destructive"
        });
      }
    });
  };
  
  return (
    <>
      <Tabs defaultValue="payments">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {payments.length === 0 
                  ? "No payments recorded yet" 
                  : `${payments.length} payment${payments.length !== 1 ? 's' : ''} recorded`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-6">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">No payments have been recorded yet.</p>
                  {balanceDue > 0 && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsPaymentDialogOpen(true)}
                    >
                      Record First Payment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium flex items-center">
                            {getPaymentMethodIcon(payment.payment_method)}
                            {payment.payment_method.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatDate(payment.payment_date)}</p>
                          {payment.reference && (
                            <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(payment.amount)}</p>
                          <div className="flex space-x-1 mt-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {payment.description && (
                        <p className="text-sm mt-2">{payment.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {balanceDue > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsPaymentDialogOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
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
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent activity for this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-primary pl-4 py-1">
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                  <p>Invoice created</p>
                </div>
                
                {payments.map((payment) => (
                  <div key={payment.id} className="border-l-2 border-primary pl-4 py-1">
                    <p className="text-sm text-muted-foreground">{formatDate(payment.payment_date)}</p>
                    <p>Payment of {formatCurrency(payment.amount)} recorded via {payment.payment_method.replace('_', ' ')}</p>
                    {payment.description && <p className="text-sm">{payment.description}</p>}
                  </div>
                ))}
                
                {/* Reminder history would go here if implemented */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <PaymentForm 
            invoice={invoice} 
            balanceDue={balanceDue} 
            onPaymentRecorded={handlePaymentRecorded}
            onCancel={() => setIsPaymentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 my-4">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">
                  {selectedPayment?.payment_method.replace('_', ' ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment?.payment_date && formatDate(selectedPayment.payment_date)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {selectedPayment?.amount && formatCurrency(selectedPayment.amount)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePayment} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}