import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { storage } from '../../storage';
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
    console.log('Fetching CRM dashboard for user:', userId);
    
    // Use simple queries with Drizzle ORM instead of raw SQL
    let totalLeads = 0;
    let totalCustomers = 0;
    let totalContacts = 0;
    let openDeals = 0;
    let totalDealValue = 0;
    let wonDeals = 0;
    let conversionRate = 0;

    try {
      // Get contact metrics
      const contactsResult = await db
        .select()
        .from(schema.contacts)
        .where(and(eq(schema.contacts.userId, userId), eq(schema.contacts.status, 'active')));

      totalLeads = contactsResult.filter(c => c.type === 'lead').length;
      totalCustomers = contactsResult.filter(c => c.type === 'customer').length;
      totalContacts = contactsResult.length;
      
      console.log('Contacts fetched:', { totalLeads, totalCustomers, totalContacts });
    } catch (contactError) {
      console.warn('Error fetching contacts:', contactError);
      // Continue with default values
    }

    try {
      // Get deals metrics
      const dealsResult = await db
        .select()
        .from(schema.deals)
        .where(eq(schema.deals.userId, userId));

      openDeals = dealsResult.filter(d => d.stage === 'open' || d.stage === 'proposal' || d.stage === 'negotiation').length;
      totalDealValue = dealsResult
        .filter(d => d.stage === 'open' || d.stage === 'proposal' || d.stage === 'negotiation')
        .reduce((sum, deal) => sum + (deal.value || 0), 0);
      wonDeals = dealsResult.filter(d => d.stage === 'won' || d.stage === 'closed-won').length;
      
      const totalClosedDeals = dealsResult.filter(d => 
        d.stage === 'won' || d.stage === 'closed-won' || d.stage === 'lost' || d.stage === 'closed-lost'
      ).length;
      
      if (totalClosedDeals > 0) {
        conversionRate = Math.round((wonDeals / totalClosedDeals) * 100 * 10) / 10;
      }
      
      console.log('Deals fetched:', { openDeals, totalDealValue, wonDeals, conversionRate });
    } catch (dealsError) {
      console.warn('Error fetching deals:', dealsError);
      // Continue with default values
    }
    
    const metrics = {
      totalLeads,
      totalContacts,
      totalCustomers,
      openDeals,
      totalDealValue,
      wonDeals,
      conversionRate,
    };
    
    console.log('Returning CRM dashboard metrics:', metrics);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching CRM dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
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
    const rows = Array.isArray(result) ? result : (result.rows || []);
    
    const leadSources = rows.map(row => ({
      source: row.source || 'Unknown',
      count: Number(row.count)
    }));
    
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
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
    const rows = Array.isArray(result) ? result : (result.rows || []);
    
    const stages = rows.map(row => ({
      stage: row.stage || 'Unknown',
      count: Number(row.count),
      totalValue: Number(row.total_value) || 0
    }));
    
    res.json({ stages });
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline analytics' });
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
    
    let newContact;
    
    // Handle lead assignment
    if (contactData.type === 'lead') {
      // Get all active sales team members
      const salesTeam = await db.select()
        .from(schema.users)
        .where(and(
          eq(schema.users.role, 'sales'),
          eq(schema.users.status, 'active')
        ))
        .orderBy(schema.users.id);

      if (salesTeam.length > 0) {
        // Get last assigned user ID
        const lastAssigned = await db.select({ value: schema.settings.value })
          .from(schema.settings)
          .where(eq(schema.settings.key, 'last_assigned_sales_id'));

        let nextIndex = 0;
        if (lastAssigned.length > 0) {
          const lastId = parseInt(lastAssigned[0].value);
          const currentIndex = salesTeam.findIndex(member => member.id === lastId);
          nextIndex = (currentIndex + 1) % salesTeam.length;
        }

        contactData.assignedTo = salesTeam[nextIndex].id;
        contactData.status = 'assigned';

        // Update last assigned setting
        await db.insert(schema.settings)
          .values({ key: 'last_assigned_sales_id', value: salesTeam[nextIndex].id.toString() })
          .onConflictDoUpdate({
            target: schema.settings.key,
            set: { value: salesTeam[nextIndex].id.toString() }
          });
      }
    }

    [newContact] = await db.insert(schema.contacts).values(contactData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    
    if (newContact.type === 'lead' && newContact.assignedTo) {
      wsService.broadcastToUser(newContact.assignedTo, {
        type: 'lead_assigned',
        data: {
          lead: newContact,
          assignedBy: userId
        }
      });
    }

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

    // Get existing deal to detect stage changes
    const [existingDeal] = await db.select()
      .from(schema.deals)
      .where(eq(schema.deals.id, dealId));

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

    // Special event for stage changes
    if (existingDeal && req.body.stage && existingDeal.stage !== req.body.stage) {
      wsService.broadcastToResource('crm', 'pipeline', {
        type: 'deal_stage_changed',
        data: {
          dealId: updatedDeal.id,
          previousStage: existingDeal.stage,
          newStage: updatedDeal.stage,
          deal: updatedDeal
        }
      });
    }

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

// Convert deal to invoice
router.post('/deals/:id/convert-to-invoice', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dealId = parseInt(req.params.id);
    
    // Get the deal with contact info
    const [deal] = await db
      .select({
        deal: schema.deals,
        contact: {
          id: schema.contacts.id,
          firstName: schema.contacts.firstName,
          lastName: schema.contacts.lastName,
          email: schema.contacts.email,
          company: schema.contacts.company
        }
      })
      .from(schema.deals)
      .leftJoin(schema.contacts, eq(schema.deals.contactId, schema.contacts.id))
      .where(and(
        eq(schema.deals.id, dealId),
        eq(schema.deals.userId, userId)
      ));

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Generate invoice number
    const invoiceNumber = await storage.generateInvoiceNumber(userId);

    // Create invoice from deal data
    const [newInvoice] = await db.insert(schema.invoices).values({
      userId,
      contactId: deal.deal.contactId,
      invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotal: deal.deal.value || 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: deal.deal.value || 0,
      status: 'draft',
      notes: `Converted from deal: ${deal.deal.title}`,
      terms: '',
      currency: deal.deal.currency || 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Update deal status to "won" since it's being converted
    await db.update(schema.deals)
      .set({
        status: 'won',
        actualCloseDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.deals.id, dealId));

    // Broadcast real-time updates
    const wsService = req.app.locals.wsService as WSService;
    
    // Notify about deal update
    wsService.broadcastToResource('crm', 'deals', {
      type: 'deal_updated',
      data: { ...deal.deal, status: 'won' }
    });

    // Notify about new invoice
    wsService.broadcastToResource('finance', 'invoices', {
      type: 'invoice_created',
      data: newInvoice
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error converting deal to invoice:', error);
    res.status(500).json({ error: 'Failed to convert deal to invoice' });
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

// Leads Management
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status, search } = req.query;

    let query = db.select().from(schema.leads)
      .where(eq(schema.leads.userId, userId));

    if (status) {
      query = query.where(eq(schema.leads.status, status as string));
    }

    if (search) {
      query = query.where(or(
        ilike(schema.leads.firstName, `%${search}%`),
        ilike(schema.leads.lastName, `%${search}%`),
        ilike(schema.leads.company, `%${search}%`),
        ilike(schema.leads.email, `%${search}%`)
      ));
    }

    const leads = await query.orderBy(desc(schema.leads.createdAt));
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.post('/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadData = { ...req.body, userId };
    
    const [newLead] = await db.insert(schema.leads)
      .values(leadData)
      .returning();

    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'leads', {
      type: 'lead_created',
      data: newLead
    });

    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadId = parseInt(req.params.id);
    
    const [updatedLead] = await db.update(schema.leads)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.userId, userId)
      ))
      .returning();

    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'leads', {
      type: 'lead_updated',
      data: updatedLead
    });

    res.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

router.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadId = parseInt(req.params.id);
    
    const [deletedLead] = await db.delete(schema.leads)
      .where(and(
        eq(schema.leads.id, leadId),
        eq(schema.leads.userId, userId)
      ))
      .returning();

    if (!deletedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'leads', {
      type: 'lead_deleted',
      data: { id: leadId }
    });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Lead assignment endpoint
router.post('/leads/assign', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadId = req.body.leadId;

    // Get all active sales team members
    const salesTeam = await db.select()
      .from(schema.users)
      .where(and(
        eq(schema.users.role, 'sales'),
        eq(schema.users.status, 'active')
      ))
      .orderBy(schema.users.id);

    if (salesTeam.length === 0) {
      return res.status(400).json({ error: 'No active sales team members found' });
    }

    // Get last assigned user ID from settings or use first team member
    const lastAssigned = await db.select({ value: schema.settings.value })
      .from(schema.settings)
      .where(eq(schema.settings.key, 'last_assigned_sales_id'));

    let nextIndex = 0;
    if (lastAssigned.length > 0) {
      const lastId = parseInt(lastAssigned[0].value);
      const currentIndex = salesTeam.findIndex(member => member.id === lastId);
      nextIndex = (currentIndex + 1) % salesTeam.length;
    }

    const assignTo = salesTeam[nextIndex].id;

    // Update lead with assigned sales person
    const [updatedLead] = await db.update(schema.contacts)
      .set({
        assignedTo: assignTo,
        status: 'assigned',
        updatedAt: new Date()
      })
      .where(and(
        eq(schema.contacts.id, leadId),
        eq(schema.contacts.type, 'lead')
      ))
      .returning();

    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Update last assigned setting
    await db.insert(schema.settings)
      .values({ key: 'last_assigned_sales_id', value: assignTo.toString() })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: assignTo.toString() }
      });

    // Broadcast assignment notification
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToUser(assignTo, {
      type: 'lead_assigned',
      data: {
        lead: updatedLead,
        assignedBy: userId
      }
    });

    res.json(updatedLead);
  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
});

