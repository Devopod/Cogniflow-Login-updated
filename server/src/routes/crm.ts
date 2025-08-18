import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();

// Safe execute wrapper: returns [] on error and normalizes result shape
async function safeExecuteRows(query: any): Promise<any[]> {
  try {
    const exec: any = await db.execute(query);
    if (Array.isArray(exec)) return exec;
    if (exec && Array.isArray((exec as any).rows)) return (exec as any).rows;
    return [];
  } catch (err) {
    console.error('SQL execute failed:', err);
    return [];
  }
}

// Middleware to get user ID (assuming authentication middleware sets req.user)
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1; // Fallback for development
};

// Get CRM dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    // Get metrics using SQL queries for better performance
    const metricsQuery = sql`
      SELECT 
        COUNT(CASE WHEN type = 'lead' THEN 1 END) as total_leads,
        COUNT(CASE WHEN type = 'customer' THEN 1 END) as total_customers,
        COUNT(CASE WHEN type = 'contact' THEN 1 END) as total_contacts
      FROM ${schema.contacts} 
      WHERE user_id = ${userId} AND status = 'active'
    `;
    
    const dealsQuery = sql`
      SELECT 
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_deals,
        SUM(CASE WHEN status = 'open' THEN value ELSE 0 END) as total_deal_value,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won_deals,
        ROUND(
          (COUNT(CASE WHEN status = 'won' THEN 1 END)::float / 
           NULLIF(COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END), 0) * 100), 1
        ) as conversion_rate
      FROM ${schema.deals} 
      WHERE user_id = ${userId}
    `;
    
    // Execute with normalization
    const metricsRows = await safeExecuteRows(metricsQuery);
    const dealsRows = await safeExecuteRows(dealsQuery);

    const metricsRow = metricsRows[0] || {};
    const dealsRow = dealsRows[0] || {};

    const metrics = {
      totalLeads: Number(metricsRow.total_leads) || 0,
      totalContacts: Number(metricsRow.total_contacts) || 0,
      totalCustomers: Number(metricsRow.total_customers) || 0,
      openDeals: Number(dealsRow.open_deals) || 0,
      totalDealValue: Number(dealsRow.total_deal_value) || 0,
      wonDeals: Number(dealsRow.won_deals) || 0,
      conversionRate: Number(dealsRow.conversion_rate) || 0,
    };

    res.json(metrics);
  } catch (error) {
    // Log on server but return safe defaults to avoid client errors
    console.error('Error fetching CRM dashboard:', error);
    res.json({
      totalLeads: 0,
      totalContacts: 0,
      totalCustomers: 0,
      openDeals: 0,
      totalDealValue: 0,
      wonDeals: 0,
      conversionRate: 0,
    });
  }
});

// Get lead analytics
router.get('/analytics/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const leadSourcesQuery = sql`
      SELECT 
        source,
        COUNT(*) as count
      FROM ${schema.contacts} 
      WHERE user_id = ${userId} AND type = 'lead' AND status = 'active'
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const rows = await safeExecuteRows(leadSourcesQuery);

    const leadSources = rows.map((row: any) => ({
      source: row.source || 'Unknown',
      count: Number(row.count)
    }));
    
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    // Return safe empty payload to prevent client 500s
    res.json({ leadSources: [] });
  }
});

// Get pipeline analytics
router.get('/analytics/pipeline', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const pipelineQuery = sql`
      SELECT 
        stage,
        COUNT(*) as count,
        SUM(value) as total_value
      FROM ${schema.deals} 
      WHERE user_id = ${userId} AND status = 'open'
      GROUP BY stage
      ORDER BY total_value DESC
    `;
    
    const rows = await safeExecuteRows(pipelineQuery);

    const stages = rows.map((row: any) => ({
      stage: row.stage || 'Unknown',
      count: Number(row.count),
      totalValue: Number(row.total_value) || 0
    }));
    
    res.json({ stages });
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    // Return safe empty payload to prevent client 500s
    res.json({ stages: [] });
  }
});

// Convert CRM deal -> quotation or purchase request (no new endpoint, reuse existing patterns)
router.post('/deals/:id/convert', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dealId = parseInt(req.params.id);
    const { target } = req.body as { target: 'sales' | 'purchase' };

    if (isNaN(dealId) || !target) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const [deal] = await db.select().from(schema.deals).where(and(
      eq(schema.deals.id, dealId),
      eq(schema.deals.userId, userId)
    )).limit(1);

    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    if (target === 'sales') {
      // Create quotation shell from deal
      const quotationNumber = `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const [quo] = await db.insert(schema.quotations).values({
        userId,
        contactId: deal.contactId,
        quotationNumber,
        issueDate: new Date(),
        subtotal: 0,
        totalAmount: 0,
        status: 'draft',
        currency: 'USD',
        notes: deal.description || null,
        category: 'CRM',
        updatedAt: new Date(),
      }).returning();

      // Link quotation to CRM deal
      await db.execute(sql`UPDATE quotations SET crm_deal_id = ${dealId} WHERE id = ${quo.id}`);

      return res.json({ quotationId: quo.id, message: 'Deal converted to quotation' });
    }

    if (target === 'purchase') {
      // Create purchase request from deal
      const requestNumber = `PR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const [pr] = await db.insert(schema.purchaseRequests).values({
        userId,
        requestNumber,
        requestDate: new Date(),
        status: 'draft',
        notes: deal.description || null,
        totalAmount: 0,
        updatedAt: new Date(),
      }).returning();

      // Link PR to CRM deal
      await db.execute(sql`UPDATE purchase_requests SET crm_deal_id = ${dealId} WHERE id = ${pr.id}`);

      return res.json({ purchaseRequestId: pr.id, message: 'Deal converted to purchase request' });
    }

    return res.status(400).json({ error: 'Unsupported target' });
  } catch (err) {
    console.error('Error converting deal:', err);
    res.status(500).json({ error: 'Failed to convert deal' });
  }
});

