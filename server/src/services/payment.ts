import Stripe from 'stripe';
import { storage } from '../../storage';
import { Invoice, Payment, Contact } from '@shared/schema';
import { WSService } from '../../websocket';
import { db } from '../../db';
import { invoices, payments, payment_history } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Initialize Stripe only when a valid secret key exists
const rawStripeKey = process.env.STRIPE_SECRET_KEY;
const normalizedKey = typeof rawStripeKey === 'string' ? rawStripeKey.trim() : '';
const isValidStripeKey = normalizedKey.startsWith('sk_'); // Accept both test and live keys
const stripe = isValidStripeKey ? new Stripe(normalizedKey, {
  apiVersion: '2023-10-16' as any,
}) : null;

// Create a development stub for Stripe when not configured
const createStripeStub = () => ({
  paymentIntents: {
    create: () => Promise.reject(new Error('Stripe not configured for development')),
    retrieve: () => Promise.reject(new Error('Stripe not configured for development')),
  },
  customers: {
    create: () => Promise.reject(new Error('Stripe not configured for development')),
    retrieve: () => Promise.reject(new Error('Stripe not configured for development')),
    list: () => Promise.reject(new Error('Stripe not configured for development')),
  },
  paymentMethods: {
    list: () => Promise.reject(new Error('Stripe not configured for development')),
    attach: () => Promise.reject(new Error('Stripe not configured for development')),
  },
  refunds: {
    create: () => Promise.reject(new Error('Stripe not configured for development')),
  },
  setupIntents: {
    create: () => Promise.reject(new Error('Stripe not configured for development')),
  },
  prices: {
    create: () => Promise.reject(new Error('Stripe not configured for development')),
  },
  subscriptions: {
    create: () => Promise.reject(new Error('Stripe not configured for development')),
  },
});

const stripeClient = stripe || createStripeStub();

let wsService: WSService | null = null;

export function setPaymentWSService(ws: WSService) {
  wsService = ws;
}

export interface PaymentIntentData {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  customer?: string;
  payment_method_types?: string[];
  setup_future_usage?: 'on_session' | 'off_session';
}

