import { db } from '../../db';
import { invoices, payment_reminders, payment_history, contacts } from '@shared/schema';
import { eq, and, or, lt, gt, gte, lte, isNull, sql } from 'drizzle-orm';
import { sendEmail } from './email';
import { formatCurrency } from '../utils/format';

/**
 * Check for invoices that need reminders and send them
 */
export async function processPaymentReminders() {
  try {
    console.log('Processing payment reminders...');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Process due date reminders
    await processDueDateReminders(today);
    
    // Process overdue reminders
    await processOverdueReminders(today);
    
    console.log('Payment reminders processed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error processing payment reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process reminders for invoices that are due soon
 */
async function processDueDateReminders(today: Date) {
  try {
    // Get all active reminders configured for before due date
    const dueReminders = await db.query.payment_reminders.findMany({
      where: and(
        eq(payment_reminders.status, 'pending'),
        eq(payment_reminders.offset_type, 'before_due'),
        lt(payment_reminders.days_offset, 0) // Negative days means before due date
      ),
    });
    
    // Group reminders by days offset
    const remindersByOffset: Record<number, typeof payment_reminders.$inferSelect[]> = {};
    for (const reminder of dueReminders) {
      const offset = reminder.days_offset;
      if (!remindersByOffset[offset]) {
        remindersByOffset[offset] = [];
      }
      remindersByOffset[offset].push(reminder);
    }
    
    // Process each group of reminders
    for (const [offsetStr, reminders] of Object.entries(remindersByOffset)) {
      const offset = parseInt(offsetStr);
      
      // Calculate the target due date (today + abs(offset))
      const targetDueDate = new Date(today);
      targetDueDate.setDate(targetDueDate.getDate() - offset); // Negative offset becomes positive days ahead
      
      // Find invoices due on the target date that haven't been fully paid
      // and haven't had a due reminder sent
      const dueInvoices = await db.query.invoices.findMany({
        where: and(
          eq(sql`DATE(${invoices.dueDate})`, sql`DATE(${sql.raw('?')})`, [targetDueDate]),
          or(
            eq(invoices.payment_status, 'Unpaid'),
            eq(invoices.payment_status, 'Partial Payment')
          ),
          eq(invoices.payment_due_reminder_sent, false)
        ),
        with: {
          contact: true,
        },
      });
      
      console.log(`Found ${dueInvoices.length} invoices due on ${targetDueDate.toISOString().split('T')[0]} (${offset} days from now)`);
      
      // Send reminders for each invoice
      for (const invoice of dueInvoices) {
        if (!invoice.contact?.email) {
          console.log(`Skipping reminder for invoice #${invoice.invoiceNumber} - no contact email`);
          continue;
        }
        
        // Send the reminder email
        await sendDueReminderEmail(invoice, Math.abs(offset));
        
        // Update the invoice to mark reminder as sent
        await db.update(invoices)
          .set({
            payment_due_reminder_sent: true,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));
        
        // Record in payment history
        await db.insert(payment_history)
          .values({
            invoiceId: invoice.id,
            event_type: 'reminder_sent',
            event_timestamp: new Date(),
            details: {
              type: 'due_date',
              days_before: Math.abs(offset),
              due_date: invoice.dueDate,
            },
            created_at: new Date(),
          });
        
        console.log(`Sent due date reminder for invoice #${invoice.invoiceNumber} to ${invoice.contact.email}`);
      }
    }
  } catch (error) {
    console.error('Error processing due date reminders:', error);
    throw error;
  }
}

/**
 * Process reminders for overdue invoices
 */
async function processOverdueReminders(today: Date) {
  try {
    // Get all active reminders configured for after due date
    const overdueReminders = await db.query.payment_reminders.findMany({
      where: and(
        eq(payment_reminders.status, 'pending'),
        eq(payment_reminders.offset_type, 'after_due'),
        gt(payment_reminders.days_offset, 0) // Positive days means after due date
      ),
    });
    
    // Group reminders by days offset
    const remindersByOffset: Record<number, typeof payment_reminders.$inferSelect[]> = {};
    for (const reminder of overdueReminders) {
      const offset = reminder.days_offset;
      if (!remindersByOffset[offset]) {
        remindersByOffset[offset] = [];
      }
      remindersByOffset[offset].push(reminder);
    }
    
    // Process each group of reminders
    for (const [offsetStr, reminders] of Object.entries(remindersByOffset)) {
      const offset = parseInt(offsetStr);
      
      // Calculate the target due date (today - offset)
      const targetDueDate = new Date(today);
      targetDueDate.setDate(targetDueDate.getDate() - offset);
      
      // Find invoices that became due on the target date, haven't been fully paid,
      // and haven't had an overdue reminder sent
      const overdueInvoices = await db.query.invoices.findMany({
        where: and(
          eq(sql`DATE(${invoices.dueDate})`, sql`DATE(${sql.raw('?')})`, [targetDueDate]),
          or(
            eq(invoices.payment_status, 'Unpaid'),
            eq(invoices.payment_status, 'Partial Payment')
          ),
          eq(invoices.payment_overdue_reminder_sent, false)
        ),
        with: {
          contact: true,
        },
      });
      
      console.log(`Found ${overdueInvoices.length} invoices overdue by ${offset} days (due on ${targetDueDate.toISOString().split('T')[0]})`);
      
      // Send reminders for each invoice
      for (const invoice of overdueInvoices) {
        if (!invoice.contact?.email) {
          console.log(`Skipping reminder for invoice #${invoice.invoiceNumber} - no contact email`);
          continue;
        }
        
        // Send the reminder email
        await sendOverdueReminderEmail(invoice, offset);
        
        // Update the invoice to mark reminder as sent
        await db.update(invoices)
          .set({
            payment_overdue_reminder_sent: true,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));
        
        // Record in payment history
        await db.insert(payment_history)
          .values({
            invoiceId: invoice.id,
            event_type: 'reminder_sent',
            event_timestamp: new Date(),
            details: {
              type: 'overdue',
              days_overdue: offset,
              due_date: invoice.dueDate,
            },
            created_at: new Date(),
          });
        
        console.log(`Sent overdue reminder for invoice #${invoice.invoiceNumber} to ${invoice.contact.email}`);
      }
    }
  } catch (error) {
    console.error('Error processing overdue reminders:', error);
    throw error;
  }
}

/**
 * Send a reminder email for an invoice due soon
 */
async function sendDueReminderEmail(invoice: any, daysUntilDue: number) {
  try {
    if (!invoice.contact?.email) {
      throw new Error('Contact email is required');
    }
    
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    const amountDue = formatCurrency(invoice.totalAmount - (invoice.amountPaid || 0), invoice.currency || 'USD');
    
    const subject = `Payment Reminder: Invoice #${invoice.invoiceNumber} due in ${daysUntilDue} days`;
    
    const text = `Dear ${invoice.contact.firstName},

This is a friendly reminder that invoice #${invoice.invoiceNumber} for ${amountDue} is due for payment in ${daysUntilDue} days (${dueDate}).

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
- Due Date: ${dueDate}
- Amount Due: ${amountDue}

Please ensure payment is made by the due date to avoid any late fees.

If you have already made the payment, please disregard this reminder.

Thank you for your business.

Regards,
Your Company`;

    const html = `
<p>Dear ${invoice.contact.firstName},</p>

<p>This is a friendly reminder that invoice #${invoice.invoiceNumber} for <strong>${amountDue}</strong> is due for payment in <strong>${daysUntilDue} days</strong> (${dueDate}).</p>

<h3>Invoice Details:</h3>
<ul>
  <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
  <li><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</li>
  <li><strong>Due Date:</strong> ${dueDate}</li>
  <li><strong>Amount Due:</strong> ${amountDue}</li>
</ul>

<p>Please ensure payment is made by the due date to avoid any late fees.</p>

<p>If you have already made the payment, please disregard this reminder.</p>

<p>Thank you for your business.</p>

<p>Regards,<br>
Your Company</p>`;

    await sendEmail({
      to: invoice.contact.email,
      subject,
      text,
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending due reminder email:', error);
    throw error;
  }
}

/**
 * Send a reminder email for an overdue invoice
 */
async function sendOverdueReminderEmail(invoice: any, daysOverdue: number) {
  try {
    if (!invoice.contact?.email) {
      throw new Error('Contact email is required');
    }
    
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    const amountDue = formatCurrency(invoice.totalAmount - (invoice.amountPaid || 0), invoice.currency || 'USD');
    
    const subject = `OVERDUE: Invoice #${invoice.invoiceNumber} is ${daysOverdue} days past due`;
    
    const text = `Dear ${invoice.contact.firstName},

This is an important notice that invoice #${invoice.invoiceNumber} for ${amountDue} is now ${daysOverdue} days overdue.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
- Due Date: ${dueDate} (${daysOverdue} days ago)
- Amount Due: ${amountDue}

Please make payment as soon as possible to avoid any further late fees or actions.

If you have already made the payment, please disregard this reminder.

If you are experiencing difficulties making payment, please contact us to discuss payment options.

Thank you for your prompt attention to this matter.

Regards,
Your Company`;

    const html = `
<p>Dear ${invoice.contact.firstName},</p>

<p>This is an important notice that invoice #${invoice.invoiceNumber} for <strong>${amountDue}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>

<h3>Invoice Details:</h3>
<ul>
  <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
  <li><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</li>
  <li><strong>Due Date:</strong> ${dueDate} (${daysOverdue} days ago)</li>
  <li><strong>Amount Due:</strong> ${amountDue}</li>
</ul>

<p>Please make payment as soon as possible to avoid any further late fees or actions.</p>

<p>If you have already made the payment, please disregard this reminder.</p>

<p>If you are experiencing difficulties making payment, please contact us to discuss payment options.</p>

<p>Thank you for your prompt attention to this matter.</p>

<p>Regards,<br>
Your Company</p>`;

    await sendEmail({
      to: invoice.contact.email,
      subject,
      text,
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending overdue reminder email:', error);
    throw error;
  }
}

/**
 * Create or update a payment reminder configuration
 */
export async function createOrUpdateReminder(reminderData: Partial<typeof payment_reminders.$inferInsert>) {
  try {
    // Check if reminder already exists
    if (reminderData.id) {
      // Update existing reminder
      const [updatedReminder] = await db.update(payment_reminders)
        .set({
          ...reminderData,
          updated_at: new Date(),
        })
        .where(eq(payment_reminders.id, reminderData.id))
        .returning();
      
      return { success: true, reminder: updatedReminder };
    } else {
      // Create new reminder
      const [newReminder] = await db.insert(payment_reminders)
        .values({
          ...reminderData,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      
      return { success: true, reminder: newReminder };
    }
  } catch (error) {
    console.error('Error creating/updating payment reminder:', error);
    throw error;
  }
}

/**
 * Get all payment reminders
 */
export async function getPaymentReminders() {
  try {
    const reminders = await db.query.payment_reminders.findMany({
      orderBy: [
        sql`CASE WHEN ${payment_reminders.offset_type} = 'before_due' THEN 0 ELSE 1 END`,
        sql`ABS(${payment_reminders.days_offset})`,
      ],
    });
    
    return { success: true, reminders };
  } catch (error) {
    console.error('Error fetching payment reminders:', error);
    throw error;
  }
}

/**
 * Delete a payment reminder
 */
export async function deletePaymentReminder(id: number) {
  try {
    const [deletedReminder] = await db.delete(payment_reminders)
      .where(eq(payment_reminders.id, id))
      .returning();
    
    return { success: true, reminder: deletedReminder };
  } catch (error) {
    console.error('Error deleting payment reminder:', error);
    throw error;
  }
}

/**
 * Get payment reminder history for an invoice
 */
export async function getPaymentReminderHistory(invoiceId: number) {
  try {
    const history = await db.query.payment_history.findMany({
      where: and(
        eq(payment_history.invoiceId, invoiceId),
        eq(payment_history.event_type, 'reminder_sent')
      ),
      orderBy: [desc(payment_history.event_timestamp)],
    });
    
    return { success: true, history };
  } catch (error) {
    console.error('Error fetching payment reminder history:', error);
    throw error;
  }
}

/**
 * Send a manual payment reminder for an invoice
 */
export async function sendManualPaymentReminder(invoiceId: number, userId: number) {
  try {
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        contact: true,
      },
    });
    
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    if (!invoice.contact?.email) {
      throw new Error('Contact email is required');
    }
    
    // Check if invoice is unpaid or partially paid
    if (invoice.payment_status !== 'Unpaid' && invoice.payment_status !== 'Partial Payment') {
      throw new Error(`Cannot send reminder for invoice with status: ${invoice.payment_status}`);
    }
    
    // Calculate days overdue
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Send appropriate reminder based on due status
    if (daysOverdue > 0) {
      await sendOverdueReminderEmail(invoice, daysOverdue);
    } else {
      await sendDueReminderEmail(invoice, -daysOverdue);
    }
    
    // Record in payment history
    await db.insert(payment_history)
      .values({
        invoiceId,
        event_type: 'reminder_sent',
        event_timestamp: new Date(),
        details: {
          type: daysOverdue > 0 ? 'overdue' : 'due_date',
          days_overdue: daysOverdue > 0 ? daysOverdue : 0,
          days_before: daysOverdue <= 0 ? -daysOverdue : 0,
          due_date: invoice.dueDate,
          manual: true,
        },
        user_id: userId,
        created_at: new Date(),
      });
    
    return { 
      success: true, 
      message: `Payment reminder sent to ${invoice.contact.email}`,
      reminderType: daysOverdue > 0 ? 'overdue' : 'due_date',
    };
  } catch (error) {
    console.error('Error sending manual payment reminder:', error);
    throw error;
  }
}