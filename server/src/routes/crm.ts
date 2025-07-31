import { Router, Request, Response } from 'express';
import { db } from '../../db';
import * as schema from '../../../shared/schema';
import { eq, and, sql, desc, asc, ilike, or, gte, lte } from 'drizzle-orm';
import { WSService } from '../../websocket';
import { Resend } from 'resend';
import Papa from 'papaparse';
import cron from 'node-cron';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware to get user ID (assuming authentication middleware sets req.user)
const getUserId = (req: Request): number => {
  return (req.user as any)?.id || 1; // Fallback for development
};

// Audit logging helper
const createAuditLog = async (userId: number, action: string, resourceType: string, resourceId?: number, details?: any) => {
  try {
    await db.insert(schema.auditLogs).values({
      userId,
      action,
      resourceType,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      ipAddress: '127.0.0.1', // Should get from request
      userAgent: 'API',
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// WebSocket broadcast helper
const broadcastUpdate = (req: Request, type: string, data: any) => {
  try {
    const wsService = req.app.locals.wsService as WSService;
    if (wsService) {
      wsService.broadcastToResource('crm', type.split('_')[0], {
        type,
        data
      });
    }
  } catch (error) {
    console.error('Failed to broadcast update:', error);
  }
};

// DASHBOARD METRICS
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
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
        SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as won_deal_value,
        ROUND(
          (COUNT(CASE WHEN status = 'won' THEN 1 END)::float / 
           NULLIF(COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END), 0) * 100), 1
        ) as conversion_rate
      FROM ${schema.deals} 
      WHERE user_id = ${userId}
    `;

    const tasksQuery = sql`
      SELECT COUNT(*) as pending_tasks
      FROM ${schema.tasks}
      WHERE user_id = ${userId} AND status IN ('pending', 'in_progress')
    `;

    const activitiesQuery = sql`
      SELECT COUNT(*) as recent_activities
      FROM ${schema.activities}
      WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '7 days'
    `;
    
    const [metricsResult] = await db.execute(metricsQuery);
    const [dealsResult] = await db.execute(dealsQuery);
    const [tasksResult] = await db.execute(tasksQuery);
    const [activitiesResult] = await db.execute(activitiesQuery);
    
    const metrics = {
      totalLeads: Number(metricsResult.total_leads) || 0,
      totalContacts: Number(metricsResult.total_contacts) || 0,
      totalCustomers: Number(metricsResult.total_customers) || 0,
      openDeals: Number(dealsResult.open_deals) || 0,
      totalDealValue: Number(dealsResult.total_deal_value) || 0,
      wonDeals: Number(dealsResult.won_deals) || 0,
      wonDealValue: Number(dealsResult.won_deal_value) || 0,
      conversionRate: Number(dealsResult.conversion_rate) || 0,
      pendingTasks: Number(tasksResult.pending_tasks) || 0,
      recentActivities: Number(activitiesResult.recent_activities) || 0,
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching CRM metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// LEADS MANAGEMENT
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, status, source, priority, assignedTo } = req.query;
    
    let query = db.select().from(schema.leads).where(eq(schema.leads.userId, userId));
    
    // Add filters
    if (search) {
      query = query.where(
        or(
          ilike(schema.leads.firstName, `%${search}%`),
          ilike(schema.leads.lastName, `%${search}%`),
          ilike(schema.leads.email, `%${search}%`),
          ilike(schema.leads.company, `%${search}%`)
        )
      );
    }
    
    if (status) query = query.where(eq(schema.leads.status, status as string));
    if (source) query = query.where(eq(schema.leads.source, source as string));
    if (priority) query = query.where(eq(schema.leads.priority, priority as string));
    if (assignedTo) query = query.where(eq(schema.leads.assignedTo, Number(assignedTo)));
    
    const offset = (Number(page) - 1) * Number(limit);
    const leads = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.leads.createdAt));
    
    // Get total count
    const totalQuery = db.select({ count: sql`count(*)` }).from(schema.leads).where(eq(schema.leads.userId, userId));
    const [{ count }] = await totalQuery;
    
    res.json({
      leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        pages: Math.ceil(Number(count) / Number(limit))
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
    const leadData = { ...req.body, userId };
    
    const [newLead] = await db.insert(schema.leads).values(leadData).returning();
    
    await createAuditLog(userId, 'lead_created', 'lead', newLead.id, { leadData });
    broadcastUpdate(req, 'lead_created', newLead);
    
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
    
    const [updatedLead] = await db
      .update(schema.leads)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.userId, userId)))
      .returning();
    
    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    await createAuditLog(userId, 'lead_updated', 'lead', leadId, { updates: req.body });
    broadcastUpdate(req, 'lead_updated', updatedLead);
    
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
    
    const [deletedLead] = await db
      .delete(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.userId, userId)))
      .returning();
    
    if (!deletedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    await createAuditLog(userId, 'lead_deleted', 'lead', leadId);
    broadcastUpdate(req, 'lead_deleted', { id: leadId });
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Lead conversion
router.post('/leads/:id/convert', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadId = parseInt(req.params.id);
    
    const [lead] = await db.select().from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.userId, userId)));
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Create contact from lead
    const [contact] = await db.insert(schema.contacts).values({
      userId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.notes,
      source: lead.source,
      type: 'customer',
      status: 'active'
    }).returning();
    
    // Update lead status
    await db.update(schema.leads)
      .set({ status: 'converted', updatedAt: new Date() })
      .where(eq(schema.leads.id, leadId));
    
    await createAuditLog(userId, 'lead_converted', 'lead', leadId, { contactId: contact.id });
    broadcastUpdate(req, 'lead_converted', { lead, contact });
    
    res.json({ contact, message: 'Lead converted to contact successfully' });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

// Lead email sending
router.post('/leads/:id/email', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const leadId = parseInt(req.params.id);
    const { subject, message, templateId } = req.body;
    
    const [lead] = await db.select().from(schema.leads)
      .where(and(eq(schema.leads.id, leadId), eq(schema.leads.userId, userId)));
    
    if (!lead || !lead.email) {
      return res.status(404).json({ error: 'Lead not found or no email address' });
    }
    
    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: 'crm@yourcompany.com',
      to: lead.email,
      subject: subject || 'Follow-up from our team',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${lead.firstName} ${lead.lastName},</h2>
          <p>${message || 'Thank you for your interest. We would like to follow up with you.'}</p>
          <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <p>Best regards,<br>Your CRM Team</p>
          </div>
        </div>
      `
    });
    
    // Log activity
    await db.insert(schema.activities).values({
      userId,
      leadId,
      type: 'email',
      subject: subject || 'Follow-up email sent',
      description: `Email sent to ${lead.email}`,
      status: 'completed',
      completedAt: new Date()
    });
    
    await createAuditLog(userId, 'lead_email_sent', 'lead', leadId, { subject, emailId: emailResult.data?.id });
    broadcastUpdate(req, 'activity_created', { type: 'email', leadId });
    
    res.json({ message: 'Email sent successfully', emailId: emailResult.data?.id });
  } catch (error) {
    console.error('Error sending lead email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Lead CSV import
router.post('/leads/import', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { csvData } = req.body;
    
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    const leadsToInsert = parsed.data.map((row: any) => ({
      userId,
      firstName: row['First Name'] || row.firstName || '',
      lastName: row['Last Name'] || row.lastName || '',
      email: row['Email'] || row.email || '',
      phone: row['Phone'] || row.phone || '',
      company: row['Company'] || row.company || '',
      source: row['Source'] || row.source || 'Import',
      status: 'new',
      priority: 'medium'
    })).filter((lead: any) => lead.firstName || lead.lastName || lead.email);
    
    if (leadsToInsert.length === 0) {
      return res.status(400).json({ error: 'No valid leads found in CSV' });
    }
    
    const insertedLeads = await db.insert(schema.leads).values(leadsToInsert).returning();
    
    await createAuditLog(userId, 'leads_imported', 'lead', undefined, { count: insertedLeads.length });
    broadcastUpdate(req, 'leads_imported', { count: insertedLeads.length });
    
    res.json({ message: `Successfully imported ${insertedLeads.length} leads`, leads: insertedLeads });
  } catch (error) {
    console.error('Error importing leads:', error);
    res.status(500).json({ error: 'Failed to import leads' });
  }
});

