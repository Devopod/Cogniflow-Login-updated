import { Router } from "express";
import { db } from "../../db";
import { payments, invoices, payment_history, payment_gateway_settings } from "@shared/schema";
import { eq, and, sql, desc, asc, gt, lt, gte, lte, isNull } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";
import { WSService } from "../../websocket";
import { v4 as uuidv4 } from 'uuid';
import { emailService } from "../services/email";
import { paymentService } from "../services/payment";

// Get the WebSocket service instance
let wsService: WSService;
export const setWSService = (ws: WSService) => {
  wsService = ws;
};

const router = Router();

// Get all payments
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      paymentMethod, 
      contactId, 
      invoiceId,
      gateway,
      minAmount,
      maxAmount,
      sort = "desc",
      limit = 50,
      offset = 0
    } = req.query;

    // Build query conditions
    let conditions = [];
    
    // Filter by user ID (unless admin)
    if (req.user!.role !== 'admin') {
      conditions.push(eq(payments.userId, req.user!.id));
    }
    
    // Apply filters if provided
    if (startDate) {
      conditions.push(gte(payments.paymentDate, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(payments.paymentDate, new Date(endDate as string)));
    }
    
    if (status) {
      conditions.push(eq(payments.status, status as string));
    }
    
    if (paymentMethod) {
      conditions.push(eq(payments.payment_method, paymentMethod as string));
    }
    
    if (contactId) {
      conditions.push(eq(payments.contactId, parseInt(contactId as string)));
    }
    
    if (invoiceId) {
      conditions.push(eq(payments.invoiceId, parseInt(invoiceId as string)));
    }
    
    if (gateway) {
      conditions.push(eq(payments.payment_gateway, gateway as string));
    }
    
    if (minAmount) {
      conditions.push(gte(payments.amount, parseFloat(minAmount as string)));
    }
    
    if (maxAmount) {
      conditions.push(lte(payments.amount, parseFloat(maxAmount as string)));
    }
    
    // Execute query with conditions
    const allPayments = await db.query.payments.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        invoice: true,
        contact: true,
      },
      orderBy: sort === "asc" 
        ? [asc(payments.paymentDate)] 
        : [desc(payments.paymentDate)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    // Get total count for pagination
    const countResult = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(payments)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const totalCount = countResult[0]?.count || 0;
    
    return res.json({
      payments: allPayments,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      }
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// Get a single payment by ID
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, parseInt(id)),
      with: {
        invoice: true,
        contact: true,
        history_entries: {
          orderBy: [desc(payment_history.event_timestamp)],
        },
      },
    });
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Check if user has permission to view this payment
    if (payment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to view this payment" });
    }
    
    return res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({ message: "Failed to fetch payment" });
  }
});

