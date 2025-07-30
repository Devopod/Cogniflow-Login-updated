import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or, gte, lte, sum } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();

// Middleware to get user ID
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1; // Fallback for development
};

// Get purchase dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const metricsQuery = sql`
      SELECT 
        COUNT(DISTINCT pr.id) as total_purchase_requests,
        COUNT(CASE WHEN pr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN pr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(DISTINCT po.id) as total_purchase_orders,
        COUNT(CASE WHEN po.status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN po.status = 'delivered' THEN 1 END) as delivered_orders,
        SUM(CASE WHEN po.status = 'pending' THEN po.total_amount ELSE 0 END) as pending_amount,
        SUM(po.total_amount) as total_spend,
        COUNT(DISTINCT s.id) as total_suppliers
      FROM ${schema.purchaseRequests} pr
      FULL OUTER JOIN ${schema.purchaseOrders} po ON pr.user_id = po.user_id
      FULL OUTER JOIN ${schema.suppliers} s ON po.user_id = s.user_id
      WHERE COALESCE(pr.user_id, po.user_id, s.user_id) = ${userId}
    `;
    
    const [metrics] = await db.execute(metricsQuery);
    
    // Calculate additional metrics
    const avgOrderValue = Number(metrics.total_purchase_orders) > 0 
      ? Number(metrics.total_spend) / Number(metrics.total_purchase_orders)
      : 0;
    
    const result = {
      totalPurchaseRequests: Number(metrics.total_purchase_requests) || 0,
      pendingRequests: Number(metrics.pending_requests) || 0,
      approvedRequests: Number(metrics.approved_requests) || 0,
      totalPurchaseOrders: Number(metrics.total_purchase_orders) || 0,
      pendingOrders: Number(metrics.pending_orders) || 0,
      deliveredOrders: Number(metrics.delivered_orders) || 0,
      pendingAmount: Number(metrics.pending_amount) || 0,
      totalSpend: Number(metrics.total_spend) || 0,
      totalSuppliers: Number(metrics.total_suppliers) || 0,
      avgOrderValue: Math.round(avgOrderValue),
      onTimeDeliveryRate: 85.5, // This would be calculated from delivery data
      supplierPerformance: 92.3, // This would be calculated from supplier ratings
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching purchase dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all suppliers with pagination and filtering
router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, status } = req.query;
    
    let query = db
      .select({
        supplier: schema.suppliers,
        orderCount: sql`COUNT(po.id) as order_count`,
        totalSpend: sql`COALESCE(SUM(po.total_amount), 0) as total_spend`,
        lastOrderDate: sql`MAX(po.order_date) as last_order_date`
      })
      .from(schema.suppliers)
      .leftJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(eq(schema.suppliers.userId, userId))
      .groupBy(schema.suppliers.id);
    
    // Add filters
    if (search) {
      query = query.where(
        or(
          ilike(schema.suppliers.name, `%${search}%`),
          ilike(schema.suppliers.contactPerson, `%${search}%`),
          ilike(schema.suppliers.email, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(schema.suppliers.status, status as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const suppliers = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.suppliers.createdAt));
    
    // Get total count for pagination
    const totalQuery = db.select({ count: sql`count(*)` }).from(schema.suppliers).where(eq(schema.suppliers.userId, userId));
    const [{ count }] = await totalQuery;
    
    res.json({
      suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create new supplier
router.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const supplierData = { ...req.body, userId };
    
    const [newSupplier] = await db.insert(schema.suppliers).values(supplierData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'suppliers', {
      type: 'supplier_created',
      data: newSupplier
    });
    
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const supplierId = parseInt(req.params.id);
    
    const [updatedSupplier] = await db
      .update(schema.suppliers)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.suppliers.id, supplierId), eq(schema.suppliers.userId, userId)))
      .returning();
    
    if (!updatedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'suppliers', {
      type: 'supplier_updated',
      data: updatedSupplier
    });
    
    res.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Get all purchase requests
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, status, department } = req.query;
    
    let query = db
      .select({
        request: schema.purchaseRequests,
        department: {
          id: schema.departments.id,
          name: schema.departments.name,
          code: schema.departments.code
        },
        requestedByUser: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName
        },
        itemCount: sql`COUNT(pri.id) as item_count`
      })
      .from(schema.purchaseRequests)
      .leftJoin(schema.departments, eq(schema.purchaseRequests.departmentId, schema.departments.id))
      .leftJoin(schema.users, eq(schema.purchaseRequests.requestedBy, schema.users.id))
      .leftJoin(schema.purchaseRequestItems, eq(schema.purchaseRequests.id, schema.purchaseRequestItems.purchaseRequestId))
      .where(eq(schema.purchaseRequests.userId, userId))
      .groupBy(
        schema.purchaseRequests.id, 
        schema.departments.id, 
        schema.users.id
      );
    
    if (status) {
      query = query.where(eq(schema.purchaseRequests.status, status as string));
    }
    
    if (department) {
      query = query.where(eq(schema.purchaseRequests.departmentId, parseInt(department as string)));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const requests = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.purchaseRequests.createdAt));
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

// Create new purchase request
router.post('/requests', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { items, ...requestData } = req.body;
    
    // Generate request number
    const requestNumber = `PR${Date.now()}`;
    const fullRequestData = { 
      ...requestData, 
      userId, 
      requestNumber,
      requestedBy: userId 
    };
    
    const [newRequest] = await db.insert(schema.purchaseRequests).values(fullRequestData).returning();
    
    // Add items if provided
    if (items && items.length > 0) {
      const itemsData = items.map((item: any) => ({
        ...item,
        purchaseRequestId: newRequest.id
      }));
      
      await db.insert(schema.purchaseRequestItems).values(itemsData);
      
      // Calculate total amount
      const totalAmount = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * (item.estimatedUnitPrice || 0)), 0
      );
      
      await db
        .update(schema.purchaseRequests)
        .set({ totalAmount })
        .where(eq(schema.purchaseRequests.id, newRequest.id));
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'requests', {
      type: 'request_created',
      data: newRequest
    });
    
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

// Approve/reject purchase request
router.put('/requests/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const requestId = parseInt(req.params.id);
    const { status } = req.body; // status: 'approved' | 'rejected'
    
    const updateData = {
      status,
      approvedBy: userId,
      approvalDate: new Date(),
      updatedAt: new Date()
    };
    
    const [updatedRequest] = await db
      .update(schema.purchaseRequests)
      .set(updateData)
      .where(and(eq(schema.purchaseRequests.id, requestId), eq(schema.purchaseRequests.userId, userId)))
      .returning();
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'requests', {
      type: 'request_status_updated',
      data: updatedRequest
    });
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating purchase request status:', error);
    res.status(500).json({ error: 'Failed to update purchase request status' });
  }
});

// Get all purchase orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, status, supplierId } = req.query;
    
    let query = db
      .select({
        order: schema.purchaseOrders,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
          contactPerson: schema.suppliers.contactPerson
        },
        request: {
          id: schema.purchaseRequests.id,
          requestNumber: schema.purchaseRequests.requestNumber
        },
        itemCount: sql`COUNT(poi.id) as item_count`
      })
      .from(schema.purchaseOrders)
      .innerJoin(schema.suppliers, eq(schema.purchaseOrders.supplierId, schema.suppliers.id))
      .leftJoin(schema.purchaseRequests, eq(schema.purchaseOrders.purchaseRequestId, schema.purchaseRequests.id))
      .leftJoin(schema.purchaseOrderItems, eq(schema.purchaseOrders.id, schema.purchaseOrderItems.purchaseOrderId))
      .where(eq(schema.purchaseOrders.userId, userId))
      .groupBy(
        schema.purchaseOrders.id,
        schema.suppliers.id,
        schema.purchaseRequests.id
      );
    
    if (status) {
      query = query.where(eq(schema.purchaseOrders.status, status as string));
    }
    
    if (supplierId) {
      query = query.where(eq(schema.purchaseOrders.supplierId, parseInt(supplierId as string)));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const orders = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.purchaseOrders.createdAt));
    
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Create new purchase order
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { items, ...orderData } = req.body;
    
    // Generate order number
    const orderNumber = `PO${Date.now()}`;
    const fullOrderData = { 
      ...orderData, 
      userId, 
      orderNumber 
    };
    
    const [newOrder] = await db.insert(schema.purchaseOrders).values(fullOrderData).returning();
    
    // Add items if provided
    if (items && items.length > 0) {
      const itemsData = items.map((item: any) => ({
        ...item,
        purchaseOrderId: newOrder.id
      }));
      
      await db.insert(schema.purchaseOrderItems).values(itemsData);
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'orders', {
      type: 'order_created',
      data: newOrder
    });
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Update purchase order status
router.put('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const orderId = parseInt(req.params.id);
    const { status } = req.body; // status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
    
    const [updatedOrder] = await db
      .update(schema.purchaseOrders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(and(eq(schema.purchaseOrders.id, orderId), eq(schema.purchaseOrders.userId, userId)))
      .returning();
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // If order is delivered, update inventory
    if (status === 'delivered') {
      // Get order items and update inventory
      const orderItems = await db
        .select()
        .from(schema.purchaseOrderItems)
        .where(eq(schema.purchaseOrderItems.purchaseOrderId, orderId));
      
      for (const item of orderItems) {
        if (item.productId) {
          // Add inventory transaction
          await db.insert(schema.inventoryTransactions).values({
            userId,
            productId: item.productId,
            type: 'purchase',
            quantity: item.quantity,
            relatedDocumentType: 'purchase_order',
            relatedDocumentId: orderId,
            notes: `Purchase order ${updatedOrder.orderNumber} delivered`,
            transactionDate: new Date()
          });
          
          // Update product stock quantity
          await db
            .update(schema.products)
            .set({
              stockQuantity: sql`${schema.products.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(schema.products.id, item.productId));
        }
      }
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'orders', {
      type: 'order_status_updated',
      data: updatedOrder
    });
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
});