// Lead CSV export
router.get('/leads/export', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const leads = await db.select().from(schema.leads)
      .where(eq(schema.leads.userId, userId))
      .orderBy(desc(schema.leads.createdAt));
    
    const csvData = Papa.unparse(leads.map(lead => ({
      'ID': lead.id,
      'First Name': lead.firstName,
      'Last Name': lead.lastName,
      'Email': lead.email,
      'Phone': lead.phone,
      'Company': lead.company,
      'Source': lead.source,
      'Status': lead.status,
      'Priority': lead.priority,
      'Estimated Value': lead.estimatedValue,
      'Created At': lead.createdAt,
      'Updated At': lead.updatedAt
    })));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ error: 'Failed to export leads' });
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

// ACTIVITIES MANAGEMENT
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, type, status, contactId, leadId, dealId, recent } = req.query;
    
    let query = db.select({
      activity: schema.activities,
      contact: {
        id: schema.contacts.id,
        firstName: schema.contacts.firstName,
        lastName: schema.contacts.lastName
      },
      lead: {
        id: schema.leads.id,
        firstName: schema.leads.firstName,
        lastName: schema.leads.lastName
      }
    })
    .from(schema.activities)
    .leftJoin(schema.contacts, eq(schema.activities.contactId, schema.contacts.id))
    .leftJoin(schema.leads, eq(schema.activities.leadId, schema.leads.id))
    .where(eq(schema.activities.userId, userId));
    
    if (type) query = query.where(eq(schema.activities.type, type as string));
    if (status) query = query.where(eq(schema.activities.status, status as string));
    if (contactId) query = query.where(eq(schema.activities.contactId, Number(contactId)));
    if (leadId) query = query.where(eq(schema.activities.leadId, Number(leadId)));
    if (dealId) query = query.where(eq(schema.activities.dealId, Number(dealId)));
    
    if (recent === 'true') {
      query = query.where(gte(schema.activities.createdAt, sql`NOW() - INTERVAL '7 days'`));
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const activities = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.activities.createdAt));
    
    res.json({ data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

router.post('/activities', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const activityData = { ...req.body, userId };
    
    const [newActivity] = await db.insert(schema.activities).values(activityData).returning();
    
    await createAuditLog(userId, 'activity_created', 'activity', newActivity.id, { activityData });
    broadcastUpdate(req, 'activity_created', newActivity);
    
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// TASKS MANAGEMENT
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, status, priority, assignedTo, upcoming } = req.query;
    
    let query = db.select({
      task: schema.tasks,
      assignedUser: {
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName
      },
      contact: {
        id: schema.contacts.id,
        firstName: schema.contacts.firstName,
        lastName: schema.contacts.lastName
      }
    })
    .from(schema.tasks)
    .leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id))
    .leftJoin(schema.contacts, eq(schema.tasks.contactId, schema.contacts.id))
    .where(eq(schema.tasks.userId, userId));
    
    if (status) query = query.where(eq(schema.tasks.status, status as string));
    if (priority) query = query.where(eq(schema.tasks.priority, priority as string));
    if (assignedTo) query = query.where(eq(schema.tasks.assignedTo, Number(assignedTo)));
    
    if (upcoming === 'true') {
      query = query.where(
        and(
          eq(schema.tasks.status, 'pending'),
          gte(schema.tasks.dueDate, new Date()),
          lte(schema.tasks.dueDate, sql`NOW() + INTERVAL '7 days'`)
        )
      );
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    const tasks = await query.limit(Number(limit)).offset(offset).orderBy(asc(schema.tasks.dueDate));
    
    res.json({ data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const taskData = { ...req.body, userId };
    
    const [newTask] = await db.insert(schema.tasks).values(taskData).returning();
    
    await createAuditLog(userId, 'task_created', 'task', newTask.id, { taskData });
    broadcastUpdate(req, 'task_created', newTask);
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const taskId = parseInt(req.params.id);
    
    const [completedTask] = await db
      .update(schema.tasks)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .returning();
    
    if (!completedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await createAuditLog(userId, 'task_completed', 'task', taskId);
    broadcastUpdate(req, 'task_completed', completedTask);
    
    res.json(completedTask);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// COMPANIES MANAGEMENT
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, search, industry } = req.query;
    
    let query = db.select().from(schema.crmCompanies).where(eq(schema.crmCompanies.userId, userId));
    
    if (search) {
      query = query.where(
        or(
          ilike(schema.crmCompanies.name, `%${search}%`),
          ilike(schema.crmCompanies.industry, `%${search}%`),
          ilike(schema.crmCompanies.email, `%${search}%`)
        )
      );
    }
    
    if (industry) query = query.where(eq(schema.crmCompanies.industry, industry as string));
    
    const offset = (Number(page) - 1) * Number(limit);
    const companies = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.crmCompanies.createdAt));
    
    res.json({ data: companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/companies', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const companyData = { ...req.body, userId };
    
    const [newCompany] = await db.insert(schema.crmCompanies).values(companyData).returning();
    
    await createAuditLog(userId, 'company_created', 'company', newCompany.id, { companyData });
    broadcastUpdate(req, 'company_created', newCompany);
    
    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PHONE CALLS MANAGEMENT
router.get('/phone-calls', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, contactId, leadId, status } = req.query;
    
    let query = db.select({
      phoneCall: schema.phoneCallsTable,
      contact: {
        id: schema.contacts.id,
        firstName: schema.contacts.firstName,
        lastName: schema.contacts.lastName
      },
      lead: {
        id: schema.leads.id,
        firstName: schema.leads.firstName,
        lastName: schema.leads.lastName
      }
    })
    .from(schema.phoneCallsTable)
    .leftJoin(schema.contacts, eq(schema.phoneCallsTable.contactId, schema.contacts.id))
    .leftJoin(schema.leads, eq(schema.phoneCallsTable.leadId, schema.leads.id))
    .where(eq(schema.phoneCallsTable.userId, userId));
    
    if (contactId) query = query.where(eq(schema.phoneCallsTable.contactId, Number(contactId)));
    if (leadId) query = query.where(eq(schema.phoneCallsTable.leadId, Number(leadId)));
    if (status) query = query.where(eq(schema.phoneCallsTable.status, status as string));
    
    const offset = (Number(page) - 1) * Number(limit);
    const phoneCalls = await query.limit(Number(limit)).offset(offset).orderBy(desc(schema.phoneCallsTable.createdAt));
    
    res.json({ data: phoneCalls });
  } catch (error) {
    console.error('Error fetching phone calls:', error);
    res.status(500).json({ error: 'Failed to fetch phone calls' });
  }
});

