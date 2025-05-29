import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../../db';
import { payments, invoices } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { WSService } from '../../websocket';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_example', {
  apiVersion: '2023-10-16',
});

// Initialize Razorpay with API key and secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_example',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'example_secret',
});

// Get WebSocket service instance
let wsService: WSService;
export const setPaymentWSService = (ws: WSService) => {
  wsService = ws;
};

interface PaymentIntentOptions {
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, string>;
  customer_email?: string;
  receipt_email?: string;
}

/**
 * Create a payment intent with Stripe
 */
export async function createPaymentIntent(options: PaymentIntentOptions) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(options.amount * 100), // Stripe requires amount in cents
      currency: options.currency.toLowerCase(),
      description: options.description,
      metadata: options.metadata,
      receipt_email: options.receipt_email,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Process a successful payment
 */
export async function processSuccessfulPayment(paymentIntentId: string) {
  try {
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment intent status is ${paymentIntent.status}, not succeeded`);
    }
    
    // Extract invoice ID from metadata
    const invoiceId = paymentIntent.metadata.invoiceId;
    if (!invoiceId) {
      throw new Error('No invoice ID found in payment intent metadata');
    }
    
    // Get the invoice from the database
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    // Create a payment record
    const [payment] = await db.insert(payments)
      .values({
        user_id: invoice.user_id,
        contact_id: invoice.contact_id,
        amount: paymentIntent.amount / 100, // Convert back from cents
        payment_method: 'stripe',
        payment_date: new Date(),
        reference: paymentIntentId,
        description: `Stripe payment for invoice #${invoice.invoice_number}`,
        related_document_type: 'invoice',
        related_document_id: parseInt(invoiceId),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    
    // Update invoice amount_paid and status
    const totalPaid = await db.select({
      total: db.sql`SUM(${payments.amount})`,
    })
    .from(payments)
    .where(eq(payments.related_document_id, parseInt(invoiceId)));
    
    const amountPaid = totalPaid[0]?.total || 0;
    
    // Determine new status based on payment
    let newStatus = invoice.status;
    if (amountPaid >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (amountPaid > 0) {
      newStatus = 'partial';
    }
    
    // Update the invoice
    const [updatedInvoice] = await db.update(invoices)
      .set({
        amount_paid: amountPaid,
        status: newStatus,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, parseInt(invoiceId)))
      .returning();
    
    // Notify via WebSocket if available
    if (wsService) {
      // Broadcast payment added
      wsService.broadcastToResource('invoices', invoiceId, 'payment_added', {
        invoiceId: parseInt(invoiceId),
        payment,
        amount: payment.amount,
        newStatus,
        amountPaid,
      });
      
      // If status changed, send a specific status change notification
      if (newStatus !== invoice.status) {
        wsService.broadcastToResource('invoices', invoiceId, 'status_changed', {
          invoiceId: parseInt(invoiceId),
          previousStatus: invoice.status,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return {
      success: true,
      payment,
      invoice: updatedInvoice,
    };
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Generate a checkout session for an invoice using Stripe
 */
export async function createCheckoutSession(options: {
  invoiceId: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  gateway?: 'stripe' | 'razorpay';
}) {
  try {
    const { invoiceId, successUrl, cancelUrl, customerEmail, gateway = 'stripe' } = options;
    
    // Get the invoice from the database
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    // Calculate the amount due
    const amountDue = invoice.total_amount - (invoice.amount_paid || 0);
    
    if (amountDue <= 0) {
      throw new Error('Invoice is already fully paid');
    }
    
    // Use the selected payment gateway
    if (gateway === 'stripe') {
      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: invoice.currency?.toLowerCase() || 'usd',
              product_data: {
                name: `Invoice #${invoice.invoice_number}`,
                description: `Payment for invoice #${invoice.invoice_number}`,
              },
              unit_amount: Math.round(amountDue * 100), // Stripe requires amount in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoice_number,
        },
      });
      
      return {
        gateway: 'stripe',
        sessionId: session.id,
        url: session.url,
      };
    } else if (gateway === 'razorpay') {
      // Create a Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round(amountDue * 100), // Razorpay also requires amount in smallest currency unit
        currency: invoice.currency?.toUpperCase() || 'USD',
        receipt: `inv_${invoice.id}_${Date.now()}`,
        notes: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoice_number,
        },
      });
      
      return {
        gateway: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_example',
        prefill: {
          email: customerEmail,
          name: invoice.contact?.firstName ? `${invoice.contact.firstName} ${invoice.contact.lastName || ''}` : undefined,
        },
        notes: {
          invoiceId: invoiceId.toString(),
          invoiceNumber: invoice.invoice_number,
        },
      };
    } else {
      throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Verify a Razorpay payment
 */
export async function verifyRazorpayPayment(options: {
  orderId: string;
  paymentId: string;
  signature: string;
  invoiceId: number;
}) {
  try {
    const { orderId, paymentId, signature, invoiceId } = options;
    
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'example_secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      throw new Error('Invalid Razorpay signature');
    }
    
    // Get the invoice from the database
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    // Create a payment record
    const [payment] = await db.insert(payments)
      .values({
        user_id: invoice.user_id,
        contact_id: invoice.contact_id,
        amount: invoice.total_amount - (invoice.amount_paid || 0), // Pay the remaining amount
        payment_method: 'razorpay',
        payment_date: new Date(),
        reference: paymentId,
        description: `Razorpay payment for invoice #${invoice.invoice_number}`,
        related_document_type: 'invoice',
        related_document_id: invoiceId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    
    // Update invoice amount_paid and status
    const totalPaid = await db.select({
      total: db.sql`SUM(${payments.amount})`,
    })
    .from(payments)
    .where(eq(payments.related_document_id, invoiceId));
    
    const amountPaid = totalPaid[0]?.total || 0;
    
    // Determine new status based on payment
    let newStatus = invoice.status;
    if (amountPaid >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (amountPaid > 0) {
      newStatus = 'partial';
    }
    
    // Update the invoice
    const [updatedInvoice] = await db.update(invoices)
      .set({
        amount_paid: amountPaid,
        status: newStatus,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    // Notify via WebSocket if available
    if (wsService) {
      // Broadcast payment added
      wsService.broadcastToResource('invoices', invoiceId.toString(), 'payment_added', {
        invoiceId,
        payment,
        amount: payment.amount,
        newStatus,
        amountPaid,
      });
      
      // If status changed, send a specific status change notification
      if (newStatus !== invoice.status) {
        wsService.broadcastToResource('invoices', invoiceId.toString(), 'status_changed', {
          invoiceId,
          previousStatus: invoice.status,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return {
      success: true,
      payment,
      invoice: updatedInvoice,
    };
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw error;
  }
}

/**
 * Process a webhook event from Stripe
 */
export async function handleStripeWebhook(signature: string, rawBody: Buffer) {
  try {
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_example'
    );
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await processSuccessfulPayment(paymentIntent.id);
        break;
        
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          const invoiceId = session.metadata?.invoiceId;
          if (invoiceId) {
            // Process the payment
            const paymentIntent = session.payment_intent as string;
            await processSuccessfulPayment(paymentIntent);
          }
        }
        break;
    }
    
    return { received: true };
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw error;
  }
}