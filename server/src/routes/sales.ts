import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();
let salesWS: WSService;

export function setSalesWSService(wsService: WSService) {
  salesWS = wsService;
}

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Create a new sales order
router.post('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { customerId, orderDate, status, items } = req.body;

    // Validate request body
    if (!customerId || !orderDate || !status || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the order and order items in a transaction
    const [newOrder] = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(schema.orders)
        .values({ customerId, orderDate: orderDate, status, userId })
        .returning();

      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      await tx.insert(schema.orderItems).values(orderItems);

      return [order];
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({ error: 'Failed to create sales order' });
  }
});

// Delete a sales order
router.delete('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const [deletedOrder] = await db
      .delete(schema.orders)
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)))
      .returning();

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({ error: 'Failed to delete sales order' });
  }
});

// Update a sales order
router.put('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const { customerId, orderDate, status, items } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Validate request body
    if (!customerId || !orderDate || !status || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update the order and order items in a transaction
    const [updatedOrder] = await db.transaction(async (tx) => {
      const [order] = await tx
        .update(schema.orders)
        .set({ customerId, orderDate: orderDate, status, updatedAt: new Date() })
        .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)))
        .returning();

      // Clear existing items and add new ones
      await tx.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));
      await tx.insert(schema.orderItems).values(orderItems);

      return [order];
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({ error: 'Failed to update sales order' });
  }
});

// Get a single sales order by ID
router.get('/orders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const [order] = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));

    res.json({ ...order, items });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({ error: 'Failed to fetch sales order' });
  }
});

// Get all sales orders
router.get('/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId));
    res.json(orders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

// Confirm a sales order
router.post('/orders/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Update the order status to 'confirmed'
    const [confirmedOrder] = await db
      .update(schema.orders)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(and(
        eq(schema.orders.id, orderId),
        eq(schema.orders.userId, userId)
      ))
      .returning();

    if (!confirmedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch items and deduct stock per item
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));

    for (const item of items) {
      const { productId, quantity } = item as any;
      if (!productId || !quantity) continue;

      const [product] = await db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)));

      if (!product) continue;

      const currentQty = Number((product as any).stockQuantity || 0);
      const newQuantity = currentQty - Number(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({ error: `Insufficient stock for product ${productId}` });
      }

      await db
        .update(schema.products)
        .set({ stockQuantity: newQuantity, updatedAt: new Date() })
        .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)));

      // Broadcast updated inventory for each item
      if (salesWS) {
        salesWS.broadcast('inventory-update', {
          productId,
          newQuantity,
          orderId,
          type: 'sales_to_inventory'
        });
      }
    }

    // Simple GDN log for now (PDF handled by services if needed)
    console.log(`GDN generated for order ${orderId}`);

    res.json(confirmedOrder);
  } catch (error) {
    console.error('Error confirming sales order:', error);
    res.status(500).json({ error: 'Failed to confirm sales order' });
  }
});

export default router;