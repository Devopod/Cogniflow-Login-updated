import { WSService } from './websocket';
import { db } from './db';
import { purchaseOrders, purchaseRequests, suppliers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class PurchaseWebSocketService {
  private wsService: WSService;

  constructor(wsService: WSService) {
    this.wsService = wsService;
  }

  // Broadcast purchase order updates
  broadcastPurchaseOrderUpdate(orderId: number, type: string, data: any) {
    this.wsService.broadcastToResource('purchase', orderId.toString(), type, data);
  }

  // Broadcast purchase request updates
  broadcastPurchaseRequestUpdate(requestId: number, type: string, data: any) {
    this.wsService.broadcastToResource('purchase', requestId.toString(), type, data);
  }

  // Broadcast supplier updates
  broadcastSupplierUpdate(supplierId: number, type: string, data: any) {
    this.wsService.broadcastToResource('purchase', supplierId.toString(), type, data);
  }

  // Broadcast general purchase updates (supports legacy signature (userId, payloadWithType))
  broadcastPurchaseUpdate(typeOrUserId: string | number, dataOrPayload: any) {
    if (typeof typeOrUserId === 'string') {
      // Modern signature: (type, data)
      this.wsService.broadcastToResource('purchase', 'all', typeOrUserId, dataOrPayload);
    } else {
      // Legacy signature: (userId, payloadWithType)
      const payload = dataOrPayload || {};
      const type = payload.type || 'purchase_update';
      this.wsService.broadcastToResource('purchase', 'all', type, { userId: typeOrUserId, ...payload });
    }
  }

  // Dashboard metrics updated
  broadcastPurchaseMetricsUpdated(userId: number, metrics: any) {
    this.broadcastPurchaseUpdate('dashboard_metrics_updated', { userId, metrics });
  }

  // Supplier events
  broadcastSupplierCreated(userId: number, supplier: any) {
    this.broadcastPurchaseUpdate('supplier_created', { userId, supplier });
  }

  broadcastSupplierUpdated(userId: number, supplier: any) {
    this.broadcastPurchaseUpdate('supplier_updated', { userId, supplier });
  }

  // Purchase Request events
  broadcastPurchaseRequestCreated(userId: number, request: any) {
    this.broadcastPurchaseUpdate('request_created', { userId, request });
  }

  broadcastPurchaseRequestApproved(userId: number, request: any, approver: any) {
    this.broadcastPurchaseUpdate('request_approved', { userId, request, approver });
  }

  broadcastPurchaseRequestRejected(userId: number, request: any, approver: any) {
    this.broadcastPurchaseUpdate('request_rejected', { userId, request, approver });
  }

  // Purchase Order events
  broadcastPurchaseOrderCreated(userId: number, order: any) {
    this.broadcastPurchaseUpdate('order_created', { userId, order });
  }

  broadcastPurchaseOrderStatusChanged(userId: number, order: any, previousStatus: string) {
    this.broadcastPurchaseUpdate('order_status_changed', { userId, order, previousStatus });
  }

  // Handle purchase order created
  async onPurchaseOrderCreated(orderId: number) {
    try {
      const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId));
      if (order) {
        this.broadcastPurchaseOrderUpdate(orderId, 'order_created', order);
        this.broadcastPurchaseUpdate('order_created', { orderId, order });
      }
    } catch (error) {
      console.error('Error broadcasting purchase order created:', error);
    }
  }

  // Handle purchase order updated
  async onPurchaseOrderUpdated(orderId: number) {
    try {
      const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId));
      if (order) {
        this.broadcastPurchaseOrderUpdate(orderId, 'order_updated', order);
        this.broadcastPurchaseUpdate('order_updated', { orderId, order });
      }
    } catch (error) {
      console.error('Error broadcasting purchase order updated:', error);
    }
  }

  // Handle purchase order status changed
  async onPurchaseOrderStatusChanged(orderId: number, newStatus: string) {
    const statusMessages: Record<string, string> = {
      pending: 'Purchase order is pending approval',
      approved: 'Purchase order has been approved',
      sent_to_supplier: 'Purchase order has been sent to supplier',
      confirmed: 'Purchase order has been confirmed by supplier',
      partially_delivered: 'Purchase order is partially delivered',
      delivered: 'Purchase order has been fully delivered',
      cancelled: 'Purchase order has been cancelled',
      rejected: 'Purchase order has been rejected'
    };

    const message = statusMessages[newStatus] || `Purchase order ${orderId} status updated to ${newStatus}`;
    
    this.broadcastPurchaseOrderUpdate(orderId, 'status_changed', { 
      orderId, 
      status: newStatus, 
      message 
    });
    this.broadcastPurchaseUpdate('status_changed', { 
      orderId, 
      status: newStatus, 
      message 
    });
  }

  // Handle purchase request created
  async onPurchaseRequestCreated(requestId: number) {
    try {
      const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, requestId));
      if (request) {
        this.broadcastPurchaseRequestUpdate(requestId, 'request_created', request);
        this.broadcastPurchaseUpdate('request_created', { requestId, request });
      }
    } catch (error) {
      console.error('Error broadcasting purchase request created:', error);
    }
  }

  // Handle purchase request updated
  async onPurchaseRequestUpdated(requestId: number) {
    try {
      const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, requestId));
      if (request) {
        this.broadcastPurchaseRequestUpdate(requestId, 'request_updated', request);
        this.broadcastPurchaseUpdate('request_updated', { requestId, request });
      }
    } catch (error) {
      console.error('Error broadcasting purchase request updated:', error);
    }
  }

  // Handle supplier created
  async onSupplierCreated(supplierId: number) {
    try {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
      if (supplier) {
        this.broadcastSupplierUpdate(supplierId, 'supplier_created', supplier);
        this.broadcastPurchaseUpdate('supplier_created', { supplierId, supplier });
      }
    } catch (error) {
      console.error('Error broadcasting supplier created:', error);
    }
  }

  // Handle supplier updated
  async onSupplierUpdated(supplierId: number) {
    try {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
      if (supplier) {
        this.broadcastSupplierUpdate(supplierId, 'supplier_updated', supplier);
        this.broadcastPurchaseUpdate('supplier_updated', { supplierId, supplier });
      }
    } catch (error) {
      console.error('Error broadcasting supplier updated:', error);
    }
  }

  // Handle delivery received
  async onDeliveryReceived(orderId: number, deliveryData: any) {
    this.broadcastPurchaseOrderUpdate(orderId, 'delivery_received', { orderId, delivery: deliveryData });
    this.broadcastPurchaseUpdate('delivery_received', { orderId, delivery: deliveryData });
  }

  // Handle payment made
  async onPaymentMade(orderId: number, paymentData: any) {
    this.broadcastPurchaseOrderUpdate(orderId, 'payment_made', { orderId, payment: paymentData });
    this.broadcastPurchaseUpdate('payment_made', { orderId, payment: paymentData });
  }

  // Handle inventory updated
  async onInventoryUpdated(productId: number, quantity: number) {
    this.broadcastPurchaseUpdate('inventory_updated', { productId, quantity });
  }

  // Handle low stock alert
  async onLowStockAlert(productId: number, currentStock: number, reorderPoint: number) {
    this.broadcastPurchaseUpdate('low_stock_alert', { 
      productId, 
      currentStock, 
      reorderPoint,
      message: `Product ${productId} is running low on stock (${currentStock}/${reorderPoint})`
    });
  }

  // Handle supplier performance update
  async onSupplierPerformanceUpdate(supplierId: number, performanceData: any) {
    this.broadcastSupplierUpdate(supplierId, 'performance_updated', { supplierId, performance: performanceData });
    this.broadcastPurchaseUpdate('supplier_performance_updated', { supplierId, performance: performanceData });
  }
}

export let purchaseWebSocketService: PurchaseWebSocketService | null = null;

export function setPurchaseWebSocketService(wsService: WSService) {
  purchaseWebSocketService = new PurchaseWebSocketService(wsService);
}