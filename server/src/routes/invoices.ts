
import { Router } from "express";
import { db } from "../../db";
import { invoices, invoiceItems, payments, invoice_tokens, users, contacts, payment_reminders, payment_history, invoiceActivities } from "@shared/schema";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";
import { WSService } from "../../websocket";
import { v4 as uuidv4 } from 'uuid';
import { emailService } from "../services/email";
import { storage } from "../../storage";
import crypto from 'crypto';
import { aiInvoiceAssistant } from "../services/ai-invoice-assistant";
import { invoicePDFService } from "../services/pdf";
import { paymentService } from "../services/payment";

// Get the WebSocket service instance.
let wsService: WSService;
export const setWSService = (ws: WSService) => {
  wsService = ws;
};

const router = Router();

// Middleware to ensure user is authenticated
const isAuthenticated = authenticateUser;

// Get all invoices
router.get("/", authenticateUser, async (req, res) => {
  try {
    // Check if we have a real database connection
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes('dummy') || dbUrl.includes('localhost')) {
      // Return mock data for development
      return res.json([
        {
          id: 1,
          userId: 1,
          contactId: 1,
          invoiceNumber: "INV-001",
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: 1000,
          taxAmount: 100,
          discountAmount: 0,
          totalAmount: 1100,
          amountPaid: 0,
          status: "draft",
          notes: "Sample invoice for development",
          terms: "Payment due within 30 days",
          currency: "USD",
          payment_terms: "Net 30",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contact: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            company: "Example Corp"
          }
        }
      ]);
    }

    // For production with real database, use safe column selection
    try {
      // Try the new approach with all columns first
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
    } catch (columnError) {
      // If that fails due to missing columns, use basic selection
      console.log('Using fallback query due to missing columns');
      
      const result = await db.execute(sql`
        SELECT 
          i.id,
          i.user_id,
          i.contact_id,
          i.invoice_number,
          i.issue_date,
          i.due_date,
          i.subtotal,
          i.tax_amount,
          i.discount_amount,
          i.total_amount,
          i.amount_paid,
          i.status,
          i.notes,
          i.terms,
          i.currency,
          i.created_at,
          i.updated_at,
          'Net 30' as payment_terms,
          c.id as c_id,
          c.first_name as contact_first_name,
          c.last_name as contact_last_name,
          c.email as contact_email,
          c.company as contact_company
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        ORDER BY i.created_at DESC
      `);

      const invoicesWithContacts = result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        contactId: row.contact_id,
        invoiceNumber: row.invoice_number,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        subtotal: row.subtotal,
        taxAmount: row.tax_amount,
        discountAmount: row.discount_amount,
        totalAmount: row.total_amount,
        amountPaid: row.amount_paid,
        status: row.status,
        notes: row.notes,
        terms: row.terms,
        currency: row.currency,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        payment_terms: row.payment_terms,
        contact: row.c_id ? {
          id: row.c_id,
          firstName: row.contact_first_name,
          lastName: row.contact_last_name,
          email: row.contact_email,
          company: row.contact_company,
        } : null,
      }));

      return res.json(invoicesWithContacts);
    }
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// Debug route: Check current user info (development only)
router.get("/debug/user-info", authenticateUser, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    return res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName
      }
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res.status(500).json({ message: "Failed to fetch user info" });
  }
});