router.post('/phone-calls', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const phoneCallData = { ...req.body, userId };
    
    const [newPhoneCall] = await db.insert(schema.phoneCallsTable).values(phoneCallData).returning();
    
    await createAuditLog(userId, 'phone_call_created', 'phone_call', newPhoneCall.id, { phoneCallData });
    broadcastUpdate(req, 'phone_call_created', newPhoneCall);
    
    res.status(201).json(newPhoneCall);
  } catch (error) {
    console.error('Error creating phone call:', error);
    res.status(500).json({ error: 'Failed to create phone call' });
  }
});

// ANALYTICS ENDPOINTS
router.get('/lead-analytics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const leadSourcesQuery = sql`
      SELECT 
        source,
        COUNT(*) as count
      FROM ${schema.leads} 
      WHERE user_id = ${userId}
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const result = await db.execute(leadSourcesQuery);
    
    const leadSources = result.map(row => ({
      source: row.source || 'Unknown',
      count: Number(row.count)
    }));
    
    res.json({ leadSources });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
  }
});

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
    
    const stages = result.map(row => ({
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

router.get('/conversion-funnel', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const funnelQuery = sql`
      SELECT 
        'Leads' as stage,
        COUNT(*) as count,
        1 as order_num
      FROM ${schema.leads}
      WHERE user_id = ${userId}
      
      UNION ALL
      
      SELECT 
        'Qualified Leads' as stage,
        COUNT(*) as count,
        2 as order_num
      FROM ${schema.leads}
      WHERE user_id = ${userId} AND status = 'qualified'
      
      UNION ALL
      
      SELECT 
        'Contacts' as stage,
        COUNT(*) as count,
        3 as order_num
      FROM ${schema.contacts}
      WHERE user_id = ${userId} AND type = 'customer'
      
      UNION ALL
      
      SELECT 
        'Deals' as stage,
        COUNT(*) as count,
        4 as order_num
      FROM ${schema.deals}
      WHERE user_id = ${userId}
      
      UNION ALL
      
      SELECT 
        'Won Deals' as stage,
        COUNT(*) as count,
        5 as order_num
      FROM ${schema.deals}
      WHERE user_id = ${userId} AND status = 'won'
      
      ORDER BY order_num
    `;
    
    const result = await db.execute(funnelQuery);
    
    const funnel = result.map(row => ({
      stage: row.stage,
      count: Number(row.count)
    }));
    
    res.json({ funnel });
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({ error: 'Failed to fetch conversion funnel' });
  }
});

// DEAL TO INVOICE CONVERSION
router.post('/deals/:id/convert-to-invoice', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const dealId = parseInt(req.params.id);
    const { invoiceData } = req.body;
    
    const [deal] = await db.select().from(schema.deals)
      .where(and(eq(schema.deals.id, dealId), eq(schema.deals.userId, userId)));
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Generate invoice number
    const invoiceCount = await db.select({ count: sql`count(*)` }).from(schema.invoices)
      .where(eq(schema.invoices.userId, userId));
    const invoiceNumber = `INV-${String(Number(invoiceCount[0].count) + 1).padStart(6, '0')}`;
    
    // Create invoice from deal
    const [invoice] = await db.insert(schema.invoices).values({
      userId,
      contactId: deal.contactId,
      invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotal: deal.value || 0,
      totalAmount: deal.value || 0,
      status: 'draft',
      notes: `Converted from deal: ${deal.title}`,
      currency: deal.currency || 'USD',
      ...invoiceData
    }).returning();
    
    // Update deal status
    await db.update(schema.deals)
      .set({ status: 'won', actualCloseDate: new Date(), updatedAt: new Date() })
      .where(eq(schema.deals.id, dealId));
    
    await createAuditLog(userId, 'deal_converted_to_invoice', 'deal', dealId, { invoiceId: invoice.id });
    broadcastUpdate(req, 'deal_updated', { ...deal, status: 'won' });
    
    res.json({ invoice, message: 'Deal converted to invoice successfully' });
  } catch (error) {
    console.error('Error converting deal to invoice:', error);
    res.status(500).json({ error: 'Failed to convert deal to invoice' });
  }
});

