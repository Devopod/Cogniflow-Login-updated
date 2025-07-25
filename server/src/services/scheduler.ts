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

// Only register tasks if we have a valid database connection and schema
const shouldRegisterTasks = () => {
  const dbUrl = process.env.DATABASE_URL;
  // Disable tasks if:
  // 1. No database URL
  // 2. Contains dummy/localhost (development)
  // 3. Environment variable to disable scheduler
  // 4. NODE_ENV is development (extra safety)
  return dbUrl && 
         !dbUrl.includes('dummy') && 
         !dbUrl.includes('localhost') &&
         process.env.ENABLE_TASK_SCHEDULER === 'true' &&
         process.env.NODE_ENV !== 'development';
};

// Log the task scheduler status
console.log('Task scheduler configuration:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
console.log('- ENABLE_TASK_SCHEDULER:', process.env.ENABLE_TASK_SCHEDULER);
console.log('- Should register tasks:', shouldRegisterTasks());

if (shouldRegisterTasks()) {
  // Register tasks
  scheduler.registerTask({
    id: 'check-overdue-invoices',
    name: 'Check for Overdue Invoices',
    interval: 24 * 60 * 60 * 1000, // Once a day
    fn: async () => {
      try {
        // Check if required columns exist by testing a simple query first
        try {
          await db.execute(sql`SELECT payment_terms FROM invoices LIMIT 1`);
        } catch (columnError) {
          console.log('Skipping overdue invoice check - database schema not ready');
          return;
        }

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
        // Check if required columns exist by testing a simple query first
        try {
          await db.execute(sql`SELECT payment_overdue_reminder_sent FROM invoices LIMIT 1`);
        } catch (columnError) {
          console.log('Skipping payment reminders - database schema not ready');
          return;
        }

        // Find invoices that are overdue and haven't had a reminder sent in the last 7 days
        const overdueInvoices = await db.select()
          .from(invoices)
          .where(
            and(
              or(
                eq(invoices.status, 'overdue'),
                and(
                  lt(invoices.dueDate, new Date()),
                  not(eq(invoices.status, 'paid')),
                  not(eq(invoices.status, 'void'))
                )
              ),
              not(eq(invoices.payment_overdue_reminder_sent, true))
            )
          );
        
        console.log(`Found ${overdueInvoices.length} invoices for payment reminders`);
        
        // Send reminder for each invoice
        for (const invoice of overdueInvoices) {
          // Skip if no contact associated
          if (!invoice.contactId) {
            console.log(`Skipping reminder for invoice #${invoice.invoiceNumber}: no contact associated`);
            continue;
          }
          
          try {
            // Get contact information using proper field name
            const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
            
            // Skip if no contact or no email
            if (!contact || !contact.email) {
              console.log(`Skipping reminder for invoice #${invoice.invoiceNumber}: no contact email`);
              continue;
            }
            
            // Use the proper sendInvoiceEmail function with invoice ID
            const sent = await sendInvoiceEmail(invoice.id, {
              customMessage: `This is a friendly reminder that invoice #${invoice.invoiceNumber} is overdue. Please make payment at your earliest convenience.`,
              includePDF: true
            });
            
            if (sent) {
              // Mark reminder as sent
              await db.update(invoices)
                .set({
                  payment_overdue_reminder_sent: true,
                  updatedAt: new Date(),
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
              
              console.log(`Sent payment reminder for invoice #${invoice.invoiceNumber} to ${contact.email}`);
            }
          } catch (error) {
            console.error(`Failed to send invoice email:`, error);
          }
        }
      } catch (error) {
        console.error('Error sending payment reminders:', error);
      }
    }
  });
} else {
  console.log('Task scheduler disabled - no valid database connection detected');
}

// Export the scheduler instance
export default scheduler;