// Get all contacts with pagination and filtering
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, type, status } = req.query;
    
    let query = db.select().from(schema.contacts).where(eq(schema.contacts.userId, userId));
    
    // Add filters
    if (search) {
      query = query.where(
        or(
          ilike(schema.contacts.firstName, `%${search}%`),
          ilike(schema.contacts.lastName, `%${search}%`),
          ilike(schema.contacts.email, `%${search}%`),
          ilike(schema.contacts.company, `%${search}%`)
        )
      );
    }
    
    if (type) {
      query = query.where(eq(schema.contacts.type, type as string));
    }
    
    if (status) {
      query = query.where(eq(schema.contacts.status, status as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const contacts = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.contacts.createdAt));
    
    // Get total count for pagination
    const totalQuery = db.select({ count: sql`count(*)` }).from(schema.contacts).where(eq(schema.contacts.userId, userId));
    const [{ count }] = await totalQuery;
    
    res.json({
      contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Create new contact
router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contactData = { ...req.body, userId };
    
    const [newContact] = await db.insert(schema.contacts).values(contactData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'contacts', {
      type: 'contact_created',
      data: newContact
    });
    
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
router.put('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contactId = parseInt(req.params.id);
    
    const [updatedContact] = await db
      .update(schema.contacts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.contacts.id, contactId), eq(schema.contacts.userId, userId)))
      .returning();
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'contacts', {
      type: 'contact_updated',
      data: updatedContact
    });
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contactId = parseInt(req.params.id);
    
    const [deletedContact] = await db
      .delete(schema.contacts)
      .where(and(eq(schema.contacts.id, contactId), eq(schema.contacts.userId, userId)))
      .returning();
    
    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'contacts', {
      type: 'contact_deleted',
      data: { id: contactId }
    });
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Get all deals with joins to contacts
router.get('/deals', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, stage, status } = req.query;
    
    let query = db
      .select({
        deal: schema.deals,
        contact: {
          id: schema.contacts.id,
          firstName: schema.contacts.firstName,
          lastName: schema.contacts.lastName,
          company: schema.contacts.company
        }
      })
      .from(schema.deals)
      .leftJoin(schema.contacts, eq(schema.deals.contactId, schema.contacts.id))
      .where(eq(schema.deals.userId, userId));
    
    if (stage) {
      query = query.where(eq(schema.deals.stage, stage as string));
    }
    
    if (status) {
      query = query.where(eq(schema.deals.status, status as string));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const deals = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.deals.createdAt));
    
    res.json({ deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Create new deal
router.post('/deals', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dealData = { ...req.body, userId };
    
    const [newDeal] = await db.insert(schema.deals).values(dealData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'deals', {
      type: 'deal_created',
      data: newDeal
    });
    
    res.status(201).json(newDeal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Update deal
router.put('/deals/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dealId = parseInt(req.params.id);
    
    const [updatedDeal] = await db
      .update(schema.deals)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.deals.id, dealId), eq(schema.deals.userId, userId)))
      .returning();
    
    if (!updatedDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'deals', {
      type: 'deal_updated',
      data: updatedDeal
    });
    
    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Get upcoming tasks (this would need a tasks table in real implementation)
router.get('/tasks/upcoming', async (req: Request, res: Response) => {
  try {
    // For now, return recent deals as tasks
    const userId = getUserId(req);
    
    const upcomingDeals = await db
      .select({
        id: schema.deals.id,
        title: schema.deals.title,
        type: sql`'deal'`,
        priority: schema.deals.priority,
        dueDate: schema.deals.expectedCloseDate,
        contact: sql`CONCAT(${schema.contacts.firstName}, ' ', ${schema.contacts.lastName})`
      })
      .from(schema.deals)
      .leftJoin(schema.contacts, eq(schema.deals.contactId, schema.contacts.id))
      .where(
        and(
          eq(schema.deals.userId, userId),
          eq(schema.deals.status, 'open')
        )
      )
      .orderBy(asc(schema.deals.expectedCloseDate))
      .limit(10);
    
    res.json(upcomingDeals);
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
  }
});

// Get recent activities (this would need an activities table in real implementation)
router.get('/activities/recent', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    // For now, return recent contacts and deals as activities
    const recentContacts = await db
      .select({
        id: schema.contacts.id,
        type: sql`'contact'`,
        description: sql`CONCAT('Added contact: ', ${schema.contacts.firstName}, ' ', ${schema.contacts.lastName})`,
        timestamp: schema.contacts.createdAt
      })
      .from(schema.contacts)
      .where(eq(schema.contacts.userId, userId))
      .orderBy(desc(schema.contacts.createdAt))
      .limit(5);
    
    const recentDeals = await db
      .select({
        id: schema.deals.id,
        type: sql`'deal'`,
        description: sql`CONCAT('Updated deal: ', ${schema.deals.title})`,
        timestamp: schema.deals.updatedAt
      })
      .from(schema.deals)
      .where(eq(schema.deals.userId, userId))
      .orderBy(desc(schema.deals.updatedAt))
      .limit(5);
    
    const activities = [...recentContacts, ...recentDeals]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

export default router;