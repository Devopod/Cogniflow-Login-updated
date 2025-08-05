import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Comprehensive finance overview data
export interface FinanceOverviewData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  bankBalance: number;
  profitMargin: number;
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  averageCollectionPeriod: number;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: number;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    status: string;
    account: string;
  }>;
  cashFlowProjection: Array<{
    date: string;
    projected: number;
    actual?: number;
  }>;
}

// Hook to fetch comprehensive finance overview
export function useFinanceOverview(dateRange?: { from?: string; to?: string }) {
  return useQuery<FinanceOverviewData>({
    queryKey: ["/api/finance/overview", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from);
      if (dateRange?.to) params.append('to', dateRange.to);
      
      const url = `/api/finance/overview${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute for real-time data
  });
}

// Hook to fetch financial analytics
export function useFinanceAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: ["/api/finance/analytics", period],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/finance/analytics?period=${period}`);
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Hook to generate financial report
export function useGenerateFinancialReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      reportType,
      dateFrom,
      dateTo,
      format = 'pdf'
    }: {
      reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'general_ledger';
      dateFrom: string;
      dateTo: string;
      format?: 'pdf' | 'excel' | 'csv';
    }) => {
      const response = await apiRequest("POST", "/api/finance/reports/generate", {
        report_type: reportType,
        date_from: dateFrom,
        date_to: dateTo,
        format: format,
      });
      
      if (format === 'pdf') {
        // Handle PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportType}_${dateFrom}_to_${dateTo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true, type: 'download' };
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/reports"] });
    },
  });
}

// Hook to fetch saved reports
export function useFinancialReports() {
  return useQuery({
    queryKey: ["/api/finance/reports"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/finance/reports");
      return response.json();
    },
  });
}

// Hook to create journal entry
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (journalEntry: {
      description: string;
      reference?: string;
      entries: Array<{
        accountId: number;
        debit?: number;
        credit?: number;
        description?: string;
      }>;
    }) => {
      const response = await apiRequest("POST", "/api/finance/journal-entries", journalEntry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
    },
  });
}

// Hook to fetch journal entries
export function useJournalEntries(filters?: {
  startDate?: string;
  endDate?: string;
  accountId?: number;
}) {
  return useQuery({
    queryKey: ["/api/finance/journal-entries", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.accountId) params.append('accountId', filters.accountId.toString());
      
      const url = `/api/finance/journal-entries${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

// Hook to close fiscal period
export function useCloseFiscalPeriod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ periodId, closingEntries }: {
      periodId: number;
      closingEntries?: Array<{
        accountId: number;
        amount: number;
        type: 'debit' | 'credit';
      }>;
    }) => {
      const response = await apiRequest("POST", `/api/finance/fiscal-periods/${periodId}/close`, {
        closing_entries: closingEntries,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/fiscal-periods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/overview"] });
    },
  });
}

// Hook to get budget vs actual data
export function useBudgetVsActual(budgetId?: number, dateRange?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["/api/finance/budget-vs-actual", budgetId, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (budgetId) params.append('budgetId', budgetId.toString());
      if (dateRange?.from) params.append('from', dateRange.from);
      if (dateRange?.to) params.append('to', dateRange.to);
      
      const url = `/api/finance/budget-vs-actual${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

// Hook to get cash flow forecast
export function useCashFlowForecast(months = 12) {
  return useQuery({
    queryKey: ["/api/finance/cash-flow-forecast", months],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/finance/cash-flow-forecast?months=${months}`);
      return response.json();
    },
    refetchInterval: 1800000, // Refetch every 30 minutes
  });
}

// Hook to get financial health score
export function useFinancialHealthScore() {
  return useQuery({
    queryKey: ["/api/finance/health-score"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/finance/health-score");
      return response.json();
    },
    refetchInterval: 3600000, // Refetch every hour
  });
}

// Hook to export financial data
export function useExportFinancialData() {
  return useMutation({
    mutationFn: async ({
      dataType,
      format,
      dateRange,
      filters
    }: {
      dataType: 'accounts' | 'transactions' | 'expenses' | 'invoices' | 'all';
      format: 'csv' | 'excel' | 'pdf';
      dateRange?: { from: string; to: string };
      filters?: Record<string, any>;
    }) => {
      const response = await apiRequest("POST", "/api/finance/export", {
        data_type: dataType,
        format: format,
        date_range: dateRange,
        filters: filters,
      });
      
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance_export_${dataType}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
}