// Create a new payment
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { 
      amount, 
      payment_method, 
      payment_date = new Date(), 
      reference, 
      description,
      invoiceId,
      contactId,
      accountId,
      payment_gateway,
      transaction_id,
      metadata,
      is_recurring = false,
      recurring_profile_id,
    } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }
    
    if (!payment_method) {
      return res.status(400).json({ message: "Payment method is required" });
    }
    
    // Generate a unique payment number
    const paymentNumber = `PAY-${new Date().getFullYear()}-${uuidv4().substring(0, 8)}`;
    
    // Create the payment record
    const [newPayment] = await db.insert(payments)
      .values({
        userId: req.user!.id,
        contactId,
        invoiceId,
        accountId,
        paymentNumber,
        amount,
        payment_method,
        payment_date: new Date(payment_date),
        reference,
        description,
        payment_gateway,
        transaction_id,
        status: 'completed', // Default status
        is_recurring,
        recurring_profile_id,
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // If this payment is for an invoice, update the invoice
    if (invoiceId) {
      // Get the invoice
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      
      if (invoice) {
        // Calculate total payments for this invoice
        const totalPaid = await db.select({
          total: sql`SUM(${payments.amount})`,
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
            last_payment_amount: amount,
            last_payment_method: payment_method,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId))
          .returning();
        
        // Record payment history
        await db.insert(payment_history)
          .values({
            invoiceId,
            paymentId: newPayment.id,
            event_type: 'payment_recorded',
            event_timestamp: new Date(),
            details: {
              amount,
              payment_method,
              old_status: invoice.payment_status,
              new_status: newPaymentStatus,
            },
            user_id: req.user!.id,
            created_at: new Date(),
          });
        
        // Send thank you email if payment completes the invoice
        if (newPaymentStatus === 'Paid' && !invoice.payment_thank_you_sent) {
          try {
            // Get contact email
            if (invoice.contactId) {
              const [contact] = await db.select().from(contacts).where(eq(contacts.id, invoice.contactId));
              
              if (contact && contact.email) {
                await emailService.sendEmail({
                  to: contact.email,
                  subject: `Thank you for your payment - Invoice #${invoice.invoiceNumber}`,
                  text: `Dear ${contact.firstName},\n\nThank you for your payment of ${amount} for invoice #${invoice.invoiceNumber}. Your payment has been received and processed successfully.\n\nRegards,\nYour Company`,
                  html: `<p>Dear ${contact.firstName},</p><p>Thank you for your payment of ${amount} for invoice #${invoice.invoiceNumber}. Your payment has been received and processed successfully.</p><p>Regards,<br>Your Company</p>`,
                });
                
                // Update invoice to mark thank you as sent
                await db.update(invoices)
                  .set({
                    payment_thank_you_sent: true,
                  })
                  .where(eq(invoices.id, invoiceId));
              }
            }
          } catch (emailError) {
            console.error("Error sending thank you email:", emailError);
            // Don't fail the request if email fails
          }
        }
        
        // Notify via WebSocket
        if (wsService) {
          // Broadcast payment added
          wsService.broadcastToResource('invoices', invoiceId.toString(), 'payment_added', {
            invoiceId,
            payment: newPayment,
            amount,
            newStatus: newPaymentStatus,
            amountPaid,
          });
          
          // Broadcast invoice updated
          wsService.broadcastToResource('invoices', invoiceId.toString(), 'invoice_updated', {
            invoice: updatedInvoice
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
        
        return res.status(201).json({
          payment: newPayment,
          invoice: updatedInvoice
        });
      }
    }
    
    // If we get here, either there was no invoice or it wasn't found
    return res.status(201).json({
      payment: newPayment
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({ message: "Failed to create payment" });
  }
});

// Update a payment
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      payment_method, 
      payment_date, 
      reference, 
      description,
      status,
      payment_gateway,
      transaction_id,
      metadata,
    } = req.body;
    
    // Get the current payment
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.id, parseInt(id)),
    });
    
    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Check if user has permission to update this payment
    if (existingPayment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to update this payment" });
    }
    
    // Check if status is changing
    const isStatusChanging = status && status !== existingPayment.status;
    const previousStatus = existingPayment.status;
    
    // Update the payment
    const [updatedPayment] = await db
      .update(payments)
      .set({
        amount: amount !== undefined ? amount : undefined,
        payment_method: payment_method !== undefined ? payment_method : undefined,
        payment_date: payment_date ? new Date(payment_date) : undefined,
        reference: reference !== undefined ? reference : undefined,
        description: description !== undefined ? description : undefined,
        status: status !== undefined ? status : undefined,
        payment_gateway: payment_gateway !== undefined ? payment_gateway : undefined,
        transaction_id: transaction_id !== undefined ? transaction_id : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, parseInt(id)))
      .returning();
    
    // If status changed to 'failed' or 'refunded', update the invoice
    if (isStatusChanging && (status === 'failed' || status === 'refunded')) {
      if (existingPayment.invoiceId) {
        // Get the invoice
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, existingPayment.invoiceId));
        
        if (invoice) {
          // Recalculate total payments for this invoice
          const totalPaid = await db.select({
            total: sql`SUM(${payments.amount})`,
          })
          .from(payments)
          .where(and(
            eq(payments.invoiceId, existingPayment.invoiceId),
            eq(payments.status, 'completed')
          ));
          
          const amountPaid = totalPaid[0]?.total || 0;
          
          // Determine new payment status
          let newPaymentStatus = 'Unpaid';
          if (amountPaid >= invoice.totalAmount) {
            newPaymentStatus = 'Paid';
          } else if (amountPaid > 0) {
            newPaymentStatus = 'Partial Payment';
          }
          
          // If payment was refunded, set special status
          if (status === 'refunded' && newPaymentStatus === 'Paid') {
            newPaymentStatus = 'Refunded';
          }
          
          // Update the invoice
          const [updatedInvoice] = await db.update(invoices)
            .set({
              amountPaid,
              payment_status: newPaymentStatus,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, existingPayment.invoiceId))
            .returning();
          
          // Record payment history
          await db.insert(payment_history)
            .values({
              invoiceId: existingPayment.invoiceId,
              paymentId: parseInt(id),
              event_type: status === 'refunded' ? 'payment_refunded' : 'payment_failed',
              event_timestamp: new Date(),
              details: {
                amount: existingPayment.amount,
                old_status: previousStatus,
                new_status: status,
                invoice_payment_status: newPaymentStatus,
              },
              user_id: req.user!.id,
              created_at: new Date(),
            });
          
          // Notify via WebSocket
          if (wsService) {
            // Broadcast payment updated
            wsService.broadcastToResource('invoices', existingPayment.invoiceId.toString(), 'payment_updated', {
              invoiceId: existingPayment.invoiceId,
              paymentId: parseInt(id),
              payment: updatedPayment,
              previousStatus,
              status,
            });
            
            // Broadcast invoice updated
            wsService.broadcastToResource('invoices', existingPayment.invoiceId.toString(), 'invoice_updated', {
              invoice: updatedInvoice
            });
          }
        }
      }
    }
    
    return res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return res.status(500).json({ message: "Failed to update payment" });
  }
});

