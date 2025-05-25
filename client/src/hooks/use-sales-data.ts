import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Order, OrderItem, Quotation, QuotationItem } from '@shared/schema';

// Orders
export const useOrders = () => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        console.log('Fetching orders...');
        const { data } = await axios.get('/api/orders');
        console.log('Orders fetched successfully:', data);
        return data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    }
  });
};

export const useOrder = (id: number) => {
  return useQuery<Order>({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/orders/${id}`);
      return data;
    },
    enabled: !!id
  });
};

export const useOrderItems = (orderId: number) => {
  return useQuery<OrderItem[]>({
    queryKey: ['orderItems', orderId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/orders/${orderId}/items`);
      return data;
    },
    enabled: !!orderId
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await axios.post('/api/orders', orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};

export const useUpdateOrder = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      const { data } = await axios.put(`/api/orders/${id}`, orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
    }
  });
};

export const useCreateOrderItem = (orderId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemData: Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await axios.post(`/api/orders/${orderId}/items`, itemData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderItems', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    }
  });
};

// Quotations
export const useQuotations = () => {
  return useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data } = await axios.get('/api/quotations');
      return data;
    }
  });
};

export const useQuotation = (id: number) => {
  return useQuery<Quotation>({
    queryKey: ['quotations', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/quotations/${id}`);
      return data;
    },
    enabled: !!id
  });
};

export const useQuotationItems = (quotationId: number) => {
  return useQuery<QuotationItem[]>({
    queryKey: ['quotationItems', quotationId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/quotations/${quotationId}/items`);
      return data;
    },
    enabled: !!quotationId
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt' | 'convertedToOrder' | 'convertedOrderId'>) => {
      const { data } = await axios.post('/api/quotations', quotationData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    }
  });
};

export const useUpdateQuotation = (id: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quotationData: Partial<Quotation>) => {
      const { data } = await axios.put(`/api/quotations/${id}`, quotationData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations', id] });
    }
  });
};

export const useCreateQuotationItem = (quotationId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemData: Omit<QuotationItem, 'id' | 'quotationId' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await axios.post(`/api/quotations/${quotationId}/items`, itemData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotationItems', quotationId] });
      queryClient.invalidateQueries({ queryKey: ['quotations', quotationId] });
    }
  });
};

export const useConvertQuotationToOrder = (quotationId: number) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`/api/quotations/${quotationId}/convert`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations', quotationId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};

// Sales Analytics
export const useSalesAnalytics = (orders: Order[] | undefined) => {
  if (!orders || orders.length === 0) {
    return {
      totalSales: 0,
      averageOrderValue: 0,
      salesByCategory: {},
      topCustomers: [],
      salesByDate: {},
      recentOrders: []
    };
  }

  // Calculate total sales
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  // Calculate average order value
  const averageOrderValue = totalSales / orders.length;
  
  // Group sales by category
  const salesByCategory = orders.reduce((acc, order) => {
    const category = order.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate top customers
  const customerSales = orders.reduce((acc, order) => {
    if (order.contactId) {
      acc[order.contactId] = (acc[order.contactId] || 0) + order.totalAmount;
    }
    return acc;
  }, {} as Record<number, number>);
  
  const topCustomers = Object.entries(customerSales)
    .map(([contactId, total]) => ({ contactId: parseInt(contactId), total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  
  // Group sales by date
  const salesByDate = orders.reduce((acc, order) => {
    const date = new Date(order.orderDate).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);
  
  // Get recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);
  
  return {
    totalSales,
    averageOrderValue,
    salesByCategory,
    topCustomers,
    salesByDate,
    recentOrders
  };
};

// Quotation Analytics
export const useQuotationAnalytics = (quotations: Quotation[] | undefined) => {
  if (!quotations || quotations.length === 0) {
    return {
      totalQuotations: 0,
      totalQuotationValue: 0,
      averageQuotationValue: 0,
      quotationsByStatus: {},
      recentQuotations: []
    };
  }

  // Calculate total quotations
  const totalQuotations = quotations.length;
  
  // Calculate total quotation value
  const totalQuotationValue = quotations.reduce((sum, quotation) => sum + quotation.totalAmount, 0);
  
  // Calculate average quotation value
  const averageQuotationValue = totalQuotationValue / totalQuotations;
  
  // Group quotations by status
  const quotationsByStatus = quotations.reduce((acc, quotation) => {
    const status = quotation.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get recent quotations
  const recentQuotations = [...quotations]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);
  
  return {
    totalQuotations,
    totalQuotationValue,
    averageQuotationValue,
    quotationsByStatus,
    recentQuotations
  };
};