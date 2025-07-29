import { Router } from "express";
import { db } from "../../db";
import { leads, deals, activities, tasks, crmCompanies, phoneCalls, contacts, invoices } from "@shared/schema";
import { eq, and, sql, desc, asc, like, ilike, or } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";
import { WSService } from "../../websocket";
import { storage } from "../../storage";
import { emailService } from "../services/email";
import PDFDocument from 'pdfkit';
import Papa from 'papaparse';

// Get the WebSocket service instance
let wsService: WSService;
export const setWSService = (ws: WSService) => {
  wsService = ws;
};

const router = Router();

// Middleware to ensure user is authenticated
const isAuthenticated = authenticateUser;

// ==================== LEADS ROUTES ====================

// Get all leads
router.get("/leads", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, source, assigned_to, search, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(leads).where(eq(leads.userId, userId));
    
    // Add filters
    if (status) {
      query = query.where(and(eq(leads.userId, userId), eq(leads.status, status as string)));
    }
    if (source) {
      query = query.where(and(eq(leads.userId, userId), eq(leads.source, source as string)));
    }
    if (assigned_to) {
      query = query.where(and(eq(leads.userId, userId), eq(leads.assignedTo, parseInt(assigned_to as string))));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(and(
        eq(leads.userId, userId),
        or(
          ilike(leads.firstName, searchTerm),
          ilike(leads.lastName, searchTerm),
          ilike(leads.email, searchTerm),
          ilike(leads.company, searchTerm)
        )
      ));
    }
    
    const leadsList = await query
      .orderBy(desc(leads.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
      
    res.json(leadsList);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Get single lead
router.get("/leads/:id", isAuthenticated, async (req, res) => {
  try {
    const lead = await storage.getLead(parseInt(req.params.id));
    if (!lead || lead.userId !== req.user.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Create new lead
router.post("/leads", isAuthenticated, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const lead = await storage.createLead(leadData);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('lead_created', { lead });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Update lead
router.put("/leads/:id", isAuthenticated, async (req, res) => {
  try {
    const lead = await storage.getLead(parseInt(req.params.id));
    if (!lead || lead.userId !== req.user.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const updatedLead = await storage.updateLead(parseInt(req.params.id), req.body);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('lead_updated', { lead: updatedLead });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Delete lead
router.delete("/leads/:id", isAuthenticated, async (req, res) => {
  try {
    const lead = await storage.getLead(parseInt(req.params.id));
    if (!lead || lead.userId !== req.user.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    await storage.deleteLead(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('lead_deleted', { leadId: parseInt(req.params.id) });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// Convert lead to deal
router.post("/leads/:id/convert", isAuthenticated, async (req, res) => {
  try {
    const lead = await storage.getLead(parseInt(req.params.id));
    if (!lead || lead.userId !== req.user.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const deal = await storage.convertLeadToDeal(parseInt(req.params.id), req.body);
    
    // Broadcast real-time events
    if (wsService) {
      wsService.broadcast('lead_converted', { lead, deal });
      wsService.broadcast('deal_created', { deal });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(201).json(deal);
  } catch (error) {
    console.error("Error converting lead:", error);
    res.status(500).json({ error: "Failed to convert lead" });
  }
});

// Import leads (CSV)
router.post("/leads/import", isAuthenticated, async (req, res) => {
  try {
    const { csvData } = req.body;
    const parsed = Papa.parse(csvData, { header: true });
    const results = [];
    
    for (const row of parsed.data) {
      if (row.firstName && row.lastName) {
        try {
          const leadData = {
            ...row,
            userId: req.user.id,
          };
          const lead = await storage.createLead(leadData);
          results.push({ success: true, lead });
        } catch (error) {
          results.push({ success: false, error: error.message, row });
        }
      }
    }
    
    // Broadcast metrics update
    if (wsService) {
      wsService.broadcast('leads_imported', { count: results.filter(r => r.success).length });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.json({
      total: parsed.data.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error("Error importing leads:", error);
    res.status(500).json({ error: "Failed to import leads" });
  }
});

// Export leads (CSV)
router.get("/leads/export", isAuthenticated, async (req, res) => {
  try {
    const leads = await storage.getLeadsByUser(req.user.id);
    const csv = Papa.unparse(leads);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting leads:", error);
    res.status(500).json({ error: "Failed to export leads" });
  }
});

// Send email to lead
router.post("/leads/:id/email", isAuthenticated, async (req, res) => {
  try {
    const lead = await storage.getLead(parseInt(req.params.id));
    if (!lead || lead.userId !== req.user.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const { subject, message, template } = req.body;
    
    // Send email via Resend
    if (emailService && lead.email) {
      await emailService.sendEmail({
        to: lead.email,
        subject: subject || `Hello ${lead.firstName}`,
        html: message || template,
      });
      
      // Log activity
      await storage.createActivity({
        userId: req.user.id,
        leadId: lead.id,
        type: 'email',
        subject: subject || 'Email sent',
        description: message,
        completedAt: new Date(),
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ==================== DEALS ROUTES ====================

// Get all deals
router.get("/deals", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, stage, owner_id, search, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(deals).where(eq(deals.userId, userId));
    
    // Add filters
    if (status) {
      query = query.where(and(eq(deals.userId, userId), eq(deals.status, status as string)));
    }
    if (stage) {
      query = query.where(and(eq(deals.userId, userId), eq(deals.stage, stage as string)));
    }
    if (owner_id) {
      query = query.where(and(eq(deals.userId, userId), eq(deals.ownerId, parseInt(owner_id as string))));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(and(
        eq(deals.userId, userId),
        or(
          ilike(deals.title, searchTerm),
          ilike(deals.description, searchTerm)
        )
      ));
    }
    
    const dealsList = await query
      .orderBy(desc(deals.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
      
    res.json(dealsList);
  } catch (error) {
    console.error("Error fetching deals:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

// Get single deal
router.get("/deals/:id", isAuthenticated, async (req, res) => {
  try {
    const deal = await storage.getDeal(parseInt(req.params.id));
    if (!deal || deal.userId !== req.user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    res.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    res.status(500).json({ error: "Failed to fetch deal" });
  }
});

// Create new deal
router.post("/deals", isAuthenticated, async (req, res) => {
  try {
    const dealData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const deal = await storage.createDeal(dealData);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('deal_created', { deal });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(201).json(deal);
  } catch (error) {
    console.error("Error creating deal:", error);
    res.status(500).json({ error: "Failed to create deal" });
  }
});

// Update deal
router.put("/deals/:id", isAuthenticated, async (req, res) => {
  try {
    const deal = await storage.getDeal(parseInt(req.params.id));
    if (!deal || deal.userId !== req.user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    const updatedDeal = await storage.updateDeal(parseInt(req.params.id), req.body);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('deal_updated', { deal: updatedDeal });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.json(updatedDeal);
  } catch (error) {
    console.error("Error updating deal:", error);
    res.status(500).json({ error: "Failed to update deal" });
  }
});

// Update deal stage
router.put("/deals/:id/stage", isAuthenticated, async (req, res) => {
  try {
    const deal = await storage.getDeal(parseInt(req.params.id));
    if (!deal || deal.userId !== req.user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    const { stage, probability } = req.body;
    const updatedDeal = await storage.updateDealStage(parseInt(req.params.id), stage, probability);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('deal_stage_updated', { deal: updatedDeal });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.json(updatedDeal);
  } catch (error) {
    console.error("Error updating deal stage:", error);
    res.status(500).json({ error: "Failed to update deal stage" });
  }
});

// Delete deal
router.delete("/deals/:id", isAuthenticated, async (req, res) => {
  try {
    const deal = await storage.getDeal(parseInt(req.params.id));
    if (!deal || deal.userId !== req.user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    await storage.deleteDeal(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('deal_deleted', { dealId: parseInt(req.params.id) });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting deal:", error);
    res.status(500).json({ error: "Failed to delete deal" });
  }
});

// ==================== ACTIVITIES ROUTES ====================

// Get all activities
router.get("/activities", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status, entity_type, entity_id, limit = 50, offset = 0 } = req.query;
    
    let activities;
    
    if (entity_type && entity_id) {
      activities = await storage.getActivitiesByEntity(
        entity_type as 'lead' | 'contact' | 'deal' | 'company',
        parseInt(entity_id as string)
      );
    } else {
      activities = await storage.getActivitiesByUser(userId);
    }
    
    // Apply additional filters
    if (type) {
      activities = activities.filter(a => a.type === type);
    }
    if (status) {
      activities = activities.filter(a => a.status === status);
    }
    
    // Apply pagination
    const start = parseInt(offset as string);
    const end = start + parseInt(limit as string);
    activities = activities.slice(start, end);
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Create new activity
router.post("/activities", isAuthenticated, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const activity = await storage.createActivity(activityData);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('activity_created', { activity });
    }
    
    res.status(201).json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: "Failed to create activity" });
  }
});

// Update activity
router.put("/activities/:id", isAuthenticated, async (req, res) => {
  try {
    const activity = await storage.getActivity(parseInt(req.params.id));
    if (!activity || activity.userId !== req.user.id) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const updatedActivity = await storage.updateActivity(parseInt(req.params.id), req.body);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('activity_updated', { activity: updatedActivity });
    }
    
    res.json(updatedActivity);
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

// Delete activity
router.delete("/activities/:id", isAuthenticated, async (req, res) => {
  try {
    const activity = await storage.getActivity(parseInt(req.params.id));
    if (!activity || activity.userId !== req.user.id) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    await storage.deleteActivity(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('activity_deleted', { activityId: parseInt(req.params.id) });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

// ==================== TASKS ROUTES ====================

// Get all tasks
router.get("/tasks", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, assigned_to, limit = 50, offset = 0 } = req.query;
    
    let tasks;
    
    if (assigned_to) {
      tasks = await storage.getTasksByAssignee(parseInt(assigned_to as string));
    } else {
      tasks = await storage.getTasksByUser(userId);
    }
    
    // Apply filters
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }
    
    // Apply pagination
    const start = parseInt(offset as string);
    const end = start + parseInt(limit as string);
    tasks = tasks.slice(start, end);
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create new task
router.post("/tasks", isAuthenticated, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const task = await storage.createTask(taskData);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('task_created', { task });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.put("/tasks/:id", isAuthenticated, async (req, res) => {
  try {
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const updatedTask = await storage.updateTask(parseInt(req.params.id), req.body);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('task_updated', { task: updatedTask });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Complete task
router.post("/tasks/:id/complete", isAuthenticated, async (req, res) => {
  try {
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const completedTask = await storage.completeTask(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('task_completed', { task: completedTask });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.json(completedTask);
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// Delete task
router.delete("/tasks/:id", isAuthenticated, async (req, res) => {
  try {
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task || task.userId !== req.user.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    await storage.deleteTask(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('task_deleted', { taskId: parseInt(req.params.id) });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ==================== COMPANIES ROUTES ====================

// Get all companies
router.get("/companies", isAuthenticated, async (req, res) => {
  try {
    const companies = await storage.getCrmCompaniesByUser(req.user.id);
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// Create new company
router.post("/companies", isAuthenticated, async (req, res) => {
  try {
    const companyData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const company = await storage.createCrmCompany(companyData);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('company_created', { company });
    }
    
    res.status(201).json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
});

// Update company
router.put("/companies/:id", isAuthenticated, async (req, res) => {
  try {
    const company = await storage.getCrmCompany(parseInt(req.params.id));
    if (!company || company.userId !== req.user.id) {
      return res.status(404).json({ error: "Company not found" });
    }
    
    const updatedCompany = await storage.updateCrmCompany(parseInt(req.params.id), req.body);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('company_updated', { company: updatedCompany });
    }
    
    res.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});

// Delete company
router.delete("/companies/:id", isAuthenticated, async (req, res) => {
  try {
    const company = await storage.getCrmCompany(parseInt(req.params.id));
    if (!company || company.userId !== req.user.id) {
      return res.status(404).json({ error: "Company not found" });
    }
    
    await storage.deleteCrmCompany(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('company_deleted', { companyId: parseInt(req.params.id) });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

// ==================== PHONE CALLS ROUTES ====================

// Get all phone calls
router.get("/phone-calls", isAuthenticated, async (req, res) => {
  try {
    const { entity_type, entity_id, limit = 50, offset = 0 } = req.query;
    
    let phoneCalls;
    
    if (entity_type && entity_id) {
      phoneCalls = await storage.getPhoneCallsByEntity(
        entity_type as 'lead' | 'contact' | 'deal',
        parseInt(entity_id as string)
      );
    } else {
      phoneCalls = await storage.getPhoneCallsByUser(req.user.id);
    }
    
    // Apply pagination
    const start = parseInt(offset as string);
    const end = start + parseInt(limit as string);
    phoneCalls = phoneCalls.slice(start, end);
    
    res.json(phoneCalls);
  } catch (error) {
    console.error("Error fetching phone calls:", error);
    res.status(500).json({ error: "Failed to fetch phone calls" });
  }
});

// Create new phone call
router.post("/phone-calls", isAuthenticated, async (req, res) => {
  try {
    const phoneCallData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const phoneCall = await storage.createPhoneCall(phoneCallData);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('phone_call_created', { phoneCall });
    }
    
    res.status(201).json(phoneCall);
  } catch (error) {
    console.error("Error creating phone call:", error);
    res.status(500).json({ error: "Failed to create phone call" });
  }
});

// Update phone call
router.put("/phone-calls/:id", isAuthenticated, async (req, res) => {
  try {
    const phoneCall = await storage.getPhoneCall(parseInt(req.params.id));
    if (!phoneCall || phoneCall.userId !== req.user.id) {
      return res.status(404).json({ error: "Phone call not found" });
    }
    
    const updatedPhoneCall = await storage.updatePhoneCall(parseInt(req.params.id), req.body);
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('phone_call_updated', { phoneCall: updatedPhoneCall });
    }
    
    res.json(updatedPhoneCall);
  } catch (error) {
    console.error("Error updating phone call:", error);
    res.status(500).json({ error: "Failed to update phone call" });
  }
});

// Delete phone call
router.delete("/phone-calls/:id", isAuthenticated, async (req, res) => {
  try {
    const phoneCall = await storage.getPhoneCall(parseInt(req.params.id));
    if (!phoneCall || phoneCall.userId !== req.user.id) {
      return res.status(404).json({ error: "Phone call not found" });
    }
    
    await storage.deletePhoneCall(parseInt(req.params.id));
    
    // Broadcast real-time event
    if (wsService) {
      wsService.broadcast('phone_call_deleted', { phoneCallId: parseInt(req.params.id) });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting phone call:", error);
    res.status(500).json({ error: "Failed to delete phone call" });
  }
});

// ==================== ANALYTICS & METRICS ROUTES ====================

// Get CRM metrics
router.get("/metrics", isAuthenticated, async (req, res) => {
  try {
    const metrics = await storage.getCrmMetrics(req.user.id);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Get lead analytics
router.get("/lead-analytics", isAuthenticated, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateRange = from && to ? { from: from as string, to: to as string } : undefined;
    const analytics = await storage.getLeadAnalytics(req.user.id, dateRange);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching lead analytics:", error);
    res.status(500).json({ error: "Failed to fetch lead analytics" });
  }
});

// Get contact analytics
router.get("/contact-analytics", isAuthenticated, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateRange = from && to ? { from: from as string, to: to as string } : undefined;
    const analytics = await storage.getContactAnalytics(req.user.id, dateRange);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching contact analytics:", error);
    res.status(500).json({ error: "Failed to fetch contact analytics" });
  }
});

// Get sales pipeline
router.get("/pipeline", isAuthenticated, async (req, res) => {
  try {
    const pipeline = await storage.getSalesPipeline(req.user.id);
    res.json(pipeline);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

// Get deal analytics
router.get("/deal-analytics", isAuthenticated, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateRange = from && to ? { from: from as string, to: to as string } : undefined;
    const analytics = await storage.getDealAnalytics(req.user.id, dateRange);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching deal analytics:", error);
    res.status(500).json({ error: "Failed to fetch deal analytics" });
  }
});

// ==================== INTEGRATION ROUTES ====================

// Convert deal to invoice (Finance integration)
router.post("/deals/:id/convert-to-invoice", isAuthenticated, async (req, res) => {
  try {
    const deal = await storage.getDeal(parseInt(req.params.id));
    if (!deal || deal.userId !== req.user.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    const invoice = await storage.convertDealToInvoice(parseInt(req.params.id), req.body);
    
    // Broadcast real-time events
    if (wsService) {
      wsService.broadcast('deal_converted_to_invoice', { deal, invoice });
      wsService.broadcast('invoice_created', { invoice });
      wsService.broadcast('metrics_updated', await storage.getCrmMetrics(req.user.id));
    }
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error converting deal to invoice:", error);
    res.status(500).json({ error: "Failed to convert deal to invoice" });
  }
});

// ==================== REPORTS ROUTES ====================

// Generate CRM report (PDF)
router.get("/reports", isAuthenticated, async (req, res) => {
  try {
    const { type = 'summary', format = 'pdf' } = req.query;
    
    const metrics = await storage.getCrmMetrics(req.user.id);
    const leads = await storage.getLeadsByUser(req.user.id);
    const deals = await storage.getDealsByUser(req.user.id);
    
    if (format === 'csv') {
      let data;
      switch (type) {
        case 'leads':
          data = Papa.unparse(leads);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=leads-report.csv');
          break;
        case 'deals':
          data = Papa.unparse(deals);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=deals-report.csv');
          break;
        default:
          data = Papa.unparse({ metrics, leadCount: leads.length, dealCount: deals.length });
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=crm-summary.csv');
      }
      res.send(data);
    } else {
      // Generate PDF report
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=crm-report.pdf');
      
      doc.pipe(res);
      
      doc.fontSize(20).text('CRM Report', 100, 100);
      doc.fontSize(14).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 130);
      
      doc.fontSize(16).text('Summary Metrics', 100, 170);
      doc.fontSize(12)
        .text(`Total Leads: ${metrics.totalLeads}`, 100, 200)
        .text(`Total Contacts: ${metrics.totalContacts}`, 100, 220)
        .text(`Total Deals: ${metrics.totalDeals}`, 100, 240)
        .text(`Open Deals: ${metrics.openDeals}`, 100, 260)
        .text(`Won Deals: ${metrics.wonDeals}`, 100, 280)
        .text(`Total Deal Value: $${metrics.totalDealValue.toLocaleString()}`, 100, 300)
        .text(`Conversion Rate: ${metrics.conversionRate.toFixed(2)}%`, 100, 320);
      
      doc.end();
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;