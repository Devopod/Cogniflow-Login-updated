import { useState, useEffect, useCallback } from 'react';
import { useInvoice } from './use-finance-data';
import { useInvoicePayments } from './use-payments';
import { Invoice, InvoiceWithItems, Payment } from '@shared/schema';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

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
  useWebSocket({ 
    resource: 'invoices', 
    resourceId: invoiceId || 'all',
    onMessage: (message) => {
      // Handle real-time updates here
      if (message.type === 'invoice_updated' && message.data.id === invoiceId) {
        setRealTimeInvoice(message.data);
        refetchInvoice();
      }
      if (message.type === 'payment_created' && message.data.relatedDocumentId === invoiceId) {
        refetchPayments();
      }
    },
    invalidateQueries: [['invoices'], ['payments']]
  });
  
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