import { Router } from "express";
import { db } from "../../db";
import { invoices, invoiceItems, payments } from "@shared/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";
import { WSService } from "../../websocket";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from "../services/email";
import { storage } from "../../storage";

// Get the WebSocket service instance.
let wsService: WSService;
export const setWSService = (ws: WSService) => {
  wsService = ws;
};

const router = Router();

// Get all invoices
router.get("/", authenticateUser, async (req, res) => {
  try {
    const allInvoices = await db.query.invoices.findMany({
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    return res.json(allInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// Get a single invoice by ID
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching invoice with ID: ${id}`);
    
    // Check if the user is authenticated
    if (!req.user) {
      console.log("User not authenticated in invoice/:id route");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log(`User ID: ${req.user.id}, looking for invoice ID: ${id}`);
    
    try {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, parseInt(id)),
        with: {
          contact: true,
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!invoice) {
        console.log(`Invoice with ID ${id} not found`);
        return res.status(404).json({ message: "Invoice not found" });
      }

      console.log(`Found invoice: ${invoice.id}, returning to client`);
      return res.json(invoice);
    } catch (dbError) {
      console.error("Database error fetching invoice:", dbError);
      
      // Fallback to direct SQL query if ORM query fails
      try {
        console.log("Trying direct SQL query as fallback");
        const result = await db.execute(sql`
          SELECT * FROM invoices WHERE id = ${parseInt(id)}
        `);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Get invoice items
        const itemsResult = await db.execute(sql`
          SELECT * FROM invoice_items WHERE invoice_id = ${parseInt(id)}
        `);
        
        const invoice = {
          ...result.rows[0],
          items: itemsResult.rows
        };
        
        return res.json(invoice);
      } catch (sqlError) {
        console.error("SQL fallback error:", sqlError);
        throw sqlError; // Re-throw to be caught by outer catch
      }
    }
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

// Create a new invoice
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { 
      contact_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      status, 
      notes, 
      terms,
      currency,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      items 
    } = req.body;
    
    // Generate invoice number if not provided
    const finalInvoiceNumber = invoice_number || `INV-${new Date().getFullYear()}-${uuidv4().substring(0, 8)}`;
    
    // Calculate totals if not provided
    let calculatedSubtotal = 0;
    let calculatedTaxAmount = 0;
    let calculatedTotalAmount = 0;
    
    if (items && items.length > 0) {
      calculatedSubtotal = items.reduce((sum: number, item: any) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemDiscount = item.discount || 0;
        return sum + (itemTotal - itemDiscount);
      }, 0);
      
      calculatedTaxAmount = items.reduce((sum: number, item: any) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemDiscount = item.discount || 0;
        const taxableAmount = itemTotal - itemDiscount;
        return sum + (taxableAmount * (item.tax_rate || 0) / 100);
      }, 0);
      
      calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount;
    }
    
    // Insert the invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId: req.user!.id,
        contactId: contact_id,
        invoiceNumber: finalInvoiceNumber,
        issueDate: new Date(issue_date),
        dueDate: new Date(due_date),
        subtotal: subtotal || calculatedSubtotal,
        taxAmount: tax_amount || calculatedTaxAmount,
        discountAmount: discount_amount || 0,
        totalAmount: total_amount || calculatedTotalAmount,
        amountPaid: 0,
        status: status || 'draft',
        notes,
        terms,
        currency: currency || 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert invoice items if provided
    if (items && items.length > 0) {
      await db.insert(invoice_items).values(
        items.map((item: any) => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
          total: (item.quantity * item.unit_price) - (item.discount || 0) + 
                 ((item.quantity * item.unit_price - (item.discount || 0)) * (item.tax_rate || 0) / 100),
        }))
      );
    }

    // Fetch the complete invoice with items
    const completeInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, newInvoice.id),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    
    // Notify connected clients about the new invoice
    if (wsService) {
      // Broadcast to global invoice channel
      wsService.broadcastToResource('invoices', 'all', 'invoice_created', {
        invoice: completeInvoice
      });
    }

    return res.status(201).json(completeInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ message: "Failed to create invoice" });
  }
});

// Update an invoice
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      contact_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      status, 
      notes,
      terms,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      amount_paid,
      currency,
      payment_method,
      items
    } = req.body;
    
    // Get the current invoice to check ownership
    const existingInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });
    
    if (!existingInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (existingInvoice.userId !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to update this invoice" });
    }
    
    // Check if status is changing
    const isStatusChanging = status && status !== existingInvoice.status;
    const previousStatus = existingInvoice.status;
    
    // Update the invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        contact_id: contact_id !== undefined ? contact_id : undefined,
        invoice_number: invoice_number !== undefined ? invoice_number : undefined,
        issue_date: issue_date ? new Date(issue_date) : undefined,
        due_date: due_date ? new Date(due_date) : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
        terms: terms !== undefined ? terms : undefined,
        subtotal: subtotal !== undefined ? subtotal : undefined,
        tax_amount: tax_amount !== undefined ? tax_amount : undefined,
        discount_amount: discount_amount !== undefined ? discount_amount : undefined,
        total_amount: total_amount !== undefined ? total_amount : undefined,
        amount_paid: amount_paid !== undefined ? amount_paid : undefined,
        currency: currency !== undefined ? currency : undefined,
        payment_method: payment_method !== undefined ? payment_method : undefined,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    // Update invoice items if provided
    if (items && items.length > 0) {
      // First delete existing items
      await db.delete(invoice_items).where(eq(invoice_items.invoice_id, parseInt(id)));
      
      // Then insert new items
      await db.insert(invoice_items).values(
        items.map((item: any) => ({
          invoice_id: parseInt(id),
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
          total: (item.quantity * item.unit_price) - (item.discount || 0) + 
                 ((item.quantity * item.unit_price - (item.discount || 0)) * (item.tax_rate || 0) / 100),
        }))
      );
    }
    
    // Fetch the complete updated invoice with items
    const completeInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    // Notify connected clients about the updated invoice
    if (wsService) {
      // Broadcast to specific invoice channel
      wsService.broadcastToResource('invoices', id, 'invoice_updated', {
        invoice: completeInvoice
      });
      
      // Broadcast to global invoice channel
      wsService.broadcastToResource('invoices', 'all', 'invoice_updated', {
        invoiceId: parseInt(id),
        invoice: completeInvoice
      });
      
      // If status changed, send a specific status change notification
      if (isStatusChanging) {
        wsService.broadcastToResource('invoices', id, 'status_changed', {
          invoiceId: parseInt(id),
          previousStatus,
          status,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.json(completeInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({ message: "Failed to update invoice" });
  }
});

// Delete an invoice
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the invoice to check ownership and store for notification
    const existingInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
      },
    });
    
    if (!existingInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (existingInvoice.userId !== req.user!.id) {
      return res.status(403).json({ message: "You don't have permission to delete this invoice" });
    }
    
    // Delete the invoice (cascade will handle invoice items)
    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, parseInt(id)))
      .returning();

    // Notify connected clients about the deleted invoice
    if (wsService) {
      // Broadcast to specific invoice channel
      wsService.broadcastToResource('invoices', id, 'invoice_deleted', {
        invoiceId: parseInt(id),
        invoiceNumber: existingInvoice.invoice_number
      });
      
      // Broadcast to global invoice channel
      wsService.broadcastToResource('invoices', 'all', 'invoice_deleted', {
        invoiceId: parseInt(id),
        invoiceNumber: existingInvoice.invoice_number
      });
    }

    return res.json({ 
      message: "Invoice deleted successfully",
      invoice: deletedInvoice
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({ message: "Failed to delete invoice" });
  }
});

// Get invoice payments
router.get("/:id/payments", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if invoice exists and belongs to user
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to view this invoice's payments" });
    }
    
    // Get all payments for this invoice
    const invoicePayments = await db.query.payments.findMany({
      where: and(
        eq(payments.related_document_type, 'invoice'),
        eq(payments.related_document_id, parseInt(id))
      ),
      orderBy: [desc(payments.payment_date)],
    });
    
    return res.json(invoicePayments);
  } catch (error) {
    console.error("Error fetching invoice payments:", error);
    return res.status(500).json({ message: "Failed to fetch invoice payments" });
  }
});

// Add a payment to an invoice
router.post("/:id/payments", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      payment_method, 
      payment_date = new Date(), 
      reference, 
      description 
    } = req.body;
    
    // Check if invoice exists and belongs to user
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to add payments to this invoice" });
    }
    
    // Create the payment
    const [newPayment] = await db.insert(payments)
      .values({
        user_id: req.user!.id,
        contact_id: invoice.contact_id,
        amount,
        payment_method,
        payment_date: new Date(payment_date),
        reference,
        description,
        related_document_type: 'invoice',
        related_document_id: parseInt(id),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    
    // Update invoice amount_paid and status
    const totalPaid = await db.select({
      total: sql`SUM(${payments.amount})`,
    })
    .from(payments)
    .where(and(
      eq(payments.related_document_type, 'invoice'),
      eq(payments.related_document_id, parseInt(id))
    ));
    
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
      .where(eq(invoices.id, parseInt(id)))
      .returning();
    
    // Fetch the complete updated invoice with items
    const completeInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    
    // Notify connected clients about the payment and invoice update
    if (wsService) {
      // Broadcast payment added
      wsService.broadcastToResource('invoices', id, 'payment_added', {
        invoiceId: parseInt(id),
        payment: newPayment,
        amount: amount,
        newStatus,
        amountPaid,
      });
      
      // Broadcast invoice updated
      wsService.broadcastToResource('invoices', id, 'invoice_updated', {
        invoice: completeInvoice
      });
      
      // Broadcast to global invoice channel
      wsService.broadcastToResource('invoices', 'all', 'payment_added', {
        invoiceId: parseInt(id),
        invoiceNumber: invoice.invoice_number,
        amount: amount,
      });
      
      // If status changed, send a specific status change notification
      if (newStatus !== invoice.status) {
        wsService.broadcastToResource('invoices', id, 'status_changed', {
          invoiceId: parseInt(id),
          previousStatus: invoice.status,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return res.status(201).json({
      payment: newPayment,
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    return res.status(500).json({ message: "Failed to add payment" });
  }
});

// Send invoice by email
router.post("/:id/send", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, subject, message, includeAttachment = true } = req.body;
    
    // Check if invoice exists and belongs to user
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to send this invoice" });
    }
    
    // In a real implementation, you would generate a PDF and send it
    // For now, we'll just simulate sending the email
    
    // Update invoice notes to record that it was sent
    const [updatedInvoice] = await db.update(invoices)
      .set({
        notes: invoice.notes ? 
          `${invoice.notes}\n[${new Date().toISOString()}] Invoice emailed to ${email}` : 
          `[${new Date().toISOString()}] Invoice emailed to ${email}`,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning();
    
    // Notify connected clients about the invoice update
    if (wsService) {
      wsService.broadcastToResource('invoices', id, 'invoice_emailed', {
        invoiceId: parseInt(id),
        to: email,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      message: "Invoice sent successfully",
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return res.status(500).json({ message: "Failed to send invoice" });
  }
});

// Generate a public link for an invoice
router.post("/:id/public-link", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { expiresIn = 30, permissions = { view: true, pay: true, download: true } } = req.body;
    
    // Check if invoice exists and belongs to user
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to generate a link for this invoice" });
    }
    
    // Calculate expiration date (default: 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);
    
    // Check if there's an existing active token
    const [existingToken] = await db.select()
      .from(invoice_tokens)
      .where(
        and(
          eq(invoice_tokens.invoice_id, parseInt(id)),
          eq(invoice_tokens.is_active, true)
        )
      );
    
    let token;
    
    if (existingToken) {
      // Update the existing token
      [token] = await db.update(invoice_tokens)
        .set({
          expires_at: expiresAt,
          permissions: permissions,
          updated_at: new Date(),
        })
        .where(eq(invoice_tokens.id, existingToken.id))
        .returning();
    } else {
      // Create a new token
      [token] = await db.insert(invoice_tokens)
        .values({
          invoice_id: parseInt(id),
          created_by: req.user!.id,
          expires_at: expiresAt,
          permissions: permissions,
        })
        .returning();
    }
    
    const publicLink = `${req.protocol}://${req.get('host')}/public/invoices/${token.token}`;
    
    // Update invoice notes to record that a link was generated
    await db.update(invoices)
      .set({
        notes: invoice.notes ? 
          `${invoice.notes}\n[${new Date().toISOString()}] Public link generated (expires: ${expiresAt.toISOString()})` : 
          `[${new Date().toISOString()}] Public link generated (expires: ${expiresAt.toISOString()})`,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)));
    
    return res.json({
      publicLink,
      token: token.token,
      expiresAt: expiresAt,
      permissions: permissions
    });
  } catch (error) {
    console.error("Error generating public link:", error);
    return res.status(500).json({ message: "Failed to generate public link" });
  }
});

// Process invoice actions
router.post("/:id/actions", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data } = req.body;
    
    // Check if invoice exists and belongs to user
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
      },
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to perform actions on this invoice" });
    }
    
    let result;
    
    switch (action) {
      case 'mark_as_sent':
        // Update invoice status to 'sent'
        result = await db.update(invoices)
          .set({
            status: 'sent',
            updated_at: new Date(),
          })
          .where(eq(invoices.id, parseInt(id)))
          .returning();
        break;
        
      case 'mark_as_paid':
        // Update invoice status to 'paid' and set amount_paid to total_amount
        result = await db.update(invoices)
          .set({
            status: 'paid',
            amount_paid: invoice.total_amount,
            updated_at: new Date(),
          })
          .where(eq(invoices.id, parseInt(id)))
          .returning();
        break;
        
      case 'mark_as_void':
        // Update invoice status to 'void'
        result = await db.update(invoices)
          .set({
            status: 'void',
            updated_at: new Date(),
          })
          .where(eq(invoices.id, parseInt(id)))
          .returning();
        break;
        
      case 'send_reminder':
        // In a real implementation, you would send an email reminder
        // For now, we'll just update the notes
        result = await db.update(invoices)
          .set({
            notes: invoice.notes ? 
              `${invoice.notes}\n[${new Date().toISOString()}] Payment reminder sent to ${invoice.contact?.email || 'customer'}` : 
              `[${new Date().toISOString()}] Payment reminder sent to ${invoice.contact?.email || 'customer'}`,
            updated_at: new Date(),
          })
          .where(eq(invoices.id, parseInt(id)))
          .returning();
        break;
        
      default:
        return res.status(400).json({ message: `Unknown action: ${action}` });
    }
    
    // Fetch the complete updated invoice with items
    const completeInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
      with: {
        contact: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    
    // Notify connected clients about the action and invoice update
    if (wsService) {
      // Broadcast action performed
      wsService.broadcastToResource('invoices', id, 'action_performed', {
        invoiceId: parseInt(id),
        action,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast invoice updated
      wsService.broadcastToResource('invoices', id, 'invoice_updated', {
        invoice: completeInvoice
      });
      
      // If status changed, send a specific status change notification
      if (action === 'mark_as_sent' || action === 'mark_as_paid' || action === 'mark_as_void') {
        wsService.broadcastToResource('invoices', id, 'status_changed', {
          invoiceId: parseInt(id),
          previousStatus: invoice.status,
          status: action === 'mark_as_sent' ? 'sent' : action === 'mark_as_paid' ? 'paid' : 'void',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return res.json({
      message: `Action '${action}' performed successfully`,
      invoice: completeInvoice
    });
  } catch (error) {
    console.error(`Error performing action:`, error);
    return res.status(500).json({ message: "Failed to perform action" });
  }
});

// Get invoice statistics
router.get("/statistics", authenticateUser, async (req, res) => {
  try {
    // Get total invoices
    const totalInvoices = await db.select({
      count: sql`COUNT(*)`,
    })
    .from(invoices)
    .where(eq(invoices.user_id, req.user!.id));
    
    // Get total amount
    const totalAmount = await db.select({
      sum: sql`SUM(${invoices.total_amount})`,
    })
    .from(invoices)
    .where(eq(invoices.user_id, req.user!.id));
    
    // Get total paid
    const totalPaid = await db.select({
      sum: sql`SUM(${invoices.amount_paid})`,
    })
    .from(invoices)
    .where(eq(invoices.user_id, req.user!.id));
    
    // Get overdue invoices
    const overdueInvoices = await db.select({
      count: sql`COUNT(*)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.user_id, req.user!.id),
      sql`${invoices.due_date} < CURRENT_DATE`,
      sql`${invoices.status} != 'paid'`,
      sql`${invoices.status} != 'void'`
    ));
    
    // Get invoices by status
    const invoicesByStatus = await db.select({
      status: invoices.status,
      count: sql`COUNT(*)`,
    })
    .from(invoices)
    .where(eq(invoices.user_id, req.user!.id))
    .groupBy(invoices.status);
    
    return res.json({
      totalInvoices: totalInvoices[0]?.count || 0,
      totalAmount: totalAmount[0]?.sum || 0,
      totalPaid: totalPaid[0]?.sum || 0,
      totalOutstanding: (totalAmount[0]?.sum || 0) - (totalPaid[0]?.sum || 0),
      overdueInvoices: overdueInvoices[0]?.count || 0,
      invoicesByStatus: invoicesByStatus.reduce((acc: Record<string, number>, curr) => {
        acc[curr.status] = Number(curr.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error("Error fetching invoice statistics:", error);
    return res.status(500).json({ message: "Failed to fetch invoice statistics" });
  }
});

export default router;