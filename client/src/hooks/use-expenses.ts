import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Expense } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Hook to fetch all expenses
export function useExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  status?: string;
}) {
  return useQuery<Expense[]>({
    queryKey: ["/api/expenses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters?.status) params.append('status', filters.status);
      
      const url = `/api/expenses${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

// Hook to fetch a single expense by ID
export function useExpense(id: number | string | null) {
  return useQuery<Expense>({
    queryKey: ["/api/expenses", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/expenses/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook to create a new expense
export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newExpense: Partial<Expense>) => {
      const response = await apiRequest("POST", "/api/expenses", newExpense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/analytics"] });
    },
  });
}

// Hook to update an expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Expense>) => {
      const response = await apiRequest("PUT", `/api/expenses/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/analytics"] });
    },
  });
}

// Hook to delete an expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/expenses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/analytics"] });
    },
  });
}

// Hook to approve an expense
export function useApproveExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/expenses/${id}/approve`, { notes });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", variables.id] });
    },
  });
}

// Hook to reject an expense
export function useRejectExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest("POST", `/api/expenses/${id}/reject`, { notes });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", variables.id] });
    },
  });
}

// Hook to fetch expense categories
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["/api/expenses/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/expenses/categories");
      return response.json();
    },
  });
}

// Hook to fetch expense statistics
export function useExpenseStats(dateRange?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["/api/expenses/stats", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from);
      if (dateRange?.to) params.append('to', dateRange.to);
      
      const url = `/api/expenses/stats${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

// Hook to fetch monthly expense trends
export function useExpenseTrends(months = 6) {
  return useQuery({
    queryKey: ["/api/expenses/trends", months],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/expenses/trends?months=${months}`);
      return response.json();
    },
  });
}

// Hook to upload expense receipt
export function useUploadExpenseReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ expenseId, file }: { expenseId: number; file: File }) => {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload receipt');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
  });
}