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