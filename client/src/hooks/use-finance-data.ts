import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
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
  return useQuery<Invoice>({
    queryKey: ["/api/invoices", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/invoices/${id}`);
      return response.json();
    },
    enabled: !!id,
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