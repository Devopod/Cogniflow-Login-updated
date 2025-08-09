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
    
    const [metricsResult] = await db.execute(metricsQuery);
    const [dealsResult] = await db.execute(dealsQuery);
    
    const metrics = {
      totalLeads: Number((metricsResult as any)?.total_leads) || 0,
      totalContacts: Number((metricsResult as any)?.total_contacts) || 0,
      totalCustomers: Number((metricsResult as any)?.total_customers) || 0,
      openDeals: Number((dealsResult as any)?.open_deals) || 0,
      totalDealValue: Number((dealsResult as any)?.total_deal_value) || 0,
      wonDeals: Number((dealsResult as any)?.won_deals) || 0,
      conversionRate: Number((dealsResult as any)?.conversion_rate) || 0,
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching CRM dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// New: Metrics endpoint expected by client/validator
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const metricsQuery = sql`
      SELECT 
        COUNT(CASE WHEN c.type = 'lead' THEN 1 END) as total_leads,
        COUNT(CASE WHEN c.type = 'contact' THEN 1 END) as total_contacts,
        COUNT(CASE WHEN c.type = 'customer' THEN 1 END) as total_customers
      FROM ${schema.contacts} c
      WHERE c.user_id = ${userId} AND c.status = 'active'
    `;

    const dealsQuery = sql`
      SELECT 
        COUNT(*) FILTER (WHERE d.status = 'open') as open_deals,
        COALESCE(SUM(d.value) FILTER (WHERE d.status = 'open'), 0) as total_deal_value,
        COUNT(*) FILTER (WHERE d.status = 'won') as won_deals,
        ROUND(
          (COUNT(*) FILTER (WHERE d.status = 'won'))::float / 
          NULLIF((COUNT(*) FILTER (WHERE d.status IN ('won','lost'))), 0) * 100, 1
        ) as conversion_rate
      FROM ${schema.deals} d
      WHERE d.user_id = ${userId}
    `;

    const [contactsRow] = await db.execute(metricsQuery);
    const [dealsRow] = await db.execute(dealsQuery);

    return res.json({
      totalLeads: Number((contactsRow as any)?.total_leads) || 0,
      totalContacts: Number((contactsRow as any)?.total_contacts) || 0,
      totalCustomers: Number((contactsRow as any)?.total_customers) || 0,
      openDeals: Number((dealsRow as any)?.open_deals) || 0,
      totalDealValue: Number((dealsRow as any)?.total_deal_value) || 0,
      wonDeals: Number((dealsRow as any)?.won_deals) || 0,
      conversionRate: Number((dealsRow as any)?.conversion_rate) || 0,
    });
  } catch (error) {
    console.error('Error fetching CRM metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
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
    
    const result = await db.execute(leadSourcesQuery);
    
    const leadSources = (result as any[]).map(row => ({
      source: (row as any).source || 'Unknown',
      count: Number((row as any).count)
    }));
    
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
  }
});

