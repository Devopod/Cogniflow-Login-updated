import express from "express";
import Stripe from "stripe";
import { storage } from "../../storage";
import { paymentService } from "../services/payment";
import { wsService } from "../services/websocket";
import { emailService } from "../services/email";

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Stripe webhook endpoint signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Raw body parser for Stripe webhooks
router.use('/stripe', express.raw({ type: 'application/json' }));

// Stripe webhook handler
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
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

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'refund.created':
        await handleRefundCreated(event.data.object as Stripe.Refund);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  try {
    await paymentService.handlePaymentSuccess(paymentIntent);
    
    // Send payment confirmation email
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (invoiceId) {
      const invoice = await storage.getInvoice(parseInt(invoiceId));
      if (invoice) {
        await emailService.sendEmail({
          to: invoice.contact?.email || '',
          subject: `Payment Confirmation - Invoice ${invoice.invoiceNumber}`,
          html: `
            <h2>Payment Received</h2>
            <p>Thank you for your payment of ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}.</p>
            <p>Invoice: ${invoice.invoiceNumber}</p>
            <p>Payment Method: ${paymentIntent.payment_method_types.join(', ')}</p>
            <p>Transaction ID: ${paymentIntent.id}</p>
          `,
          text: `Payment Received - Thank you for your payment of ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()} for invoice ${invoice.invoiceNumber}.`
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  try {
    await paymentService.handlePaymentFailure(paymentIntent);
    
    // Send payment failure notification
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (invoiceId) {
      const invoice = await storage.getInvoice(parseInt(invoiceId));
      if (invoice) {
        await emailService.sendEmail({
          to: invoice.contact?.email || '',
          subject: `Payment Failed - Invoice ${invoice.invoiceNumber}`,
          html: `
            <h2>Payment Failed</h2>
            <p>Your payment of ${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()} could not be processed.</p>
            <p>Invoice: ${invoice.invoiceNumber}</p>
            <p>Reason: ${paymentIntent.last_payment_error?.message || 'Unknown error'}</p>
            <p>Please try again or contact us for assistance.</p>
          `,
          text: `Payment Failed - Your payment for invoice ${invoice.invoiceNumber} could not be processed. Please try again.`
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle canceled payment intent
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);
  
  try {
    // Log the cancellation
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (invoiceId) {
      await storage.createInvoiceActivity({
        invoiceId: parseInt(invoiceId),
        userId: 0, // System user
        activityType: 'payment_canceled',
        description: `Payment intent ${paymentIntent.id} was canceled`,
        metadata: { paymentIntentId: paymentIntent.id }
      });

      // Broadcast the cancellation
      wsService.broadcastToResource('invoice', parseInt(invoiceId), {
        type: 'payment_canceled',
        data: { paymentIntentId: paymentIntent.id }
      });
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

// Handle payment method attached
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method attached:', paymentMethod.id);
  
  try {
    // Find the contact associated with this customer
    if (paymentMethod.customer) {
      const customerId = paymentMethod.customer as string;
      // Note: You might want to store Stripe customer ID in your contacts table
      // to easily find the associated contact
      
      // Log the attachment
      console.log(`Payment method ${paymentMethod.id} attached to customer ${customerId}`);
    }
  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}

// Handle Stripe invoice payment succeeded (for recurring payments)
async function handleInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice) {
  console.log('Stripe invoice payment succeeded:', stripeInvoice.id);
  
  try {
    // Check if this is for a recurring invoice in our system
    const subscriptionId = stripeInvoice.subscription as string;
    if (subscriptionId) {
      // Find the invoice associated with this subscription
      // Note: You would need to store subscription IDs in your invoices table
      
      // Create a new payment record
      const paymentData = {
        invoiceId: 0, // You'd need to find the actual invoice ID
        amount: stripeInvoice.amount_paid / 100, // Convert from cents
        paymentMethod: 'Stripe Subscription',
        transactionId: stripeInvoice.payment_intent as string,
        status: 'completed' as const,
        metadata: {
          stripeInvoiceId: stripeInvoice.id,
          subscriptionId: subscriptionId
        }
      };
      
      // await storage.createPayment(paymentData);
    }
  } catch (error) {
    console.error('Error handling Stripe invoice payment:', error);
  }
}

// Handle Stripe invoice payment failed (for recurring payments)
async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  console.log('Stripe invoice payment failed:', stripeInvoice.id);
  
  try {
    // Handle recurring payment failure
    // You might want to notify the customer and pause the subscription
    
    // Send notification email about failed recurring payment
    if (stripeInvoice.customer_email) {
      await emailService.sendEmail({
        to: stripeInvoice.customer_email,
        subject: 'Recurring Payment Failed',
        html: `
          <h2>Payment Failed</h2>
          <p>Your recurring payment of ${(stripeInvoice.amount_due / 100).toFixed(2)} ${stripeInvoice.currency.toUpperCase()} could not be processed.</p>
          <p>Please update your payment method to continue your subscription.</p>
        `,
        text: `Your recurring payment could not be processed. Please update your payment method.`
      });
    }
  } catch (error) {
    console.error('Error handling Stripe invoice payment failure:', error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  try {
    // Update the associated invoice with subscription details
    const invoiceId = subscription.metadata?.invoiceId;
    if (invoiceId) {
      await storage.updateInvoice(parseInt(invoiceId), {
        metadata: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        }
      });

      // Log the activity
      await storage.createInvoiceActivity({
        invoiceId: parseInt(invoiceId),
        userId: 0, // System user
        activityType: 'subscription_created',
        description: `Stripe subscription ${subscription.id} created for recurring invoice`,
        metadata: { subscriptionId: subscription.id }
      });
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    // Update subscription status in your system
    const invoiceId = subscription.metadata?.invoiceId;
    if (invoiceId) {
      await storage.createInvoiceActivity({
        invoiceId: parseInt(invoiceId),
        userId: 0, // System user
        activityType: 'subscription_updated',
        description: `Stripe subscription ${subscription.id} status changed to ${subscription.status}`,
        metadata: { 
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        }
      });

      // Broadcast the update
      wsService.broadcastToResource('invoice', parseInt(invoiceId), {
        type: 'subscription_updated',
        data: { 
          subscriptionId: subscription.id,
          status: subscription.status
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    // Handle subscription cancellation
    const invoiceId = subscription.metadata?.invoiceId;
    if (invoiceId) {
      // Update the recurring invoice to mark it as inactive
      await storage.updateInvoice(parseInt(invoiceId), {
        isRecurring: false,
        metadata: {
          subscriptionCanceledAt: new Date().toISOString(),
          subscriptionCancelReason: 'stripe_subscription_deleted'
        }
      });

      // Log the activity
      await storage.createInvoiceActivity({
        invoiceId: parseInt(invoiceId),
        userId: 0, // System user
        activityType: 'subscription_canceled',
        description: `Stripe subscription ${subscription.id} was canceled`,
        metadata: { subscriptionId: subscription.id }
      });

      // Broadcast the cancellation
      wsService.broadcastToResource('invoice', parseInt(invoiceId), {
        type: 'subscription_canceled',
        data: { subscriptionId: subscription.id }
      });
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle charge dispute created
async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Charge dispute created:', dispute.id);
  
  try {
    // Find the payment associated with this charge
    const chargeId = dispute.charge as string;
    
    // Log the dispute
    console.log(`Dispute ${dispute.id} created for charge ${chargeId}. Reason: ${dispute.reason}`);
    
    // You might want to:
    // 1. Notify relevant staff about the dispute
    // 2. Update the payment status
    // 3. Create a task for handling the dispute
    
    // Send notification email about dispute
    if (process.env.ADMIN_EMAIL) {
      await emailService.sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Payment Dispute Created - ${dispute.id}`,
        html: `
          <h2>Payment Dispute Alert</h2>
          <p>A dispute has been created for charge ${chargeId}.</p>
          <p>Dispute ID: ${dispute.id}</p>
          <p>Amount: ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}</p>
          <p>Reason: ${dispute.reason}</p>
          <p>Status: ${dispute.status}</p>
          <p>Please review and respond in your Stripe Dashboard.</p>
        `,
        text: `Payment dispute created: ${dispute.id} for charge ${chargeId}. Amount: ${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}. Reason: ${dispute.reason}`
      });
    }
  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}

// Handle refund created
async function handleRefundCreated(refund: Stripe.Refund) {
  console.log('Refund created:', refund.id);
  
  try {
    // Update the associated payment record
    const chargeId = refund.charge as string;
    
    // Log the refund
    console.log(`Refund ${refund.id} created for charge ${chargeId}. Amount: ${refund.amount / 100}`);
    
    // You might want to:
    // 1. Update the payment status in your database
    // 2. Update the invoice payment status if fully refunded
    // 3. Send confirmation email to the customer
    
    // Create refund record in your system
    const refundData = {
      paymentId: 0, // You'd need to find the payment ID from the charge
      amount: refund.amount / 100,
      reason: refund.reason || 'requested_by_customer',
      status: refund.status,
      transactionId: refund.id,
      metadata: {
        chargeId: chargeId,
        stripeRefundId: refund.id
      }
    };
    
    // await storage.createRefund(refundData);
  } catch (error) {
    console.error('Error handling refund creation:', error);
  }
}

export default router;