// Delete a payment
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the payment to check ownership
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.id, parseInt(id)),
    });
    
    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Check if user has permission to delete this payment
    if (existingPayment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to delete this payment" });
    }
    
    // Store invoice ID for later use
    const invoiceId = existingPayment.invoiceId;
    
    // Delete the payment
    const [deletedPayment] = await db
      .delete(payments)
      .where(eq(payments.id, parseInt(id)))
      .returning();
    
    // If this payment was for an invoice, update the invoice
    if (invoiceId) {
      // Get the invoice
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      
      if (invoice) {
        // Recalculate total payments for this invoice
        const totalPaid = await db.select({
          total: sql`SUM(${payments.amount})`,
        })
        .from(payments)
        .where(and(
          eq(payments.invoiceId, invoiceId),
          eq(payments.status, 'completed')
        ));
        
        const amountPaid = totalPaid[0]?.total || 0;
        
        // Determine new payment status
        let newPaymentStatus = 'Unpaid';
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
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId))
          .returning();
        
        // Record payment history
        await db.insert(payment_history)
          .values({
            invoiceId,
            event_type: 'payment_deleted',
            event_timestamp: new Date(),
            details: {
              amount: existingPayment.amount,
              payment_method: existingPayment.payment_method,
              old_status: invoice.payment_status,
              new_status: newPaymentStatus,
            },
            user_id: req.user!.id,
            created_at: new Date(),
          });
        
        // Notify via WebSocket
        if (wsService) {
          // Broadcast payment deleted
          wsService.broadcastToResource('invoices', invoiceId.toString(), 'payment_deleted', {
            invoiceId,
            paymentId: parseInt(id),
            amount: existingPayment.amount,
          });
          
          // Broadcast invoice updated
          wsService.broadcastToResource('invoices', invoiceId.toString(), 'invoice_updated', {
            invoice: updatedInvoice
          });
        }
      }
    }
    
    return res.json({ 
      message: "Payment deleted successfully",
      payment: deletedPayment
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return res.status(500).json({ message: "Failed to delete payment" });
  }
});

