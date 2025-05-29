import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Payment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Hook to fetch all payments
export function usePayments() {
  return useQuery<Payment[]>({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/payments");
      return response.json();
    },
  });
}

// Hook to fetch a single payment by ID
export function usePayment(id: number | string | null) {
  return useQuery<Payment>({
    queryKey: ["/api/payments", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/payments/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook to create a new payment
export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPayment: Partial<Payment>) => {
      const response = await apiRequest("POST", "/api/payments", newPayment);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      // Also invalidate invoices since payment status might change
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Hook to update a payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Payment>) => {
      const response = await apiRequest("PUT", `/api/payments/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments", variables.id] });
      // Also invalidate invoices since payment status might change
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Hook to delete a payment
export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/payments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      // Also invalidate invoices since payment status might change
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Hook to fetch payments for a specific invoice
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