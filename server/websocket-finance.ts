import { WSService } from './websocket.js';

export interface FinanceUpdate {
  type: 'expense_created' | 'expense_updated' | 'expense_approved' | 'expense_rejected' | 
        'invoice_paid' | 'transaction_created' | 'account_updated' | 'payment_received';
  data: any;
  timestamp: string;
  userId?: number;
}

export class FinanceWebSocketService {
  constructor(private wsService: WSService) {}

  // Broadcast expense updates
  broadcastExpenseUpdate(update: Omit<FinanceUpdate, 'timestamp'>) {
    const message = {
      type: 'finance:update',
      data: {
        ...update,
        timestamp: new Date().toISOString(),
      }
    };

    // Broadcast to all finance namespace clients
    this.wsService.broadcastToResource('finance', 'all', message);
    
    // Also broadcast to global namespace for dashboard updates
    this.wsService.broadcast('finance_update', message.data);
  }

  // Broadcast transaction updates
  broadcastTransactionUpdate(transactionData: any, updateType: 'created' | 'updated' | 'deleted') {
    this.broadcastExpenseUpdate({
      type: 'transaction_created',
      data: {
        transaction: transactionData,
        updateType,
      }
    });
  }

  // Broadcast account balance updates
  broadcastAccountUpdate(accountData: any) {
    this.broadcastExpenseUpdate({
      type: 'account_updated',
      data: accountData
    });
  }

  // Broadcast invoice payment updates
  broadcastInvoicePayment(invoiceData: any, paymentData: any) {
    this.broadcastExpenseUpdate({
      type: 'invoice_paid',
      data: {
        invoice: invoiceData,
        payment: paymentData,
      }
    });
  }

  // Broadcast expense approval/rejection
  broadcastExpenseApproval(expenseData: any, approved: boolean, notes?: string) {
    this.broadcastExpenseUpdate({
      type: approved ? 'expense_approved' : 'expense_rejected',
      data: {
        expense: expenseData,
        notes,
      }
    });
  }

  // Send real-time financial metrics updates
  broadcastFinancialMetrics(metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    cashFlow: number;
    accountsReceivable: number;
    accountsPayable: number;
  }) {
    const message = {
      type: 'finance:metrics_update',
      data: {
        metrics,
        timestamp: new Date().toISOString(),
      }
    };

    this.wsService.broadcastToResource('finance', 'all', message);
    this.wsService.broadcast('financial_metrics_update', message.data);
  }

  // Send alerts for important financial events
  broadcastFinancialAlert(alert: {
    type: 'overdue_invoice' | 'low_cash_flow' | 'expense_limit_exceeded' | 'payment_received';
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    data?: any;
  }) {
    const message = {
      type: 'finance:alert',
      data: {
        ...alert,
        timestamp: new Date().toISOString(),
      }
    };

    this.wsService.broadcastToResource('finance', 'all', message);
    this.wsService.broadcast('financial_alert', message.data);
  }
}