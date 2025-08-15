import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ReportOverview {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

interface PaymentMetrics {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
}

interface TopProduct {
  productName: string;
  totalSales: number;
  totalRevenue: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  invoiceCount: number;
}

interface DashboardData {
  salesMetrics: ReportOverview;
  paymentMetrics: PaymentMetrics;
  topProducts: TopProduct[];
  monthlyTrend: MonthlyTrend[];
  generatedAt: string;
}

interface PaymentsByGateway {
  gateway: string;
  totalAmount: number;
  totalPayments: number;
  successRate: number;
}

interface PaymentsByMethod {
  method: string;
  totalAmount: number;
  totalPayments: number;
  percentage: number;
}

interface PaymentTrend {
  period: string;
  totalAmount: number;
  totalPayments: number;
  successfulPayments: number;
}

interface PaymentReportsData {
  overview: PaymentMetrics & {
    successRate: number;
    averageAmount: number;
  };
  paymentsByGateway: PaymentsByGateway[];
  paymentsByMethod: PaymentsByMethod[];
  paymentTrends: PaymentTrend[];
  generatedAt: string;
}

interface SalesReportsData {
  overview: ReportOverview & {
    averageInvoiceValue: number;
    paidAmount: number;
  };
  salesByPeriod: Array<{
    period: string;
    revenue: number;
    invoiceCount: number;
    paidAmount: number;
  }>;
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    customerEmail: string;
    totalRevenue: number;
    totalInvoices: number;
  }>;
  generatedAt: string;
}

interface FinancialReportsData {
  reportType: string;
  period: {
    from: Date;
    to: Date;
  };
  data: {
    revenue?: number;
    expenses?: number;
    netProfit?: number;
    profitMargin?: string;
    inflows?: number;
    outflows?: number;
    netCashFlow?: number;
  };
  generatedAt: string;
}

interface SavedReport {
  id: number;
  reportType: string;
  name: string;
  generatedAt: string;
  parameters: Record<string, any>;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
}

interface AllReportsData {
  savedReports: SavedReport[];
  templates: ReportTemplate[];
  categories: Array<{
    name: string;
    count: number;
  }>;
  stats: {
    totalReports: number;
    generatedThisMonth: number;
  };
}

// Custom hook for dashboard analytics
export function useReportsDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["reports", "dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/reports/dashboard", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

// Custom hook for payment reports
export function usePaymentReports(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  gateway?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.groupBy) queryParams.append('groupBy', params.groupBy);
  if (params?.gateway) queryParams.append('gateway', params.gateway);
  if (params?.status) queryParams.append('status', params.status);

  return useQuery<PaymentReportsData>({
    queryKey: ["reports", "payments", params],
    queryFn: async () => {
      const response = await fetch(`/api/reports/payments?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment reports");
      }
      
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Custom hook for sales reports
export function useSalesReports(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  contactId?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.groupBy) queryParams.append('groupBy', params.groupBy);
  if (params?.contactId) queryParams.append('contactId', params.contactId);
  if (params?.status) queryParams.append('status', params.status);

  return useQuery<SalesReportsData>({
    queryKey: ["reports", "sales", params],
    queryFn: async () => {
      const response = await fetch(`/api/reports/sales?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch sales reports");
      }
      
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Custom hook for financial reports
export function useFinancialReports(params?: {
  startDate?: string;
  endDate?: string;
  reportType?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.reportType) queryParams.append('reportType', params.reportType);

  return useQuery<FinancialReportsData>({
    queryKey: ["reports", "financial", params],
    queryFn: async () => {
      const response = await fetch(`/api/reports/financial?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch financial reports");
      }
      
      return response.json();
    },
    enabled: !!params?.reportType, // Only run if report type is specified
  });
}

// Custom hook for all reports data
export function useAllReports() {
  return useQuery<AllReportsData>({
    queryKey: ["reports", "all"],
    queryFn: async () => {
      const response = await fetch("/api/reports", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      
      return response.json();
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

// Custom hook for generating reports
export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      reportType: string;
      name: string;
      parameters?: Record<string, any>;
    }) => {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch reports data
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      
      toast({
        title: "Report Generated",
        description: `${data.report.name} has been generated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Real-time updates hook
export function useReportsWebSocket() {
  const queryClient = useQueryClient();

  // Set up WebSocket connection for real-time updates
  const setupWebSocket = () => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/reports/all`);
    
    ws.onopen = () => {
      console.log("Reports WebSocket connected");
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'report_generated':
            // Invalidate reports queries when a new report is generated
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            break;
          case 'data_updated':
            // Invalidate specific report queries when underlying data changes
            queryClient.invalidateQueries({ queryKey: ["reports", "dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["reports", "payments"] });
            queryClient.invalidateQueries({ queryKey: ["reports", "sales"] });
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onclose = () => {
      console.log("Reports WebSocket disconnected, reconnecting...");
      // Reconnect after 3 seconds
      setTimeout(setupWebSocket, 3000);
    };
    
    return ws;
  };

  // Initialize WebSocket connection
  const ws = setupWebSocket();

  // Cleanup function
  return () => {
    ws.close();
  };
}