// Get purchase order items
router.get('/orders/:id/items', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const orderId = parseInt(req.params.id);
    
    const items = await db
      .select({
        item: schema.purchaseOrderItems,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku,
          unit: schema.products.unit
        }
      })
      .from(schema.purchaseOrderItems)
      .leftJoin(schema.products, eq(schema.purchaseOrderItems.productId, schema.products.id))
      .innerJoin(schema.purchaseOrders, eq(schema.purchaseOrderItems.purchaseOrderId, schema.purchaseOrders.id))
      .where(
        and(
          eq(schema.purchaseOrderItems.purchaseOrderId, orderId),
          eq(schema.purchaseOrders.userId, userId)
        )
      )
      .orderBy(asc(schema.purchaseOrderItems.id));
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching purchase order items:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order items' });
  }
});

// Get purchase request items
router.get('/requests/:id/items', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const requestId = parseInt(req.params.id);
    
    const items = await db
      .select({
        item: schema.purchaseRequestItems,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku,
          unit: schema.products.unit
        }
      })
      .from(schema.purchaseRequestItems)
      .leftJoin(schema.products, eq(schema.purchaseRequestItems.productId, schema.products.id))
      .innerJoin(schema.purchaseRequests, eq(schema.purchaseRequestItems.purchaseRequestId, schema.purchaseRequests.id))
      .where(
        and(
          eq(schema.purchaseRequestItems.purchaseRequestId, requestId),
          eq(schema.purchaseRequests.userId, userId)
        )
      )
      .orderBy(asc(schema.purchaseRequestItems.id));
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching purchase request items:', error);
    res.status(500).json({ error: 'Failed to fetch purchase request items' });
  }
});