// Process a refund
router.post("/:id/refund", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, // Optional: for partial refunds
      reason,
    } = req.body;
    
    // Get the payment
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, parseInt(id)),
    });
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Check if user has permission
    if (payment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to refund this payment" });
    }
    
    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: `Cannot refund a payment with status: ${payment.status}` });
    }
    
    // If this is an online payment, process the refund through the gateway
    if (payment.payment_gateway && payment.transaction_id) {
      try {
        const refundResult = await paymentService.createRefund(payment.id, amount || payment.amount, reason);
        
        // Update payment with refund details
        const [updatedPayment] = await db.update(payments)
          .set({
            status: 'refunded',
            refund_status: amount && amount < payment.amount ? 'partial' : 'full',
            refund_amount: amount || payment.amount,
            refund_transaction_id: refundResult.refundTransactionId,
            refund_date: new Date(),
            refund_reason: reason,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, parseInt(id)))
          .returning();
        
        // If payment is for an invoice, update the invoice
        if (payment.invoiceId) {
          // Recalculate total valid payments
          const totalPaid = await db.select({
            total: sql`SUM(${payments.amount})`,
          })
          .from(payments)
          .where(and(
            eq(payments.invoiceId, payment.invoiceId),
            eq(payments.status, 'completed')
          ));
          
          const amountPaid = totalPaid[0]?.total || 0;
          
          // Determine new payment status
          let newPaymentStatus = 'Unpaid';
          if (amountPaid >= payment.amount) {
            newPaymentStatus = 'Paid';
          } else if (amountPaid > 0) {
            newPaymentStatus = 'Partial Payment';
          } else {
            // If fully refunded
            newPaymentStatus = 'Refunded';
          }
          
          // Update the invoice
          const [updatedInvoice] = await db.update(invoices)
            .set({
              amountPaid,
              payment_status: newPaymentStatus,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, payment.invoiceId))
            .returning();
          
          // Record in payment history
          await db.insert(payment_history)
            .values({
              invoiceId: payment.invoiceId,
              paymentId: payment.id,
              event_type: 'refund_processed',
              event_timestamp: new Date(),
              details: {
                amount: amount || payment.amount,
                reason,
                refund_transaction_id: refundResult.refundTransactionId,
              },
              user_id: req.user!.id,
              created_at: new Date(),
            });
          
          // Notify via WebSocket
          if (wsService) {
            wsService.broadcastToResource('invoices', payment.invoiceId.toString(), 'payment_refunded', {
              invoiceId: payment.invoiceId,
              paymentId: payment.id,
              refundAmount: amount || payment.amount,
              newInvoiceStatus: newPaymentStatus,
            });
          }
        }
        
        return res.json({
          success: true,
          payment: updatedPayment,
          refund: refundResult,
        });
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
        return res.status(500).json({ 
          message: "Failed to process refund through payment gateway", 
          error: refundError.message 
        });
      }
    } else {
      // For manual payments, just mark as refunded
      const [updatedPayment] = await db.update(payments)
        .set({
          status: 'refunded',
          refund_status: amount && amount < payment.amount ? 'partial' : 'full',
          refund_amount: amount || payment.amount,
          refund_date: new Date(),
          refund_reason: reason,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, parseInt(id)))
        .returning();
      
      // If payment is for an invoice, update the invoice
      if (payment.invoiceId) {
        // Get the invoice
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
        
        if (invoice) {
          // Recalculate total valid payments
          const totalPaid = await db.select({
            total: sql`SUM(${payments.amount})`,
          })
          .from(payments)
          .where(and(
            eq(payments.invoiceId, payment.invoiceId),
            eq(payments.status, 'completed')
          ));
          
          const amountPaid = totalPaid[0]?.total || 0;
          
          // Determine new payment status
          let newPaymentStatus = 'Unpaid';
          if (amountPaid >= invoice.totalAmount) {
            newPaymentStatus = 'Paid';
          } else if (amountPaid > 0) {
            newPaymentStatus = 'Partial Payment';
          } else {
            // If fully refunded
            newPaymentStatus = 'Refunded';
          }
          
          // Update the invoice
          const [updatedInvoice] = await db.update(invoices)
            .set({
              amountPaid,
              payment_status: newPaymentStatus,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, payment.invoiceId))
            .returning();
          
          // Record in payment history
          await db.insert(payment_history)
            .values({
              invoiceId: payment.invoiceId,
              paymentId: payment.id,
              event_type: 'refund_processed',
              event_timestamp: new Date(),
              details: {
                amount: amount || payment.amount,
                reason,
                manual_refund: true,
              },
              user_id: req.user!.id,
              created_at: new Date(),
            });
          
          // Notify via WebSocket
          if (wsService) {
            wsService.broadcastToResource('invoices', payment.invoiceId.toString(), 'payment_refunded', {
              invoiceId: payment.invoiceId,
              paymentId: payment.id,
              refundAmount: amount || payment.amount,
              newInvoiceStatus: newPaymentStatus,
            });
          }
        }
      }
      
      return res.json({
        success: true,
        payment: updatedPayment,
        manual: true,
      });
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({ message: "Failed to process refund" });
  }
});

