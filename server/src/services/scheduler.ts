import { db } from "../../db";
import { invoices, contacts } from "@shared/schema";
import { eq, and, lt, not, or } from "drizzle-orm";
import { sendInvoiceEmail } from "./email";
import { WSService } from "../../websocket";

// Get WebSocket service instance
let wsService: WSService;
export const setSchedulerWSService = (ws: WSService) => {
  wsService = ws;
};

interface ScheduledTask {
  id: string;
  name: string;
  interval: number; // in milliseconds
  lastRun: number;
  fn: () => Promise<void>;
  isRunning: boolean;
}

class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 60 * 1000; // Check every minute

  constructor() {
    this.start();
  }

  /**
   * Register a new task
   * @param task - Task configuration
   */
  registerTask(task: Omit<ScheduledTask, 'lastRun' | 'isRunning'>): void {
    this.tasks.set(task.id, {
      ...task,
      lastRun: 0,
      isRunning: false
    });
    
    console.log(`Task registered: ${task.name} (${task.id})`);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.intervalId) {
      return;
    }
    
    this.intervalId = setInterval(() => this.checkTasks(), this.checkInterval);
    console.log('Task scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Task scheduler stopped');
    }
  }

  /**
   * Check and run due tasks
   */
  private async checkTasks(): Promise<void> {
    const now = Date.now();
    
    for (const [id, task] of this.tasks.entries()) {
      // Skip if task is already running
      if (task.isRunning) {
        continue;
      }
      
      // Check if it's time to run the task
      if (now - task.lastRun >= task.interval) {
        // Mark task as running
        task.isRunning = true;
        
        try {
          console.log(`Running task: ${task.name}`);
          await task.fn();
          
          // Update last run time
          task.lastRun = now;
          console.log(`Task completed: ${task.name}`);
        } catch (error) {
          console.error(`Error running task ${task.name}:`, error);
        } finally {
          // Mark task as not running
          task.isRunning = false;
        }
      }
    }
  }

  /**
   * Run a task immediately
   * @param id - Task ID
   */
  async runTaskNow(id: string): Promise<void> {
    const task = this.tasks.get(id);
    
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    
    // Skip if task is already running
    if (task.isRunning) {
      console.log(`Task ${task.name} is already running`);
      return;
    }
    
    // Mark task as running
    task.isRunning = true;
    
    try {
      console.log(`Running task now: ${task.name}`);
      await task.fn();
      
      // Update last run time
      task.lastRun = Date.now();
      console.log(`Task completed: ${task.name}`);
    } catch (error) {
      console.error(`Error running task ${task.name}:`, error);
    } finally {
      // Mark task as not running
      task.isRunning = false;
    }
  }

  /**
   * Get all registered tasks
   */
  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Remove a task
   * @param id - Task ID
   */
  removeTask(id: string): boolean {
    return this.tasks.delete(id);
  }
}

// Create a singleton instance
export const scheduler = new TaskScheduler();

// Register tasks
scheduler.registerTask({
  id: 'check-overdue-invoices',
  name: 'Check for Overdue Invoices',
  interval: 24 * 60 * 60 * 1000, // Once a day
  fn: async () => {
    try {
      // Find invoices that are overdue but not marked as overdue
      const overdueInvoices = await db.select()
        .from(invoices)
        .where(
          and(
            lt(invoices.dueDate, new Date()),
            not(eq(invoices.status, 'paid')),
            not(eq(invoices.status, 'void')),
            not(eq(invoices.status, 'overdue'))
          )
        );
      
      console.log(`Found ${overdueInvoices.length} newly overdue invoices`);
      
      // Update each invoice to overdue status
      for (const invoice of overdueInvoices) {
        await db.update(invoices)
          .set({
            status: 'overdue',
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));
        
        // Notify via WebSocket if available
        if (wsService) {
          wsService.broadcastToResource('invoices', invoice.id, 'status_changed', {
            invoiceId: invoice.id,
            previousStatus: invoice.status,
            status: 'overdue',
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`Marked invoice #${invoice.invoiceNumber} as overdue`);
      }
    } catch (error) {
      console.error('Error checking for overdue invoices:', error);
    }
  }
});

scheduler.registerTask({
  id: 'send-payment-reminders',
  name: 'Send Payment Reminders',
  interval: 24 * 60 * 60 * 1000, // Once a day
  fn: async () => {
    try {
      // Find invoices that are overdue and haven't had a reminder sent in the last 7 days
      // In a real implementation, you would track when reminders were sent
      // Use a very simple query to avoid any issues
      const overdueInvoices = await db.execute(`
        SELECT * FROM invoices 
        WHERE status = 'overdue' 
        OR (due_date < CURRENT_DATE AND status != 'paid' AND status != 'void')
      `).then(result => result.rows);
      
      console.log(`Found ${overdueInvoices.length} invoices for payment reminders`);
      
      // Send reminder for each invoice
      for (const invoice of overdueInvoices) {
        // We need to fetch the contact separately since we're not using relations
        if (!invoice.contact_id) {
          console.log(`Skipping reminder for invoice #${invoice.invoice_number}: no contact associated`);
          continue;
        }
        
        try {
          // Get contact information
          const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contact_id));
          
          // Skip if no contact or no email
          if (!contact || !contact.email) {
            console.log(`Skipping reminder for invoice #${invoice.invoice_number}: no contact email`);
            continue;
          }
          
          // Send reminder email
          await sendInvoiceEmail({
            invoice,
            to: contact.email,
            subject: `Payment Reminder: Invoice #${invoice.invoice_number} is Overdue`,
            message: `This is a friendly reminder that invoice #${invoice.invoice_number} is overdue. Please make payment at your earliest convenience.`,
          });
          
          // Update invoice notes
          await db.update(invoices)
            .set({
              notes: invoice.notes ? 
                `${invoice.notes}\n[${new Date().toISOString()}] Payment reminder sent to ${contact.email}` : 
                `[${new Date().toISOString()}] Payment reminder sent to ${contact.email}`,
              updated_at: new Date(),
            })
            .where(eq(invoices.id, invoice.id));
          
          // Notify via WebSocket if available
          if (wsService) {
            wsService.broadcastToResource('invoices', invoice.id, 'reminder_sent', {
              invoiceId: invoice.id,
              to: contact.email,
              timestamp: new Date().toISOString()
            });
          }
          
          console.log(`Sent payment reminder for invoice #${invoice.invoice_number} to ${contact.email}`);
        } catch (error) {
          console.error(`Error sending reminder for invoice #${invoice.invoice_number}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }
});

// Export the scheduler instance
export default scheduler;