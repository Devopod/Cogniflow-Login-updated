import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Account, AccountGroup } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Hook to fetch all accounts
export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/accounts");
      return response.json();
    },
  });
}

// Hook to fetch account groups
export function useAccountGroups() {
  return useQuery<AccountGroup[]>({
    queryKey: ["/api/accounts/groups"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/accounts/groups");
      return response.json();
    },
  });
}

// Hook to fetch a single account by ID
export function useAccount(id: number | string | null) {
  return useQuery<Account>({
    queryKey: ["/api/accounts", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/accounts/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook to create a new account
export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newAccount: Partial<Account>) => {
      const response = await apiRequest("POST", "/api/accounts", newAccount);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
    },
  });
}

// Hook to update an account
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Account>) => {
      const response = await apiRequest("PUT", `/api/accounts/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
    },
  });
}

// Hook to delete an account
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/accounts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
    },
  });
}

// Hook to create account group
export function useCreateAccountGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newGroup: Partial<AccountGroup>) => {
      const response = await apiRequest("POST", "/api/accounts/groups", newGroup);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
  });
}

// Hook to update account group
export function useUpdateAccountGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<AccountGroup>) => {
      const response = await apiRequest("PUT", `/api/accounts/groups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
  });
}

// Hook to get account balance history
export function useAccountBalance(accountId: number | string | null, dateRange?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["/api/accounts", accountId, "balance", dateRange],
    queryFn: async () => {
      if (!accountId) return null;
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from);
      if (dateRange?.to) params.append('to', dateRange.to);
      
      const url = `/api/accounts/${accountId}/balance${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: !!accountId,
  });
}

// Hook to get account transactions
export function useAccountTransactions(accountId: number | string | null, limit = 50) {
  return useQuery({
    queryKey: ["/api/accounts", accountId, "transactions", limit],
    queryFn: async () => {
      if (!accountId) return [];
      const response = await apiRequest("GET", `/api/accounts/${accountId}/transactions?limit=${limit}`);
      return response.json();
    },
    enabled: !!accountId,
  });
}

// Hook to reconcile account
export function useReconcileAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      accountId, 
      statementBalance, 
      reconciliationDate,
      clearedTransactions 
    }: {
      accountId: number;
      statementBalance: number;
      reconciliationDate: string;
      clearedTransactions: number[];
    }) => {
      const response = await apiRequest("POST", `/api/accounts/${accountId}/reconcile`, {
        statement_balance: statementBalance,
        reconciliation_date: reconciliationDate,
        cleared_transactions: clearedTransactions,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", variables.accountId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
  });
}