// Get payment gateways
router.get("/gateways", authenticateUser, async (req, res) => {
  try {
    // Get all enabled payment gateways
    const gateways = await db.query.payment_gateway_settings.findMany({
      where: eq(payment_gateway_settings.is_enabled, true),
      orderBy: [asc(payment_gateway_settings.gateway_name)],
    });
    
    // Filter sensitive information
    const safeGateways = gateways.map(gateway => ({
      id: gateway.id,
      gateway_name: gateway.gateway_name,
      display_name: gateway.display_name || gateway.gateway_name,
      supported_currencies: gateway.supported_currencies,
      supported_payment_methods: gateway.supported_payment_methods,
      is_default: gateway.is_default,
      logo_url: gateway.logo_url,
      test_mode: gateway.test_mode,
    }));
    
    return res.json(safeGateways);
  } catch (error) {
    console.error("Error fetching payment gateways:", error);
    return res.status(500).json({ message: "Failed to fetch payment gateways" });
  }
});

// Process online payment
router.post("/process", authenticateUser, async (req, res) => {
  try {
    const { 
      invoiceId, 
      gateway, 
      amount,
      paymentMethod,
      returnUrl,
      metadata,
    } = req.body;
    
    if (!invoiceId || !gateway) {
      return res.status(400).json({ message: "Invoice ID and gateway are required" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(invoiceId)),
      with: {
        contact: true,
      },
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    // Check if invoice allows online payment
    if (!invoice.allow_online_payment) {
      return res.status(400).json({ message: "Online payment is not enabled for this invoice" });
    }
    
    // Calculate amount to pay (use provided amount or remaining balance)
    const paymentAmount = amount || (invoice.totalAmount - invoice.amountPaid);
    
    if (paymentAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }
    
    // Process the payment through the gateway
    const paymentResult = await paymentService.processPayment({
      invoiceId: invoice.id,
      gateway,
      amount: paymentAmount,
      currency: invoice.currency,
      description: `Payment for invoice #${invoice.invoiceNumber}`,
      customerEmail: invoice.contact?.email,
      customerName: invoice.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName}` : undefined,
      paymentMethod,
      returnUrl,
      metadata: {
        ...metadata,
        invoiceId: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        userId: req.user!.id.toString(),
      },
    });
    
    return res.json(paymentResult);
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ message: "Failed to process payment", error: error.message });
  }
});

// Get payment statistics
router.get("/statistics", authenticateUser, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    // Define date range based on period
    let start = new Date();
    let end = new Date();
    
    if (startDate && endDate) {
      // Use custom date range if provided
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Calculate date range based on period
      switch (period) {
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(start.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setMonth(start.getMonth() - 1); // Default to month
      }
    }
    
    // Build query conditions
    let conditions = [
      gte(payments.paymentDate, start),
      lte(payments.paymentDate, end),
      eq(payments.status, 'completed'),
    ];
    
    // Filter by user ID (unless admin)
    if (req.user!.role !== 'admin') {
      conditions.push(eq(payments.userId, req.user!.id));
    }
    
    // Get total payments
    const totalResult = await db.select({
      count: sql<number>`count(*)`,
      sum: sql<number>`sum(${payments.amount})`,
    })
    .from(payments)
    .where(and(...conditions));
    
    // Get payments by method
    const byMethodResult = await db.select({
      method: payments.payment_method,
      count: sql<number>`count(*)`,
      sum: sql<number>`sum(${payments.amount})`,
    })
    .from(payments)
    .where(and(...conditions))
    .groupBy(payments.payment_method);
    
    // Get payments by gateway
    const byGatewayResult = await db.select({
      gateway: payments.payment_gateway,
      count: sql<number>`count(*)`,
      sum: sql<number>`sum(${payments.amount})`,
    })
    .from(payments)
    .where(and(...conditions))
    .groupBy(payments.payment_gateway);
    
    // Get payments by day
    const byDayResult = await db.select({
      date: sql<string>`date_trunc('day', ${payments.paymentDate})`,
      count: sql<number>`count(*)`,
      sum: sql<number>`sum(${payments.amount})`,
    })
    .from(payments)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${payments.paymentDate})`)
    .orderBy(sql`date_trunc('day', ${payments.paymentDate})`);
    
    return res.json({
      total: {
        count: totalResult[0]?.count || 0,
        amount: totalResult[0]?.sum || 0,
      },
      byMethod: byMethodResult,
      byGateway: byGatewayResult,
      byDay: byDayResult,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    return res.status(500).json({ message: "Failed to fetch payment statistics" });
  }
});

export default router;