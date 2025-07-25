import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Invoice, InvoiceWithItems, Payment, InvoiceActivity, PaymentLink } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Hook to fetch all invoices
export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/invoices");
      return response.json();
    },
  });
}

// Hook to fetch a single invoice by ID
export function useInvoice(id: number | string | null) {
  return useQuery<InvoiceWithItems>({
    queryKey: ["/api/invoices", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        console.log(`Fetching invoice with ID: ${id}`);
        const response = await apiRequest("GET", `/api/invoices/${id}`);
        const data = await response.json();
        console.log(`Received invoice data:`, data);
        return data;
      } catch (error) {
        console.error(`Error fetching invoice ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 2,
    retryDelay: 1000,
  });
}

// Hook to create a new invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newInvoice: Partial<Invoice>) => {
      const response = await apiRequest("POST", "/api/invoices", newInvoice);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Hook to update an invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Invoice>) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", variables.id] });
    },
  });
}

// Hook to delete an invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/invoices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Hook to fetch invoice activities/history
export function useInvoiceActivities(invoiceId: number | string | null) {
  return useQuery<InvoiceActivity[]>({
    queryKey: ["/api/invoices", invoiceId, "activities"],
    queryFn: async () => {
      if (!invoiceId) return [];
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}/activities`);
      return response.json();
    },
    enabled: !!invoiceId,
  });
}

// Hook to send invoice via email
export function useSendInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      templateId, 
      customMessage, 
      ccEmails, 
      includePDF = true 
    }: { 
      id: number; 
      templateId?: number; 
      customMessage?: string; 
      ccEmails?: string[]; 
      includePDF?: boolean;
    }) => {
      const response = await apiRequest("POST", `/api/invoices/${id}/send`, {
        templateId,
        customMessage,
        ccEmails,
        includePDF,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", variables.id, "activities"] });
    },
  });
}

// Hook to generate PDF
export function useGenerateInvoicePDF() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("GET", `/api/invoices/${id}/pdf`);
      
      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
}

// Hook to create payment intent
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      customAmount, 
      paymentMethodTypes,
      setupFutureUsage 
    }: {
      invoiceId: number;
      customAmount?: number;
      paymentMethodTypes?: string[];
      setupFutureUsage?: 'on_session' | 'off_session';
    }) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/payment-intent`, {
        custom_amount: customAmount,
        payment_method_types: paymentMethodTypes,
        setup_future_usage: setupFutureUsage,
      });
      return response.json();
    },
  });
}

// Hook to create payment link
export function useCreatePaymentLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      expiresInHours = 168, 
      maxUses, 
      customMessage 
    }: {
      invoiceId: number;
      expiresInHours?: number;
      maxUses?: number;
      customMessage?: string;
    }) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/payment-link`, {
        expires_in_hours: expiresInHours,
        max_uses: maxUses,
        custom_message: customMessage,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", variables.invoiceId] });
    },
  });
}

// Hook to set invoice as recurring
export function useSetInvoiceRecurring() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      frequency, 
      startDate, 
      endDate, 
      count 
    }: {
      invoiceId: number;
      frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      startDate: string;
      endDate?: string;
      count?: number;
    }) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/recurring`, {
        frequency,
        start_date: startDate,
        end_date: endDate,
        count,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/recurring"] });
    },
  });
}

// Hook to generate next recurring invoice
export function useGenerateNextRecurringInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/generate-next`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/recurring"] });
    },
  });
}

// Hook to clone/duplicate invoice
export function useCloneInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/clone`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Hook to send payment reminder
export function useSendPaymentReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      type = 'gentle' 
    }: {
      invoiceId: number;
      type?: 'gentle' | 'firm' | 'final';
    }) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/reminder`, {
        type,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", variables.invoiceId, "activities"] });
    },
  });
}

// Hook to fetch overdue invoices
export function useOverdueInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["/api/invoices/overdue"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/invoices/overdue");
      return response.json();
    },
  });
}

// Hook to fetch recurring invoices
export function useRecurringInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["/api/invoices/recurring"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/invoices/recurring");
      return response.json();
    },
  });
}

// Hook to fetch invoice statistics
export function useInvoiceStats(dateRange?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["/api/invoices/stats", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from);
      if (dateRange?.to) params.append('to', dateRange.to);
      
      const url = `/api/invoices/stats${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

// Hook to fetch payments for an invoice
export function useInvoicePayments(invoiceId: number | string | null) {
  return useQuery<Payment[]>({
    queryKey: ["/api/invoices", invoiceId, "payments"],
    queryFn: async () => {
      if (!invoiceId) return [];
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}/payments`);
      return response.json();
    },
    enabled: !!invoiceId,
  });
}

// Hook for real-time invoice updates
export function useInvoiceRealTime(invoiceId: number | string | null) {
  const queryClient = useQueryClient();
  
  // This would be implemented with your WebSocket hook
  // For now, it's a placeholder that polls for updates
  return useQuery({
    queryKey: ["/api/invoices", invoiceId, "realtime"],
    queryFn: async () => {
      if (!invoiceId) return null;
      // This would connect to WebSocket for real-time updates
      // For now, just return the current invoice
      const response = await apiRequest("GET", `/api/invoices/${invoiceId}`);
      return response.json();
    },
    enabled: !!invoiceId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    onSuccess: (data) => {
      if (data) {
        // Update the main invoice query cache
        queryClient.setQueryData(["/api/invoices", invoiceId], data);
      }
    },
  });
}

// Composite hook for managing invoice workflow
export function useInvoiceWorkflow(invoiceId: number | string | null) {
  const invoice = useInvoice(invoiceId);
  const activities = useInvoiceActivities(invoiceId);
  const payments = useInvoicePayments(invoiceId);
  const updateInvoice = useUpdateInvoice();
  const sendInvoice = useSendInvoice();
  const generatePDF = useGenerateInvoicePDF();
  const createPaymentIntent = useCreatePaymentIntent();
  const sendReminder = useSendPaymentReminder();
  
  const markAsSent = async () => {
    if (!invoiceId) return;
    return updateInvoice.mutateAsync({ 
      id: Number(invoiceId), 
      status: 'sent' 
    });
  };
  
  const markAsPaid = async (amount?: number) => {
    if (!invoiceId || !invoice.data) return;
    return updateInvoice.mutateAsync({ 
      id: Number(invoiceId), 
      payment_status: 'Paid',
      amountPaid: amount || invoice.data.totalAmount,
    });
  };
  
  return {
    invoice: invoice.data,
    activities: activities.data || [],
    payments: payments.data || [],
    isLoading: invoice.isLoading || activities.isLoading || payments.isLoading,
    error: invoice.error || activities.error || payments.error,
    actions: {
      update: updateInvoice.mutateAsync,
      send: sendInvoice.mutateAsync,
      generatePDF: () => generatePDF.mutateAsync(Number(invoiceId)),
      createPaymentIntent: createPaymentIntent.mutateAsync,
      sendReminder: sendReminder.mutateAsync,
      markAsSent,
      markAsPaid,
    },
    isUpdating: updateInvoice.isPending || sendInvoice.isPending,
  };
}