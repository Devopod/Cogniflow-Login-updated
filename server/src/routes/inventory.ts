import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();

// Middleware to get user ID
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1;
};

// Get inventory dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    // Get inventory metrics using SQL queries
    const metricsQuery = sql`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity > 0 THEN (quantity * unit_price) ELSE 0 END) as total_value,
        COUNT(CASE WHEN quantity <= reorder_level AND quantity > 0 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items,
        COUNT(CASE WHEN status = 'discontinued' THEN 1 END) as dead_stock,
        COUNT(DISTINCT location) as warehouse_count,
        AVG(CASE WHEN quantity > 0 THEN quantity ELSE NULL END) as avg_stock_level
      FROM ${schema.products} 
      WHERE user_id = ${userId}
    `;
    
    const [metricsResult] = await db.execute(metricsQuery);
    
    // Calculate additional metrics
    const inventoryTurnoverQuery = sql`
      SELECT 
        COALESCE(AVG(quantity), 0) as avg_inventory,
        30 as avg_inventory_days
      FROM ${schema.products}
      WHERE user_id = ${userId} AND quantity > 0
    `;
    
    const [turnoverResult] = await db.execute(inventoryTurnoverQuery);
    
    const metrics = {
      totalItems: Number(metricsResult.total_items) || 0,
      totalValue: Number(metricsResult.total_value) || 0,
      lowStockItems: Number(metricsResult.low_stock_items) || 0,
      outOfStockItems: Number(metricsResult.out_of_stock_items) || 0,
      deadStock: Number(metricsResult.dead_stock) || 0,
      warehouseCount: Number(metricsResult.warehouse_count) || 1,
      stockTurnover: 12.5, // Mock calculation
      avgInventoryDays: Number(turnoverResult.avg_inventory_days) || 30,
      inventoryToSalesRatio: 0.15, // Mock calculation
      expiringSoon: 3 // Mock data for now
    };
    
    res.json([metrics]); // Return as array for consistency with frontend
  } catch (error) {
    console.error('Error fetching inventory dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all products with filtering and pagination
router.get('/products', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, category, status, location } = req.query;
    
    let query = db.select().from(schema.products).where(eq(schema.products.userId, userId));
    
    // Add filters
    if (search) {
      query = query.where(
        or(
          ilike(schema.products.name, `%${search}%`),
          ilike(schema.products.sku, `%${search}%`),
          ilike(schema.products.description, `%${search}%`)
        )
      );
    }
    
    if (category) {
      query = query.where(eq(schema.products.category, category as string));
    }
    
    if (status) {
      query = query.where(eq(schema.products.status, status as string));
    }
    
    if (location) {
      query = query.where(eq(schema.products.location, location as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const products = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.products.createdAt));
    
    // Get total count for pagination
    const totalQuery = db.select({ count: sql`count(*)` }).from(schema.products).where(eq(schema.products.userId, userId));
    const [{ count }] = await totalQuery;
    
    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productId = parseInt(req.params.id);
    
    const [product] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productData = { ...req.body, userId };
    
    const [newProduct] = await db.insert(schema.products).values(productData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'products', {
      type: 'product_created',
      data: newProduct
    });
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productId = parseInt(req.params.id);
    
    const [updatedProduct] = await db
      .update(schema.products)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)))
      .returning();
    
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'products', {
      type: 'product_updated',
      data: updatedProduct
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productId = parseInt(req.params.id);
    
    const [deletedProduct] = await db
      .delete(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)))
      .returning();
    
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'products', {
      type: 'product_deleted',
      data: { id: productId }
    });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Adjust stock levels
router.post('/products/:id/adjust-stock', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productId = parseInt(req.params.id);
    const { adjustment, reason } = req.body;
    
    // Get current product
    const [product] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const newQuantity = (product.quantity || 0) + Number(adjustment);
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock for adjustment' });
    }
    
    // Update product quantity
    const [updatedProduct] = await db
      .update(schema.products)
      .set({ 
        quantity: newQuantity,
        updatedAt: new Date()
      })
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)))
      .returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'stock', {
      type: 'stock_adjusted',
      data: {
        product: updatedProduct,
        adjustment: Number(adjustment),
        reason,
        oldQuantity: product.quantity,
        newQuantity
      }
    });
    
    res.json({
      product: updatedProduct,
      adjustment: Number(adjustment),
      oldQuantity: product.quantity,
      newQuantity
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Get low stock products
router.get('/products/alerts/low-stock', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const lowStockProducts = await db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.userId, userId),
          sql`${schema.products.stockQuantity} <= COALESCE(${schema.products.reorderPoint}, 0)`
        )
      )
      .orderBy(asc(schema.products.stockQuantity));
    
    res.json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get stock movements (basic implementation using purchase order items and adjustments)
router.get('/stock-movements', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.query;

    // Movements from purchase order receipts (receivedQuantity > 0)
    const poMovements = await db
      .select({
        id: schema.purchaseOrderItems.id,
        productId: schema.purchaseOrderItems.productId,
        type: sql<string>`'receipt'`,
        quantity: schema.purchaseOrderItems.receivedQuantity,
        reason: sql<string>`'PO Receipt'`,
        timestamp: schema.purchaseOrderItems.updatedAt,
      })
      .from(schema.purchaseOrderItems)
      .leftJoin(schema.purchaseOrders, eq(schema.purchaseOrderItems.purchaseOrderId, schema.purchaseOrders.id))
      .where(
        and(
          eq(schema.purchaseOrders.userId, userId),
          sql`${schema.purchaseOrderItems.receivedQuantity} > 0`,
          productId ? eq(schema.purchaseOrderItems.productId, Number(productId)) : sql`TRUE`
        )
      );

    // Movements from manual adjustments captured via product updates (simple heuristic: quantity change)
    // Note: For production-grade, create dedicated stock_movements table. This is a lightweight interim.
    const productMovements = await db
      .select({
        id: schema.products.id,
        productId: schema.products.id,
        type: sql<string>`'adjustment'`,
        quantity: sql<number>`0`,
        reason: sql<string>`'Manual Adjustment'`,
        timestamp: schema.products.updatedAt
      })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.userId, userId),
          productId ? eq(schema.products.id, Number(productId)) : sql`TRUE`
        )
      )
      .limit(1000);

    const movements = [...poMovements, ...productMovements]
      .sort((a: any, b: any) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime())
      .slice(0, 500);

    res.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// Bulk import products
router.post('/products/import', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No products provided for import' });
    }
    
    const productsWithUserId = products.map(product => ({ ...product, userId }));
    
    const insertedProducts = await db.insert(schema.products).values(productsWithUserId).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'products', {
      type: 'products_imported',
      data: {
        products: insertedProducts,
        count: insertedProducts.length
      }
    });
    
    res.json({
      success: insertedProducts.length,
      products: insertedProducts
    });
  } catch (error) {
    console.error('Error importing products:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
});

export default router;