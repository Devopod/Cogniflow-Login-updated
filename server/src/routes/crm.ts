import express from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { wsService } from "../../websocket";
import {
  insertLeadSchema,
  insertActivitySchema,
  insertTaskSchema,
  insertCrmCompanySchema,
  insertPhoneCallSchema,
  insertDealStageSchema,
  type Lead,
  type Contact,
  type Activity,
  type Task,
  type CrmCompany,
  type PhoneCall,
  type DealStage,
} from "@shared/schema";
import multer from "multer";
import Papa from "papaparse";
// import { Resend } from "resend";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to check if the user is authenticated
const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
// const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware to ensure authentication
router.use(isAuthenticated);

// Input validation schemas
const leadUpdateSchema = insertLeadSchema.partial();
const activityUpdateSchema = insertActivitySchema.partial();
const taskUpdateSchema = insertTaskSchema.partial();
const companyUpdateSchema = insertCrmCompanySchema.partial();
const phoneCallUpdateSchema = insertPhoneCallSchema.partial();
const dealStageUpdateSchema = insertDealStageSchema.partial();

// Pagination schema
const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  priority: z.string().optional(),
});

// ====================
// LEADS ENDPOINTS
// ====================

// Get all leads
router.get("/leads", async (req, res) => {
  try {
    const { page, limit, search, status, source, priority } = paginationSchema.parse(req.query);
    const userId = req.user!.id;
    
    let leads = await storage.getLeadsByUser(userId);
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead => 
        lead.firstName.toLowerCase().includes(searchLower) ||
        lead.lastName.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }
    
    if (source) {
      leads = leads.filter(lead => lead.source === source);
    }
    
    if (priority) {
      leads = leads.filter(lead => lead.priority === priority);
    }
    
    // Apply pagination
    const total = leads.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = leads.slice(startIndex, startIndex + limit);
    
    res.json({
      data: paginatedLeads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Get single lead
router.get("/leads/:id", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const lead = await storage.getLead(leadId);
    
    if (!lead || lead.userId !== req.user!.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    res.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Create lead
router.post("/leads", async (req, res) => {
  try {
    const leadData = insertLeadSchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    
    const lead = await storage.createLead(leadData);
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid lead data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Update lead
router.put("/leads/:id", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const leadData = leadUpdateSchema.parse(req.body);
    
    const existingLead = await storage.getLead(leadId);
    if (!existingLead || existingLead.userId !== req.user!.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const lead = await storage.updateLead(leadId, leadData);
    res.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid lead data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Delete lead
router.delete("/leads/:id", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    
    const existingLead = await storage.getLead(leadId);
    if (!existingLead || existingLead.userId !== req.user!.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    await storage.deleteLead(leadId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// Convert lead to contact
router.post("/leads/:id/convert", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    
    const existingLead = await storage.getLead(leadId);
    if (!existingLead || existingLead.userId !== req.user!.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    const contact = await storage.convertLeadToContact(leadId);
    res.json(contact);
  } catch (error) {
    console.error("Error converting lead:", error);
    res.status(500).json({ error: "Failed to convert lead" });
  }
});

// Import leads from CSV
router.post("/leads/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const csvData = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    
    const results = {
      total: parsed.data.length,
      success: 0,
      errors: [] as any[],
    };
    
    for (const [index, row] of parsed.data.entries()) {
      try {
        const leadData = insertLeadSchema.parse({
          ...row,
          userId: req.user!.id,
        });
        
        await storage.createLead(leadData);
        results.success++;
      } catch (error) {
        results.errors.push({
          row: index + 1,
          data: row,
          error: error instanceof z.ZodError ? error.errors : error.message,
        });
      }
    }
    
    // Broadcast import completion
    wsService.broadcast("leads_imported", { userId: req.user!.id, results });
    
    res.json(results);
  } catch (error) {
    console.error("Error importing leads:", error);
    res.status(500).json({ error: "Failed to import leads" });
  }
});

// Export leads to CSV
router.get("/leads/export", async (req, res) => {
  try {
    const leads = await storage.getLeadsByUser(req.user!.id);
    
    const csvData = Papa.unparse(leads.map(lead => ({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      estimatedValue: lead.estimatedValue,
      notes: lead.notes,
      createdAt: lead.createdAt,
    })));
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
    res.send(csvData);
  } catch (error) {
    console.error("Error exporting leads:", error);
    res.status(500).json({ error: "Failed to export leads" });
  }
});

// Send email to lead
router.post("/leads/:id/email", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { subject, message } = req.body;
    
    const lead = await storage.getLead(leadId);
    if (!lead || lead.userId !== req.user!.id) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    if (!lead.email) {
      return res.status(400).json({ error: "Lead has no email address" });
    }
    
    // TODO: Implement email sending with proper email service
    // For now, just log and create activity record
    console.log(`Would send email to ${lead.email}: ${subject || "Follow-up from our team"}`);
    
    // Create activity for email sent
    await storage.createActivity({
      userId: req.user!.id,
      leadId: leadId,
      activityType: "email",
      subject: subject || "Email sent",
      description: message,
      activityDate: new Date().toISOString(),
    });
    
    // Broadcast WebSocket event
    wsService.broadcast("email_sent", {
      lead,
      subject,
      message,
    });
    
    res.json({ success: true, message: "Email scheduled successfully" });
  } catch (error) {
    console.error("Error sending email to lead:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ====================
// ACTIVITIES ENDPOINTS
// ====================

// Get all activities
router.get("/activities", async (req, res) => {
  try {
    const { contactId, leadId, dealId } = req.query;
    let activities;
    
    if (contactId) {
      activities = await storage.getActivitiesByContact(parseInt(contactId as string));
    } else if (leadId) {
      activities = await storage.getActivitiesByLead(parseInt(leadId as string));
    } else if (dealId) {
      activities = await storage.getActivitiesByDeal(parseInt(dealId as string));
    } else {
      activities = await storage.getActivitiesByUser(req.user!.id);
    }
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Get recent activities
router.get("/activities/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await storage.getRecentActivities(req.user!.id, limit);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
});

// Create activity
router.post("/activities", async (req, res) => {
  try {
    const activityData = insertActivitySchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    
    const activity = await storage.createActivity(activityData);
    res.status(201).json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid activity data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create activity" });
  }
});

// Update activity
router.put("/activities/:id", async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    const activityData = activityUpdateSchema.parse(req.body);
    
    const existingActivity = await storage.getActivity(activityId);
    if (!existingActivity || existingActivity.userId !== req.user!.id) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const activity = await storage.updateActivity(activityId, activityData);
    res.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid activity data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update activity" });
  }
});

// Delete activity
router.delete("/activities/:id", async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    
    const existingActivity = await storage.getActivity(activityId);
    if (!existingActivity || existingActivity.userId !== req.user!.id) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    await storage.deleteActivity(activityId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

// ====================
// TASKS ENDPOINTS
// ====================

// Get all tasks
router.get("/tasks", async (req, res) => {
  try {
    const { assignedTo } = req.query;
    let tasks;
    
    if (assignedTo) {
      tasks = await storage.getTasksByAssignee(parseInt(assignedTo as string));
    } else {
      tasks = await storage.getTasksByUser(req.user!.id);
    }
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get upcoming tasks
router.get("/tasks/upcoming", async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const tasks = await storage.getUpcomingTasks(req.user!.id, days);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching upcoming tasks:", error);
    res.status(500).json({ error: "Failed to fetch upcoming tasks" });
  }
});

// Create task
router.post("/tasks", async (req, res) => {
  try {
    const taskData = insertTaskSchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    
    const task = await storage.createTask(taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid task data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const taskData = taskUpdateSchema.parse(req.body);
    
    const existingTask = await storage.getTask(taskId);
    if (!existingTask || existingTask.userId !== req.user!.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const task = await storage.updateTask(taskId, taskData);
    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid task data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Complete task
router.post("/tasks/:id/complete", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const existingTask = await storage.getTask(taskId);
    if (!existingTask || existingTask.userId !== req.user!.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    const task = await storage.completeTask(taskId);
    res.json(task);
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

// Delete task
router.delete("/tasks/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const existingTask = await storage.getTask(taskId);
    if (!existingTask || existingTask.userId !== req.user!.id) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    await storage.deleteTask(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ====================
// COMPANIES ENDPOINTS
// ====================

// Get all companies
router.get("/companies", async (req, res) => {
  try {
    const companies = await storage.getCrmCompaniesByUser(req.user!.id);
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// Create company
router.post("/companies", async (req, res) => {
  try {
    const companyData = insertCrmCompanySchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    
    const company = await storage.createCrmCompany(companyData);
    res.status(201).json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid company data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create company" });
  }
});

// Update company
router.put("/companies/:id", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const companyData = companyUpdateSchema.parse(req.body);
    
    const existingCompany = await storage.getCrmCompany(companyId);
    if (!existingCompany || existingCompany.userId !== req.user!.id) {
      return res.status(404).json({ error: "Company not found" });
    }
    
    const company = await storage.updateCrmCompany(companyId, companyData);
    res.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid company data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update company" });
  }
});

// Delete company
router.delete("/companies/:id", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    
    const existingCompany = await storage.getCrmCompany(companyId);
    if (!existingCompany || existingCompany.userId !== req.user!.id) {
      return res.status(404).json({ error: "Company not found" });
    }
    
    await storage.deleteCrmCompany(companyId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

// ====================
// PHONE CALLS ENDPOINTS
// ====================

// Get all phone calls
router.get("/phone-calls", async (req, res) => {
  try {
    const { contactId } = req.query;
    let phoneCalls;
    
    if (contactId) {
      phoneCalls = await storage.getPhoneCallsByContact(parseInt(contactId as string));
    } else {
      phoneCalls = await storage.getPhoneCallsByUser(req.user!.id);
    }
    
    res.json(phoneCalls);
  } catch (error) {
    console.error("Error fetching phone calls:", error);
    res.status(500).json({ error: "Failed to fetch phone calls" });
  }
});

// Create phone call
router.post("/phone-calls", async (req, res) => {
  try {
    const phoneCallData = insertPhoneCallSchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    
    const phoneCall = await storage.createPhoneCall(phoneCallData);
    res.status(201).json(phoneCall);
  } catch (error) {
    console.error("Error creating phone call:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid phone call data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create phone call" });
  }
});

// Update phone call
router.put("/phone-calls/:id", async (req, res) => {
  try {
    const phoneCallId = parseInt(req.params.id);
    const phoneCallData = phoneCallUpdateSchema.parse(req.body);
    
    const existingPhoneCall = await storage.getPhoneCall(phoneCallId);
    if (!existingPhoneCall || existingPhoneCall.userId !== req.user!.id) {
      return res.status(404).json({ error: "Phone call not found" });
    }
    
    const phoneCall = await storage.updatePhoneCall(phoneCallId, phoneCallData);
    res.json(phoneCall);
  } catch (error) {
    console.error("Error updating phone call:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid phone call data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update phone call" });
  }
});

// Delete phone call
router.delete("/phone-calls/:id", async (req, res) => {
  try {
    const phoneCallId = parseInt(req.params.id);
    
    const existingPhoneCall = await storage.getPhoneCall(phoneCallId);
    if (!existingPhoneCall || existingPhoneCall.userId !== req.user!.id) {
      return res.status(404).json({ error: "Phone call not found" });
    }
    
    await storage.deletePhoneCall(phoneCallId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting phone call:", error);
    res.status(500).json({ error: "Failed to delete phone call" });
  }
});

// ====================
// DEAL STAGES ENDPOINTS
// ====================

// Get all deal stages
router.get("/deal-stages", async (req, res) => {
  try {
    const stages = await storage.getDealStagesByUser(req.user!.id);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching deal stages:", error);
    res.status(500).json({ error: "Failed to fetch deal stages" });
  }
});

// Create deal stage
router.post("/deal-stages", async (req, res) => {
  try {
    const stageData = insertDealStageSchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    
    const stage = await storage.createDealStage(stageData);
    res.status(201).json(stage);
  } catch (error) {
    console.error("Error creating deal stage:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid deal stage data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create deal stage" });
  }
});

// Update deal stage
router.put("/deal-stages/:id", async (req, res) => {
  try {
    const stageId = parseInt(req.params.id);
    const stageData = dealStageUpdateSchema.parse(req.body);
    
    const existingStage = await storage.getDealStage(stageId);
    if (!existingStage || existingStage.userId !== req.user!.id) {
      return res.status(404).json({ error: "Deal stage not found" });
    }
    
    const stage = await storage.updateDealStage(stageId, stageData);
    res.json(stage);
  } catch (error) {
    console.error("Error updating deal stage:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid deal stage data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update deal stage" });
  }
});

// Reorder deal stages
router.post("/deal-stages/reorder", async (req, res) => {
  try {
    const { stageOrders } = req.body;
    
    if (!Array.isArray(stageOrders)) {
      return res.status(400).json({ error: "stageOrders must be an array" });
    }
    
    await storage.reorderDealStages(req.user!.id, stageOrders);
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering deal stages:", error);
    res.status(500).json({ error: "Failed to reorder deal stages" });
  }
});

// Delete deal stage
router.delete("/deal-stages/:id", async (req, res) => {
  try {
    const stageId = parseInt(req.params.id);
    
    const existingStage = await storage.getDealStage(stageId);
    if (!existingStage || existingStage.userId !== req.user!.id) {
      return res.status(404).json({ error: "Deal stage not found" });
    }
    
    await storage.deleteDealStage(stageId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal stage:", error);
    res.status(500).json({ error: "Failed to delete deal stage" });
  }
});

// ====================
// METRICS & ANALYTICS ENDPOINTS
// ====================

// Get CRM metrics dashboard
router.get("/metrics", async (req, res) => {
  try {
    const metrics = await storage.getCrmMetrics(req.user!.id);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching CRM metrics:", error);
    res.status(500).json({ error: "Failed to fetch CRM metrics" });
  }
});

// Get lead analytics
router.get("/lead-analytics", async (req, res) => {
  try {
    const analytics = await storage.getLeadAnalytics(req.user!.id);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching lead analytics:", error);
    res.status(500).json({ error: "Failed to fetch lead analytics" });
  }
});

// Get lead source analytics
router.get("/lead-source-analytics", async (req, res) => {
  try {
    const analytics = await storage.getLeadSourceAnalytics(req.user!.id);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching lead source analytics:", error);
    res.status(500).json({ error: "Failed to fetch lead source analytics" });
  }
});

// Get deal pipeline
router.get("/pipeline", async (req, res) => {
  try {
    const pipeline = await storage.getDealPipeline(req.user!.id);
    res.json(pipeline);
  } catch (error) {
    console.error("Error fetching deal pipeline:", error);
    res.status(500).json({ error: "Failed to fetch deal pipeline" });
  }
});

// Get sales conversion funnel
router.get("/conversion-funnel", async (req, res) => {
  try {
    const funnel = await storage.getSalesConversionFunnel(req.user!.id);
    res.json(funnel);
  } catch (error) {
    console.error("Error fetching conversion funnel:", error);
    res.status(500).json({ error: "Failed to fetch conversion funnel" });
  }
});

// ====================
// INTEGRATIONS ENDPOINTS
// ====================

// Convert deal to invoice
router.post("/deals/:id/convert-to-invoice", async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const invoiceData = req.body;
    
    const deal = await storage.getDeal(dealId);
    if (!deal || deal.userId !== req.user!.id) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    const invoice = await storage.convertDealToInvoice(dealId, invoiceData);
    
    // Broadcast WebSocket event
    wsService.broadcast("deal_converted_to_invoice", {
      deal,
      invoice,
    });
    
    res.json(invoice);
  } catch (error) {
    console.error("Error converting deal to invoice:", error);
    res.status(500).json({ error: "Failed to convert deal to invoice" });
  }
});

// Generate reports
router.post("/reports/generate", async (req, res) => {
  try {
    const { type, format, dateRange } = req.body;
    
    let data;
    switch (type) {
      case "leads":
        data = await storage.getLeadsByUser(req.user!.id);
        break;
      case "activities":
        data = await storage.getActivitiesByUser(req.user!.id);
        break;
      case "tasks":
        data = await storage.getTasksByUser(req.user!.id);
        break;
      case "metrics":
        data = await storage.getCrmMetrics(req.user!.id);
        break;
      default:
        return res.status(400).json({ error: "Invalid report type" });
    }
    
    if (format === "csv") {
      const csvData = Papa.unparse(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${type}-report.csv`);
      res.send(csvData);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// ====================
// AUDIT LOGS ENDPOINTS
// ====================

// Get audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const { resourceType, resourceId } = req.query;
    
    let logs;
    if (resourceType && resourceId) {
      logs = await storage.getAuditLogsByResource(
        resourceType as string,
        parseInt(resourceId as string)
      );
    } else {
      logs = await storage.getAuditLogsByUser(req.user!.id);
    }
    
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;