export interface PaymentMethodData {
  type: 'card' | 'ach_debit' | 'bank_transfer';
  card?: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  clientSecret?: string;
  error?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

export class PaymentService {
  async refreshGateways(): Promise<void> {
    // Placeholder for future: load gateway configs from DB
    console.log('PaymentService: refreshGateways called');
  }
  // Create a payment intent for invoice payment
  async createInvoicePaymentIntent(
    invoiceId: number,
    options: {
      payment_method_types?: string[];
      setup_future_usage?: 'on_session' | 'off_session';
      custom_amount?: number; // For partial payments
    } = {}
  ): Promise<PaymentResult> {
    try {
      // Get invoice details
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const amountPaid = invoice.amountPaid || 0;
      // Calculate payment amount
      const paymentAmount = options.custom_amount || (invoice.totalAmount - amountPaid);
      if (paymentAmount <= 0) {
        return { success: false, error: 'No amount to pay' };
      }

      // Create Stripe payment intent
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(paymentAmount * 100), // Convert to cents
        currency: invoice.currency?.toLowerCase() || 'usd',
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        metadata: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
        },
        payment_method_types: options.payment_method_types || ['card'],
        setup_future_usage: options.setup_future_usage,
      } as any);

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: (paymentIntent as any).client_secret || undefined,
        amount: paymentAmount,
        currency: invoice.currency || 'USD',
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: 'Failed to create payment intent' };
    }
  }

  // Process payment for an invoice
  async processInvoicePayment(
    invoiceId: number,
    paymentData: {
      amount: number;
      payment_method: string;
      paymentNumber: string;
      description?: string;
      metadata?: any;
    }
  ): Promise<PaymentResult> {
    try {
      // Get invoice details
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const amountPaid = invoice.amountPaid || 0;
      // Validate payment amount
      const remainingAmount = invoice.totalAmount - amountPaid;
      if (paymentData.amount > remainingAmount) {
        return { success: false, error: 'Payment amount exceeds remaining balance' };
      }

      // Create payment record
      const [payment] = await db.insert(payments).values({
        userId: invoice.userId,
        invoiceId: invoiceId,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        paymentNumber: paymentData.paymentNumber,
        status: 'completed',
        description: paymentData.description || `Payment for invoice ${invoice.invoiceNumber}`,
        metadata: paymentData.metadata,
        paymentDate: new Date(),
      }).returning();

      // Update invoice amount paid
      const newAmountPaid = amountPaid + paymentData.amount;
      const newStatus = newAmountPaid >= invoice.totalAmount ? 'Paid' : 'Partial Payment';

      await db.update(invoices)
        .set({
          amountPaid: newAmountPaid,
          payment_status: newStatus,
          last_payment_date: new Date(),
          last_payment_amount: paymentData.amount,
          last_payment_method: paymentData.payment_method,
        })
        .where(eq(invoices.id, invoiceId));

      // Add to payment history
      await db.insert(payment_history).values({
        invoiceId: invoice.userId ? invoiceId : invoiceId,
        event_type: 'payment_processed',
        event_timestamp: new Date(),
        details: {
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
        },
        user_id: invoice.userId,
        created_at: new Date(),
      });

      // Broadcast real-time update
      if (wsService) {
        wsService.broadcastToResource('finance', invoiceId.toString(), 'payment_processed', {
          invoiceId,
          paymentId: payment.id,
          amount: paymentData.amount,
          status: newStatus,
        });
      }

      return {
        success: true,
        paymentId: payment.id.toString(),
        amount: paymentData.amount,
        currency: invoice.currency || 'USD',
        status: 'completed',
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Failed to process payment' };
    }
  }

  // Process refund
  async processRefund(
    paymentId: number,
    refundData: {
      amount: number;
      reason: string;
      description?: string;
    }
  ): Promise<PaymentResult> {
    try {
      // Get payment details
      const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      // Validate refund amount
      if (refundData.amount > payment.amount) {
        return { success: false, error: 'Refund amount cannot exceed payment amount' };
      }

      // Create refund record
      const [refund] = await db.insert(payment_history).values({
        invoiceId: payment.invoiceId || 0,
        paymentId: paymentId,
        event_type: 'refund_processed',
        event_timestamp: new Date(),
        details: { reason: refundData.reason, amount: refundData.amount },
        user_id: payment.userId,
        created_at: new Date(),
      }).returning();

      // Update payment status if full refund
      if (refundData.amount === payment.amount) {
        await db.update(payments)
          .set({ status: 'refunded' })
          .where(eq(payments.id, paymentId));
      }

      // Update invoice if applicable
      if (payment.invoiceId) {
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
        if (invoice) {
          const amountPaid = invoice.amountPaid || 0;
          const newAmountPaid = Math.max(0, amountPaid - refundData.amount);
          const newStatus = newAmountPaid === 0 ? 'Unpaid' : 'Partial Payment';

          await db.update(invoices)
            .set({
              amountPaid: newAmountPaid,
              payment_status: newStatus,
            })
            .where(eq(invoices.id, payment.invoiceId));
        }
      }

      return {
        success: true,
        paymentId: refund.id.toString(),
        amount: refundData.amount,
        currency: payment.reference || 'USD',
        status: 'refunded',
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: 'Failed to process refund' };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId: number): Promise<Payment | null> {
    try {
      const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
      return payment || null;
    } catch (error) {
      console.error('Error getting payment details:', error);
      return null;
    }
  }

  // Get payment history for an invoice
  async getInvoicePaymentHistory(invoiceId: number): Promise<any[]> {
    try {
      const history = await db.select().from(payment_history)
        .where(eq(payment_history.invoiceId, invoiceId))
        .orderBy(payment_history.event_timestamp);
      return history as any[];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  // Create recurring payment setup
  async createRecurringPaymentSetup(
    invoiceId: number,
    options: {
      interval: 'month' | 'year';
      interval_count: number;
      metadata?: Record<string, string>;
    }
  ): Promise<PaymentResult> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Create Stripe setup intent for recurring payments
      const setupIntent = await stripeClient.setupIntents.create({
        payment_method_types: ['card'],
        metadata: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
          ...(options.metadata || {}),
        },
      } as any);

      // Update invoice with recurring settings
      await db.update(invoices)
        .set({
          is_recurring: true,
          recurring_frequency: options.interval,
          recurring_schedule: {
            interval: options.interval,
            interval_count: options.interval_count,
            setup_intent_id: (setupIntent as any).id,
          } as any,
        })
        .where(eq(invoices.id, invoiceId));

      return {
        success: true,
        paymentId: (setupIntent as any).id,
        clientSecret: (setupIntent as any).client_secret || undefined,
        status: (setupIntent as any).status,
      };
    } catch (error) {
      console.error('Error creating recurring payment setup:', error);
      return { success: false, error: 'Failed to create recurring payment setup' };
    }
  }

  // Process recurring payment
  async processRecurringPayment(
    invoiceId: number,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Create payment intent using saved payment method
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(invoice.totalAmount * 100),
        currency: invoice.currency?.toLowerCase() || 'usd',
        customer: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
          recurring: 'true',
        },
      } as any);

      if (paymentIntent.status === 'succeeded') {
        // Process the successful payment
        return await this.processInvoicePayment(invoiceId, {
          amount: invoice.totalAmount,
          payment_method: 'recurring_card',
          paymentNumber: (paymentIntent as any).id,
          description: `Recurring payment for ${invoice.invoiceNumber}`,
          metadata: { payment_intent_id: (paymentIntent as any).id },
        });
      } else {
        return { success: false, error: `Payment failed: ${paymentIntent.status}` };
      }
    } catch (error) {
      console.error('Error processing recurring payment:', error);
      return { success: false, error: 'Failed to process recurring payment' };
    }
  }
}

export const paymentService = new PaymentService();