import Stripe from 'stripe';
import { storage } from '../../storage';
import { Invoice, Payment, Contact } from '@shared/schema';
import { WSService } from '../../websocket';

// Initialize Stripe (only if API key is provided and not a dummy key)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && !stripeKey.includes('dummy') ? new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
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


      const invoice = await storage.getInvoiceWithItems(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const contact = invoice.contactId 
        ? await storage.getContact(invoice.contactId)
        : null;

      // Calculate amount to charge (handle partial payments)
      const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
      const chargeAmount = options.custom_amount 
        ? Math.min(options.custom_amount, amountDue)
        : amountDue;

      if (chargeAmount <= 0) {
        return { success: false, error: 'Invoice is already fully paid' };
      }

      // Get or create Stripe customer
      let stripeCustomer: Stripe.Customer | undefined;
      if (contact) {
        stripeCustomer = await this.getOrCreateStripeCustomer(contact);
      }

      // Create payment intent
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(chargeAmount * 100), // Convert to cents
        currency: invoice.currency.toLowerCase(),
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        customer: stripeCustomer?.id,
        payment_method_types: options.payment_method_types || ['card'],
        setup_future_usage: options.setup_future_usage,
        metadata: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoiceNumber,
          customerId: contact?.id?.toString() || 'unknown',
          userId: invoice.userId.toString(),
        },
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        amount: chargeAmount,
        currency: invoice.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment creation failed' 
      };
    }
  }

  // Get or create a Stripe customer
  async getOrCreateStripeCustomer(contact: Contact): Promise<Stripe.Customer> {
    try {


      // Check if customer already exists in Stripe
      if (contact.payment_portal_token) {
        try {
          const customer = await stripeClient.customers.retrieve(contact.payment_portal_token);
          if (!customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (error) {
          // Customer doesn't exist, create new one
        }
      }

      // Create new customer
      const customer = await stripeClient.customers.create({
        email: contact.email || undefined,
        name: `${contact.firstName} ${contact.lastName}`,
        phone: contact.phone || undefined,
        address: contact.address ? {
          line1: contact.address,
          city: contact.city || undefined,
          state: contact.state || undefined,
          postal_code: contact.postalCode || undefined,
          country: contact.country || undefined,
        } : undefined,
        metadata: {
          contactId: contact.id.toString(),
        },
      });

      // Update contact with Stripe customer ID
      await storage.updateContact(contact.id, {
        payment_portal_token: customer.id,
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Process successful payment webhook
  async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { invoiceId, userId } = paymentIntent.metadata;
      
      if (!invoiceId) {
        console.error('No invoice ID in payment metadata');
        return;
      }

      const invoice = await storage.getInvoice(parseInt(invoiceId));
      if (!invoice) {
        console.error('Invoice not found:', invoiceId);
        return;
      }

      // Calculate payment amount from Stripe (convert from cents)
      const paymentAmount = paymentIntent.amount / 100;

      // Create payment record
      const payment = await storage.createPayment({
        userId: parseInt(userId),
        invoiceId: parseInt(invoiceId),
        contactId: invoice.contactId,
        amount: paymentAmount,
        payment_method: this.getPaymentMethodType(paymentIntent),
        payment_gateway: 'stripe',
        transaction_id: paymentIntent.id,
        gateway_fee: this.calculateStripeFee(paymentAmount),
        gateway_response: paymentIntent as any,
        status: 'completed',
        reference: `Stripe Payment - ${paymentIntent.id}`,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
      });

      // Update invoice payment status
      const newAmountPaid = (invoice.amountPaid || 0) + paymentAmount;
      const isFullyPaid = newAmountPaid >= invoice.totalAmount;
      
      await storage.updateInvoice(parseInt(invoiceId), {
        amountPaid: newAmountPaid,
        payment_status: isFullyPaid ? 'Paid' : 'Partial Payment',
        last_payment_date: new Date().toISOString(),
        last_payment_amount: paymentAmount,
        last_payment_method: this.getPaymentMethodType(paymentIntent),
        updatedAt: new Date().toISOString(),
      });

      // Log payment activity
      await storage.createInvoiceActivity({
        invoiceId: parseInt(invoiceId),
        userId: parseInt(userId),
        activity_type: 'paid',
        description: `Payment of ${paymentAmount} ${invoice.currency} received via ${this.getPaymentMethodType(paymentIntent)}`,
        metadata: {
          paymentId: payment.id,
          paymentIntentId: paymentIntent.id,
          amount: paymentAmount,
          currency: invoice.currency,
          paymentMethod: this.getPaymentMethodType(paymentIntent),
        },
      });

      // Broadcast payment update via WebSocket
      if (wsService) {
        wsService.broadcastToResource('invoices', parseInt(invoiceId), 'payment_received', {
          invoiceId: parseInt(invoiceId),
          paymentId: payment.id,
          amount: paymentAmount,
          currency: invoice.currency,
          isFullyPaid,
          newAmountPaid,
          totalAmount: invoice.totalAmount,
        });

        wsService.broadcast('payment_received', {
          invoiceId: parseInt(invoiceId),
          amount: paymentAmount,
          currency: invoice.currency,
          isFullyPaid,
        });
      }

      console.log(`Payment processed successfully for invoice ${invoice.invoiceNumber}: ${paymentAmount} ${invoice.currency}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Handle payment failure
  async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { invoiceId, userId } = paymentIntent.metadata;
      
      if (!invoiceId) {
        console.error('No invoice ID in payment metadata');
        return;
      }

      // Log failed payment activity
      await storage.createInvoiceActivity({
        invoiceId: parseInt(invoiceId),
        userId: parseInt(userId),
        activity_type: 'payment_failed',
        description: `Payment attempt failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
        metadata: {
          paymentIntentId: paymentIntent.id,
          errorCode: paymentIntent.last_payment_error?.code,
          errorMessage: paymentIntent.last_payment_error?.message,
        },
      });

      // Broadcast payment failure via WebSocket
      if (wsService) {
        wsService.broadcastToResource('invoices', parseInt(invoiceId), 'payment_failed', {
          invoiceId: parseInt(invoiceId),
          error: paymentIntent.last_payment_error?.message || 'Payment failed',
        });
      }

      console.log(`Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Create a refund
  async createRefund(
    paymentId: number,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (!payment.transaction_id) {
        return { success: false, error: 'No transaction ID found for refund' };
      }

      // Calculate refund amount
      const refundAmount = amount || payment.amount;
      
      if (refundAmount > payment.amount) {
        return { success: false, error: 'Refund amount cannot exceed payment amount' };
      }

      // Create refund in Stripe
      const refund = await stripeClient.refunds.create({
        payment_intent: payment.transaction_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: reason as any || 'requested_by_customer',
        metadata: {
          paymentId: paymentId.toString(),
          invoiceId: payment.invoiceId?.toString() || '',
        },
      });

      // Update payment record
      await storage.updatePayment(paymentId, {
        refund_status: refundAmount === payment.amount ? 'full' : 'partial',
        refund_amount: refundAmount,
        refund_transaction_id: refund.id,
        refund_date: new Date().toISOString(),
        refund_reason: reason,
        status: refundAmount === payment.amount ? 'refunded' : 'completed',
        updatedAt: new Date().toISOString(),
      });

      // If this is for an invoice, update the invoice
      if (payment.invoiceId) {
        const invoice = await storage.getInvoice(payment.invoiceId);
        if (invoice) {
          const newAmountPaid = Math.max(0, (invoice.amountPaid || 0) - refundAmount);
          await storage.updateInvoice(payment.invoiceId, {
            amountPaid: newAmountPaid,
            payment_status: newAmountPaid === 0 ? 'Unpaid' : 
                          newAmountPaid < invoice.totalAmount ? 'Partial Payment' : 'Paid',
            updatedAt: new Date().toISOString(),
          });

          // Log refund activity
          await storage.createInvoiceActivity({
            invoiceId: payment.invoiceId,
            userId: payment.userId,
            activity_type: 'refunded',
            description: `Refund of ${refundAmount} ${invoice.currency} processed`,
            metadata: {
              refundId: refund.id,
              originalPaymentId: paymentId,
              refundAmount,
              reason,
            },
          });
        }
      }

      return {
        success: true,
        paymentId: refund.id,
        amount: refundAmount,
        status: refund.status,
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Refund creation failed' 
      };
    }
  }

  // Get payment methods for a customer
  async getCustomerPaymentMethods(contactId: number): Promise<Stripe.PaymentMethod[]> {
    try {
      const contact = await storage.getContact(contactId);
      if (!contact || !contact.payment_portal_token) {
        return [];
      }

      const paymentMethods = await stripeClient.paymentMethods.list({
        customer: contact.payment_portal_token,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  // Save payment method for future use
  async savePaymentMethod(
    contactId: number,
    paymentMethodId: string
  ): Promise<boolean> {
    try {
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return false;
      }

      // Get or create Stripe customer
      const stripeCustomer = await this.getOrCreateStripeCustomer(contact);

      // Attach payment method to customer
      await stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.id,
      });

      // Update contact's saved payment methods
      const savedMethods = contact.saved_payment_methods as any[] || [];
      savedMethods.push({
        stripe_payment_method_id: paymentMethodId,
        created_at: new Date().toISOString(),
      });

      await storage.updateContact(contactId, {
        saved_payment_methods: savedMethods,
      });

      return true;
    } catch (error) {
      console.error('Error saving payment method:', error);
      return false;
    }
  }

  // Helper methods
  private getPaymentMethodType(paymentIntent: Stripe.PaymentIntent): string {
    const charges = paymentIntent.charges?.data;
    if (charges && charges.length > 0) {
      const charge = charges[0];
      if (charge.payment_method_details?.card) {
        return `card_${charge.payment_method_details.card.brand}`;
      }
      if (charge.payment_method_details?.ach_debit) {
        return 'ach_debit';
      }
    }
    return 'unknown';
  }

  private calculateStripeFee(amount: number): number {
    // Standard Stripe fee: 2.9% + $0.30
    return Math.round((amount * 0.029 + 0.30) * 100) / 100;
  }

  // Setup intent for saving payment methods
  async createSetupIntent(contactId: number): Promise<PaymentResult> {
    try {
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      const stripeCustomer = await this.getOrCreateStripeCustomer(contact);

      const setupIntent = await stripeClient.setupIntents.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          contactId: contactId.toString(),
        },
      });

      return {
        success: true,
        paymentId: setupIntent.id,
        clientSecret: setupIntent.client_secret || undefined,
        status: setupIntent.status,
      };
    } catch (error) {
      console.error('Error creating setup intent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Setup intent creation failed' 
      };
    }
  }

  // Create subscription for recurring payments
  async createRecurringPayment(
    invoiceId: number,
    frequency: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<PaymentResult> {
    try {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const contact = invoice.contactId 
        ? await storage.getContact(invoice.contactId)
        : null;

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      const stripeCustomer = await this.getOrCreateStripeCustomer(contact);

      // Create price for the subscription
      const price = await stripeClient.prices.create({
        unit_amount: Math.round(invoice.totalAmount * 100),
        currency: invoice.currency.toLowerCase(),
        recurring: {
          interval: frequency === 'monthly' ? 'month' : 
                   frequency === 'quarterly' ? 'month' : 'year',
          interval_count: frequency === 'quarterly' ? 3 : 1,
        },
        product_data: {
          name: `Recurring Invoice ${invoice.invoiceNumber}`,
          description: `Recurring payment for ${invoice.invoiceNumber}`,
        },
        metadata: {
          invoiceId: invoiceId.toString(),
        },
      });

      // Create subscription
      const subscription = await stripeClient.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: price.id }],
        metadata: {
          invoiceId: invoiceId.toString(),
          originalInvoiceNumber: invoice.invoiceNumber,
        },
      });

      // Update invoice as recurring
      await storage.updateInvoice(invoiceId, {
        is_recurring: true,
        recurring_frequency: frequency,
        recurring_start_date: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        paymentId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      console.error('Error creating recurring payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Recurring payment creation failed' 
      };
    }
  }

  // Get payment statistics
  async getPaymentStats(userId: number, dateRange?: { from: Date; to: Date }): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransaction: number;
    successRate: number;
    topPaymentMethods: Array<{ method: string; count: number; total: number }>;
  }> {
    try {
      // This would need to be implemented with proper SQL queries
      // For now, return mock data
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        successRate: 0,
        topPaymentMethods: [],
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();