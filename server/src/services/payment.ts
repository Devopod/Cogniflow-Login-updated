import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../../db';
import { payments, invoices, payment_history, payment_gateway_settings } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { WSService } from '../../websocket';
import { sendEmail } from './email';

// Initialize payment gateways
let stripe: Stripe;
let razorpay: Razorpay;
let paypal: any; // PayPal SDK would be initialized here

// Initialize gateways with configuration from database
async function initializeGateways() {
  try {
    // Check if payment_gateway_settings table exists
    try {
      // Get gateway settings from database
      const gatewaySettings = await db.query.payment_gateway_settings.findMany({
        where: eq(payment_gateway_settings.is_enabled, true),
      });
      
      // Initialize each gateway
      for (const gateway of gatewaySettings) {
        if (gateway.gateway_name === 'stripe') {
          const apiKey = gateway.test_mode ? gateway.test_api_key_secret : gateway.api_key_secret;
          if (apiKey) {
            stripe = new Stripe(apiKey, {
              apiVersion: '2023-10-16',
            });
            console.log('Stripe gateway initialized');
          }
        } else if (gateway.gateway_name === 'razorpay') {
          const keyId = gateway.test_mode ? gateway.test_api_key_public : gateway.api_key_public;
          const keySecret = gateway.test_mode ? gateway.test_api_key_secret : gateway.api_key_secret;
          if (keyId && keySecret) {
            razorpay = new Razorpay({
              key_id: keyId,
              key_secret: keySecret,
            });
            console.log('Razorpay gateway initialized');
          }
        }
        // Add other gateways as needed
      }
    } catch (dbError) {
      // If there's an error with the database query, fall back to environment variables
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error initializing payment gateways:', error);
    
    // Fallback to environment variables if database initialization fails
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_example', {
      apiVersion: '2023-10-16',
    });
    
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_example',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'example_secret',
    });
    
    console.log('Payment gateways initialized from environment variables');
  }
}

// Initialize gateways on module load
initializeGateways().catch(console.error);

// Function to refresh gateway settings
export async function refreshGatewaySettings() {
  await initializeGateways();
  return { success: true, message: 'Payment gateways refreshed' };
}

// Get WebSocket service instance
let wsService: WSService;
export const setPaymentWSService = (ws: WSService) => {
  wsService = ws;
};

// Payment gateway interface
interface PaymentGateway {
  name: string;
  processPayment(options: ProcessPaymentOptions): Promise<PaymentResult>;
  verifyPayment(options: VerifyPaymentOptions): Promise<VerificationResult>;
  refundPayment(options: RefundOptions): Promise<RefundResult>;
}

// Stripe gateway implementation
class StripeGateway implements PaymentGateway {
  name = 'stripe';
  
  async processPayment(options: ProcessPaymentOptions): Promise<PaymentResult> {
    if (!stripe) {
      throw new Error('Stripe gateway not initialized');
    }
    
    const { amount, currency, description, metadata, customerEmail, customerName, returnUrl } = options;
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              description: description,
            },
            unit_amount: Math.round(amount * 100), // Stripe requires amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`,
      cancel_url: `${returnUrl}?canceled=true&gateway=stripe`,
      customer_email: customerEmail,
      metadata,
    });
    
    return {
      success: true,
      gateway: 'stripe',
      redirectUrl: session.url,
      sessionId: session.id,
      amount: amount,
      currency: currency,
    };
  }
  
  async verifyPayment(options: VerifyPaymentOptions): Promise<VerificationResult> {
    if (!stripe) {
      throw new Error('Stripe gateway not initialized');
    }
    
    const { sessionId } = options;
    
    if (!sessionId) {
      throw new Error('Session ID is required for Stripe verification');
    }
    
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return {
        success: false,
        message: `Payment not completed. Status: ${session.payment_status}`,
      };
    }
    
    // Get payment intent details
    const paymentIntentId = session.payment_intent as string;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: true,
      transactionId: paymentIntentId,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      paymentMethod: 'card',
      gatewayResponse: paymentIntent,
      metadata: session.metadata,
    };
  }
  
  async refundPayment(options: RefundOptions): Promise<RefundResult> {
    if (!stripe) {
      throw new Error('Stripe gateway not initialized');
    }
    
    const { transactionId, amount, reason } = options;
    
    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
      reason: reason === 'requested_by_customer' ? 'requested_by_customer' : 'other',
    });
    
    return {
      success: true,
      refundTransactionId: refund.id,
      amount: refund.amount / 100, // Convert from cents
      currency: refund.currency,
      status: refund.status,
      gatewayResponse: refund,
    };
  }
}

