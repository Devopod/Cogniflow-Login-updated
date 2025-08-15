import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Payment {
  id: number;
  userId: number;
  contactId?: number;
  invoiceId?: number;
  paymentNumber: string;
  amount: number;
  payment_method: string;
  payment_gateway?: string;
  transaction_id?: string;
  paymentDate: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  reference?: string;
  description?: string;
  contact?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  invoice?: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface PaymentMetrics {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  avgTransactionValue: number;
  pendingTransactions: number;
  failedTransactions: number;
  mpesaTransactions: number;
  stripeTransactions: number;
}

interface GatewayPerformance {
  gateway: string;
  successRate: number;
  avgProcessingTime: number;
  dailyVolume: number;
}

interface PaymentMethod {
  method: string;
  percentage: number;
  lastMonth: number;
  growth: number;
}

// Custom hook for fetching payments with filters
export function usePayments(params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  gateway?: string;
  contactId?: number;
  invoiceId?: number;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
  if (params?.gateway) queryParams.append('gateway', params.gateway);
  if (params?.contactId) queryParams.append('contactId', params.contactId.toString());
  if (params?.invoiceId) queryParams.append('invoiceId', params.invoiceId.toString());
  if (params?.minAmount) queryParams.append('minAmount', params.minAmount.toString());
  if (params?.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  return useQuery<PaymentsResponse>({
    queryKey: ["payments", params],
    queryFn: async () => {
      const response = await fetch(`/api/payments?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      
      return response.json();
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
  });
}

// Custom hook for fetching a single payment
export function usePayment(id: number) {
  return useQuery<Payment & { 
    history_entries?: Array<{
      event_type: string;
      event_timestamp: string;
      details: any;
    }> 
  }>({
    queryKey: ["payments", id],
    queryFn: async () => {
      const response = await fetch(`/api/payments/${id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment");
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

// Custom hook for payment metrics
export function usePaymentMetrics() {
  return useQuery<PaymentMetrics>({
    queryKey: ["payments", "metrics"],
    queryFn: async () => {
      const response = await fetch("/api/payments", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment metrics");
      }
      
      const data = await response.json();
      
      // Calculate metrics from payments data
      const payments = data.payments;
      const totalTransactions = payments.length;
      const totalVolume = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
      const completedPayments = payments.filter((p: Payment) => p.status === 'completed');
      const successRate = totalTransactions > 0 ? completedPayments.length / totalTransactions : 0;
      const avgTransactionValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
      const pendingTransactions = payments.filter((p: Payment) => p.status === 'pending').length;
      const failedTransactions = payments.filter((p: Payment) => p.status === 'failed').length;
      const mpesaTransactions = payments.filter((p: Payment) => p.payment_gateway === 'MPESA').length;
      const stripeTransactions = payments.filter((p: Payment) => p.payment_gateway === 'Stripe').length;

      return {
        totalTransactions,
        totalVolume,
        successRate,
        avgTransactionValue,
        pendingTransactions,
        failedTransactions,
        mpesaTransactions,
        stripeTransactions,
      };
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Custom hook for gateway performance
export function useGatewayPerformance() {
  return useQuery<GatewayPerformance[]>({
    queryKey: ["payments", "gateway-performance"],
    queryFn: async () => {
      const response = await fetch("/api/payments", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch gateway performance");
      }
      
      const data = await response.json();
      const payments = data.payments;

      // Group by gateway and calculate metrics
      const gatewayData = payments.reduce((acc: any, payment: Payment) => {
        const gateway = payment.payment_gateway || 'Unknown';
        if (!acc[gateway]) {
          acc[gateway] = {
            gateway,
            total: 0,
            successful: 0,
            totalAmount: 0,
          };
        }
        
        acc[gateway].total++;
        acc[gateway].totalAmount += payment.amount;
        
        if (payment.status === 'completed') {
          acc[gateway].successful++;
        }
        
        return acc;
      }, {});

      return Object.values(gatewayData).map((data: any) => ({
        gateway: data.gateway,
        successRate: data.total > 0 ? data.successful / data.total : 0,
        avgProcessingTime: Math.random() * 5 + 1, // Mock processing time
        dailyVolume: data.totalAmount,
      }));
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Custom hook for payment methods analysis
export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["payments", "methods"],
    queryFn: async () => {
      const response = await fetch("/api/payments", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods");
      }
      
      const data = await response.json();
      const payments = data.payments;
      const totalVolume = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);

      // Group by payment method
      const methodData = payments.reduce((acc: any, payment: Payment) => {
        const method = payment.payment_method;
        if (!acc[method]) {
          acc[method] = {
            method,
            totalAmount: 0,
          };
        }
        
        acc[method].totalAmount += payment.amount;
        
        return acc;
      }, {});

      return Object.values(methodData).map((data: any) => ({
        method: data.method,
        percentage: totalVolume > 0 ? (data.totalAmount / totalVolume) * 100 : 0,
        lastMonth: Math.random() * 100, // Mock last month data
        growth: (Math.random() - 0.5) * 10, // Mock growth data
      }));
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Custom hook for creating payments
export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      payment_method: string;
      payment_date?: string;
      reference?: string;
      description?: string;
      invoiceId?: number;
      contactId?: number;
      accountId?: number;
      payment_gateway?: string;
      transaction_id?: string;
      metadata?: any;
    }) => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payment");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch payments data
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      
      toast({
        title: "Payment Created",
        description: "Payment has been successfully recorded.",
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

// Custom hook for updating payments
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: number;
      amount?: number;
      payment_method?: string;
      payment_date?: string;
      reference?: string;
      description?: string;
      status?: string;
      payment_gateway?: string;
      transaction_id?: string;
      metadata?: any;
    }) => {
      const response = await fetch(`/api/payments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update payment");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch payments data
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments", variables.id] });
      
      toast({
        title: "Payment Updated",
        description: "Payment has been successfully updated.",
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

// Real-time WebSocket hook for payments
export function usePaymentsWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const setupWebSocket = () => {
      try {
        ws = new WebSocket(`ws://${window.location.host}/ws/payments/all`);
        
        ws.onopen = () => {
          console.log("Payments WebSocket connected");
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
              case 'payment_added':
              case 'payment_updated':
              case 'payment_status_changed':
                // Invalidate payments queries when payments change
                queryClient.invalidateQueries({ queryKey: ["payments"] });
                break;
            }
          } catch (error) {
            console.error("Error parsing payments WebSocket message:", error);
          }
        };
        
        ws.onclose = () => {
          console.log("Payments WebSocket disconnected, reconnecting...");
          reconnectTimer = setTimeout(setupWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error("Payments WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to create payments WebSocket:", error);
        reconnectTimer = setTimeout(setupWebSocket, 3000);
      }
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [queryClient]);

  // This hook doesn't return anything since it's just setting up a side effect
}