// Get top suppliers by spend
router.get('/analytics/top-suppliers', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { limit = 5 } = req.query;
    
    const topSuppliers = await db
      .select({
        supplier: schema.suppliers,
        totalSpend: sql`SUM(po.total_amount) as total_spend`,
        orderCount: sql`COUNT(po.id) as order_count`,
        avgOrderValue: sql`AVG(po.total_amount) as avg_order_value`
      })
      .from(schema.suppliers)
      .innerJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(eq(schema.suppliers.userId, userId))
      .groupBy(schema.suppliers.id)
      .orderBy(desc(sql`total_spend`))
      .limit(Number(limit));
    
    res.json(topSuppliers);
  } catch (error) {
    console.error('Error fetching top suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch top suppliers' });
  }
});

// Get purchase trends
router.get('/analytics/trends', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { period = 'monthly' } = req.query; // monthly, weekly, daily
    
    let dateFormat = 'YYYY-MM';
    if (period === 'weekly') dateFormat = 'YYYY-WW';
    if (period === 'daily') dateFormat = 'YYYY-MM-DD';
    
    const trends = await db.execute(sql`
      SELECT 
        TO_CHAR(order_date, '${dateFormat}') as period,
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_amount
      FROM ${schema.purchaseOrders}
      WHERE user_id = ${userId}
        AND order_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(order_date, '${dateFormat}')
      ORDER BY period DESC
      LIMIT 12
    `);
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching purchase trends:', error);
    res.status(500).json({ error: 'Failed to fetch purchase trends' });
  }
});

