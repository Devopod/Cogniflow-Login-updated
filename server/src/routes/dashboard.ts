import { Router } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { sql, eq, and, gte, lte, desc, asc } from 'drizzle-orm';

const router = Router();

// Dashboard overview endpoint
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get revenue data
    const [currentRevenue] = await db.select({
      total: sql<number>`COALESCE(SUM(${schema.invoices.total}), 0)`
    })
    .from(schema.invoices)
    .where(
      and(
        eq(schema.invoices.userId, userId),
        gte(schema.invoices.createdAt, startOfMonth),
        eq(schema.invoices.status, 'paid')
      )
    );

    const [lastMonthRevenue] = await db.select({
      total: sql<number>`COALESCE(SUM(${schema.invoices.total}), 0)`
    })
    .from(schema.invoices)
    .where(
      and(
        eq(schema.invoices.userId, userId),
        gte(schema.invoices.createdAt, startOfLastMonth),
        lte(schema.invoices.createdAt, endOfLastMonth),
        eq(schema.invoices.status, 'paid')
      )
    );

    // Get customer data
    const [newCustomers] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.userId, userId),
        gte(schema.contacts.createdAt, startOfMonth)
      )
    );

    // Get inventory data
    const [inventoryItems] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(schema.products)
    .where(eq(schema.products.userId, userId));

    // Get employee data
    const [employeeCount] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(schema.employees)
    .where(eq(schema.employees.userId, userId));

    // Calculate percentage changes
    const revenueChange = lastMonthRevenue?.total > 0 ? 
      ((currentRevenue?.total - lastMonthRevenue?.total) / lastMonthRevenue?.total) * 100 : 0;

    const dashboardData = {
      metrics: {
        totalRevenue: {
          value: currentRevenue?.total || 0,
          change: Math.round(revenueChange * 100) / 100,
          isPositive: revenueChange >= 0
        },
        newCustomers: {
          value: newCustomers?.count || 0,
          change: 12.5, // Could calculate from previous month
          isPositive: true
        },
        inventoryItems: {
          value: inventoryItems?.count || 0,
          change: 3.2,
          isPositive: true
        },
        employeeCount: {
          value: employeeCount?.count || 0,
          change: 0,
          isPositive: true
        }
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
