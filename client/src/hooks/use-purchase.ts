import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocket } from './use-websocket';
import { useEffect } from 'react';

// Purchase Dashboard Hooks
export function usePurchaseDashboard() {
  return useQuery({
    queryKey: ['purchase', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/purchase/dashboard');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Supplier Management Hooks
export function useSuppliers(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);

  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/suppliers?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/suppliers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplierData: any) => {
      const response = await api.post('/api/purchase/suppliers', supplierData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...supplierData }: any) => {
      const response = await api.put(`/api/purchase/suppliers/${id}`, supplierData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', data.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/purchase/suppliers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

// Purchase Request Hooks
export function usePurchaseRequests(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.department) params.append('department', filters.department);

  return useQuery({
    queryKey: ['purchase-requests', filters],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/requests?${params.toString()}`);
      return response.data;
    },
  });
}

export function usePurchaseRequest(id: number) {
  return useQuery({
    queryKey: ['purchase-requests', id],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/requests/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestData: any) => {
      const response = await api.post('/api/purchase/requests', requestData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

export function useUpdatePurchaseRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...requestData }: any) => {
      const response = await api.put(`/api/purchase/requests/${id}`, requestData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', data.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

export function useApprovePurchaseRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      const response = await api.put(`/api/purchase/requests/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', data.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

// Purchase Order Hooks
export function usePurchaseOrders(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  supplierId?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.supplierId) params.append('supplierId', filters.supplierId.toString());

  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/orders?${params.toString()}`);
      return response.data;
    },
  });
}

export function usePurchaseOrder(id: number) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/orders/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await api.post('/api/purchase/orders', orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...orderData }: any) => {
      const response = await api.put(`/api/purchase/orders/${id}`, orderData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await api.put(`/api/purchase/orders/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
    },
  });
}

// Purchase Order Items Hooks
export function usePurchaseOrderItems(orderId: number) {
  return useQuery({
    queryKey: ['purchase-order-items', orderId],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/orders/${orderId}/items`);
      return response.data;
    },
    enabled: !!orderId,
  });
}

// Real-time Purchase Updates Hook
export function usePurchaseRealtime() {
  const queryClient = useQueryClient();
  
  return useWebSocket({
    resource: 'purchase',
    resourceId: 'all',
    onMessage: (message) => {
      console.log('Purchase WebSocket message:', message);
      
      // Handle purchase-specific messages
      switch (message.type) {
        case 'supplier_created':
        case 'supplier_updated':
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
          break;
          
        case 'purchase_request_created':
        case 'purchase_request_approved':
        case 'purchase_request_rejected':
          queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
          queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
          if (message.data?.request?.id) {
            queryClient.invalidateQueries({ queryKey: ['purchase-requests', message.data.request.id] });
          }
          break;
          
        case 'purchase_order_created':
        case 'purchase_order_updated':
        case 'purchase_order_status_changed':
        case 'purchase_order_delivered':
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          queryClient.invalidateQueries({ queryKey: ['purchase', 'dashboard'] });
          if (message.data?.order?.id) {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders', message.data.order.id] });
          }
          // If delivered, also update inventory
          if (message.type === 'purchase_order_delivered') {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
          }
          break;
          
        case 'inventory_received':
        case 'stock_updated':
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          break;
          
        case 'purchase_metrics_updated':
          if (message.data?.metrics) {
            queryClient.setQueryData(['purchase', 'dashboard'], message.data.metrics);
          }
          break;
          
        case 'supplier_performance_updated':
          if (message.data?.supplierId) {
            queryClient.invalidateQueries({ queryKey: ['suppliers', message.data.supplierId] });
          }
          break;
      }
    }
  });
}

// Purchase Analytics Hooks
export function usePurchaseAnalytics(period?: number) {
  const params = new URLSearchParams();
  if (period) params.append('period', period.toString());

  return useQuery({
    queryKey: ['purchase', 'analytics', period],
    queryFn: async () => {
      const response = await api.get(`/api/purchase/analytics?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSupplierPerformance(supplierId?: number) {
  return useQuery({
    queryKey: ['purchase', 'supplier-performance', supplierId],
    queryFn: async () => {
      const url = supplierId 
        ? `/api/purchase/suppliers/${supplierId}/performance`
        : '/api/purchase/suppliers/performance';
      const response = await api.get(url);
      return response.data;
    },
  });
}