import { Router } from "express";
import { db } from "../../db";
import { payment_reminders, payment_history } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";
import { 
  processPaymentReminders, 
  createOrUpdateReminder, 
  getPaymentReminders, 
  deletePaymentReminder,
  getPaymentReminderHistory,
  sendManualPaymentReminder
} from "../services/payment-reminders";

const router = Router();

// Get all payment reminder configurations
router.get("/", authenticateUser, async (req, res) => {
  try {
    const result = await getPaymentReminders();
    return res.json(result);
  } catch (error) {
    console.error("Error fetching payment reminders:", error);
    return res.status(500).json({ message: "Failed to fetch payment reminders" });
  }
});

// Create a new payment reminder configuration
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { 
      invoiceId, 
      days_offset, 
      offset_type, 
      channel = 'email',
      template_used,
    } = req.body;
    
    // Validate required fields
    if (days_offset === undefined || !offset_type) {
      return res.status(400).json({ message: "days_offset and offset_type are required" });
    }
    
    // Create the reminder
    const result = await createOrUpdateReminder({
      invoiceId,
      days_offset,
      offset_type,
      channel,
      template_used,
      status: 'pending',
      reminder_date: new Date(), // This will be calculated when reminders are processed
    });
    
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating payment reminder:", error);
    return res.status(500).json({ message: "Failed to create payment reminder" });
  }
});

// Update a payment reminder configuration
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      invoiceId, 
      days_offset, 
      offset_type, 
      channel,
      template_used,
      status,
    } = req.body;
    
    // Get the current reminder
    const existingReminder = await db.query.payment_reminders.findFirst({
      where: eq(payment_reminders.id, parseInt(id)),
    });
    
    if (!existingReminder) {
      return res.status(404).json({ message: "Payment reminder not found" });
    }
    
    // Update the reminder
    const result = await createOrUpdateReminder({
      id: parseInt(id),
      invoiceId,
      days_offset: days_offset !== undefined ? days_offset : undefined,
      offset_type: offset_type || undefined,
      channel: channel || undefined,
      template_used: template_used || undefined,
      status: status || undefined,
    });
    
    return res.json(result);
  } catch (error) {
    console.error("Error updating payment reminder:", error);
    return res.status(500).json({ message: "Failed to update payment reminder" });
  }
});

// Delete a payment reminder configuration
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deletePaymentReminder(parseInt(id));
    
    if (!result.reminder) {
      return res.status(404).json({ message: "Payment reminder not found" });
    }
    
    return res.json({ message: "Payment reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment reminder:", error);
    return res.status(500).json({ message: "Failed to delete payment reminder" });
  }
});

// Manually process payment reminders (admin only)
router.post("/process", authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can process reminders" });
    }
    
    const result = await processPaymentReminders();
    return res.json(result);
  } catch (error) {
    console.error("Error processing payment reminders:", error);
    return res.status(500).json({ message: "Failed to process payment reminders" });
  }
});

// Get payment reminder history for an invoice
router.get("/history/:invoiceId", authenticateUser, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const result = await getPaymentReminderHistory(parseInt(invoiceId));
    return res.json(result);
  } catch (error) {
    console.error("Error fetching payment reminder history:", error);
    return res.status(500).json({ message: "Failed to fetch payment reminder history" });
  }
});

// Send a manual payment reminder for an invoice
router.post("/send/:invoiceId", authenticateUser, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const result = await sendManualPaymentReminder(parseInt(invoiceId), req.user!.id);
    return res.json(result);
  } catch (error) {
    console.error("Error sending manual payment reminder:", error);
    return res.status(500).json({ message: "Failed to send payment reminder", error: error.message });
  }
});

export default router;