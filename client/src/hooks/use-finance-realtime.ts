import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io, { Socket } from 'socket.io-client';

interface FinanceUpdate {
  type: 'expense_created' | 'expense_updated' | 'invoice_paid' | 'transaction_created' | 'account_updated';
  data: any;
  timestamp: string;
}

export function useFinanceRealtime() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<FinanceUpdate[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create socket connection
    const newSocket = io('/finance', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to finance real-time updates');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from finance real-time updates');
    });

    // Listen for finance updates
    newSocket.on('finance:update', (update: FinanceUpdate) => {
      setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
      
      // Invalidate relevant queries based on update type
      switch (update.type) {
        case 'expense_created':
        case 'expense_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/overview'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/analytics'] });
          break;
        case 'invoice_paid':
          queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/overview'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/analytics'] });
          break;
        case 'transaction_created':
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/overview'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/analytics'] });
          break;
        case 'account_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/finance/overview'] });
          break;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [queryClient]);

  const sendUpdate = (update: Omit<FinanceUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('finance:update', {
        ...update,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return {
    socket,
    isConnected,
    updates,
    sendUpdate,
  };
}