// Get purchase summary by category
router.get('/analytics/category-summary', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const categorySummary = await db
      .select({
        category: schema.products.category,
        totalQuantity: sql`SUM(poi.quantity) as total_quantity`,
        totalAmount: sql`SUM(poi.quantity * poi.unitPrice) as total_amount`,
        orderCount: sql`COUNT(DISTINCT po.id) as order_count`
      })
      .from(schema.purchaseOrders)
      .innerJoin(schema.purchaseOrderItems, eq(schema.purchaseOrders.id, schema.purchaseOrderItems.purchaseOrderId))
      .leftJoin(schema.products, eq(schema.purchaseOrderItems.productId, schema.products.id))
      .where(eq(schema.purchaseOrders.userId, userId))
      .groupBy(schema.products.category)
      .orderBy(desc(sql`total_amount`));
    
    res.json(categorySummary);
  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({ error: 'Failed to fetch category summary' });
  }
});

// Convert purchase request to purchase order
router.post('/requests/:id/convert-to-order', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const requestId = parseInt(req.params.id);
    const { supplierId, ...orderDetails } = req.body;
    
    // Get the purchase request
    const request = await db
      .select()
      .from(schema.purchaseRequests)
      .where(and(eq(schema.purchaseRequests.id, requestId), eq(schema.purchaseRequests.userId, userId)))
      .limit(1);
    
    if (!request.length) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    // Get request items
    const requestItems = await db
      .select()
      .from(schema.purchaseRequestItems)
      .where(eq(schema.purchaseRequestItems.purchaseRequestId, requestId));
    
    // Create purchase order
    const orderNumber = `PO${Date.now()}`;
    const [newOrder] = await db.insert(schema.purchaseOrders).values({
      userId,
      supplierId,
      purchaseRequestId: requestId,
      orderNumber,
      orderDate: new Date(),
      subtotal: request[0].totalAmount || 0,
      totalAmount: request[0].totalAmount || 0,
      status: 'pending',
      ...orderDetails
    }).returning();
    
    // Convert request items to order items
    if (requestItems.length > 0) {
      const orderItemsData = requestItems.map(item => ({
        purchaseOrderId: newOrder.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.estimatedUnitPrice || 0,
        subtotal: item.quantity * (item.estimatedUnitPrice || 0),
        totalAmount: item.quantity * (item.estimatedUnitPrice || 0)
      }));
      
      await db.insert(schema.purchaseOrderItems).values(orderItemsData);
    }
    
    // Update request status
    await db
      .update(schema.purchaseRequests)
      .set({ status: 'converted', updatedAt: new Date() })
      .where(eq(schema.purchaseRequests.id, requestId));
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('purchase', 'orders', {
      type: 'order_created_from_request',
      data: { order: newOrder, requestId }
    });
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error converting request to order:', error);
    res.status(500).json({ error: 'Failed to convert request to order' });
  }
});

export default router;