// Debug route: Make current user admin (development only)
router.post("/debug/make-admin", authenticateUser, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    // Update current user to admin
    const [updatedUser] = await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, req.user!.id))
      .returning();

    return res.json({
      message: "User role updated to admin",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ message: "Failed to update user role" });
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
      const invoice = await db.select({
        id: invoices.id,
        userId: invoices.userId,
        contactId: invoices.contactId,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        notes: invoices.notes,
        terms: invoices.terms,
        currency: invoices.currency,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      }).from(invoices).where(eq(invoices.id, parseInt(id))).limit(1);

      if (invoice.length === 0) {
        console.log(`Invoice with ID ${id} not found`);
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoiceData = invoice[0];

      // Get contact information
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, invoiceData.contactId),
      });

      // Get invoice items
      const items = await db.query.invoiceItems.findMany({
        where: eq(invoiceItems.invoiceId, parseInt(id)),
        with: {
          product: true,
        },
      });

      // Ensure all required fields have proper values
      const enhancedInvoice = {
        ...invoiceData,
        invoiceNumber: invoiceData.invoiceNumber || 'N/A',
        issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
        status: invoiceData.status || 'draft',
        paymentTerms: 'Due on receipt', // Default value since column doesn't exist
        contact: contact || {
          firstName: 'N/A',
          lastName: 'N/A',
          email: 'N/A',
          phone: 'N/A'
        },
        items: items || []
      };

      console.log(`Found invoice: ${invoiceData.id}, returning to client`);
      return res.json(enhancedInvoice);
    } catch (dbError) {
      console.error("Database error fetching invoice:", dbError);

      // Fallback to direct SQL query if ORM query fails
      try {
        console.log("Trying direct SQL query as fallback");
        const result = await db.execute(sql`
          SELECT 
            id, user_id, contact_id, invoice_number, issue_date, due_date,
            subtotal, tax_amount, discount_amount, total_amount, amount_paid,
            status, notes, terms, currency, created_at, updated_at
          FROM invoices WHERE id = ${parseInt(id)}
        `);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        // Get invoice items
        const itemsResult = await db.execute(sql`
          SELECT * FROM invoice_items WHERE invoice_id = ${parseInt(id)}
        `);

        // Get contact information
        const contactResult = await db.execute(sql`
          SELECT * FROM contacts WHERE id = ${result.rows[0].contact_id}
        `);

        const invoice = {
          ...result.rows[0],
          invoiceNumber: result.rows[0].invoice_number || 'N/A',
          issueDate: result.rows[0].issue_date || new Date().toISOString().split('T')[0],
          dueDate: result.rows[0].due_date || new Date().toISOString().split('T')[0],
          status: result.rows[0].status || 'draft',
          paymentTerms: result.rows[0].payment_terms || 'Due on receipt',
          contact: contactResult.rows[0] || {
            firstName: 'N/A',
            lastName: 'N/A',
            email: 'N/A',
            phone: 'N/A'
          },
          items: itemsResult.rows || []
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

    // Helper to generate a unique invoice number
    function generateInvoiceNumber() {
      const prefix = "INV";
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return `${prefix}-${year}-${randomNum}`;
    }

    // Try to insert invoice, retry once if duplicate invoice number
    let finalInvoiceNumber = invoice_number || generateInvoiceNumber();
    let newInvoice;
    let triedOnce = false;
    while (true) {
      try {
        // Insert the invoice using only basic columns that exist in database
        [newInvoice] = await db
          .insert(invoices)
          .values({
            userId: req.user!.id,
            contactId: contact_id,
            invoiceNumber: finalInvoiceNumber,
            issueDate: new Date(issue_date),
            dueDate: new Date(due_date),
            subtotal: subtotal,
            taxAmount: tax_amount,
            discountAmount: discount_amount || 0,
            totalAmount: total_amount,
            amountPaid: 0,
            status: status || 'draft',
            notes,
            terms,
            currency: currency || 'USD',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        break; // Success
      } catch (error) {
        // Check for duplicate invoice number error
        if (
          !triedOnce &&
          error &&
          error.code === '23505' &&
          error.detail &&
          error.detail.includes('invoice_number')
        ) {
          // Generate a new invoice number and retry once
          finalInvoiceNumber = generateInvoiceNumber();
          triedOnce = true;
          continue;
        } else {
          // Other errors or already retried
          console.error("Error creating invoice:", error);
          if (error && error.code === '23505' && error.detail && error.detail.includes('invoice_number')) {
            return res.status(400).json({ message: "Invoice number already exists. Please try again." });
          }
          return res.status(500).json({ message: "Failed to create invoice" });
        }
      }
    }

    // Insert invoice items if provided
    if (items && items.length > 0) {
      await db.insert(invoiceItems).values(
        items.map((item) => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
          total:
            item.quantity * item.unit_price - (item.discount || 0) +
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
      await db.delete(invoiceItems).where(eq(invoiceItems.invoice_id, parseInt(id)));

      // Then insert new items
      await db.insert(invoiceItems).values(
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



// Get invoice payments
router.get("/:id/payments", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invoice exists and belongs to user using safe SQL
    const invoiceResult = await db.execute(sql`
      SELECT id, user_id FROM invoices WHERE id = ${parseInt(id)}
    `);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];
    if (invoice.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to view this invoice's payments" });
    }

    // Get all payments for this invoice
    const invoicePayments = await db.execute(sql`
      SELECT 
        p.id,
        p.user_id,
        p.contact_id,
        p.amount,
        p.payment_method,
        p.payment_date,
        p.reference,
        p.description,
        p.related_document_type,
        p.related_document_id,
        p.created_at,
        p.updated_at
      FROM payments p
      WHERE p.related_document_type = 'invoice' AND p.related_document_id = ${parseInt(id)}
      ORDER BY p.payment_date DESC
    `);

    const paymentsWithContacts = invoicePayments.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      contactId: row.contact_id,
      amount: row.amount,
      paymentMethod: row.payment_method,
      paymentDate: row.payment_date,
      reference: row.reference,
      description: row.description,
      relatedDocumentType: row.related_document_type,
      relatedDocumentId: row.related_document_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json(paymentsWithContacts);
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

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
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
        relatedDocumentType: 'invoice',
        relatedDocumentId: parseInt(id),
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
      eq(payments.relatedDocumentType, 'invoice'),
      eq(payments.relatedDocumentId, parseInt(id))
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

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
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

    // Debug information
    console.log('Permission check debug:', {
      invoiceUserId: invoice.userId,
      currentUserId: req.user!.id,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      isOwner: invoice.userId === req.user!.id,
      isAdmin: req.user!.role === 'admin'
    });

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        message: "You don't have permission to generate a link for this invoice",
        debug: {
          invoiceUserId: invoice.userId,
          currentUserId: req.user!.id,
          userRole: req.user!.role,
          userEmail: req.user!.email
        }
      });
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

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
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
    .where(eq(invoices.userId, req.user!.id));

    // Get total amount
    const totalAmount = await db.select({
      sum: sql`SUM(${invoices.total_amount})`,
    })
    .from(invoices)
    .where(eq(invoices.userId, req.user!.id));

    // Get total paid
    const totalPaid = await db.select({
      sum: sql`SUM(${invoices.amount_paid})`,
    })
    .from(invoices)
    .where(eq(invoices.userId, req.user!.id));

    // Get overdue invoices
    const overdueInvoices = await db.select({
      count: sql`COUNT(*)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.userId, req.user!.id),
      sql`${invoices.dueDate} < CURRENT_DATE`,
      sql`${invoices.status} != 'paid'`,
      sql`${invoices.status} != 'void'`
    ));

    // Get invoices by status
    const invoicesByStatus = await db.select({
      status: invoices.status,
      count: sql`COUNT(*)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, req.user!.id))
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



// Debug route: Get payment link for testing (development only)
router.get("/:id/debug/payment-link", authenticateUser, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if invoice exists and belongs to user
    const invoice = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, parseInt(id)), eq(invoices.userId, userId)))
      .limit(1);

    if (invoice.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Generate token directly
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const permissions = { view: true, pay: true, download: true };

    // Insert token into database
    const [token] = await db.insert(invoice_tokens).values({
      token: tokenValue,
      invoiceId: parseInt(id),
      expiresAt: expiresAt,
      permissions: JSON.stringify(permissions),
      createdAt: new Date(),
    }).returning();

    const publicLink = `${req.protocol}://${req.get('host')}/public/invoices/${token.token}`;

    // Update invoice notes
    await db.update(invoices)
      .set({
        notes: invoice[0].notes ?
          `${invoice[0].notes}\n[${new Date().toISOString()}] Debug payment link generated (expires: ${expiresAt.toISOString()})` :
          `[${new Date().toISOString()}] Debug payment link generated (expires: ${expiresAt.toISOString()})`,
        updated_at: new Date(),
      })
      .where(eq(invoices.id, parseInt(id)));

    return res.json({
      message: "🔗 Payment link generated for testing",
      paymentLink: publicLink,
      token: token.token,
      expiresAt: expiresAt,
      instructions: [
        "1. Copy the payment link below",
        "2. Open it in a new browser tab/window",
        "3. Test the payment flow as a client",
        "4. No email required!"
      ],
      permissions
    });
  } catch (error) {
    console.error("Error generating debug payment link:", error);
    return res.status(500).json({ message: "Failed to generate debug link" });
  }
});


router.post("/:id/ai/generate-description", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ message: "Notes are required for description generation" });
    }

    // Check invoice ownership
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to access this invoice" });
    }

    const description = await aiInvoiceAssistant.generateInvoiceDescription(notes);

    return res.json({ description });
  } catch (error) {
    console.error("Error generating invoice description:", error);
    return res.status(500).json({ message: "Failed to generate invoice description" });
  }
});

