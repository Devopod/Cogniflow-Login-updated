import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or, gt, lt } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();

// Middleware to get user ID
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1; // Fallback for development
};

// Get inventory dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const metricsQuery = sql`
      SELECT 
        COUNT(DISTINCT p.id) as total_items,
        SUM(p.price * i.quantity) as total_value,
        COUNT(CASE WHEN i.quantity <= p.reorder_point THEN 1 END) as low_stock_items,
        COUNT(DISTINCT w.id) as warehouse_count,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_items,
        COUNT(CASE WHEN i.expiry_date < CURRENT_DATE + INTERVAL '30 days' AND i.expiry_date > CURRENT_DATE THEN 1 END) as expiring_soon
      FROM ${schema.products} p
      LEFT JOIN ${schema.inventory} i ON p.id = i.product_id
      LEFT JOIN ${schema.warehouses} w ON i.warehouse_id = w.id
      WHERE p.user_id = ${userId}
    `;
    
    const [metrics] = await db.execute(metricsQuery);
    
    // Calculate additional metrics
    const avgInventoryDays = 75; // This would be calculated based on turnover
    const stockTurnover = 4.3; // This would be calculated from sales data
    const inventoryToSalesRatio = 0.32; // This would be calculated from sales data
    const deadStock = 12; // Items with no movement in X days
    
    const result = {
      totalItems: Number(metrics.total_items) || 0,
      totalValue: Number(metrics.total_value) || 0,
      lowStockItems: Number(metrics.low_stock_items) || 0,
      warehouseCount: Number(metrics.warehouse_count) || 0,
      activeItems: Number(metrics.active_items) || 0,
      expiringSoon: Number(metrics.expiring_soon) || 0,
      avgInventoryDays,
      stockTurnover,
      inventoryToSalesRatio,
      deadStock
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching inventory dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all products with pagination and filtering
router.get('/products', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, category, status, warehouse } = req.query;
    
    let query = db
      .select({
        product: schema.products,
        inventory: sql`COALESCE(SUM(${schema.inventory.quantity}), 0) as total_quantity`,
        warehouses: sql`ARRAY_AGG(DISTINCT ${schema.warehouses.name}) FILTER (WHERE ${schema.warehouses.name} IS NOT NULL) as warehouse_names`
      })
      .from(schema.products)
      .leftJoin(schema.inventory, eq(schema.products.id, schema.inventory.productId))
      .leftJoin(schema.warehouses, eq(schema.inventory.warehouseId, schema.warehouses.id))
      .where(eq(schema.products.userId, userId))
      .groupBy(schema.products.id);
    
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

// Get all warehouses
router.get('/warehouses', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const warehouses = await db
      .select({
        warehouse: schema.warehouses,
        totalItems: sql`COUNT(DISTINCT ${schema.inventory.productId}) as total_items`,
        totalQuantity: sql`COALESCE(SUM(${schema.inventory.quantity}), 0) as total_quantity`
      })
      .from(schema.warehouses)
      .leftJoin(schema.inventory, eq(schema.warehouses.id, schema.inventory.warehouseId))
      .where(eq(schema.warehouses.userId, userId))
      .groupBy(schema.warehouses.id)
      .orderBy(desc(schema.warehouses.createdAt));
    
    res.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// Create new warehouse
router.post('/warehouses', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const warehouseData = { ...req.body, userId };
    
    const [newWarehouse] = await db.insert(schema.warehouses).values(warehouseData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'warehouses', {
      type: 'warehouse_created',
      data: newWarehouse
    });
    
    res.status(201).json(newWarehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

// Update warehouse
router.put('/warehouses/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const warehouseId = parseInt(req.params.id);
    
    const [updatedWarehouse] = await db
      .update(schema.warehouses)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.warehouses.id, warehouseId), eq(schema.warehouses.userId, userId)))
      .returning();
    
    if (!updatedWarehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'warehouses', {
      type: 'warehouse_updated',
      data: updatedWarehouse
    });
    
    res.json(updatedWarehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

// Get stock levels with low stock alerts
router.get('/stock', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { lowStock = false, warehouse } = req.query;
    
    let query = db
      .select({
        product: schema.products,
        inventory: schema.inventory,
        warehouse: {
          id: schema.warehouses.id,
          name: schema.warehouses.name,
          code: schema.warehouses.code
        }
      })
      .from(schema.inventory)
      .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
      .innerJoin(schema.warehouses, eq(schema.inventory.warehouseId, schema.warehouses.id))
      .where(eq(schema.products.userId, userId));
    
    if (lowStock === 'true') {
      query = query.where(sql`${schema.inventory.quantity} <= ${schema.products.reorderPoint}`);
    }
    
    if (warehouse) {
      query = query.where(eq(schema.warehouses.id, parseInt(warehouse as string)));
    }
    
    const stockLevels = await query.orderBy(asc(schema.inventory.quantity));
    
    res.json(stockLevels);
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({ error: 'Failed to fetch stock levels' });
  }
});

// Adjust stock levels
router.post('/stock/adjust', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId, warehouseId, adjustment, type, notes } = req.body;
    
    // Check if inventory record exists
    const existingInventory = await db
      .select()
      .from(schema.inventory)
      .where(
        and(
          eq(schema.inventory.productId, productId),
          eq(schema.inventory.warehouseId, warehouseId)
        )
      )
      .limit(1);
    
    let updatedInventory;
    
    if (existingInventory.length > 0) {
      // Update existing inventory
      const currentQuantity = existingInventory[0].quantity;
      const newQuantity = type === 'increase' 
        ? currentQuantity + adjustment 
        : Math.max(0, currentQuantity - adjustment);
      
      [updatedInventory] = await db
        .update(schema.inventory)
        .set({ 
          quantity: newQuantity,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(schema.inventory.productId, productId),
            eq(schema.inventory.warehouseId, warehouseId)
          )
        )
        .returning();
    } else {
      // Create new inventory record
      [updatedInventory] = await db
        .insert(schema.inventory)
        .values({
          productId,
          warehouseId,
          quantity: type === 'increase' ? adjustment : 0
        })
        .returning();
    }
    
    // Create transaction record
    await db.insert(schema.inventoryTransactions).values({
      userId,
      productId,
      warehouseId,
      type: 'adjustment',
      quantity: type === 'increase' ? adjustment : -adjustment,
      notes,
      transactionDate: new Date()
    });
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'stock', {
      type: 'stock_adjusted',
      data: { inventory: updatedInventory, adjustment, type }
    });
    
    res.json(updatedInventory);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Transfer stock between warehouses
router.post('/stock/transfer', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    
    // Check source warehouse has enough stock
    const sourceInventory = await db
      .select()
      .from(schema.inventory)
      .where(
        and(
          eq(schema.inventory.productId, productId),
          eq(schema.inventory.warehouseId, fromWarehouseId)
        )
      )
      .limit(1);
    
    if (!sourceInventory.length || sourceInventory[0].quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock in source warehouse' });
    }
    
    // Reduce stock from source warehouse
    await db
      .update(schema.inventory)
      .set({ 
        quantity: sourceInventory[0].quantity - quantity,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(schema.inventory.productId, productId),
          eq(schema.inventory.warehouseId, fromWarehouseId)
        )
      );
    
    // Check if destination warehouse has the product
    const destInventory = await db
      .select()
      .from(schema.inventory)
      .where(
        and(
          eq(schema.inventory.productId, productId),
          eq(schema.inventory.warehouseId, toWarehouseId)
        )
      )
      .limit(1);
    
    if (destInventory.length > 0) {
      // Update existing inventory
      await db
        .update(schema.inventory)
        .set({ 
          quantity: destInventory[0].quantity + quantity,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(schema.inventory.productId, productId),
            eq(schema.inventory.warehouseId, toWarehouseId)
          )
        );
    } else {
      // Create new inventory record
      await db
        .insert(schema.inventory)
        .values({
          productId,
          warehouseId: toWarehouseId,
          quantity
        });
    }
    
    // Create transaction records
    await db.insert(schema.inventoryTransactions).values([
      {
        userId,
        productId,
        warehouseId: fromWarehouseId,
        type: 'transfer',
        quantity: -quantity,
        notes: `Transfer to warehouse ${toWarehouseId}: ${notes}`,
        transactionDate: new Date()
      },
      {
        userId,
        productId,
        warehouseId: toWarehouseId,
        type: 'transfer',
        quantity: quantity,
        notes: `Transfer from warehouse ${fromWarehouseId}: ${notes}`,
        transactionDate: new Date()
      }
    ]);
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('inventory', 'stock', {
      type: 'stock_transferred',
      data: { productId, fromWarehouseId, toWarehouseId, quantity }
    });
    
    res.json({ message: 'Stock transferred successfully' });
  } catch (error) {
    console.error('Error transferring stock:', error);
    res.status(500).json({ error: 'Failed to transfer stock' });
  }
});

// Get inventory transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, type, productId, warehouseId } = req.query;
    
    let query = db
      .select({
        transaction: schema.inventoryTransactions,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku
        },
        warehouse: {
          id: schema.warehouses.id,
          name: schema.warehouses.name,
          code: schema.warehouses.code
        }
      })
      .from(schema.inventoryTransactions)
      .innerJoin(schema.products, eq(schema.inventoryTransactions.productId, schema.products.id))
      .leftJoin(schema.warehouses, eq(schema.inventoryTransactions.warehouseId, schema.warehouses.id))
      .where(eq(schema.inventoryTransactions.userId, userId));
    
    if (type) {
      query = query.where(eq(schema.inventoryTransactions.type, type as string));
    }
    
    if (productId) {
      query = query.where(eq(schema.inventoryTransactions.productId, parseInt(productId as string)));
    }
    
    if (warehouseId) {
      query = query.where(eq(schema.inventoryTransactions.warehouseId, parseInt(warehouseId as string)));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const transactions = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.inventoryTransactions.transactionDate));
    
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const lowStockItems = await db
      .select({
        product: schema.products,
        inventory: schema.inventory,
        warehouse: {
          id: schema.warehouses.id,
          name: schema.warehouses.name
        },
        shortfall: sql`${schema.products.reorderPoint} - ${schema.inventory.quantity} as shortfall`
      })
      .from(schema.inventory)
      .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
      .innerJoin(schema.warehouses, eq(schema.inventory.warehouseId, schema.warehouses.id))
      .where(
        and(
          eq(schema.products.userId, userId),
          sql`${schema.inventory.quantity} <= ${schema.products.reorderPoint}`
        )
      )
      .orderBy(asc(schema.inventory.quantity));
    
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
});

// Get expiring items
router.get('/alerts/expiring', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { days = 30 } = req.query;
    
    const expiringItems = await db
      .select({
        product: schema.products,
        inventory: schema.inventory,
        warehouse: {
          id: schema.warehouses.id,
          name: schema.warehouses.name
        },
        daysToExpiry: sql`${schema.inventory.expiryDate} - CURRENT_DATE as days_to_expiry`
      })
      .from(schema.inventory)
      .innerJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
      .innerJoin(schema.warehouses, eq(schema.inventory.warehouseId, schema.warehouses.id))
      .where(
        and(
          eq(schema.products.userId, userId),
          sql`${schema.inventory.expiryDate} IS NOT NULL`,
          sql`${schema.inventory.expiryDate} <= CURRENT_DATE + INTERVAL '${days} days'`,
          sql`${schema.inventory.expiryDate} > CURRENT_DATE`
        )
      )
      .orderBy(asc(schema.inventory.expiryDate));
    
    res.json(expiringItems);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

// Get inventory value report
router.get('/reports/value', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { warehouseId } = req.query;
    
    let query = db
      .select({
        product: schema.products,
        totalQuantity: sql`SUM(${schema.inventory.quantity}) as total_quantity`,
        totalValue: sql`SUM(${schema.inventory.quantity} * ${schema.products.price}) as total_value`,
        totalCost: sql`SUM(${schema.inventory.quantity} * ${schema.products.costPrice}) as total_cost`,
        warehouseCount: sql`COUNT(DISTINCT ${schema.inventory.warehouseId}) as warehouse_count`
      })
      .from(schema.products)
      .innerJoin(schema.inventory, eq(schema.products.id, schema.inventory.productId))
      .where(eq(schema.products.userId, userId))
      .groupBy(schema.products.id);
    
    if (warehouseId) {
      query = query.where(eq(schema.inventory.warehouseId, parseInt(warehouseId as string)));
    }
    
    const valueReport = await query.orderBy(desc(sql`total_value`));
    
    // Calculate summary
    const summary = valueReport.reduce((acc, item) => ({
      totalItems: acc.totalItems + 1,
      totalQuantity: acc.totalQuantity + Number(item.totalQuantity),
      totalValue: acc.totalValue + Number(item.totalValue),
      totalCost: acc.totalCost + Number(item.totalCost)
    }), { totalItems: 0, totalQuantity: 0, totalValue: 0, totalCost: 0 });
    
    res.json({ items: valueReport, summary });
  } catch (error) {
    console.error('Error generating value report:', error);
    res.status(500).json({ error: 'Failed to generate value report' });
  }
});

export default router;