// New: alias path expected by client/validator
router.get('/lead-analytics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result = await db.execute(sql`
      SELECT 
        source,
        COUNT(*) AS count
      FROM ${schema.contacts}
      WHERE user_id = ${userId} AND type = 'lead' AND status = 'active'
      GROUP BY source
      ORDER BY count DESC
    `);
    const leadSources = (result as any[]).map(row => ({
      source: (row as any).source || 'Unknown',
      count: Number((row as any).count)
    }));
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead analytics (alias):', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
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
    
    const result = await db.execute(pipelineQuery);
    
    const stages = (result as any[]).map(row => ({
      stage: (row as any).stage || 'Unknown',
      count: Number((row as any).count),
      totalValue: Number((row as any).total_value) || 0
    }));
    
    res.json({ stages });
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline analytics' });
  }
});

// New: alias path expected by client/validator
router.get('/pipeline', async (req: Request, res: Response) => {
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
    
    const result = await db.execute(pipelineQuery);
    
    const stages = (result as any[]).map(row => ({
      stage: (row as any).stage || 'Unknown',
      count: Number((row as any).count),
      totalValue: Number((row as any).total_value) || 0
    }));
    
    res.json({ stages });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// New: lead source analytics explicit endpoint
router.get('/lead-source-analytics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result = await db.execute(sql`
      SELECT source, COUNT(*) AS count
      FROM ${schema.contacts}
      WHERE user_id = ${userId} AND type = 'lead' AND status = 'active'
      GROUP BY source
      ORDER BY count DESC
    `);
    const leadSources = (result as any[]).map(row => ({
      source: (row as any).source || 'Unknown',
      count: Number((row as any).count)
    }));
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead source analytics:', error);
    res.status(500).json({ error: 'Failed to fetch lead source analytics' });
  }
});

// New: conversion funnel endpoint
router.get('/conversion-funnel', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const [leadsRow] = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'new') AS new,
        COUNT(*) FILTER (WHERE status = 'contacted') AS contacted,
        COUNT(*) FILTER (WHERE status = 'qualified') AS qualified,
        COUNT(*) FILTER (WHERE status = 'unqualified') AS unqualified
      FROM ${schema.leads}
      WHERE user_id = ${userId}
    `);

    const [dealsRow] = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE status = 'won') AS won,
        COUNT(*) FILTER (WHERE status = 'lost') AS lost
      FROM ${schema.deals}
      WHERE user_id = ${userId}
    `);

    res.json({
      leads: {
        new: Number((leadsRow as any)?.new) || 0,
        contacted: Number((leadsRow as any)?.contacted) || 0,
        qualified: Number((leadsRow as any)?.qualified) || 0,
        unqualified: Number((leadsRow as any)?.unqualified) || 0,
      },
      deals: {
        open: Number((dealsRow as any)?.open) || 0,
        won: Number((dealsRow as any)?.won) || 0,
        lost: Number((dealsRow as any)?.lost) || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({ error: 'Failed to fetch conversion funnel' });
  }
});

// Get all contacts with pagination and filtering
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, type, status } = req.query as Record<string, string>;

    const conditions: any[] = [eq(schema.contacts.userId, userId)];

    if (search) {
      conditions.push(
        or(
          ilike(schema.contacts.firstName, `%${search}%`),
          ilike(schema.contacts.lastName, `%${search}%`),
          ilike(schema.contacts.email, `%${search}%`),
          ilike(schema.contacts.company, `%${search}%`)
        )
      );
    }

    if (type) {
      conditions.push(eq(schema.contacts.type, type));
    }

    if (status) {
      conditions.push(eq(schema.contacts.status, status));
    }

    const offset = (Number(page) - 1) * Number(limit);

    const contacts = await db
      .select()
      .from(schema.contacts)
      .where(and(...conditions))
      .orderBy(desc(schema.contacts.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    const totalQuery = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM ${schema.contacts}
      WHERE user_id = ${userId}
    `);
    const total = Number((totalQuery as any[])[0]?.count || 0);

    res.json({
      contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
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
    wsService.broadcastToResource('crm', 'contacts', 'contact_created', newContact);
    
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
    wsService.broadcastToResource('crm', 'contacts', 'contact_updated', updatedContact);
    
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
    wsService.broadcastToResource('crm', 'contacts', 'contact_deleted', { id: contactId });
    
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
    const { page = 1, limit = 10, stage, status } = req.query as Record<string, string>;

    const conditions: any[] = [eq(schema.deals.userId, userId)];
    if (stage) conditions.push(eq(schema.deals.stage, stage));
    if (status) conditions.push(eq(schema.deals.status, status));

    const offset = (Number(page) - 1) * Number(limit);
    const deals = await db
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
      .where(and(...conditions))
      .orderBy(desc(schema.deals.createdAt))
      .limit(Number(limit))
      .offset(offset);

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
    wsService.broadcastToResource('crm', 'deals', 'deal_created', newDeal);
    
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
    wsService.broadcastToResource('crm', 'deals', 'deal_updated', updatedDeal);
    
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
      .sort((a, b) => new Date((b as any).timestamp).getTime() - new Date((a as any).timestamp).getTime())
      .slice(0, 10);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// Minimal list endpoints required by validator and client hooks
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 20, search, status, source, priority } = req.query as Record<string, string>;
    const conditions: any[] = [eq(schema.leads.userId, userId)];

    if (search) {
      conditions.push(
        or(
          ilike(schema.leads.firstName, `%${search}%`),
          ilike(schema.leads.lastName, `%${search}%`),
          ilike(schema.leads.company, `%${search}%`),
          ilike(schema.leads.email, `%${search}%`)
        )
      );
    }
    if (status) conditions.push(eq(schema.leads.status, status));
    if (source) conditions.push(eq(schema.leads.source, source));
    if (priority) conditions.push(eq(schema.leads.priority, priority));

    const offset = (Number(page) - 1) * Number(limit);
    const items = await db
      .select()
      .from(schema.leads)
      .where(and(...conditions))
      .orderBy(desc(schema.leads.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json(items);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.get('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { contactId, leadId, dealId } = req.query as Record<string, string>;
    const conditions: any[] = [eq(schema.activities.userId, userId)];
    if (contactId) conditions.push(eq(schema.activities.contactId, Number(contactId)));
    if (leadId) conditions.push(eq(schema.activities.leadId, Number(leadId)));
    if (dealId) conditions.push(eq(schema.activities.dealId, Number(dealId)));

    const items = await db
      .select()
      .from(schema.activities)
      .where(and(...conditions))
      .orderBy(desc(schema.activities.createdAt))
      .limit(50);

    res.json(items);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { assignedTo } = req.query as Record<string, string>;
    const conditions: any[] = [eq(schema.tasks.userId, userId)];
    if (assignedTo) conditions.push(eq(schema.tasks.assignedTo, Number(assignedTo)));

    const items = await db
      .select()
      .from(schema.tasks)
      .where(and(...conditions))
      .orderBy(asc(schema.tasks.dueDate))
      .limit(100);

    res.json(items);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/companies', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const items = await db
      .select()
      .from(schema.crmCompanies)
      .where(eq(schema.crmCompanies.userId, userId))
      .orderBy(desc(schema.crmCompanies.createdAt))
      .limit(100);
    res.json(items);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.get('/phone-calls', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { contactId } = req.query as Record<string, string>;
    const conditions: any[] = [eq(schema.phoneCallsTable.userId, userId)];
    if (contactId) conditions.push(eq(schema.phoneCallsTable.contactId, Number(contactId)));

    const items = await db
      .select()
      .from(schema.phoneCallsTable)
      .where(and(...conditions))
      .orderBy(desc(schema.phoneCallsTable.createdAt))
      .limit(50);
    res.json(items);
  } catch (error) {
    console.error('Error fetching phone calls:', error);
    res.status(500).json({ error: 'Failed to fetch phone calls' });
  }
});

// Reports generation
router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { type = 'summary', format = 'json' } = req.body || {};

    if (type === 'leads') {
      const leads = await db
        .select({
          id: schema.leads.id,
          firstName: schema.leads.firstName,
          lastName: schema.leads.lastName,
          email: schema.leads.email,
          company: schema.leads.company,
          status: schema.leads.status,
          source: schema.leads.source,
          priority: schema.leads.priority,
          createdAt: schema.leads.createdAt,
        })
        .from(schema.leads)
        .where(eq(schema.leads.userId, userId))
        .orderBy(desc(schema.leads.createdAt))
        .limit(500);

      if (format === 'csv') {
        const headers = ['id','firstName','lastName','email','company','status','source','priority','createdAt'];
        const rows = leads.map(l => [
          l.id,
          l.firstName,
          l.lastName,
          l.email || '',
          l.company || '',
          l.status || '',
          l.source || '',
          l.priority || '',
          (l.createdAt as any) || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `${String(v).replace(/"/g,'""')}`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leads-report.csv"');
        return res.status(200).send(csv);
      }

      return res.json({ items: leads, count: leads.length });
    }

    // Default summary report
    const [metrics] = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM ${schema.leads} WHERE user_id = ${userId}) AS lead_count,
        (SELECT COUNT(*) FROM ${schema.contacts} WHERE user_id = ${userId} AND type = 'contact') AS contact_count,
        (SELECT COUNT(*) FROM ${schema.deals} WHERE user_id = ${userId} AND status = 'open') AS open_deal_count
    `);

    return res.json({
      type: 'summary',
      metrics: {
        leads: Number((metrics as any)?.lead_count) || 0,
        contacts: Number((metrics as any)?.contact_count) || 0,
        openDeals: Number((metrics as any)?.open_deal_count) || 0,
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;