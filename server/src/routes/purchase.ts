import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or, gte, lte, sum, count, avg } from 'drizzle-orm';
import { WSService } from '../../websocket';
import { PurchaseWebSocketService } from '../../websocket-purchase';

const router = Router();
let purchaseWS: PurchaseWebSocketService;

export function setPurchaseWSService(wsService: WSService) {
  purchaseWS = new PurchaseWebSocketService(wsService);
}

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Helper function to safely convert dates
function safeDate(dateValue: any): string {
  if (!dateValue) {
    return new Date().toISOString();
  }
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  
  return date.toISOString();
}

// Helper function to safely convert date for filtering
function safeDateFilter(dateValue: any): Date {
  if (!dateValue) {
    return new Date();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return date;
}

// Middleware to get user ID
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1; // Fallback for development
};

// Get purchase dashboard metrics
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get purchase request metrics
    const requestMetrics = await db
      .select({
        totalRequests: count(),
        pendingRequests: sum(sql`CASE WHEN ${schema.purchaseRequests.status} = 'pending' THEN 1 ELSE 0 END`),
        approvedRequests: sum(sql`CASE WHEN ${schema.purchaseRequests.status} = 'approved' THEN 1 ELSE 0 END`),
        rejectedRequests: sum(sql`CASE WHEN ${schema.purchaseRequests.status} = 'rejected' THEN 1 ELSE 0 END`)
      })
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.userId, userId));

    // Get purchase order metrics
    const orderMetrics = await db
      .select({
        totalOrders: count(),
        pendingOrders: sum(sql`CASE WHEN ${schema.purchaseOrders.status} = 'pending' THEN 1 ELSE 0 END`),
        deliveredOrders: sum(sql`CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 ELSE 0 END`),
        totalSpend: sum(schema.purchaseOrders.totalAmount),
        pendingAmount: sum(sql`CASE WHEN ${schema.purchaseOrders.status} = 'pending' THEN ${schema.purchaseOrders.totalAmount} ELSE 0 END`)
      })
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.userId, userId));

    // Get supplier count
    const supplierMetrics = await db
      .select({
        totalSuppliers: count(),
        activeSuppliers: sum(sql`CASE WHEN ${schema.suppliers.status} = 'active' THEN 1 ELSE 0 END`)
      })
      .from(schema.suppliers)
      .where(eq(schema.suppliers.userId, userId));

    // Calculate additional metrics
    const avgOrderValue = Number(orderMetrics[0]?.totalOrders || 0) > 0 
      ? (Number(orderMetrics[0]?.totalSpend || 0) / Number(orderMetrics[0]?.totalOrders || 1))
      : 0;

    // Calculate on-time delivery rate (simplified)
    const deliveryMetrics = await db
      .select({
        onTimeDeliveries: count(sql`CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END`),
        totalDelivered: count(sql`CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END`)
      })
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.userId, userId));

    const onTimeDeliveryRate = Number(deliveryMetrics[0]?.totalDelivered || 0) > 0 
      ? (Number(deliveryMetrics[0]?.onTimeDeliveries || 0) / Number(deliveryMetrics[0]?.totalDelivered || 1)) * 100
      : 0;

    // Calculate supplier performance overview (simplified since we don't have deliveryDate)
    const supplierPerformanceMetrics = await db
      .select({
        totalOrders: sql<number>`CAST(COUNT(${schema.purchaseOrders.id}) AS INTEGER)`,
        deliveredOrders: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END) AS INTEGER)`
      })
      .from(schema.suppliers)
      .leftJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(eq(schema.suppliers.userId, userId));

    // Calculate supplier performance as delivery rate (orders delivered vs total orders)
    const supplierPerformance = Number(supplierPerformanceMetrics[0]?.totalOrders || 0) > 0
      ? (Number(supplierPerformanceMetrics[0]?.deliveredOrders || 0) / Number(supplierPerformanceMetrics[0]?.totalOrders || 1)) * 100
      : 0;

    const result = {
      totalPurchaseRequests: Number(requestMetrics[0]?.totalRequests || 0),
      pendingRequests: Number(requestMetrics[0]?.pendingRequests || 0),
      approvedRequests: Number(requestMetrics[0]?.approvedRequests || 0),
      rejectedRequests: Number(requestMetrics[0]?.rejectedRequests || 0),
      totalPurchaseOrders: Number(orderMetrics[0]?.totalOrders || 0),
      pendingOrders: Number(orderMetrics[0]?.pendingOrders || 0),
      deliveredOrders: Number(orderMetrics[0]?.deliveredOrders || 0),
      pendingAmount: Number(orderMetrics[0]?.pendingAmount || 0),
      totalSpend: Number(orderMetrics[0]?.totalSpend || 0),
      totalSuppliers: Number(supplierMetrics[0]?.totalSuppliers || 0),
      activeSuppliers: Number(supplierMetrics[0]?.activeSuppliers || 0),
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
      supplierPerformance: Math.round(supplierPerformance * 100) / 100
    };
    
    // Broadcast metrics update if WebSocket service is available
    if (purchaseWS) {
      purchaseWS.broadcastPurchaseMetricsUpdated(userId, result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching purchase dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all suppliers with pagination and filtering
router.get('/suppliers', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build base query with proper joins
    let query = db
      .select({
        supplier: schema.suppliers,
        orderCount: sql<number>`CAST(COUNT(DISTINCT ${schema.purchaseOrders.id}) AS INTEGER)`,
        totalSpend: sql<number>`CAST(COALESCE(SUM(${schema.purchaseOrders.totalAmount}), 0) AS DECIMAL)`,
        lastOrderDate: sql<string>`MAX(${schema.purchaseOrders.orderDate})`
      })
      .from(schema.suppliers)
      .leftJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(eq(schema.suppliers.userId, userId))
      .groupBy(schema.suppliers.id);
    
    // Add search filter
    if (search && typeof search === 'string') {
      query = query.where(
        and(
          eq(schema.suppliers.userId, userId),
          or(
            ilike(schema.suppliers.name, `%${search}%`),
            ilike(schema.suppliers.contactPerson, `%${search}%`),
            ilike(schema.suppliers.email, `%${search}%`)
          )
        )
      );
    }
    
    // Add status filter
    if (status && typeof status === 'string') {
      query = query.where(
        and(
          eq(schema.suppliers.userId, userId),
          eq(schema.suppliers.status, status)
        )
      );
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const suppliers = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.suppliers.createdAt));
    
    // Get total count for pagination
    let countQuery = db
      .select({ count: count() })
      .from(schema.suppliers)
      .where(eq(schema.suppliers.userId, userId));
    
    if (search && typeof search === 'string') {
      countQuery = countQuery.where(
        and(
          eq(schema.suppliers.userId, userId),
          or(
            ilike(schema.suppliers.name, `%${search}%`),
            ilike(schema.suppliers.contactPerson, `%${search}%`),
            ilike(schema.suppliers.email, `%${search}%`)
          )
        )
      );
    }
    
    if (status && typeof status === 'string') {
      countQuery = countQuery.where(
        and(
          eq(schema.suppliers.userId, userId),
          eq(schema.suppliers.status, status)
        )
      );
    }
    
    const [{ count: totalCount }] = await countQuery;
    
    res.json({
      suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalCount),
        pages: Math.ceil(Number(totalCount) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create new supplier
router.post('/suppliers', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const supplierData = { 
      ...req.body, 
      userId, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    
    const [newSupplier] = await db
      .insert(schema.suppliers)
      .values(supplierData)
      .returning();
    
    // Broadcast real-time update
    if (purchaseWS) {
      purchaseWS.broadcastSupplierCreated(userId, newSupplier);
    }
    
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/suppliers/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const supplierId = parseInt(req.params.id);
    
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }
    
    const [updatedSupplier] = await db
      .update(schema.suppliers)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(
        eq(schema.suppliers.id, supplierId), 
        eq(schema.suppliers.userId, userId)
      ))
      .returning();
    
    if (!updatedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    // Broadcast real-time update
    if (purchaseWS) {
      purchaseWS.broadcastSupplierUpdated(userId, updatedSupplier);
    }
    
    res.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/suppliers/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const supplierId = parseInt(req.params.id);
    
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }
    
    // Check if supplier has any purchase orders
    const orders = await db
      .select({ id: schema.purchaseOrders.id })
      .from(schema.purchaseOrders)
      .where(and(
        eq(schema.purchaseOrders.supplierId, supplierId),
        eq(schema.purchaseOrders.userId, userId)
      ))
      .limit(1);
    
    if (orders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier with existing purchase orders. Consider deactivating instead.' 
      });
    }
    
    const [deletedSupplier] = await db
      .delete(schema.suppliers)
      .where(and(
        eq(schema.suppliers.id, supplierId),
        eq(schema.suppliers.userId, userId)
      ))
      .returning();
    
    if (!deletedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Get all purchase requests
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
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
        approvedByUser: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName
        },
        itemCount: sql<number>`CAST(COUNT(DISTINCT ${schema.purchaseRequestItems.id}) AS INTEGER)`
      })
      .from(schema.purchaseRequests)
      .leftJoin(schema.departments, eq(schema.purchaseRequests.departmentId, schema.departments.id))
      .leftJoin(schema.users, eq(schema.purchaseRequests.requestedBy, schema.users.id))
      .leftJoin(schema.purchaseRequestItems, eq(schema.purchaseRequests.id, schema.purchaseRequestItems.purchaseRequestId))
      .where(eq(schema.purchaseRequests.userId, userId))
      .groupBy(
        schema.purchaseRequests.id,
        schema.departments.id,
        schema.departments.name,
        schema.departments.code,
        schema.users.id,
        schema.users.firstName,
        schema.users.lastName
      );
    
    if (status && typeof status === 'string') {
      query = query.where(
        and(
          eq(schema.purchaseRequests.userId, userId),
          eq(schema.purchaseRequests.status, status)
        )
      );
    }
    
    if (department && typeof department === 'string') {
      const deptId = parseInt(department);
      if (!isNaN(deptId)) {
        query = query.where(
          and(
            eq(schema.purchaseRequests.userId, userId),
            eq(schema.purchaseRequests.departmentId, deptId)
          )
        );
      }
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const requests = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.purchaseRequests.createdAt));
    
    // Get total count for pagination
    let countQuery = db
      .select({ count: count() })
      .from(schema.purchaseRequests)
      .where(eq(schema.purchaseRequests.userId, userId));
    
    if (status && typeof status === 'string') {
      countQuery = countQuery.where(
        and(
          eq(schema.purchaseRequests.userId, userId),
          eq(schema.purchaseRequests.status, status)
        )
      );
    }
    
    if (department && typeof department === 'string') {
      const deptId = parseInt(department);
      if (!isNaN(deptId)) {
        countQuery = countQuery.where(
          and(
            eq(schema.purchaseRequests.userId, userId),
            eq(schema.purchaseRequests.departmentId, deptId)
          )
        );
      }
    }
    
    const [{ count: totalCount }] = await countQuery;
    
    res.json({
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalCount),
        pages: Math.ceil(Number(totalCount) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

// Create new purchase request
router.post('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { items, ...requestData } = req.body;
    
    // Generate request number
    const requestNumber = `PR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Calculate total amount
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (Number(item.quantity || 0) * Number(item.estimatedUnitPrice || 0));
      }, 0);
    }
    
    const fullRequestData = { 
      ...requestData, 
      userId, 
      requestNumber,
      requestedBy: userId,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newRequest] = await db
      .insert(schema.purchaseRequests)
      .values(fullRequestData)
      .returning();
    
    // Add items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsData = items.map((item: any) => ({
        ...item,
        purchaseRequestId: newRequest.id,
        estimatedTotal: Number(item.quantity || 0) * Number(item.estimatedUnitPrice || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await db.insert(schema.purchaseRequestItems).values(itemsData);
    }
    
    // Broadcast real-time update
    if (purchaseWS) {
      purchaseWS.broadcastPurchaseRequestCreated(userId, newRequest);
    }
    
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

