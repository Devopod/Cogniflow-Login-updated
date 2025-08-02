import { useState, useEffect, useCallback } from 'react';
import { WebSocketClient } from '../lib/websocket';

// Base API configuration
const API_BASE_URL = '/api';

// Generic API hook for CRUD operations with real-time updates
export function useApi<T = any>(
  endpoint: string,
  options: {
    auto?: boolean;
    websocket?: {
      resourceType: string;
      resourceId?: string | number;
    };
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  // WebSocket client for real-time updates
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);

  // Initialize WebSocket connection if configured
  useEffect(() => {
    if (options.websocket) {
      const client = new WebSocketClient(
        options.websocket.resourceType,
        options.websocket.resourceId || 'all'
      );
      
      // Set up event listeners for real-time updates using the client's on method
      const unsubscribe = client.on('*', (message) => {
        handleRealtimeUpdate(message);
      });
      
      // Connect to the WebSocket server
      client.connect().catch(error => {
        console.warn('Failed to connect to WebSocket:', error);
        // Continue without WebSocket - the app should still work
      });
      
      setWsClient(client);
      
      return () => {
        unsubscribe();
        client.disconnect();
      };
    }
  }, [options.websocket?.resourceType, options.websocket?.resourceId]);

  // Handle real-time updates from WebSocket
  const handleRealtimeUpdate = useCallback((message: any) => {
    const { type, data: updateData } = message;
    
    switch (type) {
      case 'created':
      case 'contact_created':
      case 'deal_created':
      case 'product_created':
      case 'employee_created':
      case 'supplier_created':
        setData(prev => [updateData, ...prev]);
        break;
        
      case 'updated':
      case 'contact_updated':
      case 'deal_updated':
      case 'product_updated':
      case 'employee_updated':
      case 'supplier_updated':
        setData(prev => 
          prev.map(item => 
            item.id === updateData.id ? { ...item, ...updateData } : item
          )
        );
        break;
        
      case 'deleted':
      case 'contact_deleted':
      case 'deal_deleted':
      case 'product_deleted':
      case 'employee_deleted':
      case 'supplier_deleted':
        setData(prev => 
          prev.filter(item => item.id !== updateData.id)
        );
        break;
        
      case 'stock_adjusted':
      case 'stock_transferred':
        // Refresh inventory data when stock changes
        if (endpoint.includes('inventory') || endpoint.includes('stock')) {
          fetchData();
        }
        break;
        
      case 'connection_established':
        // WebSocket connection confirmation - no action needed
        console.log('WebSocket connection established for:', endpoint);
        break;
        
      default:
        console.log('Unhandled real-time update:', type, updateData);
    }
  }, [endpoint]);

  // Generic fetch function
  const fetchData = useCallback(async (params: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle different response formats
      if (Array.isArray(result)) {
        setData(result);
      } else if (result.data || result.items) {
        setData(result.data || result.items);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        setData([result]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Create function
  const create = useCallback(async (itemData: Partial<T>) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newItem = await response.json();
      
      // Update local state immediately (optimistic update)
      setData(prev => [newItem, ...prev]);
      
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  }, [endpoint]);

  // Update function
  const update = useCallback(async (id: string | number, itemData: Partial<T>) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedItem = await response.json();
      
      // Update local state
      setData(prev => 
        prev.map(item => 
          (item as any).id === id ? { ...item, ...updatedItem } : item
        )
      );
      
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  }, [endpoint]);

  // Delete function
  const remove = useCallback(async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state
      setData(prev => prev.filter(item => (item as any).id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [endpoint]);

  // Fetch data on mount if auto is enabled
  useEffect(() => {
    if (options.auto !== false) {
      fetchData();
    }
  }, [fetchData, options.auto]);

  return {
    data,
    loading,
    error,
    pagination,
    fetchData,
    create,
    update,
    remove,
    wsClient,
    setData, // Allow manual data updates
    setError, // Allow manual error clearing
  };
}

// Specialized hooks for each module
export function useCrmApi() {
  return {
    dashboard: useApi('/crm/dashboard', { websocket: { resourceType: 'crm', resourceId: 'dashboard' } }),
    contacts: useApi('/crm/contacts', { websocket: { resourceType: 'crm', resourceId: 'contacts' } }),
    deals: useApi('/crm/deals', { websocket: { resourceType: 'crm', resourceId: 'deals' } }),
    analytics: {
      leads: useApi('/crm/analytics/leads', { websocket: { resourceType: 'crm', resourceId: 'analytics' } }),
      pipeline: useApi('/crm/analytics/pipeline', { websocket: { resourceType: 'crm', resourceId: 'analytics' } }),
    },
    tasks: useApi('/crm/tasks/upcoming', { websocket: { resourceType: 'crm', resourceId: 'tasks' } }),
    activities: useApi('/crm/activities/recent', { websocket: { resourceType: 'crm', resourceId: 'activities' } }),
  };
}

export function useInventoryApi() {
  return {
    dashboard: useApi('/inventory/dashboard', { websocket: { resourceType: 'inventory', resourceId: 'dashboard' } }),
    products: useApi('/inventory/products', { websocket: { resourceType: 'inventory', resourceId: 'products' } }),
    warehouses: useApi('/inventory/warehouses', { websocket: { resourceType: 'inventory', resourceId: 'warehouses' } }),
    stock: useApi('/inventory/stock', { websocket: { resourceType: 'inventory', resourceId: 'stock' } }),
    transactions: useApi('/inventory/transactions', { websocket: { resourceType: 'inventory', resourceId: 'transactions' } }),
    alerts: {
      lowStock: useApi('/inventory/alerts/low-stock', { websocket: { resourceType: 'inventory', resourceId: 'alerts' } }),
      expiring: useApi('/inventory/alerts/expiring', { websocket: { resourceType: 'inventory', resourceId: 'alerts' } }),
    },
    reports: {
      value: useApi('/inventory/reports/value', { auto: false }),
    },
  };
}

export function useHrmsApi() {
  return {
    dashboard: useApi('/hrms/dashboard', { websocket: { resourceType: 'hrms', resourceId: 'dashboard' } }),
    employees: useApi('/hrms/employees', { websocket: { resourceType: 'hrms', resourceId: 'employees' } }),
    departments: useApi('/hrms/departments', { websocket: { resourceType: 'hrms', resourceId: 'departments' } }),
    positions: useApi('/hrms/positions', { websocket: { resourceType: 'hrms', resourceId: 'positions' } }),
    attendance: useApi('/hrms/attendance', { websocket: { resourceType: 'hrms', resourceId: 'attendance' } }),
    leaveTypes: useApi('/hrms/leave-types'),
    leaveRequests: useApi('/hrms/leave-requests', { websocket: { resourceType: 'hrms', resourceId: 'leave-requests' } }),
    payroll: useApi('/hrms/payroll', { websocket: { resourceType: 'hrms', resourceId: 'payroll' } }),
  };
}

export function usePurchaseApi() {
  return {
    dashboard: useApi('/purchase/dashboard', { websocket: { resourceType: 'purchase', resourceId: 'dashboard' } }),
    suppliers: useApi('/purchase/suppliers', { websocket: { resourceType: 'purchase', resourceId: 'suppliers' } }),
    requests: useApi('/purchase/requests', { websocket: { resourceType: 'purchase', resourceId: 'requests' } }),
    orders: useApi('/purchase/orders', { websocket: { resourceType: 'purchase', resourceId: 'orders' } }),
    analytics: {
      topSuppliers: useApi('/purchase/analytics/top-suppliers', { auto: false }),
      trends: useApi('/purchase/analytics/trends', { auto: false }),
      categorySum: useApi('/purchase/analytics/category-summary', { auto: false }),
    },
  };
}

// Helper function for custom API calls
export async function apiCall(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', data, params } = options;
  
  const queryParams = params ? new URLSearchParams(params).toString() : '';
  const url = `${API_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}