import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or } from 'drizzle-orm';
import { WSService } from '../../websocket';

const router = Router();

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
    
    const metricsRes: any = await db.execute(metricsQuery);
    const dealsRes: any = await db.execute(dealsQuery);
    const metricsRow = (metricsRes?.rows && metricsRes.rows[0]) || {};
    const dealsRow = (dealsRes?.rows && dealsRes.rows[0]) || {};
    
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
    console.error('Error fetching CRM dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// NEW: Metrics endpoint to match client hooks
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const leadsCountRes: any = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM ${schema.leads} WHERE user_id = ${userId}
    `);
    const contactsCountRes: any = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM ${schema.contacts} WHERE user_id = ${userId} AND status = 'active'
    `);
    const customersCountRes: any = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM ${schema.contacts} WHERE user_id = ${userId} AND type = 'customer' AND status = 'active'
    `);
    const dealsAggRes: any = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'open')::int AS open_deals,
        SUM(CASE WHEN status = 'open' THEN value ELSE 0 END) AS total_deal_value,
        COUNT(*) FILTER (WHERE status = 'won')::int AS won_deals,
        COUNT(*) FILTER (WHERE status IN ('won','lost'))::int AS closed_deals
      FROM ${schema.deals}
      WHERE user_id = ${userId}
    `);

    const leadsCount = leadsCountRes?.rows?.[0]?.count || 0;
    const contactsCount = contactsCountRes?.rows?.[0]?.count || 0;
    const customersCount = customersCountRes?.rows?.[0]?.count || 0;
    const openDeals = dealsAggRes?.rows?.[0]?.open_deals || 0;
    const totalDealValue = Number(dealsAggRes?.rows?.[0]?.total_deal_value) || 0;
    const wonDeals = dealsAggRes?.rows?.[0]?.won_deals || 0;
    const closedDeals = dealsAggRes?.rows?.[0]?.closed_deals || 0;
    const conversionRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 1000) / 10 : 0;

    res.json({
      totalLeads: leadsCount,
      totalContacts: contactsCount,
      totalCustomers: customersCount,
      openDeals,
      totalDealValue,
      wonDeals,
      conversionRate,
    });
  } catch (error) {
    console.error('Error fetching CRM metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get lead analytics
router.get('/lead-analytics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const leadSourcesQuery = sql`
      SELECT 
        COALESCE(source, 'Unknown') AS source,
        COUNT(*)::int as count
      FROM ${schema.leads} 
      WHERE user_id = ${userId}
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const result: any = await db.execute(leadSourcesQuery);
    const rows = result?.rows || [];
    
    const leadSources = rows.map((row: any) => ({
      source: row.source || 'Unknown',
      count: Number(row.count) || 0
    }));
    
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
  }
});