// Get specific purchase request with items
router.get('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.id);
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }
    
    const [request] = await db
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
        }
      })
      .from(schema.purchaseRequests)
      .leftJoin(schema.departments, eq(schema.purchaseRequests.departmentId, schema.departments.id))
      .leftJoin(schema.users, eq(schema.purchaseRequests.requestedBy, schema.users.id))
      .where(and(
        eq(schema.purchaseRequests.id, requestId),
        eq(schema.purchaseRequests.userId, userId)
      ))
      .limit(1);
    
    if (!request) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    // Get request items
    const items = await db
      .select({
        item: schema.purchaseRequestItems,
        product: schema.products
      })
      .from(schema.purchaseRequestItems)
      .leftJoin(schema.products, eq(schema.purchaseRequestItems.productId, schema.products.id))
      .where(eq(schema.purchaseRequestItems.purchaseRequestId, requestId));
    
    res.json({ ...request, items });
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    res.status(500).json({ error: 'Failed to fetch purchase request' });
  }
});

// Update purchase request status
router.put('/requests/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'approved') {
      updateData.approvedBy = userId;
      updateData.approvalDate = new Date();
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const [updatedRequest] = await db
      .update(schema.purchaseRequests)
      .set(updateData)
      .where(and(
        eq(schema.purchaseRequests.id, requestId),
        eq(schema.purchaseRequests.userId, userId)
      ))
      .returning();
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    // Broadcast real-time update
    if (purchaseWS) {
      if (status === 'approved') {
        purchaseWS.broadcastPurchaseRequestApproved(userId, updatedRequest, { id: userId });
      } else if (status === 'rejected') {
        purchaseWS.broadcastPurchaseRequestRejected(userId, updatedRequest, { id: userId });
      }
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating purchase request status:', error);
    res.status(500).json({ error: 'Failed to update purchase request status' });
  }
});

