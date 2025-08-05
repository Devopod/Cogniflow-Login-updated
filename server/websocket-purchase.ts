import { WSService } from './websocket.js';

export interface PurchaseWebSocketData {
  // Purchase Orders
  purchase_order_created?: any;
  purchase_order_updated?: any; 
  purchase_order_status_changed?: any;
  purchase_order_delivered?: any;
  
  // Purchase Requests
  purchase_request_created?: any;
  purchase_request_updated?: any;
  purchase_request_approved?: any;
  purchase_request_rejected?: any;
  
  // Suppliers
  supplier_created?: any;
  supplier_updated?: any;
  supplier_status_changed?: any;
  
  // Inventory Updates from Purchases
  inventory_received?: any;
  stock_updated?: any;
  
  // Purchase Analytics
  purchase_metrics_updated?: any;
  supplier_performance_updated?: any;
}

export class PurchaseWebSocketService {
  constructor(private wsService: WSService) {}

  // Purchase Order Events
  broadcastPurchaseOrderCreated(userId: number, order: any) {
    this.wsService.broadcastToUser(userId, 'purchase_order_created', {
      message: `New purchase order ${order.orderNumber} created`,
      order,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'orders', 'purchase_order_created', {
      order,
      userId
    });
  }

  broadcastPurchaseOrderUpdated(userId: number, order: any) {
    this.wsService.broadcastToUser(userId, 'purchase_order_updated', {
      message: `Purchase order ${order.orderNumber} updated`,
      order,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'orders', 'purchase_order_updated', {
      order,
      userId
    });
  }

  broadcastPurchaseOrderStatusChanged(userId: number, order: any, oldStatus: string) {
    const message = this.getStatusChangeMessage(order.status, order.orderNumber);
    
    this.wsService.broadcastToUser(userId, 'purchase_order_status_changed', {
      message,
      order,
      oldStatus,
      newStatus: order.status,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'orders', 'purchase_order_status_changed', {
      order,
      oldStatus,
      newStatus: order.status,
      userId
    });
  }

  broadcastPurchaseOrderDelivered(userId: number, order: any, receivedItems: any[]) {
    this.wsService.broadcastToUser(userId, 'purchase_order_delivered', {
      message: `Purchase order ${order.orderNumber} has been delivered`,
      order,
      receivedItems,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'orders', 'purchase_order_delivered', {
      order,
      receivedItems,
      userId
    });
  }

  // Purchase Request Events
  broadcastPurchaseRequestCreated(userId: number, request: any) {
    this.wsService.broadcastToUser(userId, 'purchase_request_created', {
      message: `New purchase request ${request.requestNumber} created`,
      request,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'requests', 'purchase_request_created', {
      request,
      userId
    });
  }

  broadcastPurchaseRequestApproved(userId: number, request: any, approvedBy: any) {
    this.wsService.broadcastToUser(userId, 'purchase_request_approved', {
      message: `Purchase request ${request.requestNumber} has been approved`,
      request,
      approvedBy,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'requests', 'purchase_request_approved', {
      request,
      approvedBy,
      userId
    });
  }

  broadcastPurchaseRequestRejected(userId: number, request: any, rejectedBy: any) {
    this.wsService.broadcastToUser(userId, 'purchase_request_rejected', {
      message: `Purchase request ${request.requestNumber} has been rejected`,
      request,
      rejectedBy,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'requests', 'purchase_request_rejected', {
      request,
      rejectedBy,
      userId
    });
  }

  // Supplier Events
  broadcastSupplierCreated(userId: number, supplier: any) {
    this.wsService.broadcastToUser(userId, 'supplier_created', {
      message: `New supplier ${supplier.name} added`,
      supplier,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'suppliers', 'supplier_created', {
      supplier,
      userId
    });
  }

  broadcastSupplierUpdated(userId: number, supplier: any) {
    this.wsService.broadcastToUser(userId, 'supplier_updated', {
      message: `Supplier ${supplier.name} updated`,
      supplier,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('purchase', 'suppliers', 'supplier_updated', {
      supplier,
      userId
    });
  }

  // Inventory Integration Events
  broadcastInventoryReceived(userId: number, receivedItems: any[], order: any) {
    this.wsService.broadcastToUser(userId, 'inventory_received', {
      message: `Inventory received for order ${order.orderNumber}`,
      receivedItems,
      order,
      timestamp: new Date().toISOString()
    });
    
    // Also broadcast to inventory module
    this.wsService.broadcastToResource('inventory', 'stock', 'inventory_received', {
      receivedItems,
      order,
      userId
    });
  }

  broadcastStockUpdated(userId: number, stockUpdates: any[]) {
    this.wsService.broadcastToUser(userId, 'stock_updated', {
      message: 'Stock levels updated from purchase receipt',
      stockUpdates,
      timestamp: new Date().toISOString()
    });
    
    this.wsService.broadcastToResource('inventory', 'stock', 'stock_updated', {
      stockUpdates,
      userId
    });
  }

  // Analytics Events
  broadcastPurchaseMetricsUpdated(userId: number, metrics: any) {
    this.wsService.broadcastToResource('purchase', 'dashboard', 'purchase_metrics_updated', {
      metrics,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  broadcastSupplierPerformanceUpdated(userId: number, supplierId: number, performance: any) {
    this.wsService.broadcastToResource('purchase', 'suppliers', 'supplier_performance_updated', {
      supplierId,
      performance,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Helper method for status change messages
  private getStatusChangeMessage(status: string, orderNumber: string): string {
    const statusMessages = {
      'pending': `Purchase order ${orderNumber} is pending approval`,
      'approved': `Purchase order ${orderNumber} has been approved`,
      'sent_to_supplier': `Purchase order ${orderNumber} sent to supplier`,
      'confirmed': `Purchase order ${orderNumber} confirmed by supplier`,
      'partially_delivered': `Purchase order ${orderNumber} partially delivered`,
      'delivered': `Purchase order ${orderNumber} fully delivered`,
      'cancelled': `Purchase order ${orderNumber} has been cancelled`,
      'rejected': `Purchase order ${orderNumber} has been rejected`
    };
    
    return statusMessages[status] || `Purchase order ${orderNumber} status updated to ${status}`;
  }

  // Real-time notifications for purchase workflow
  notifyPurchaseWorkflow(userId: number, type: 'approval_needed' | 'delivery_overdue' | 'budget_exceeded', data: any) {
    const messages = {
      'approval_needed': 'Purchase request requires approval',
      'delivery_overdue': 'Purchase order delivery is overdue',
      'budget_exceeded': 'Purchase order exceeds approved budget'
    };

    this.wsService.broadcastToUser(userId, 'purchase_workflow_notification', {
      type,
      message: messages[type],
      data,
      priority: type === 'budget_exceeded' ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    });
  }
}