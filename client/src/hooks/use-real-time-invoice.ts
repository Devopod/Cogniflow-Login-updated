import { useState, useEffect, useCallback } from 'react';
import { useInvoice } from './use-finance-data';
import { useInvoicePayments } from './use-payments';
import { Invoice, InvoiceWithItems, Payment } from '@shared/schema';
import { useWebSocket } from '@/lib/websocket';
import { useToast } from '@/components/ui/use-toast';

// Hook to get real-time invoice data with payments
export function useRealTimeInvoice(invoiceId: string | number | null) {
  // Get invoice data
  const { data: invoice, isLoading: isInvoiceLoading, error: invoiceError, refetch: refetchInvoice } = useInvoice(invoiceId);
  
  // Get payments for this invoice
  const { data: payments, isLoading: isPaymentsLoading, error: paymentsError, refetch: refetchPayments } = useInvoicePayments(invoiceId);
  
  // State for real-time data
  const [realTimeInvoice, setRealTimeInvoice] = useState<InvoiceWithItems | null>(null);
  const [realTimePayments, setRealTimePayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(isInvoiceLoading || isPaymentsLoading);
  const [error, setError] = useState<Error | null>(null);
  
  // Toast notifications
  const { toast } = useToast();
  
  // Set up WebSocket connection for real-time updates
  const { subscribe } = useWebSocket('invoices', invoiceId || '');
  
  // Update state when data changes
  useEffect(() => {
    if (invoice) {
      setRealTimeInvoice(invoice);
    }
    
    if (payments) {
      setRealTimePayments(payments);
    }
    
    if (!isInvoiceLoading && !isPaymentsLoading) {
      setIsLoading(false);
    }
    
    if (invoiceError || paymentsError) {
      setError(invoiceError || paymentsError);
    }
  }, [invoice, payments, isInvoiceLoading, isPaymentsLoading, invoiceError, paymentsError]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!invoiceId) return;
    
    // Handle invoice updates
    const unsubscribeInvoiceUpdate = subscribe('invoice_updated', (data) => {
      setRealTimeInvoice(prev => {
        if (!prev) return data.invoice;
        return { ...prev, ...data.invoice };
      });
      
      toast({
        title: "Invoice Updated",
        description: "The invoice has been updated.",
        variant: "default",
      });
      
      // Refetch to ensure we have the latest data
      refetchInvoice();
    });
    
    // Handle payment added
    const unsubscribePaymentAdded = subscribe('payment_added', (data) => {
      // Refetch payments to get the complete payment data
      refetchPayments();
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${data.amount.toFixed(2)} has been recorded.`,
        variant: "default",
      });
    });
    
    // Handle payment updated
    const unsubscribePaymentUpdated = subscribe('payment_updated', (data) => {
      setRealTimePayments(prev => {
        return prev.map(payment => {
          if (payment.id === data.paymentId) {
            return { ...payment, ...data.payment };
          }
          return payment;
        });
      });
      
      // Refetch to ensure we have the latest data
      refetchPayments();
      refetchInvoice(); // Invoice totals might have changed
      
      toast({
        title: "Payment Updated",
        description: "A payment has been updated.",
        variant: "default",
      });
    });
    
    // Handle payment deleted
    const unsubscribePaymentDeleted = subscribe('payment_deleted', (data) => {
      setRealTimePayments(prev => {
        return prev.filter(payment => payment.id !== data.paymentId);
      });
      
      // Refetch to ensure we have the latest data
      refetchPayments();
      refetchInvoice(); // Invoice totals might have changed
      
      toast({
        title: "Payment Deleted",
        description: "A payment has been removed.",
        variant: "default",
      });
    });
    
    // Handle status changes
    const unsubscribeStatusChanged = subscribe('status_changed', (data) => {
      setRealTimeInvoice(prev => {
        if (!prev) return null;
        return { ...prev, status: data.status };
      });
      
      toast({
        title: "Status Changed",
        description: `Invoice status changed to ${data.status}.`,
        variant: "default",
      });
      
      // Refetch to ensure we have the latest data
      refetchInvoice();
    });
    
    // Clean up subscriptions
    return () => {
      unsubscribeInvoiceUpdate();
      unsubscribePaymentAdded();
      unsubscribePaymentUpdated();
      unsubscribePaymentDeleted();
      unsubscribeStatusChanged();
    };
  }, [invoiceId, subscribe, toast, refetchInvoice, refetchPayments]);
  
  // Function to manually refresh data
  const refresh = useCallback(() => {
    refetchInvoice();
    refetchPayments();
  }, [refetchInvoice, refetchPayments]);
  
  // Calculate totals and other derived data
  const totalPaid = realTimePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = realTimeInvoice ? realTimeInvoice.totalAmount - totalPaid : 0;
  const isPaid = balance <= 0;
  const isOverdue = realTimeInvoice ? 
    new Date(realTimeInvoice.dueDate) < new Date() && !isPaid : 
    false;
  
  return {
    invoice: realTimeInvoice,
    payments: realTimePayments,
    isLoading,
    error,
    refresh,
    totalPaid,
    balance,
    isPaid,
    isOverdue
  };
}