// Get all purchase orders
router.get('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, supplierId } = req.query;
    
    let query = db
      .select({
        order: schema.purchaseOrders,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
          contactPerson: schema.suppliers.contactPerson
        },
        itemCount: sql<number>`CAST(COUNT(DISTINCT ${schema.purchaseOrderItems.id}) AS INTEGER)`
      })
      .from(schema.purchaseOrders)
      .leftJoin(schema.suppliers, eq(schema.purchaseOrders.supplierId, schema.suppliers.id))
      .leftJoin(schema.purchaseOrderItems, eq(schema.purchaseOrders.id, schema.purchaseOrderItems.purchaseOrderId))
      .where(eq(schema.purchaseOrders.userId, userId))
      .groupBy(
        schema.purchaseOrders.id,
        schema.suppliers.id,
        schema.suppliers.name,
        schema.suppliers.contactPerson
      );
    
    if (status && typeof status === 'string') {
      query = query.where(
        and(
          eq(schema.purchaseOrders.userId, userId),
          eq(schema.purchaseOrders.status, status)
        )
      );
    }
    
    if (supplierId && typeof supplierId === 'string') {
      const supplierIdInt = parseInt(supplierId);
      if (!isNaN(supplierIdInt)) {
        query = query.where(
          and(
            eq(schema.purchaseOrders.userId, userId),
            eq(schema.purchaseOrders.supplierId, supplierIdInt)
          )
        );
      }
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const orders = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.purchaseOrders.createdAt));
    
    // Get total count for pagination
    let countQuery = db
      .select({ count: count() })
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.userId, userId));
    
    if (status && typeof status === 'string') {
      countQuery = countQuery.where(
        and(
          eq(schema.purchaseOrders.userId, userId),
          eq(schema.purchaseOrders.status, status)
        )
      );
    }
    
    if (supplierId && typeof supplierId === 'string') {
      const supplierIdInt = parseInt(supplierId);
      if (!isNaN(supplierIdInt)) {
        countQuery = countQuery.where(
          and(
            eq(schema.purchaseOrders.userId, userId),
            eq(schema.purchaseOrders.supplierId, supplierIdInt)
          )
        );
      }
    }
    
    const [{ count: totalCount }] = await countQuery;
    
    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalCount),
        pages: Math.ceil(Number(totalCount) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Create new purchase order
router.post('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { items, ...orderData } = req.body;
    
    if (!orderData.supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }
    
    // Verify supplier exists and belongs to user
    const [supplier] = await db
      .select({ id: schema.suppliers.id })
      .from(schema.suppliers)
      .where(and(
        eq(schema.suppliers.id, orderData.supplierId),
        eq(schema.suppliers.userId, userId)
      ))
      .limit(1);
    
    if (!supplier) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }
    
    // Generate order number
    const orderNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Calculate totals
    let subtotal = 0;
    let totalAmount = 0;
    
    if (items && Array.isArray(items)) {
      subtotal = items.reduce((sum: number, item: any) => {
        return sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
      }, 0);
      
      const taxAmount = Number(orderData.taxAmount || 0);
      const shippingAmount = Number(orderData.shippingAmount || 0);
      const discountAmount = Number(orderData.discountAmount || 0);
      
      totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
    }
    
    const fullOrderData = {
      ...orderData,
      userId,
      orderNumber,
      subtotal,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newOrder] = await db
      .insert(schema.purchaseOrders)
      .values(fullOrderData)
      .returning();
    
    // Add items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsData = items.map((item: any) => ({
        ...item,
        purchaseOrderId: newOrder.id,
        total: Number(item.quantity || 0) * Number(item.unitPrice || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await db.insert(schema.purchaseOrderItems).values(itemsData);
    }
    
    // Broadcast real-time update
    if (purchaseWS) {
      purchaseWS.broadcastPurchaseOrderCreated(userId, newOrder);
    }
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Get specific purchase order with items
router.get('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const [order] = await db
      .select({
        order: schema.purchaseOrders,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
          contactPerson: schema.suppliers.contactPerson,
          email: schema.suppliers.email,
          phone: schema.suppliers.phone,
          address: schema.suppliers.address
        }
      })
      .from(schema.purchaseOrders)
      .leftJoin(schema.suppliers, eq(schema.purchaseOrders.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.purchaseOrders.id, orderId),
        eq(schema.purchaseOrders.userId, userId)
      ))
      .limit(1);
    
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // Get order items
    const items = await db
      .select({
        item: schema.purchaseOrderItems,
        product: schema.products
      })
      .from(schema.purchaseOrderItems)
      .leftJoin(schema.products, eq(schema.purchaseOrderItems.productId, schema.products.id))
      .where(eq(schema.purchaseOrderItems.purchaseOrderId, orderId));
    
    res.json({ ...order, items });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// Update purchase order status