router.post("/:id/ai/suggest-pricing", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, currentPrice } = req.body;

    if (!productName || currentPrice === undefined) {
      return res.status(400).json({ message: "Product name and current price are required" });
    }

    // Check invoice ownership
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to access this invoice" });
    }

    const suggestion = await aiInvoiceAssistant.suggestPricing(productName, currentPrice);

    return res.json({ suggestion });
  } catch (error) {
    console.error("Error suggesting pricing:", error);
    return res.status(500).json({ message: "Failed to suggest pricing" });
  }
});

router.post("/:id/ai/predict-payment-delay", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, paymentHistorySummary } = req.body;

    if (!clientName || !paymentHistorySummary) {
      return res.status(400).json({ message: "Client name and payment history summary are required" });
    }

    // Check invoice ownership
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to access this invoice" });
    }

    const prediction = await aiInvoiceAssistant.predictPaymentDelay(clientName, paymentHistorySummary);

    return res.json({ prediction });
  } catch (error) {
    console.error("Error predicting payment delay:", error);
    return res.status(500).json({ message: "Failed to predict payment delay" });
  }
});

router.post("/:id/ai/categorize-expenses", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseList } = req.body;

    if (!expenseList) {
      return res.status(400).json({ message: "Expense list is required" });
    }

    // Check invoice ownership
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parseInt(id)),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "You don't have permission to access this invoice" });
    }

    const categories = await aiInvoiceAssistant.categorizeExpenses(expenseList);

    return res.json({ categories });
  } catch (error) {
    console.error("Error categorizing expenses:", error);
    return res.status(500).json({ message: "Failed to categorize expenses" });
  }
});