// Get all activities with pagination and filtering
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, type, status, contactId, dealId, leadId } = req.query;
    
    let query = db.select().from(schema.activities).where(eq(schema.activities.userId, userId));
    
    // Add filters
    if (type) {
      query = query.where(eq(schema.activities.type, type as string));
    }
    
    if (status) {
      query = query.where(eq(schema.activities.status, status as string));
    }
    
    if (contactId) {
      query = query.where(eq(schema.activities.contactId, parseInt(contactId as string)));
    }
    
    if (dealId) {
      query = query.where(eq(schema.activities.dealId, parseInt(dealId as string)));
    }
    
    if (leadId) {
      query = query.where(eq(schema.activities.leadId, parseInt(leadId as string)));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const activities = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.activities.createdAt));
    
    // Get total count for pagination
    const totalQuery = db.select({ count: sql`count(*)` }).from(schema.activities).where(eq(schema.activities.userId, userId));
    const [{ count }] = await totalQuery;
    
    res.json({
      activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Create new activity
router.post('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const activityData = { 
      ...req.body, 
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newActivity] = await db.insert(schema.activities).values(activityData).returning();
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'activities', {
      type: 'activity_created',
      data: newActivity
    });
    
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Update activity
router.put('/activities/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const activityId = parseInt(req.params.id);
    
    const [updatedActivity] = await db
      .update(schema.activities)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.activities.id, activityId), eq(schema.activities.userId, userId)))
      .returning();
    
    if (!updatedActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'activities', {
      type: 'activity_updated',
      data: updatedActivity
    });
    
    res.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/activities/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const activityId = parseInt(req.params.id);
    
    const [deletedActivity] = await db
      .delete(schema.activities)
      .where(and(eq(schema.activities.id, activityId), eq(schema.activities.userId, userId)))
      .returning();
    
    if (!deletedActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    // Broadcast real-time update
    const wsService = req.app.locals.wsService as WSService;
    wsService.broadcastToResource('crm', 'activities', {
      type: 'activity_deleted',
      data: { id: activityId }
    });
    
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
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

// Convert deal to invoice
router.post('/deals/:id/convert-to-invoice', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dealId = parseInt(req.params.id);

    // Get the deal with contact info
    const [deal] = await db.select()
      .from(schema.deals)
      .leftJoin(schema.contacts, eq(schema.deals.contactId, schema.contacts.id))
      .where(and(
        eq(schema.deals.id, dealId),
        eq(schema.deals.userId, userId)
      ));

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Create invoice from deal data
    const [invoice] = await db.insert(schema.invoices)
      .values({
        userId,
        contactId: deal.contactId,
        invoiceNumber: await storage.generateInvoiceNumber(userId),
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subtotal: deal.value || 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: deal.value || 0,
        status: 'sent',
        notes: `Converted from deal: ${deal.title}`,
        terms: '',
        currency: deal.currency || 'USD'
      })
      .returning();

    // Add invoice items from deal products (if any)
    if (deal.products && Array.isArray(deal.products)) {
      await db.insert(schema.invoiceItems)
        .values(deal.products.map((product: any) => ({
          invoiceId: invoice.id,
          productId: product.id,
          description: product.name || product.description || 'Product from deal',
          quantity: product.quantity || 1,
          unitPrice: product.price || product.unitPrice || 0,
          taxRate: product.taxRate || 0,
          discountRate: product.discountRate || 0,
          subtotal: (product.quantity || 1) * (product.price || product.unitPrice || 0),
          totalAmount: (product.quantity || 1) * (product.price || product.unitPrice || 0)
        })));
    }

    // Update deal status to "won"
    const [updatedDeal] = await db.update(schema.deals)
      .set({
        status: 'won',
        actualCloseDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.deals.id, dealId))
      .returning();

    // Broadcast real-time updates
    const wsService = req.app.locals.wsService as WSService;
    
    // Notify about invoice creation
    wsService.broadcastToResource('invoices', 'all', {
      type: 'invoice_created',
      data: invoice
    });

    // Notify about deal update
    wsService.broadcastToResource('crm', 'deals', {
      type: 'deal_updated',
      data: updatedDeal
    });

    // Notify about pipeline change
    wsService.broadcastToResource('crm', 'pipeline', {
      type: 'deal_converted_to_invoice',
      data: {
        dealId: updatedDeal.id,
        invoiceId: invoice.id,
        amount: invoice.totalAmount
      }
    });

    res.status(201).json({
      invoice,
      deal: updatedDeal
    });
  } catch (error) {
    console.error('Error converting deal to invoice:', error);
    res.status(500).json({ error: 'Failed to convert deal to invoice' });
  }
});

export default router;