router.put('/orders/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get current order for comparison
    const [currentOrder] = await db
      .select()
      .from(schema.purchaseOrders)
      .where(and(
        eq(schema.purchaseOrders.id, orderId),
        eq(schema.purchaseOrders.userId, userId)
      ))
      .limit(1);
    
    if (!currentOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'approved') {
      updateData.approvedBy = userId;
      updateData.approvalDate = new Date();
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const [updatedOrder] = await db
      .update(schema.purchaseOrders)
      .set(updateData)
      .where(and(
        eq(schema.purchaseOrders.id, orderId),
        eq(schema.purchaseOrders.userId, userId)
      ))
      .returning();
    
    // Broadcast real-time update
    if (purchaseWS) {
      purchaseWS.broadcastPurchaseOrderStatusChanged(userId, updatedOrder, currentOrder.status);
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
});

// Convert purchase request to purchase order
router.post('/requests/:id/convert-to-order', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.id);
    const { supplierId, ...orderDetails } = req.body;
    
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }
    
    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }
    
    // Get the purchase request
    const [request] = await db
      .select()
      .from(schema.purchaseRequests)
      .where(and(
        eq(schema.purchaseRequests.id, requestId),
        eq(schema.purchaseRequests.userId, userId)
      ))
      .limit(1);
    
    if (!request) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    if (request.status !== 'approved') {
      return res.status(400).json({ error: 'Purchase request must be approved before conversion' });
    }
    
    // Get request items
    const requestItems = await db
      .select()
      .from(schema.purchaseRequestItems)
      .where(eq(schema.purchaseRequestItems.purchaseRequestId, requestId));
    
    // Generate order number
    const orderNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Calculate totals from request items
    const subtotal = requestItems.reduce((sum, item) => 
      sum + (Number(item.quantity) * Number(item.estimatedUnitPrice || 0)), 0
    );
    
    const taxAmount = Number(orderDetails.taxAmount || 0);
    const shippingAmount = Number(orderDetails.shippingAmount || 0);
    const discountAmount = Number(orderDetails.discountAmount || 0);
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
    
    // Create purchase order
    const orderData = {
      userId,
      supplierId: Number(supplierId),
      purchaseRequestId: requestId,
      orderNumber,
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      status: 'pending',
      ...orderDetails,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newOrder] = await db
      .insert(schema.purchaseOrders)
      .values(orderData)
      .returning();
    
    // Convert request items to order items
    if (requestItems.length > 0) {
      const orderItemsData = requestItems.map(item => ({
        purchaseOrderId: newOrder.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.estimatedUnitPrice || 0,
        total: Number(item.quantity) * Number(item.estimatedUnitPrice || 0),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await db.insert(schema.purchaseOrderItems).values(orderItemsData);
    }
    
    // Update request status to 'converted'
    await db
      .update(schema.purchaseRequests)
      .set({ 
        status: 'converted',
        updatedAt: new Date()
      })
      .where(eq(schema.purchaseRequests.id, requestId));
    
    // Broadcast real-time update
    if (purchaseWS) {
      purchaseWS.broadcastPurchaseOrderCreated(userId, newOrder);
    }
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error converting purchase request to order:', error);
    res.status(500).json({ error: 'Failed to convert purchase request to order' });
  }
});

