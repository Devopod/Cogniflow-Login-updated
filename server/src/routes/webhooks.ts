import express from 'express';
import Stripe from 'stripe';
import { storage } from '../../storage';
import { paymentService } from '../services/payment';
import { emailService } from '../services/email';
import { db } from '../../db';
import { invoices, contacts, payment_history } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Initialize Stripe only if a valid secret key is provided
const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeSecret.startsWith('sk_') ? new Stripe(stripeSecret, {
  apiVersion: "2023-10-16" as any,
}) : null;

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (!invoiceId) {
      console.log('No invoice ID in payment intent metadata');
      return;
    }

    // Get invoice details
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    if (!invoice) {
      console.log('Invoice not found:', invoiceId);
      return;
    }

    // Process payment
    const result = await paymentService.processInvoicePayment(parseInt(invoiceId), {
      amount: paymentIntent.amount / 100, // Convert from cents
      payment_method: 'stripe',
      paymentNumber: paymentIntent.id,
      description: `Stripe payment for invoice ${invoice.invoiceNumber}`,
      metadata: {
        payment_intent_id: paymentIntent.id,
        customer_id: paymentIntent.customer as string,
      },
    });

    if (result.success) {
      // Send confirmation email
      if (invoice.contactId) {
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
        if (contact?.email) {
          await emailService.sendEmail({
            to: contact.email,
            subject: `Payment Confirmed - Invoice ${invoice.invoiceNumber}`,
            html: `
              <h2>Payment Confirmed</h2>
              <p>Your payment of ${result.amount} ${result.currency} for invoice ${invoice.invoiceNumber} has been processed successfully.</p>
              <p>Thank you for your business!</p>
            `,
          });
        }
      }

      // Log activity
      await db.insert(payment_history).values({
        invoiceId: parseInt(invoiceId),
        event_type: 'payment_processed',
        event_timestamp: new Date(),
        details: {
          amount: result.amount,
          payment_method: 'stripe',
          payment_intent_id: paymentIntent.id,
        },
        user_id: invoice.userId,
        created_at: new Date(),
      });
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (!invoiceId) return;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    if (!invoice) return;

    // Send failure notification
    if (invoice.contactId) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
      if (contact?.email) {
        await emailService.sendEmail({
          to: contact.email,
          subject: `Payment Failed - Invoice ${invoice.invoiceNumber}`,
          html: `
            <h2>Payment Failed</h2>
            <p>We were unable to process your payment for invoice ${invoice.invoiceNumber}.</p>
            <p>Please try again or contact us for assistance.</p>
          `,
        });
      }
    }

    // Log activity
    await db.insert(payment_history).values({
      invoiceId: parseInt(invoiceId),
      event_type: 'payment_failed',
      event_timestamp: new Date(),
      details: {
        payment_intent_id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
      user_id: invoice.userId,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice) {
  try {
    const invoiceId = stripeInvoice.metadata?.invoiceId;
    if (!invoiceId) return;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    if (!invoice) return;

    // Process the payment
    const result = await paymentService.processInvoicePayment(parseInt(invoiceId), {
      amount: stripeInvoice.amount_paid / 100,
      payment_method: 'stripe_invoice',
      paymentNumber: stripeInvoice.id || '',
      description: `Stripe invoice payment for ${invoice.invoiceNumber}`,
      metadata: {
        stripe_invoice_id: stripeInvoice.id,
        subscription_id: (stripeInvoice.subscription as string) || '',
      },
    });

    if (result.success) {
      // Send confirmation email
      if (invoice.contactId) {
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
        if (contact?.email) {
          await emailService.sendEmail({
            to: contact.email,
            subject: `Payment Confirmed - Invoice ${invoice.invoiceNumber}`,
            html: `
              <h2>Payment Confirmed</h2>
              <p>Your payment of ${result.amount} ${result.currency} for invoice ${invoice.invoiceNumber} has been processed successfully.</p>
            `,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  try {
    const invoiceId = stripeInvoice.metadata?.invoiceId;
    if (!invoiceId) return;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    if (!invoice) return;

    // Send failure notification
    if (invoice.contactId) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
      if (contact?.email) {
        await emailService.sendEmail({
          to: contact.email,
          subject: `Payment Failed - Invoice ${invoice.invoiceNumber}`,
          html: `
            <h2>Payment Failed</h2>
            <p>We were unable to process your payment for invoice ${invoice.invoiceNumber}.</p>
          `,
        });
      }
    }

    // Log activity
    await db.insert(payment_history).values({
      invoiceId: parseInt(invoiceId),
      event_type: 'payment_failed',
      event_timestamp: new Date(),
      details: {
        stripe_invoice_id: stripeInvoice.id,
        error: 'Invoice payment failed',
      },
      user_id: invoice.userId,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const invoiceId = subscription.metadata?.invoiceId;
    if (!invoiceId) return;

    // Update invoice with subscription details
    await db.update(invoices)
      .set({
        is_recurring: true,
        recurring_schedule: {
          subscription_id: subscription.id,
          interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
          interval_count: subscription.items.data[0]?.price.recurring?.interval_count || 1,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
        } as any,
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    // Log activity
    await db.insert(payment_history).values({
      invoiceId: parseInt(invoiceId),
      event_type: 'subscription_created',
      event_timestamp: new Date(),
      details: {
        subscription_id: subscription.id,
        status: subscription.status,
      },
      user_id: parseInt(subscription.metadata?.userId || '0'),
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const invoiceId = subscription.metadata?.invoiceId;
    if (!invoiceId) return;

    // Update invoice with new subscription details
    await db.update(invoices)
      .set({
        recurring_schedule: {
          subscription_id: subscription.id,
          interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
          interval_count: subscription.items.data[0]?.price.recurring?.interval_count || 1,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
        } as any,
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    // Log activity
    await db.insert(payment_history).values({
      invoiceId: parseInt(invoiceId),
      event_type: 'subscription_updated',
      event_timestamp: new Date(),
      details: {
        subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
      },
      user_id: parseInt(subscription.metadata?.userId || '0'),
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const invoiceId = subscription.metadata?.invoiceId;
    if (!invoiceId) return;

    // Update invoice to mark subscription as cancelled
    await db.update(invoices)
      .set({
        is_recurring: false,
        recurring_schedule: null,
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    // Log activity
    await db.insert(payment_history).values({
      invoiceId: parseInt(invoiceId),
      event_type: 'subscription_cancelled',
      event_timestamp: new Date(),
      details: {
        subscription_id: subscription.id,
        status: subscription.status,
      },
      user_id: parseInt(subscription.metadata?.userId || '0'),
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Razorpay webhook endpoint
router.post('/razorpay', express.json(), async (req, res) => {
  try {
    const { event, payload } = req.body;

    switch (event) {
      case 'payment.captured':
        await handleRazorpayPaymentCaptured(payload);
        break;
      case 'payment.failed':
        await handleRazorpayPaymentFailed(payload);
        break;
      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleRazorpayPaymentCaptured(payload: any) {
  try {
    const invoiceId = payload.notes?.invoiceId;
    if (!invoiceId) return;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    if (!invoice) return;

    // Process the payment
    const result = await paymentService.processInvoicePayment(parseInt(invoiceId), {
      amount: payload.amount / 100, // Convert from paise
      payment_method: 'razorpay',
      paymentNumber: payload.id,
      description: `Razorpay payment for invoice ${invoice.invoiceNumber}`,
      metadata: {
        razorpay_payment_id: payload.id,
        razorpay_order_id: payload.order_id,
      },
    });

    if (result.success) {
      // Send confirmation email
      if (invoice.contactId) {
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
        if (contact?.email) {
          await emailService.sendEmail({
            to: contact.email,
            subject: `Payment Confirmed - Invoice ${invoice.invoiceNumber}`,
            html: `
              <h2>Payment Confirmed</h2>
              <p>Your payment of ${result.amount} ${result.currency} for invoice ${invoice.invoiceNumber} has been processed successfully.</p>
            `,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling Razorpay payment captured:', error);
  }
}

async function handleRazorpayPaymentFailed(payload: any) {
  try {
    const invoiceId = payload.notes?.invoiceId;
    if (!invoiceId) return;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parseInt(invoiceId)));
    if (!invoice) return;

    // Send failure notification
    if (invoice.contactId) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
      if (contact?.email) {
        await emailService.sendEmail({
          to: contact.email,
          subject: `Payment Failed - Invoice ${invoice.invoiceNumber}`,
          html: `
            <h2>Payment Failed</h2>
            <p>We were unable to process your payment for invoice ${invoice.invoiceNumber}.</p>
          `,
        });
      }
    }

    // Log activity
    await db.insert(payment_history).values({
      invoiceId: parseInt(invoiceId),
      event_type: 'payment_failed',
      event_timestamp: new Date(),
      details: {
        razorpay_payment_id: payload.id,
        error: payload.error_description || 'Payment failed',
      },
      user_id: invoice.userId,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Error handling Razorpay payment failed:', error);
  }
}

export default router;