// Razorpay gateway implementation
class RazorpayGateway implements PaymentGateway {
  name = 'razorpay';
  
  async processPayment(options: ProcessPaymentOptions): Promise<PaymentResult> {
    if (!razorpay) {
      throw new Error('Razorpay gateway not initialized');
    }
    
    const { amount, currency, description, metadata, customerEmail, customerName } = options;
    
    // Create a Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay requires amount in smallest currency unit
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}`,
      notes: metadata,
    });
    
    // Get gateway settings for key ID
    const [gatewaySetting] = await db.select({
      keyId: payment_gateway_settings.api_key_public,
      testKeyId: payment_gateway_settings.test_api_key_public,
      testMode: payment_gateway_settings.test_mode,
    })
    .from(payment_gateway_settings)
    .where(eq(payment_gateway_settings.gateway_name, 'razorpay'));
    
    const keyId = gatewaySetting?.testMode ? gatewaySetting.testKeyId : gatewaySetting?.keyId;
    
    return {
      success: true,
      gateway: 'razorpay',
      orderId: order.id,
      amount: order.amount / 100, // Convert back to decimal
      currency: order.currency,
      keyId: keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_example',
      prefill: {
        email: customerEmail,
        name: customerName,
      },
      notes: metadata,
    };
  }
  
  async verifyPayment(options: VerifyPaymentOptions): Promise<VerificationResult> {
    const { orderId, paymentId, signature } = options;
    
    if (!orderId || !paymentId || !signature) {
      throw new Error('Order ID, Payment ID, and Signature are required for Razorpay verification');
    }
    
    // Get gateway settings for key secret
    const [gatewaySetting] = await db.select({
      keySecret: payment_gateway_settings.api_key_secret,
      testKeySecret: payment_gateway_settings.test_api_key_secret,
      testMode: payment_gateway_settings.test_mode,
    })
    .from(payment_gateway_settings)
    .where(eq(payment_gateway_settings.gateway_name, 'razorpay'));
    
    const keySecret = gatewaySetting?.testMode ? gatewaySetting.testKeySecret : gatewaySetting?.keySecret;
    const secret = keySecret || process.env.RAZORPAY_KEY_SECRET || 'example_secret';
    
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      return {
        success: false,
        message: 'Invalid signature',
      };
    }
    
    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    return {
      success: true,
      transactionId: paymentId,
      amount: payment.amount / 100, // Convert from smallest unit
      currency: payment.currency,
      paymentMethod: 'razorpay',
      gatewayResponse: payment,
      metadata: payment.notes,
    };
  }
  
  async refundPayment(options: RefundOptions): Promise<RefundResult> {
    if (!razorpay) {
      throw new Error('Razorpay gateway not initialized');
    }
    
    const { transactionId, amount, reason } = options;
    
    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(transactionId, {
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to smallest unit if partial refund
      notes: {
        reason: reason || 'Customer requested',
      },
    });
    
    return {
      success: true,
      refundTransactionId: refund.id,
      amount: refund.amount / 100, // Convert from smallest unit
      currency: refund.currency,
      status: refund.status,
      gatewayResponse: refund,
    };
  }
}

// Factory to get the appropriate gateway
function getGateway(gatewayName: string): PaymentGateway {
  switch (gatewayName.toLowerCase()) {
    case 'stripe':
      return new StripeGateway();
    case 'razorpay':
      return new RazorpayGateway();
    // Add other gateways as needed
    default:
      throw new Error(`Unsupported payment gateway: ${gatewayName}`);
  }
}

// Types for payment processing
interface ProcessPaymentOptions {
  invoiceId: number;
  gateway: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  paymentMethod?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
}

interface PaymentResult {
  success: boolean;
  gateway: string;
  redirectUrl?: string;
  sessionId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  keyId?: string;
  prefill?: {
    email?: string;
    name?: string;
  };
  notes?: Record<string, string>;
  error?: string;
}

interface VerifyPaymentOptions {
  gateway: string;
  sessionId?: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
}

interface VerificationResult {
  success: boolean;
  message?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  gatewayResponse?: any;
  metadata?: Record<string, string>;
}

interface RefundOptions {
  paymentId: number;
  gateway: string;
  transactionId: string;
  amount?: number; // Optional for partial refunds
  reason?: string;
}

interface RefundResult {
  success: boolean;
  refundTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  gatewayResponse: any;
  error?: string;
}

/**
 * Process a payment through the specified gateway
 */
export async function processPayment(options: ProcessPaymentOptions): Promise<PaymentResult> {
  try {
    const gateway = getGateway(options.gateway);
    return await gateway.processPayment(options);
  } catch (error) {
    console.error(`Error processing payment with ${options.gateway}:`, error);
    return {
      success: false,
      gateway: options.gateway,
      amount: options.amount,
      currency: options.currency,
      error: error.message,
    };
  }
}

/**
 * Verify a payment from a gateway
 */
export async function verifyPayment(options: VerifyPaymentOptions): Promise<VerificationResult> {
  try {
    const gateway = getGateway(options.gateway);
    return await gateway.verifyPayment(options);
  } catch (error) {
    console.error(`Error verifying payment with ${options.gateway}:`, error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Process a refund through the appropriate gateway
 */
export async function refundPayment(options: RefundOptions): Promise<RefundResult> {
  try {
    const gateway = getGateway(options.gateway);
    return await gateway.refundPayment(options);
  } catch (error) {
    console.error(`Error processing refund with ${options.gateway}:`, error);
    throw error;
  }
}

/**
 * Get available payment gateways
 */
export async function getPaymentGateways() {
  try {
    const gateways = await db.query.payment_gateway_settings.findMany({
      where: eq(payment_gateway_settings.is_enabled, true),
    });
    
    // Filter sensitive information
    return gateways.map(gateway => ({
      id: gateway.id,
      name: gateway.gateway_name,
      displayName: gateway.display_name || gateway.gateway_name,
      supportedCurrencies: gateway.supported_currencies,
      supportedPaymentMethods: gateway.supported_payment_methods,
      isDefault: gateway.is_default,
      logoUrl: gateway.logo_url,
      testMode: gateway.test_mode,
    }));
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    throw error;
  }
}

/**
 * Process a successful payment and update the invoice
 */
export async function recordSuccessfulPayment(verificationResult: VerificationResult, invoiceId: number) {
  try {
    if (!verificationResult.success || !verificationResult.transactionId) {
      throw new Error('Invalid verification result');
    }
    
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
    
    // Generate a unique payment number
    const paymentNumber = `PAY-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Create a payment record
    const [payment] = await db.insert(payments)
      .values({
        userId: invoice.userId,
        invoiceId: invoice.id,
        contactId: invoice.contactId,
        paymentNumber,
        amount: verificationResult.amount,
        payment_method: verificationResult.paymentMethod || 'online',
        payment_gateway: verificationResult.gateway,
        transaction_id: verificationResult.transactionId,
        gateway_response: verificationResult.gatewayResponse,
        payment_date: new Date(),
        description: `Online payment for invoice #${invoice.invoiceNumber}`,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Update invoice amount_paid and status
    const totalPaid = await db.select({
      total: db.sql`SUM(${payments.amount})`,
    })
    .from(payments)
    .where(and(
      eq(payments.invoiceId, invoiceId),
      eq(payments.status, 'completed')
    ));
    
    const amountPaid = totalPaid[0]?.total || 0;
    
    // Determine new payment status
    let newPaymentStatus = invoice.payment_status;
    if (amountPaid >= invoice.totalAmount) {
      newPaymentStatus = 'Paid';
    } else if (amountPaid > 0) {
      newPaymentStatus = 'Partial Payment';
    }
    
    // Update the invoice
    const [updatedInvoice] = await db.update(invoices)
      .set({
        amountPaid,
        payment_status: newPaymentStatus,
        last_payment_date: new Date(),
        last_payment_amount: verificationResult.amount,
        last_payment_method: verificationResult.paymentMethod || 'online',
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    // Record in payment history
    await db.insert(payment_history)
      .values({
        invoiceId,
        paymentId: payment.id,
        event_type: 'payment_recorded',
        event_timestamp: new Date(),
        details: {
          amount: verificationResult.amount,
          payment_method: verificationResult.paymentMethod || 'online',
          gateway: verificationResult.gateway,
          transaction_id: verificationResult.transactionId,
          old_status: invoice.payment_status,
          new_status: newPaymentStatus,
        },
        created_at: new Date(),
      });
    
    // Send thank you email if payment completes the invoice
    if (newPaymentStatus === 'Paid' && !invoice.payment_thank_you_sent && invoice.contact?.email) {
      try {
        await sendEmail({
          to: invoice.contact.email,
          subject: `Thank you for your payment - Invoice #${invoice.invoiceNumber}`,
          text: `Dear ${invoice.contact.firstName},\n\nThank you for your payment of ${verificationResult.amount} for invoice #${invoice.invoiceNumber}. Your payment has been received and processed successfully.\n\nRegards,\nYour Company`,
          html: `<p>Dear ${invoice.contact.firstName},</p><p>Thank you for your payment of ${verificationResult.amount} for invoice #${invoice.invoiceNumber}. Your payment has been received and processed successfully.</p><p>Regards,<br>Your Company</p>`,
        });
        
        // Update invoice to mark thank you as sent
        await db.update(invoices)
          .set({
            payment_thank_you_sent: true,
          })
          .where(eq(invoices.id, invoiceId));
      } catch (emailError) {
        console.error("Error sending thank you email:", emailError);
        // Don't fail the request if email fails
      }
    }
    
    // Notify via WebSocket if available
    if (wsService) {
      // Broadcast payment added
      wsService.broadcastToResource('invoices', invoiceId.toString(), 'payment_added', {
        invoiceId,
        payment,
        amount: verificationResult.amount,
        newStatus: newPaymentStatus,
        amountPaid,
      });
      
      // If status changed, send a specific status change notification
      if (newPaymentStatus !== invoice.payment_status) {
        wsService.broadcastToResource('invoices', invoiceId.toString(), 'status_changed', {
          invoiceId,
          previousStatus: invoice.payment_status,
          status: newPaymentStatus,
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
    console.error('Error recording successful payment:', error);
    throw error;
  }
}

/**
 * Process a webhook event from Stripe
 */
export async function handleStripeWebhook(signature: string, rawBody: Buffer) {
  try {
    if (!stripe) {
      throw new Error('Stripe gateway not initialized');
    }
    
    // Get webhook secret from database
    const [gatewaySetting] = await db.select({
      webhookSecret: payment_gateway_settings.webhook_secret,
      testWebhookSecret: payment_gateway_settings.test_webhook_secret,
      testMode: payment_gateway_settings.test_mode,
    })
    .from(payment_gateway_settings)
    .where(eq(payment_gateway_settings.gateway_name, 'stripe'));
    
    const webhookSecret = gatewaySetting?.testMode 
      ? gatewaySetting.testWebhookSecret 
      : gatewaySetting?.webhookSecret;
    
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_example'
    );
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoiceId;
        
        if (invoiceId) {
          // Verify the payment
          const verificationResult: VerificationResult = {
            success: true,
            transactionId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents
            currency: paymentIntent.currency,
            paymentMethod: 'card',
            gatewayResponse: paymentIntent,
            metadata: paymentIntent.metadata,
            gateway: 'stripe',
          };
          
          // Record the payment
          await recordSuccessfulPayment(verificationResult, parseInt(invoiceId));
        }
        break;
        
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          const sessionInvoiceId = session.metadata?.invoiceId;
          
          if (sessionInvoiceId) {
            // Get payment intent details
            const paymentIntentId = session.payment_intent as string;
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            // Verify the payment
            const verificationResult: VerificationResult = {
              success: true,
              transactionId: paymentIntentId,
              amount: paymentIntent.amount / 100, // Convert from cents
              currency: paymentIntent.currency,
              paymentMethod: 'card',
              gatewayResponse: paymentIntent,
              metadata: session.metadata,
              gateway: 'stripe',
            };
            
            // Record the payment
            await recordSuccessfulPayment(verificationResult, parseInt(sessionInvoiceId));
          }
        }
        break;
        
      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        
        // Find the payment with this transaction ID
        const [paymentToUpdate] = await db.select()
          .from(payments)
          .where(eq(payments.transaction_id, charge.payment_intent as string));
        
        if (paymentToUpdate) {
          // Update payment with refund details
          await db.update(payments)
            .set({
              status: 'refunded',
              refund_status: charge.amount_refunded < charge.amount ? 'partial' : 'full',
              refund_amount: charge.amount_refunded / 100, // Convert from cents
              refund_transaction_id: charge.refunds.data[0]?.id,
              refund_date: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentToUpdate.id));
          
          // If payment is for an invoice, update the invoice
          if (paymentToUpdate.invoiceId) {
            // Recalculate total valid payments
            const totalPaid = await db.select({
              total: db.sql`SUM(${payments.amount})`,
            })
            .from(payments)
            .where(and(
              eq(payments.invoiceId, paymentToUpdate.invoiceId),
              eq(payments.status, 'completed')
            ));
            
            const amountPaid = totalPaid[0]?.total || 0;
            
            // Determine new payment status
            let newPaymentStatus = 'Unpaid';
            if (amountPaid > 0) {
              newPaymentStatus = amountPaid >= paymentToUpdate.amount ? 'Paid' : 'Partial Payment';
            } else {
              // If fully refunded
              newPaymentStatus = 'Refunded';
            }
            
            // Update the invoice
            await db.update(invoices)
              .set({
                amountPaid,
                payment_status: newPaymentStatus,
                updatedAt: new Date(),
              })
              .where(eq(invoices.id, paymentToUpdate.invoiceId));
            
            // Record in payment history
            await db.insert(payment_history)
              .values({
                invoiceId: paymentToUpdate.invoiceId,
                paymentId: paymentToUpdate.id,
                event_type: 'refund_processed',
                event_timestamp: new Date(),
                details: {
                  amount: charge.amount_refunded / 100, // Convert from cents
                  refund_transaction_id: charge.refunds.data[0]?.id,
                },
                created_at: new Date(),
              });
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

/**
 * Handle Razorpay webhook events
 */
export async function handleRazorpayWebhook(payload: any) {
  try {
    const { event, payload: eventPayload } = payload;
    
    switch (event) {
      case 'payment.authorized':
        const payment = eventPayload.payment.entity;
        const orderId = payment.order_id;
        
        // Get order details to find invoice ID
        const order = await razorpay.orders.fetch(orderId);
        const invoiceId = order.notes?.invoiceId;
        
        if (invoiceId) {
          // Verify the payment
          const verificationResult: VerificationResult = {
            success: true,
            transactionId: payment.id,
            amount: payment.amount / 100, // Convert from smallest unit
            currency: payment.currency,
            paymentMethod: 'razorpay',
            gatewayResponse: payment,
            metadata: order.notes,
            gateway: 'razorpay',
          };
          
          // Record the payment
          await recordSuccessfulPayment(verificationResult, parseInt(invoiceId));
        }
        break;
        
      case 'refund.processed':
        const refund = eventPayload.refund.entity;
        const paymentId = refund.payment_id;
        
        // Find the payment with this transaction ID
        const [paymentToUpdate] = await db.select()
          .from(payments)
          .where(eq(payments.transaction_id, paymentId));
        
        if (paymentToUpdate) {
          // Update payment with refund details
          await db.update(payments)
            .set({
              status: 'refunded',
              refund_status: refund.amount < paymentToUpdate.amount * 100 ? 'partial' : 'full',
              refund_amount: refund.amount / 100, // Convert from smallest unit
              refund_transaction_id: refund.id,
              refund_date: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentToUpdate.id));
          
          // If payment is for an invoice, update the invoice
          if (paymentToUpdate.invoiceId) {
            // Similar logic as in Stripe webhook for updating invoice
            // ...
          }
        }
        break;
    }
    
    return { received: true };
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
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
    
    // Verify the payment
    const verificationResult = await verifyPayment({
      gateway: 'razorpay',
      orderId,
      paymentId,
      signature,
    });
    
    if (!verificationResult.success) {
      throw new Error(verificationResult.message || 'Payment verification failed');
    }
    
    // Record the successful payment
    return await recordSuccessfulPayment({
      ...verificationResult,
      gateway: 'razorpay',
    }, invoiceId);
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw error;
  }
}

/**
 * Create a checkout session for an invoice
 */
export async function createCheckoutSession(options: {
  invoiceId: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  gateway?: string;
}) {
  try {
    const { invoiceId, successUrl, cancelUrl, customerEmail, gateway = 'stripe' } = options;
    
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
    
    // Check if invoice allows online payment
    if (!invoice.allow_online_payment) {
      throw new Error('Online payment is not enabled for this invoice');
    }
    
    // Calculate the amount due
    const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
    
    if (amountDue <= 0) {
      throw new Error('Invoice is already fully paid');
    }
    
    // Process the payment through the gateway
    return await processPayment({
      invoiceId,
      gateway,
      amount: amountDue,
      currency: invoice.currency || 'USD',
      description: `Payment for invoice #${invoice.invoiceNumber}`,
      customerEmail: invoice.contact?.email || customerEmail,
      customerName: invoice.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName || ''}` : undefined,
      returnUrl: successUrl,
      metadata: {
        invoiceId: invoiceId.toString(),
        invoiceNumber: invoice.invoiceNumber,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}