// Get purchase analytics
router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;
    
    const days = parseInt(period as string) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // Spending trends
    const spendingTrends = await db
      .select({
        date: sql<string>`DATE(${schema.purchaseOrders.orderDate})`,
        amount: sql<number>`CAST(SUM(${schema.purchaseOrders.totalAmount}) AS DECIMAL)`
      })
      .from(schema.purchaseOrders)
      .where(and(
        eq(schema.purchaseOrders.userId, userId),
        gte(schema.purchaseOrders.orderDate, fromDate)
      ))
      .groupBy(sql`DATE(${schema.purchaseOrders.orderDate})`)
      .orderBy(sql`DATE(${schema.purchaseOrders.orderDate})`);
    
    // Top suppliers
    const topSuppliers = await db
      .select({
        supplier: schema.suppliers,
        totalSpent: sql<number>`CAST(SUM(${schema.purchaseOrders.totalAmount}) AS DECIMAL)`,
        orderCount: sql<number>`CAST(COUNT(${schema.purchaseOrders.id}) AS INTEGER)`
      })
      .from(schema.suppliers)
      .leftJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(and(
        eq(schema.suppliers.userId, userId),
        gte(schema.purchaseOrders.orderDate, fromDate)
      ))
      .groupBy(schema.suppliers.id)
      .orderBy(desc(sql`SUM(${schema.purchaseOrders.totalAmount})`))
      .limit(10);
    
    // Category spending
    const categorySpending = await db
      .select({
        category: schema.products.category,
        totalSpent: sql<number>`CAST(SUM(${schema.purchaseOrderItems.total}) AS DECIMAL)`,
        orderCount: sql<number>`CAST(COUNT(DISTINCT ${schema.purchaseOrders.id}) AS INTEGER)`
      })
      .from(schema.purchaseOrderItems)
      .leftJoin(schema.purchaseOrders, eq(schema.purchaseOrderItems.purchaseOrderId, schema.purchaseOrders.id))
      .leftJoin(schema.products, eq(schema.purchaseOrderItems.productId, schema.products.id))
      .where(and(
        eq(schema.purchaseOrders.userId, userId),
        gte(schema.purchaseOrders.orderDate, fromDate)
      ))
      .groupBy(schema.products.category)
      .orderBy(desc(sql`SUM(${schema.purchaseOrderItems.total})`));
    
    // Request approval metrics
    const approvalMetrics = await db
      .select({
        avgApprovalDays: sql<number>`CAST(AVG(EXTRACT(epoch FROM (${schema.purchaseRequests.approvalDate} - ${schema.purchaseRequests.requestDate}))/86400) AS DECIMAL)`,
        approvedCount: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseRequests.status} = 'approved' THEN 1 END) AS INTEGER)`,
        rejectedCount: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseRequests.status} = 'rejected' THEN 1 END) AS INTEGER)`,
        pendingCount: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseRequests.status} = 'pending' THEN 1 END) AS INTEGER)`
      })
      .from(schema.purchaseRequests)
      .where(and(
        eq(schema.purchaseRequests.userId, userId),
        gte(schema.purchaseRequests.requestDate, fromDate)
      ));
    
    res.json({
      spendingTrends,
      topSuppliers,
      categorySpending,
      approvalMetrics: approvalMetrics[0] || {
        avgApprovalDays: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching purchase analytics:', error);
    res.status(500).json({ error: 'Failed to fetch purchase analytics' });
  }
});

// Get supplier performance metrics
router.get('/suppliers/performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const performance = await db
      .select({
        supplier: schema.suppliers,
        totalOrders: sql<number>`CAST(COUNT(${schema.purchaseOrders.id}) AS INTEGER)`,
        deliveredOrders: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END) AS INTEGER)`,
        totalAmount: sql<number>`CAST(COALESCE(SUM(${schema.purchaseOrders.totalAmount}), 0) AS DECIMAL)`,
        onTimeDeliveries: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END) AS INTEGER)`,
        avgDeliveryDays: sql<number>`CAST(0 AS DECIMAL)`,
        lastOrderDate: sql<string>`MAX(${schema.purchaseOrders.orderDate})`
      })
      .from(schema.suppliers)
      .leftJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(eq(schema.suppliers.userId, userId))
      .groupBy(schema.suppliers.id)
      .orderBy(desc(sql`COUNT(${schema.purchaseOrders.id})`));

    const performanceWithMetrics = performance.map(p => {
      // Since we don't have actual delivery dates, use order fulfillment rate as main metric
      const orderFulfillmentRate = p.totalOrders > 0 ? (p.deliveredOrders / p.totalOrders) * 100 : 0;
      const deliveryRate = orderFulfillmentRate; // Same as fulfillment rate for now
      const overallScore = orderFulfillmentRate; // Simplified scoring
      
      return {
        ...p,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        orderFulfillmentRate: Math.round(orderFulfillmentRate * 100) / 100,
        overallScore: Math.round(overallScore * 100) / 100,
        avgDeliveryDays: 0 // Not available without deliveryDate
      };
    });
    
    res.json(performanceWithMetrics);
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ error: 'Failed to fetch supplier performance' });
  }
});

// Get individual supplier performance
router.get('/suppliers/:id/performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const supplierId = parseInt(req.params.id);
    
    if (isNaN(supplierId)) {
      return res.status(400).json({ error: 'Invalid supplier ID' });
    }

    const performance = await db
      .select({
        supplier: schema.suppliers,
        totalOrders: sql<number>`CAST(COUNT(${schema.purchaseOrders.id}) AS INTEGER)`,
        deliveredOrders: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END) AS INTEGER)`,
        pendingOrders: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseOrders.status} = 'pending' THEN 1 END) AS INTEGER)`,
        totalAmount: sql<number>`CAST(COALESCE(SUM(${schema.purchaseOrders.totalAmount}), 0) AS DECIMAL)`,
        onTimeDeliveries: sql<number>`CAST(COUNT(CASE WHEN ${schema.purchaseOrders.status} = 'delivered' THEN 1 END) AS INTEGER)`,
        avgDeliveryDays: sql<number>`CAST(0 AS DECIMAL)`,
        lastOrderDate: sql<string>`MAX(${schema.purchaseOrders.orderDate})`,
        firstOrderDate: sql<string>`MIN(${schema.purchaseOrders.orderDate})`
      })
      .from(schema.suppliers)
      .leftJoin(schema.purchaseOrders, eq(schema.suppliers.id, schema.purchaseOrders.supplierId))
      .where(and(
        eq(schema.suppliers.userId, userId),
        eq(schema.suppliers.id, supplierId)
      ))
      .groupBy(schema.suppliers.id);

    if (performance.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const p = performance[0];
    // Since we don't have actual delivery dates, use order fulfillment rate as main metric
    const orderFulfillmentRate = p.totalOrders > 0 ? (p.deliveredOrders / p.totalOrders) * 100 : 0;
    const deliveryRate = orderFulfillmentRate; // Same as fulfillment rate for now
    const overallScore = orderFulfillmentRate; // Simplified scoring
    
    const result = {
      ...p,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      orderFulfillmentRate: Math.round(orderFulfillmentRate * 100) / 100,
      overallScore: Math.round(overallScore * 100) / 100,
      avgDeliveryDays: 0 // Not available without deliveryDate
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ error: 'Failed to fetch supplier performance' });
  }
});

export default router;