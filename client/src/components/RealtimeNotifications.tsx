import React, { useEffect, useState } from 'react';
import { WebSocketClient } from '../lib/websocket';
import { useToast } from '../hooks/use-toast';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  module: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export default function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create WebSocket client for global notifications
    const client = new WebSocketClient('global', 'notifications');
    
    // Subscribe to all message types using the client's on method
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
  }, []);

  const handleRealtimeUpdate = (message: any) => {
    const { type, data } = message;
    
    let notification: Notification | null = null;
    
    switch (type) {
      case 'contact_created':
        notification = {
          id: `contact_${data.id}_${Date.now()}`,
          type: 'success',
          title: 'New Contact Added',
          message: `${data.firstName} ${data.lastName} has been added to CRM`,
          timestamp: new Date(),
          module: 'CRM',
          read: false,
          action: {
            label: 'View Contact',
            url: `/crm/contacts/${data.id}`
          }
        };
        break;
        
      case 'deal_updated':
        notification = {
          id: `deal_${data.id}_${Date.now()}`,
          type: 'info',
          title: 'Deal Updated',
          message: `Deal "${data.title}" has been updated`,
          timestamp: new Date(),
          module: 'CRM',
          read: false,
          action: {
            label: 'View Deal',
            url: `/crm/deals/${data.id}`
          }
        };
        break;
        
      case 'stock_adjusted':
        notification = {
          id: `stock_${data.inventory.id}_${Date.now()}`,
          type: 'warning',
          title: 'Stock Adjustment',
          message: `Inventory levels have been ${data.type}d for a product`,
          timestamp: new Date(),
          module: 'Inventory',
          read: false,
          action: {
            label: 'View Inventory',
            url: '/inventory/stock'
          }
        };
        break;
        
      case 'low_stock_alert':
        notification = {
          id: `low_stock_${data.productId}_${Date.now()}`,
          type: 'error',
          title: 'Low Stock Alert',
          message: `${data.productName} is running low on stock`,
          timestamp: new Date(),
          module: 'Inventory',
          read: false,
          action: {
            label: 'Reorder Product',
            url: `/inventory/products/${data.productId}`
          }
        };
        break;
        
      case 'employee_created':
        notification = {
          id: `employee_${data.id}_${Date.now()}`,
          type: 'success',
          title: 'New Employee Added',
          message: `${data.firstName} ${data.lastName} has joined the team`,
          timestamp: new Date(),
          module: 'HRMS',
          read: false,
          action: {
            label: 'View Profile',
            url: `/hrms/employees/${data.id}`
          }
        };
        break;
        
      case 'leave_request_created':
        notification = {
          id: `leave_${data.id}_${Date.now()}`,
          type: 'info',
          title: 'Leave Request Submitted',
          message: `A new leave request requires approval`,
          timestamp: new Date(),
          module: 'HRMS',
          read: false,
          action: {
            label: 'Review Request',
            url: `/hrms/leave-requests/${data.id}`
          }
        };
        break;
        
      case 'order_status_updated':
        notification = {
          id: `order_${data.id}_${Date.now()}`,
          type: data.status === 'delivered' ? 'success' : 'info',
          title: 'Purchase Order Updated',
          message: `Order ${data.orderNumber} status changed to ${data.status}`,
          timestamp: new Date(),
          module: 'Purchase',
          read: false,
          action: {
            label: 'View Order',
            url: `/purchase/orders/${data.id}`
          }
        };
        break;
        
      case 'payment_received':
        notification = {
          id: `payment_${data.id}_${Date.now()}`,
          type: 'success',
          title: 'Payment Received',
          message: `Payment of $${data.amount} has been processed`,
          timestamp: new Date(),
          module: 'Payments',
          read: false,
          action: {
            label: 'View Payment',
            url: `/payments/${data.id}`
          }
        };
        break;
    }
    
    if (notification) {
      setNotifications(prev => [notification!, ...prev].slice(0, 50)); // Keep only latest 50
      
      // Show toast notification for important updates
      if (notification.type === 'error' || notification.type === 'success') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        });
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-hidden bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getTypeColor(notification.type)}`}
                          >
                            {notification.module}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          <div className="flex gap-2">
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6"
                                onClick={() => {
                                  markAsRead(notification.id);
                                  // Navigate to the action URL
                                  window.location.href = notification.action!.url;
                                }}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}