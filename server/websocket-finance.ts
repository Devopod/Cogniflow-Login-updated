import { WSService } from './websocket';
import { db } from './db';
import { invoices, payments, payment_history } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class FinanceWebSocketService {
  private wsService: WSService;

  constructor(wsService: WSService) {
    this.wsService = wsService;
  }

  // Broadcast invoice updates
  broadcastInvoiceUpdate(invoiceId: number, type: string, data: any) {
    this.wsService.broadcastToResource('finance', invoiceId.toString(), type, data);
  }

  // Broadcast payment updates
  broadcastPaymentUpdate(paymentId: number, type: string, data: any) {
    this.wsService.broadcastToResource('finance', paymentId.toString(), type, data);
  }

  // Broadcast general finance updates
  broadcastFinanceUpdate(type: string, data: any) {
    this.wsService.broadcastToResource('finance', 'all', type, data);
  }

  // Handle invoice created
  async onInvoiceCreated(invoiceId: number) {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (invoice) {
        this.broadcastInvoiceUpdate(invoiceId, 'invoice_created', invoice);
        this.broadcastFinanceUpdate('invoice_created', { invoiceId, invoice });
      }
    } catch (error) {
      console.error('Error broadcasting invoice created:', error);
    }
  }

  // Handle invoice updated
  async onInvoiceUpdated(invoiceId: number) {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (invoice) {
        this.broadcastInvoiceUpdate(invoiceId, 'invoice_updated', invoice);
        this.broadcastFinanceUpdate('invoice_updated', { invoiceId, invoice });
      }
    } catch (error) {
      console.error('Error broadcasting invoice updated:', error);
    }
  }

  // Handle invoice deleted
  async onInvoiceDeleted(invoiceId: number) {
    this.broadcastInvoiceUpdate(invoiceId, 'invoice_deleted', { invoiceId });
    this.broadcastFinanceUpdate('invoice_deleted', { invoiceId });
  }

  // Handle payment processed
  async onPaymentProcessed(paymentId: number, invoiceId: number) {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (payment) {
        this.broadcastPaymentUpdate(paymentId, 'payment_processed', payment);
        this.broadcastInvoiceUpdate(invoiceId, 'payment_processed', { paymentId, payment });
        this.broadcastFinanceUpdate('payment_processed', { paymentId, invoiceId, payment });
      }
    } catch (error) {
      console.error('Error broadcasting payment processed:', error);
    }
  }

  // Handle payment refunded
  async onPaymentRefunded(paymentId: number, invoiceId: number) {
    try {
      const [refund] = await db.select().from(payment_history)
        .where(and(
          eq(payment_history.paymentId, paymentId),
          eq(payment_history.event_type, 'refund_processed')
        ))
        .orderBy(payment_history.event_timestamp);
      
      if (refund) {
        this.broadcastPaymentUpdate(paymentId, 'payment_refunded', refund);
        this.broadcastInvoiceUpdate(invoiceId, 'payment_refunded', { paymentId, refund });
        this.broadcastFinanceUpdate('payment_refunded', { paymentId, invoiceId, refund });
      }
    } catch (error) {
      console.error('Error broadcasting payment refunded:', error);
    }
  }

  // Handle invoice status change
  async onInvoiceStatusChanged(invoiceId: number, newStatus: string) {
    this.broadcastInvoiceUpdate(invoiceId, 'status_changed', { invoiceId, status: newStatus });
    this.broadcastFinanceUpdate('status_changed', { invoiceId, status: newStatus });
  }

  // Handle payment reminder sent
  async onPaymentReminderSent(invoiceId: number, reminderType: string) {
    this.broadcastInvoiceUpdate(invoiceId, 'reminder_sent', { invoiceId, reminderType });
    this.broadcastFinanceUpdate('reminder_sent', { invoiceId, reminderType });
  }

  // Handle recurring invoice generated
  async onRecurringInvoiceGenerated(parentInvoiceId: number, newInvoiceId: number) {
    this.broadcastInvoiceUpdate(parentInvoiceId, 'recurring_generated', { parentInvoiceId, newInvoiceId });
    this.broadcastFinanceUpdate('recurring_generated', { parentInvoiceId, newInvoiceId });
  }
}

export let financeWebSocketService: FinanceWebSocketService | null = null;

export function setFinanceWebSocketService(wsService: WSService) {
  financeWebSocketService = new FinanceWebSocketService(wsService);
}