// Add new route handlers for enhanced functionality
  
  // Get invoice activities/history
  router.get('/:id/activities', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const activities = await storage.getInvoiceActivitiesByInvoice(invoiceId);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching invoice activities:', error);
      res.status(500).json({ message: 'Failed to fetch invoice activities' });
    }
  });
  
  // Generate and download invoice PDF
  router.get('/:id/pdf', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      // For public access, we need to verify token
      const { token } = req.query;
      let invoice;
      
      if (token) {
        // Public access via token
        const paymentLink = await storage.getPaymentLinkByToken(token as string);
        if (!paymentLink || paymentLink.invoiceId !== invoiceId) {
          return res.status(404).json({ message: 'Invalid access token' });
        }
        invoice = await storage.getInvoice(invoiceId);
      } else {
        // Authenticated access
        if (!req.user) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        invoice = await storage.getInvoice(invoiceId);
        if (!invoice || invoice.userId !== req.user.id) {
          return res.status(404).json({ message: 'Invoice not found' });
        }
      }
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Generate PDF
      const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoiceId);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Log PDF generation activity (if authenticated)
      if (req.user) {
        await storage.createInvoiceActivity({
          invoiceId,
          userId: req.user.id,
          activity_type: 'pdf_generated',
          description: `PDF generated for invoice ${invoice.invoiceNumber}`,
          metadata: { downloadedAt: new Date().toISOString() },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        });
      }
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  });
  
  // Send invoice via email
  router.post('/:id/send', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { templateId, customMessage, ccEmails, includePDF = true } = req.body;
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Send email
      const sent = await emailService.sendInvoiceEmail(invoiceId, {
        templateId,
        customMessage,
        ccEmails,
        includePDF,
      });
      
      if (sent) {
        // Broadcast email sent via WebSocket
        if (wsService) {
          wsService.broadcastToResource('invoices', invoiceId, 'invoice_sent', {
            invoiceId,
            sentAt: new Date().toISOString(),
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Invoice sent successfully',
          sentAt: new Date().toISOString(),
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send invoice' 
        });
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      res.status(500).json({ message: 'Failed to send invoice' });
    }
  });
  
  // Create payment intent for invoice
  router.post('/:id/payment-intent', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { custom_amount, payment_method_types, setup_future_usage } = req.body;
      
      const result = await paymentService.createInvoicePaymentIntent(invoiceId, {
        custom_amount,
        payment_method_types,
        setup_future_usage,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to create payment intent' });
    }
  });
  
  // Create payment link for invoice
  router.post('/:id/payment-link', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { expires_in_hours = 168, max_uses, custom_message } = req.body; // Default 1 week
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Generate unique token
      const token = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expires_in_hours);
      
      const paymentLink = await storage.createPaymentLink({
        invoiceId,
        link_token: token,
        expires_at: expiresAt.toISOString(),
        max_uses,
        custom_message,
        is_active: true,
      });
      
      const paymentLinkUrl = `${process.env.APP_URL || 'http://localhost:5000'}/invoice/${token}/pay`;
      
      res.json({
        success: true,
        paymentLink: {
          ...paymentLink,
          url: paymentLinkUrl,
        },
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      res.status(500).json({ message: 'Failed to create payment link' });
    }
  });
  
  // Mark invoice as recurring
  router.post('/:id/recurring', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { frequency, start_date, end_date, count } = req.body;
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        is_recurring: true,
        recurring_frequency: frequency,
        recurring_start_date: start_date,
        recurring_end_date: end_date,
        recurring_count: count,
        recurring_remaining: count,
        next_invoice_date: start_date,
        updatedAt: new Date().toISOString(),
      });
      
      // Log activity
      await storage.createInvoiceActivity({
        invoiceId,
        userId: req.user!.id,
        activity_type: 'made_recurring',
        description: `Invoice ${invoice.invoiceNumber} set as recurring (${frequency})`,
        metadata: { frequency, start_date, end_date, count },
      });
      
      res.json({ 
        success: true, 
        invoice: updatedInvoice,
        message: 'Invoice marked as recurring',
      });
    } catch (error) {
      console.error('Error setting invoice as recurring:', error);
      res.status(500).json({ message: 'Failed to set invoice as recurring' });
    }
  });
  
  // Generate next recurring invoice
  router.post('/:id/generate-next', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      if (!invoice.is_recurring) {
        return res.status(400).json({ message: 'Invoice is not set as recurring' });
      }
      
      const newInvoice = await storage.createRecurringInvoice(invoiceId);
      
      // Log activity
      await storage.createInvoiceActivity({
        invoiceId,
        userId: req.user!.id,
        activity_type: 'recurring_generated',
        description: `Next recurring invoice ${newInvoice.invoiceNumber} generated`,
        metadata: { newInvoiceId: newInvoice.id, newInvoiceNumber: newInvoice.invoiceNumber },
      });
      
      res.json({ 
        success: true, 
        invoice: newInvoice,
        message: 'Next recurring invoice generated',
      });
    } catch (error) {
      console.error('Error generating next recurring invoice:', error);
      res.status(500).json({ message: 'Failed to generate next recurring invoice' });
    }
  });
  
  // Get overdue invoices
  router.get('/overdue', isAuthenticated, async (req, res) => {
    try {
      const overdueInvoices = await storage.getOverdueInvoices(req.user!.id);
      res.json(overdueInvoices);
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      res.status(500).json({ message: 'Failed to fetch overdue invoices' });
    }
  });
  
  // Get recurring invoices
  router.get('/recurring', isAuthenticated, async (req, res) => {
    try {
      const recurringInvoices = await storage.getRecurringInvoices(req.user!.id);
      res.json(recurringInvoices);
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
      res.status(500).json({ message: 'Failed to fetch recurring invoices' });
    }
  });
  
  // Send payment reminder
  router.post('/:id/reminder', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { type = 'gentle' } = req.body; // gentle, firm, final
      
      // Verify invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const sent = await emailService.sendPaymentReminder(invoiceId, type);
      
      if (sent) {
        res.json({ 
          success: true, 
          message: `${type} reminder sent successfully`,
          sentAt: new Date().toISOString(),
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send reminder' 
        });
      }
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      res.status(500).json({ message: 'Failed to send payment reminder' });
    }
  });
  
  // Clone/duplicate invoice
  router.post('/:id/clone', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Verify invoice belongs to user
      const originalInvoice = await storage.getInvoiceWithItems(invoiceId);
      if (!originalInvoice || originalInvoice.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Generate new invoice number
      const newInvoiceNumber = await storage.generateInvoiceNumber(req.user!.id);
      
      // Create cloned invoice
      const clonedInvoiceData = {
        userId: originalInvoice.userId,
        contactId: originalInvoice.contactId,
        invoiceNumber: newInvoiceNumber,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days from now
        subtotal: originalInvoice.subtotal,
        taxAmount: originalInvoice.taxAmount,
        discountAmount: originalInvoice.discountAmount,
        totalAmount: originalInvoice.totalAmount,
        status: 'draft',
        payment_status: 'Unpaid',
        notes: originalInvoice.notes,
        terms: originalInvoice.terms,
        currency: originalInvoice.currency,
        payment_terms: originalInvoice.payment_terms,
        tax_type: originalInvoice.tax_type,
        tax_inclusive: originalInvoice.tax_inclusive,
      };
      
      const clonedInvoice = await storage.createInvoice(clonedInvoiceData);
      
      // Clone invoice items
      if (originalInvoice.items && originalInvoice.items.length > 0) {
        for (const item of originalInvoice.items) {
          await storage.createInvoiceItem({
            invoiceId: clonedInvoice.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            discountRate: item.discountRate,
            discountAmount: item.discountAmount,
            subtotal: item.subtotal,
            totalAmount: item.totalAmount,
          });
        }
      }
      
      // Log activity
      await storage.createInvoiceActivity({
        invoiceId: clonedInvoice.id,
        userId: req.user!.id,
        activity_type: 'created',
        description: `Invoice ${clonedInvoice.invoiceNumber} cloned from ${originalInvoice.invoiceNumber}`,
        metadata: { originalInvoiceId: invoiceId, originalInvoiceNumber: originalInvoice.invoiceNumber },
      });
      
      res.json({ 
        success: true, 
        invoice: clonedInvoice,
        message: 'Invoice cloned successfully',
      });
    } catch (error) {
      console.error('Error cloning invoice:', error);
      res.status(500).json({ message: 'Failed to clone invoice' });
    }
  });
  
  // Invoice statistics
  router.get('/stats', isAuthenticated, async (req, res) => {
    try {
      const { from, to } = req.query;
      const invoices = await storage.getInvoicesByUser(req.user!.id);
      
      // Filter by date range if provided
      let filteredInvoices = invoices;
      if (from || to) {
        filteredInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.issueDate);
          if (from && invoiceDate < new Date(from as string)) return false;
          if (to && invoiceDate > new Date(to as string)) return false;
          return true;
        });
      }
      
      // Calculate statistics
      const stats = {
        total_invoices: filteredInvoices.length,
        total_amount: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        paid_amount: filteredInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
        pending_amount: filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount - (inv.amountPaid || 0)), 0),
        overdue_count: filteredInvoices.filter(inv => 
          new Date(inv.dueDate) < new Date() && inv.payment_status !== 'Paid'
        ).length,
        draft_count: filteredInvoices.filter(inv => inv.status === 'draft').length,
        sent_count: filteredInvoices.filter(inv => inv.status === 'sent').length,
        paid_count: filteredInvoices.filter(inv => inv.payment_status === 'Paid').length,
        average_amount: filteredInvoices.length > 0 
          ? filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / filteredInvoices.length 
          : 0,
        currency_breakdown: filteredInvoices.reduce((breakdown, inv) => {
          breakdown[inv.currency] = (breakdown[inv.currency] || 0) + inv.totalAmount;
          return breakdown;
        }, {} as Record<string, number>),
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching invoice statistics:', error);
      res.status(500).json({ message: 'Failed to fetch invoice statistics' });
    }
  });

  // Delete invoice
  router.delete("/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const invoiceId = parseInt(id);

      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }

      // Check if invoice exists and belongs to user
      const invoiceResult = await db.execute(sql`
        SELECT id, user_id, invoice_number, total_amount FROM invoices WHERE id = ${invoiceId}
      `);

      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoice = invoiceResult.rows[0];
      if (invoice.user_id !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete this invoice" });
      }

      // Delete related records first (cascade delete)
      await db.execute(sql`DELETE FROM invoice_items WHERE invoice_id = ${invoiceId}`);
      await db.execute(sql`DELETE FROM payments WHERE related_document_type = 'invoice' AND related_document_id = ${invoiceId}`);
      await db.execute(sql`DELETE FROM payment_reminders WHERE invoice_id = ${invoiceId}`);
      await db.execute(sql`DELETE FROM payment_history WHERE invoice_id = ${invoiceId}`);

      // Delete the invoice
      await db.execute(sql`DELETE FROM invoices WHERE id = ${invoiceId}`);

      // Log the deletion activity
      console.log(`Invoice ${invoice.invoice_number} (ID: ${invoiceId}) deleted by user ${req.user!.id}`);

      // Notify other modules about the deletion via WebSocket
      if (wsService) {
        // Notify finance module
        wsService.broadcastToResource('finance', 'invoices', {
          type: 'invoice_deleted',
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            totalAmount: invoice.total_amount,
            userId: req.user!.id
          }
        });

        // Notify sales module
        wsService.broadcastToResource('sales', 'orders', {
          type: 'invoice_deleted',
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            totalAmount: invoice.total_amount,
            userId: req.user!.id
          }
        });

        // Notify dashboard
        wsService.broadcastToResource('dashboard', 'all', {
          type: 'invoice_deleted',
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            totalAmount: invoice.total_amount,
            userId: req.user!.id
          }
        });
      }

      res.json({
        success: true, 
        message: `Invoice ${invoice.invoice_number} has been deleted successfully`,
        deletedInvoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          totalAmount: invoice.total_amount
        }
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

export default router;