// CRON JOBS FOR AUTOMATION
// Task reminders (runs every hour)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running task reminder job...');
    
    const upcomingTasks = await db.select({
      task: schema.tasks,
      user: {
        email: schema.users.email,
        firstName: schema.users.firstName
      }
    })
    .from(schema.tasks)
    .leftJoin(schema.users, eq(schema.tasks.userId, schema.users.id))
    .where(
      and(
        eq(schema.tasks.status, 'pending'),
        gte(schema.tasks.reminderDate, new Date()),
        lte(schema.tasks.reminderDate, sql`NOW() + INTERVAL '1 hour'`)
      )
    );
    
    for (const { task, user } of upcomingTasks) {
      if (user.email) {
        await resend.emails.send({
          from: 'crm@yourcompany.com',
          to: user.email,
          subject: `Task Reminder: ${task.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Task Reminder</h2>
              <p>Hello ${user.firstName},</p>
              <p>This is a reminder for your upcoming task:</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>${task.title}</h3>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</p>
                ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
              </div>
              <p>Please complete this task as soon as possible.</p>
            </div>
          `
        });
        
        // Mark reminder as sent
        await db.update(schema.tasks)
          .set({ reminderDate: null, updatedAt: new Date() })
          .where(eq(schema.tasks.id, task.id));
      }
    }
    
    console.log(`Sent ${upcomingTasks.length} task reminders`);
  } catch (error) {
    console.error('Error in task reminder job:', error);
  }
});

// Lead assignment automation (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('Running lead assignment job...');
    
    // Get unassigned leads
    const unassignedLeads = await db.select().from(schema.leads)
      .where(and(eq(schema.leads.status, 'new'), sql`assigned_to IS NULL`));
    
    if (unassignedLeads.length === 0) return;
    
    // Get sales users (assuming role-based assignment)
    const salesUsers = await db.select().from(schema.users)
      .where(eq(schema.users.role, 'sales'));
    
    if (salesUsers.length === 0) return;
    
    // Round-robin assignment
    for (let i = 0; i < unassignedLeads.length; i++) {
      const assignedUser = salesUsers[i % salesUsers.length];
      await db.update(schema.leads)
        .set({ assignedTo: assignedUser.id, updatedAt: new Date() })
        .where(eq(schema.leads.id, unassignedLeads[i].id));
    }
    
    console.log(`Assigned ${unassignedLeads.length} leads to ${salesUsers.length} sales users`);
  } catch (error) {
    console.error('Error in lead assignment job:', error);
  }
});

export default router;