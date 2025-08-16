import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketHookOptions {
  resource: string;
  resourceId?: string | number;
  onMessage?: (message: any) => void;
  invalidateQueries?: string[][];
}

export const useWebSocket = ({ 
  resource, 
  resourceId = 'all', 
  onMessage,
  invalidateQueries = []
}: WebSocketHookOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/${resource}/${resourceId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected to ${resource}/${resourceId}`);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`WebSocket message received for ${resource}:`, message);
        
        // Call custom message handler if provided
        if (onMessage) {
          onMessage(message);
        }
        
        // Invalidate specified queries
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${resource}/${resourceId}:`, error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected from ${resource}/${resourceId}`);
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', () => ws.close(), { once: true });
      } else {
        ws.close();
      }
    };
  }, [resource, resourceId, queryClient]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage, isConnected };
};

// Specific hook for sales real-time updates
export const useSalesWebSocket = () => {
  const queryClient = useQueryClient();
  
  return useWebSocket({
    resource: 'orders',
    resourceId: 'all',
    onMessage: (message) => {
      // Handle sales-specific messages
      switch (message.type) {
        case 'new_order':
        case 'order_created':
        case 'order_updated':
        case 'order_deleted':
        case 'order_item_created':
          // Invalidate all sales-related queries
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['salesMetrics'] });
          queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
          queryClient.invalidateQueries({ queryKey: ['salesData'] });
          queryClient.invalidateQueries({ queryKey: ['topCustomers'] });
          queryClient.invalidateQueries({ queryKey: ['salesByCategory'] });
          break;
        case 'sales_metrics_updated':
          // Invalidate analytics-related queries
          queryClient.invalidateQueries({ queryKey: ['salesMetrics'] });
          queryClient.invalidateQueries({ queryKey: ['salesData'] });
          queryClient.invalidateQueries({ queryKey: ['topCustomers'] });
          queryClient.invalidateQueries({ queryKey: ['salesByCategory'] });
          break;
      }
    }
  });
};

// Specific hook for dashboard real-time updates
export const useDashboardWebSocket = () => {
  const queryClient = useQueryClient();
  
  return useWebSocket({
    resource: 'dashboard',
    resourceId: 'all',
    onMessage: (message) => {
      // Handle dashboard-specific messages
      switch (message.type) {
        case 'new_order':
        case 'order_created':
        case 'order_updated':
        case 'order_deleted':
        case 'dashboard_updated':
          // Invalidate dashboard data that depends on orders
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['quotations'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          break;
        case 'sales_metrics_updated':
          // Refresh sales analytics on dashboard
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          break;
        case 'inventory_updated':
          queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
          break;
        case 'leave_updated':
          queryClient.invalidateQueries({ queryKey: ['upcomingLeaves'] });
          break;
        case 'finance_updated':
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['financeCards'] });
          break;
      }
    }
  });
};