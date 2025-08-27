import { db } from '../../db';
import { invoices, payment_reminders } from '@shared/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { emailService } from './email';

// Optional WebSocket service reference (set at runtime)
let wsServiceRef: any | null = null;
export function setSchedulerWSService(service: any) {
  wsServiceRef = service;
}

interface ScheduledTask {
  id: string;
  type: 'payment_reminder' | 'invoice_generation' | 'report_generation';
  schedule: string; // Cron expression
  data: any;
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
}

export class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTasks();
  }

  private initializeTasks() {
    // Add default tasks
    this.addTask({
      id: 'payment_reminders',
      type: 'payment_reminder',
      schedule: '0 9 * * *', // Daily at 9 AM
      data: {},
      isActive: true,
    });

    this.addTask({
      id: 'invoice_generation',
      type: 'invoice_generation',
      schedule: '0 0 1 * *', // Monthly on 1st
      data: {},
      isActive: true,
    });
  }

  addTask(task: ScheduledTask) {
    this.tasks.set(task.id, task);
    this.scheduleNextRun(task);
  }

  removeTask(taskId: string) {
    this.tasks.delete(taskId);
  }

  private scheduleNextRun(task: ScheduledTask) {
    // Simple cron parser for basic scheduling
    const parts = task.schedule.split(' ');
    const minute = parts[0];
    const hour = parts[1];

    const now = new Date();
    let nextRun = new Date(now);

    if (minute !== '*' && hour !== '*') {
      nextRun.setMinutes(parseInt(minute));
      nextRun.setHours(parseInt(hour));
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (hour !== '*') {
      nextRun.setHours(parseInt(hour));
      nextRun.setMinutes(0);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else {
      nextRun.setMinutes(now.getMinutes() + 1);
    }

    task.nextRun = nextRun;
  }

  start() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.runScheduledTasks();
    }, 60000); // Check every minute
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async runScheduledTasks() {
    const now = new Date();
    
    for (const [id, task] of Array.from(this.tasks.entries())) {
      if (!task.isActive || !task.nextRun || task.nextRun > now) {
        continue;
      }

      try {
        await this.executeTask(task);
        task.lastRun = now;
        this.scheduleNextRun(task);
      } catch (error) {
        console.error(`Error executing task ${id}:`, error);
      }
    }
  }

  private async executeTask(task: ScheduledTask) {
    switch (task.type) {
      case 'payment_reminder':
        await this.sendPaymentReminders();
        break;
      case 'invoice_generation':
        await this.generateRecurringInvoices();
        break;
      case 'report_generation':
        await this.generateReports();
        break;
    }
  }

  private async sendPaymentReminders() {
    try {
      // Delegate to payment reminder processor if desired
      // Placeholder: actual processing handled elsewhere
      return;
    } catch (error) {
      console.error('Error in payment reminder scheduler:', error);
    }
  }

  private async generateRecurringInvoices() {
    try {
      // Get recurring invoices that need to be generated (next_invoice_date <= today)
      const today = new Date().toISOString().split('T')[0];
      const recurringInvoices = await db.select().from(invoices)
        .where(and(eq(invoices.is_recurring, true)));

      for (const invoice of recurringInvoices as any[]) {
        if (!invoice.next_invoice_date) continue;
        const nextDateStr: string = invoice.next_invoice_date;
        if (nextDateStr > today) continue;

        // Generate next invoice
        const nextIssueDate = new Date(nextDateStr);
        const nextDueDate = new Date(nextIssueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 30);

        await db.insert(invoices).values({
          userId: invoice.userId,
          contactId: invoice.contactId,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: nextIssueDate.toISOString().split('T')[0],
          dueDate: nextDueDate.toISOString().split('T')[0],
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          discountAmount: invoice.discountAmount,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          notes: invoice.notes,
          terms: invoice.terms,
          payment_status: 'Unpaid',
          parent_recurring_invoice_id: invoice.id,
        } as any);

        // Compute and update next invoice date (simple monthly increment)
        const schedule = (invoice.recurring_schedule || {}) as any;
        const base = new Date(nextDateStr);
        switch (schedule.interval) {
          case 'quarterly':
            base.setMonth(base.getMonth() + 3);
            break;
          case 'yearly':
            base.setFullYear(base.getFullYear() + 1);
            break;
          default:
            base.setMonth(base.getMonth() + 1);
        }

        await db.update(invoices)
          .set({ next_invoice_date: base.toISOString().split('T')[0] })
          .where(eq(invoices.id, invoice.id));
      }
    } catch (error) {
      console.error('Error in recurring invoice scheduler:', error);
    }
  }

  private async generateReports() {
    // Placeholder for report generation
    console.log('Report generation scheduled task executed');
  }

  // Manual trigger for testing
  async triggerTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      await this.executeTask(task);
    }
  }

  // Get task status
  getTaskStatus(taskId: string): ScheduledTask | null {
    return this.tasks.get(taskId) || null;
  }

  // Get all tasks
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }
}

export const scheduler = new SchedulerService();
export default scheduler;