// Backward-compat alias (if used anywhere)
router.get('/lead-source-analytics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result: any = await db.execute(sql`
      SELECT 
        COALESCE(source, 'Unknown') AS source,
        COUNT(*)::int as count
      FROM ${schema.leads} 
      WHERE user_id = ${userId}
      GROUP BY source
      ORDER BY count DESC
    `);
    const rows = result?.rows || [];
    res.json({ leadSources: rows.map((row: any) => ({ source: row.source, count: Number(row.count) })) });
  } catch (error) {
    console.error('Error fetching lead source analytics:', error);
    res.status(500).json({ error: 'Failed to fetch lead source analytics' });
  }
});

// Get pipeline analytics
router.get('/pipeline', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const pipelineQuery = sql`
      SELECT 
        stage,
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0) as total_value
      FROM ${schema.deals} 
      WHERE user_id = ${userId} AND status = 'open'
      GROUP BY stage
      ORDER BY total_value DESC
    `;
    
    const result: any = await db.execute(pipelineQuery);
    const rows = result?.rows || [];
    
    const stages = rows.map((row: any) => ({
      stage: row.stage || 'Unknown',
      count: Number(row.count) || 0,
      totalValue: Number(row.total_value) || 0
    }));
    
    res.json(stages);
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline analytics' });
  }
});

// Conversion funnel
router.get('/conversion-funnel', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadsRes: any = await db.execute(sql`SELECT COUNT(*)::int AS total FROM ${schema.leads} WHERE user_id = ${userId}`);
    const qualifiedRes: any = await db.execute(sql`SELECT COUNT(*)::int AS total FROM ${schema.leads} WHERE user_id = ${userId} AND status = 'qualified'`);
    const dealsRes: any = await db.execute(sql`SELECT COUNT(*)::int AS total FROM ${schema.deals} WHERE user_id = ${userId}`);
    const wonRes: any = await db.execute(sql`SELECT COUNT(*)::int AS total FROM ${schema.deals} WHERE user_id = ${userId} AND status = 'won'`);

    const totalLeads = leadsRes?.rows?.[0]?.total || 0;
    const qualifiedLeads = qualifiedRes?.rows?.[0]?.total || 0;
    const totalDeals = dealsRes?.rows?.[0]?.total || 0;
    const wonDeals = wonRes?.rows?.[0]?.total || 0;

    res.json({ totalLeads, qualifiedLeads, totalDeals, wonDeals });
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({ error: 'Failed to fetch conversion funnel' });
  }
});

// ================= Contacts =================
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
    if (wsService) {
      wsService.broadcastToResource('crm', 'contacts', 'contact_created', newContact);
    }
    
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
    if (wsService) {
      wsService.broadcastToResource('crm', 'contacts', 'contact_updated', updatedContact);
    }
    
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
    if (wsService) {
      wsService.broadcastToResource('crm', 'contacts', 'contact_deleted', { id: contactId });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// ================= Leads =================
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, status, source, priority } = req.query as any;

    let base = sql`FROM ${schema.leads} WHERE user_id = ${userId}`;
    const clauses: any[] = [];
    if (status) clauses.push(sql`status = ${status}`);
    if (source) clauses.push(sql`source = ${source}`);
    if (priority) clauses.push(sql`priority = ${priority}`);
    if (search) clauses.push(sql`(LOWER(first_name) LIKE ${'%' + String(search).toLowerCase() + '%'} OR LOWER(last_name) LIKE ${'%' + String(search).toLowerCase() + '%'} OR LOWER(company) LIKE ${'%' + String(search).toLowerCase() + '%'})`);

    let whereSql = base;
    if (clauses.length > 0) {
      whereSql = sql`${base} AND ${sql.join(clauses, sql` AND `)}`;
    }

    const listRes: any = await db.execute(sql`
      SELECT * ${whereSql} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}
    `);
    const countRes: any = await db.execute(sql`SELECT COUNT(*)::int AS total ${whereSql}`);

    res.json({
      items: listRes?.rows || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countRes?.rows?.[0]?.total || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.post('/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [lead] = await db.insert(schema.leads).values({ ...req.body, userId }).returning();

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'leads', 'lead_created', lead);
    }

    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [lead] = await db.update(schema.leads).set({ ...req.body, updatedAt: new Date() }).where(and(eq(schema.leads.id, id), eq(schema.leads.userId, userId))).returning();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'leads', 'lead_updated', lead);
    }

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

router.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.leads).where(and(eq(schema.leads.id, id), eq(schema.leads.userId, userId))).returning();
    if (!deleted) return res.status(404).json({ error: 'Lead not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'leads', 'lead_deleted', { id });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

router.post('/leads/:id/convert', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const leadRes: any = await db.execute(sql`SELECT * FROM ${schema.leads} WHERE id = ${id} AND user_id = ${userId} LIMIT 1`);
    const lead = leadRes?.rows?.[0];
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const [contact] = await db.insert(schema.contacts).values({
      userId,
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: 'active',
      type: 'contact',
    }).returning();

    await db.update(schema.leads).set({ status: 'converted', updatedAt: new Date() }).where(and(eq(schema.leads.id, id), eq(schema.leads.userId, userId)));

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'leads', 'lead_converted', { leadId: id, contact });
    }

    res.json({ success: true, contact });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

// Optional simple import endpoint to satisfy client
router.post('/leads/import', async (_req: Request, res: Response) => {
  try {
    // In a full implementation, parse CSV and insert rows
    res.json({ success: 0, errors: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import leads' });
  }
});

// ================= Deals =================
// Get all deals with joins to contacts
router.get('/deals', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, stage, status } = req.query as any;
    
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
    if (wsService) {
      wsService.broadcastToResource('crm', 'deals', 'deal_created', newDeal);
    }
    
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
    if (wsService) {
      wsService.broadcastToResource('crm', 'deals', 'deal_updated', updatedDeal);
    }
    
    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// ================= Tasks =================
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const assignedTo = req.query.assignedTo ? Number(req.query.assignedTo) : undefined;

    const result = await db
      .select()
      .from(schema.tasks)
      .where(assignedTo ? and(eq(schema.tasks.userId, userId), eq(schema.tasks.assignedTo, assignedTo)) : eq(schema.tasks.userId, userId))
      .orderBy(desc(schema.tasks.createdAt));

    res.json(result);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get upcoming tasks
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

router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [task] = await db.insert(schema.tasks).values({ ...req.body, userId }).returning();

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'tasks', 'task_created', task);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [task] = await db.update(schema.tasks).set({ ...req.body, updatedAt: new Date() }).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId))).returning();
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'tasks', 'task_updated', task);
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.post('/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [task] = await db.update(schema.tasks).set({ status: 'completed', updatedAt: new Date() }).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId))).returning();
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'tasks', 'task_completed', task);
    }

    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.tasks).where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, userId))).returning();
    if (!deleted) return res.status(404).json({ error: 'Task not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'tasks', 'task_deleted', { id });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ================= Activities =================
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result = await db.select().from(schema.activities).where(eq(schema.activities.userId, userId)).orderBy(desc(schema.activities.createdAt));
    res.json(result);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
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
      .sort((a, b) => new Date((b as any).timestamp).getTime() - new Date((a as any).timestamp).getTime())
      .slice(0, 10);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

router.post('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [activity] = await db.insert(schema.activities).values({ ...req.body, userId }).returning();

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'activities', 'activity_created', activity);
    }

    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

router.put('/activities/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [activity] = await db.update(schema.activities).set({ ...req.body, updatedAt: new Date() }).where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId))).returning();
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'activities', 'activity_updated', activity);
    }

    res.json(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

router.delete('/activities/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.activities).where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId))).returning();
    if (!deleted) return res.status(404).json({ error: 'Activity not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'activities', 'activity_deleted', { id });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ================= Companies =================
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const rows = await db.select().from(schema.crmCompanies).where(eq(schema.crmCompanies.userId, userId)).orderBy(desc(schema.crmCompanies.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/companies', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [company] = await db.insert(schema.crmCompanies).values({ ...req.body, userId }).returning();

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'companies', 'company_created', company);
    }

    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.put('/companies/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [company] = await db.update(schema.crmCompanies).set({ ...req.body, updatedAt: new Date() }).where(and(eq(schema.crmCompanies.id, id), eq(schema.crmCompanies.userId, userId))).returning();
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'companies', 'company_updated', company);
    }

    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

router.delete('/companies/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.crmCompanies).where(and(eq(schema.crmCompanies.id, id), eq(schema.crmCompanies.userId, userId))).returning();
    if (!deleted) return res.status(404).json({ error: 'Company not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'companies', 'company_deleted', { id });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// ================= Phone Calls =================
router.get('/phone-calls', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const contactId = req.query.contactId ? Number(req.query.contactId) : undefined;
    const rows = await db
      .select()
      .from(schema.phoneCallsTable)
      .where(contactId ? and(eq(schema.phoneCallsTable.userId, userId), eq(schema.phoneCallsTable.contactId, contactId)) : eq(schema.phoneCallsTable.userId, userId))
      .orderBy(desc(schema.phoneCallsTable.createdAt));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching phone calls:', error);
    res.status(500).json({ error: 'Failed to fetch phone calls' });
  }
});

router.post('/phone-calls', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [call] = await db.insert(schema.phoneCallsTable).values({ ...req.body, userId }).returning();

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'phone-calls', 'phone_call_created', call);
    }

    res.status(201).json(call);
  } catch (error) {
    console.error('Error creating phone call:', error);
    res.status(500).json({ error: 'Failed to create phone call' });
  }
});

router.put('/phone-calls/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [call] = await db.update(schema.phoneCallsTable).set({ ...req.body, updatedAt: new Date() }).where(and(eq(schema.phoneCallsTable.id, id), eq(schema.phoneCallsTable.userId, userId))).returning();
    if (!call) return res.status(404).json({ error: 'Phone call not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'phone-calls', 'phone_call_updated', call);
    }

    res.json(call);
  } catch (error) {
    console.error('Error updating phone call:', error);
    res.status(500).json({ error: 'Failed to update phone call' });
  }
});

router.delete('/phone-calls/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.phoneCallsTable).where(and(eq(schema.phoneCallsTable.id, id), eq(schema.phoneCallsTable.userId, userId))).returning();
    if (!deleted) return res.status(404).json({ error: 'Phone call not found' });

    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', 'phone-calls', 'phone_call_deleted', { id });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting phone call:', error);
    res.status(500).json({ error: 'Failed to delete phone call' });
  }
});

// ================= Deal Stages =================
router.get('/deal-stages', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const rows = await db.select().from(schema.dealStages).where(eq(schema.dealStages.userId, userId)).orderBy(asc(schema.dealStages.order));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching deal stages:', error);
    res.status(500).json({ error: 'Failed to fetch deal stages' });
  }
});

router.post('/deal-stages', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [stage] = await db.insert(schema.dealStages).values({ ...req.body, userId }).returning();
    res.status(201).json(stage);
  } catch (error) {
    console.error('Error creating deal stage:', error);
    res.status(500).json({ error: 'Failed to create deal stage' });
  }
});

router.put('/deal-stages/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [stage] = await db.update(schema.dealStages).set({ ...req.body, updatedAt: new Date() }).where(and(eq(schema.dealStages.id, id), eq(schema.dealStages.userId, userId))).returning();
    if (!stage) return res.status(404).json({ error: 'Deal stage not found' });
    res.json(stage);
  } catch (error) {
    console.error('Error updating deal stage:', error);
    res.status(500).json({ error: 'Failed to update deal stage' });
  }
});

router.post('/deal-stages/reorder', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const stageOrders: { id: number; order: number }[] = req.body?.stageOrders || [];
    for (const s of stageOrders) {
      await db.update(schema.dealStages).set({ order: s.order, updatedAt: new Date() }).where(and(eq(schema.dealStages.id, s.id), eq(schema.dealStages.userId, userId)));
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering deal stages:', error);
    res.status(500).json({ error: 'Failed to reorder deal stages' });
  }
});

router.delete('/deal-stages/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const [deleted] = await db.delete(schema.dealStages).where(and(eq(schema.dealStages.id, id), eq(schema.dealStages.userId, userId))).returning();
    if (!deleted) return res.status(404).json({ error: 'Deal stage not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal stage:', error);
    res.status(500).json({ error: 'Failed to delete deal stage' });
  }
});

export default router;