
import { Router } from "express";
import { db } from "../../db";
import { invoices, invoiceItems, payments, invoice_tokens, users, contacts, payment_reminders, payment_history, invoiceActivities, companies } from "@shared/schema";
import { CurrencyCode } from "@shared/types";
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
import { sendInvoiceEmail } from '../../storage';

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
    // Always query real database in all environments

    // For production with real database, use enhanced query with complete customer data
    console.log('🔍 Fetching invoices with customer details...');
    
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
        c.phone as contact_phone,
        c.company as contact_company,
        c.address as contact_address,
        c.city as contact_city,
        c.state as contact_state,
        c.postal_code as contact_postal_code,
        c.country as contact_country
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.user_id = ${req.user!.id}
      ORDER BY i.created_at DESC
    `);

    const invoicesWithContacts = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      contactId: row.contact_id,
      invoiceNumber: row.invoice_number,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      subtotal: row.subtotal || 0,
      taxAmount: row.tax_amount || 0,
      discountAmount: row.discount_amount || 0,
      totalAmount: row.total_amount || 0,
      amountPaid: row.amount_paid || 0,
      status: row.status || 'draft',
      notes: row.notes,
      terms: row.terms,
      currency: row.currency || 'USD',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      payment_terms: row.payment_terms,
      contact: row.c_id ? {
        id: row.c_id,
        firstName: row.contact_first_name,
        lastName: row.contact_last_name,
        email: row.contact_email,
        phone: row.contact_phone,
        company: row.contact_company,
        address: row.contact_address,
        city: row.contact_city,
        state: row.contact_state,
        postalCode: row.contact_postal_code,
        country: row.contact_country,
      } : null,
    }));

    console.log(`✅ Found ${invoicesWithContacts.length} invoices with customer details`);
    return res.json(invoicesWithContacts);
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
      // Use the enhanced query with proper customer details
      const invoiceResult = await db.execute(sql`
        SELECT 
          i.id, i.user_id as "userId", i.contact_id as "contactId", 
          i.invoice_number as "invoiceNumber", i.issue_date as "issueDate", 
          i.due_date as "dueDate", i.subtotal, i.tax_amount as "taxAmount", 
          i.discount_amount as "discountAmount", i.total_amount as "totalAmount", 
          i.amount_paid as "amountPaid", i.status, i.notes, i.terms, i.currency,
          i.created_at as "createdAt", i.updated_at as "updatedAt",
          c.id as contact_id, c.first_name as contact_first_name, 
          c.last_name as contact_last_name, c.email as contact_email,
          c.phone as contact_phone, c.company as contact_company,
          c.address as contact_address, c.city as contact_city,
          c.state as contact_state, c.postal_code as contact_postal_code,
          c.country as contact_country
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        WHERE i.id = ${parseInt(id)}
      `);

      if (invoiceResult.rows.length === 0) {
        console.log(`Invoice with ID ${id} not found`);
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoiceRow = invoiceResult.rows[0];

      // Get invoice items
      const itemsResult = await db.execute(sql`
        SELECT 
          ii.id, ii.product_id as "productId", ii.description, 
          ii.quantity, ii.unit_price as "unitPrice", ii.total_amount as "totalAmount",
          ii.tax_rate as "taxRate", ii.discount_rate as "discountRate",
          p.name as product_name, p.sku as product_sku
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = ${parseInt(id)}
      `);

      // Build enhanced invoice object with complete customer data
      const enhancedInvoice = {
        id: invoiceRow.id,
        userId: invoiceRow.userId,
        contactId: invoiceRow.contactId,
        invoiceNumber: invoiceRow.invoiceNumber || 'N/A',
        issueDate: invoiceRow.issueDate || new Date().toISOString().split('T')[0],
        dueDate: invoiceRow.dueDate || new Date().toISOString().split('T')[0],
        subtotal: invoiceRow.subtotal || 0,
        taxAmount: invoiceRow.taxAmount || 0,
        discountAmount: invoiceRow.discountAmount || 0,
        totalAmount: invoiceRow.totalAmount || 0,
        amountPaid: invoiceRow.amountPaid || 0,
        status: invoiceRow.status || 'draft',
        notes: invoiceRow.notes,
        terms: invoiceRow.terms,
        currency: invoiceRow.currency || 'USD',
        createdAt: invoiceRow.createdAt,
        updatedAt: invoiceRow.updatedAt,
        paymentTerms: 'Due on receipt', // Default value
        contact: invoiceRow.contact_id ? {
          id: invoiceRow.contact_id,
          firstName: invoiceRow.contact_first_name,
          lastName: invoiceRow.contact_last_name,
          email: invoiceRow.contact_email,
          phone: invoiceRow.contact_phone,
          company: invoiceRow.contact_company,
          address: invoiceRow.contact_address,
          city: invoiceRow.contact_city,
          state: invoiceRow.contact_state,
          postalCode: invoiceRow.contact_postal_code,
          country: invoiceRow.contact_country,
        } : null,
        items: itemsResult.rows.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
          taxRate: item.taxRate || 0,
          discountRate: item.discountRate || 0,
          product: item.product_name ? {
            name: item.product_name,
            sku: item.product_sku,
          } : null,
        }))
      };

      console.log(`✅ Found invoice: ${enhancedInvoice.id} with customer: ${enhancedInvoice.contact?.firstName} ${enhancedInvoice.contact?.lastName}`);
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
    let {
      contactId,
      invoiceDate,
      dueDate,
      status,
      notes,
      terms,  
      currency,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      items,
      seriesPrefix,
      hsnSeries
    } = req.body;

    // Debug: Log the received seriesPrefix
    console.log('Received seriesPrefix:', seriesPrefix);
    console.log('Received hsnSeries:', hsnSeries);

    // Validate contactId
    if (!contactId || contactId <= 0 || contactId === null) {
      return res.status(400).json({ 
        message: "Valid customer selection is required",
        field: "contactId" 
      });
    }

    // Verify the contact exists and belongs to the user
    const contactExists = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.userId, req.user!.id)
      ),
    });

    if (!contactExists) {
      return res.status(400).json({ 
        message: "Selected customer not found or access denied",
        field: "contactId" 
      });
    }

    // Verify the contact has an email address
    if (!contactExists.email) {
      return res.status(400).json({ 
        message: "Selected customer must have a valid email address",
        field: "contactId" 
      });
    }

    // Helper to generate a unique invoice number
    function generateInvoiceNumber() {
      const prefix = "INV";
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return `${prefix}-${year}-${randomNum}`;
    }

    // Helper function to safely parse dates
    function parseDate(dateValue: any): Date {
      if (!dateValue) return new Date();
      
      // If it's already a Date object, return it
      if (dateValue instanceof Date) return dateValue;
      
      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        // Remove any invalid characters and normalize the date string
        const cleanDate = dateValue.trim();
        if (cleanDate === '' || cleanDate === 'Invalid Date') {
          return new Date();
        }
        
        const parsed = new Date(cleanDate);
        if (isNaN(parsed.getTime())) {
          // If parsing fails, return current date
          console.warn(`Invalid date value: ${dateValue}, using current date instead`);
          return new Date();
        }
        return parsed;
      }
      
      // Default to current date for any other type
      return new Date();
    }

    // Generate invoice number using storage function, honoring optional series prefix
    let finalInvoiceNumber = await storage.generateInvoiceNumber(req.user!.id, seriesPrefix);
    let newInvoice;
    let triedOnce = false;
    
    // Ensure we have at least one contact for this user
    const existingContacts = await db.query.contacts.findMany({
      where: eq(contacts.userId, req.user!.id),
    });
    
    if (existingContacts.length === 0) {
      return res.status(400).json({ message: "No customers found. Please add a customer before creating an invoice." });
      
      console.log('Created default contact:', defaultContact);
      // Use the default contact if no specific contact was selected
      if (!contactId || contactId <= 0) {
        contactId = defaultContact.id;
      }
    }
    
    // Parse and validate dates
    const parsedIssueDate = parseDate(invoiceDate);
    const parsedDueDate = parseDate(dueDate);
    
    // Calculate total amount if not provided or invalid
    const calculatedSubtotal = subtotal || 0;
    const calculatedTaxAmount = taxAmount || 0;
    const calculatedDiscountAmount = discountAmount || 0;
    const calculatedTotalAmount = totalAmount || (calculatedSubtotal + calculatedTaxAmount - calculatedDiscountAmount);
    
    console.log('Creating invoice with dates:', {
      original_invoiceDate: invoiceDate,
      original_dueDate: dueDate,
      parsed_issue_date: parsedIssueDate,
      parsed_due_date: parsedDueDate
    });
    
    console.log('Invoice amounts:', {
      subtotal: calculatedSubtotal,
      tax_amount: calculatedTaxAmount,
      discount_amount: calculatedDiscountAmount,
      total_amount: calculatedTotalAmount
    });
    
    while (true) {
      try {
        // Insert the invoice using only basic columns that exist in database
        [newInvoice] = await db
          .insert(invoices) 
          .values({
            userId: req.user!.id,
            contactId: contactId,
            invoiceNumber: finalInvoiceNumber, 
            issueDate: parsedIssueDate,
            dueDate: parsedDueDate,
            subtotal: calculatedSubtotal,
            taxAmount: calculatedTaxAmount,
            discountAmount: calculatedDiscountAmount,
            totalAmount: calculatedTotalAmount,
            amountPaid: 0,
            status: status || 'draft',
            notes: hsnSeries ? `${notes ? notes + "\n" : ""}HSN: ${hsnSeries}` : notes,
            terms,
            currency: (currency as CurrencyCode) || 'USD',
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
          finalInvoiceNumber = await storage.generateInvoiceNumber(req.user!.id, seriesPrefix);
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
      console.log('Inserting invoice items for invoice ID:', newInvoice.id);
      console.log('Items data:', items);
      await db.insert(invoiceItems).values(
        items.map((item) => {
          const quantity = parseFloat(item.quantity) || 0;
          const unitPrice = parseFloat(item.unit_price) || 0;
          const discount = parseFloat(item.discount) || 0;
          const taxRate = parseFloat(item.tax_rate) || 0;
          const subtotal = quantity * unitPrice;
          const totalAmount = subtotal - discount + (subtotal - discount) * (taxRate / 100);
          
          console.log('Processing item:', {
            quantity,
            unitPrice,
            discount,
            taxRate,
            subtotal,
            totalAmount
          });
          
          return {
            invoiceId: newInvoice.id,
            productId: item.product_id,
            description: item.description,
            quantity: quantity,
            unitPrice: unitPrice,
            discountRate: discount,
            taxRate: taxRate,
            subtotal: subtotal,
            totalAmount: totalAmount,
          };
        })
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
      contactId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      status,
      notes,
      terms,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid,
      currency,
      paymentMethod,
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
      where: (invoices, { eq }) => eq(invoices.id, parseInt(id)),
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

// Fix invoice contact (for existing invoices without contacts)
router.post("/:id/fix-contact", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);
    const userId = req.user!.id;

    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to modify this invoice" });
    }

    // If invoice already has a contact, return success
    if (invoice.contactId) {
      return res.json({ message: "Invoice already has a contact", contactId: invoice.contactId });
    }

    // Get or create a contact for this user
    let contact = await db.query.contacts.findFirst({
      where: eq(contacts.userId, userId),
    });

    if (!contact) {
      console.log('Creating default contact for user...');
      const [newContact] = await db.insert(contacts).values({
        userId: userId,
        firstName: 'Default',
        lastName: 'Customer',
        email: req.user!.email || 'customer@example.com',
        phone: '+1234567890',
        company: 'Default Company',
        address: '123 Default St, Default City, DC 12345',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      contact = newContact;
    }

    // Update the invoice with the contact
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        contactId: contact.id,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return res.json({ 
      message: "Invoice contact fixed successfully", 
      contactId: contact.id,
      contact: contact
    });

  } catch (error: any) {
    console.error("Error fixing invoice contact:", error);
    return res.status(500).json({ message: "Failed to fix invoice contact" });
  }
});

// Send invoice by email
router.post("/:id/send", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id);
    const userId = req.user!.id;
    const { email, subject, message } = req.body;

    console.log(`🚀 POST /api/invoices/${id}/send - Starting...`);
    console.log(`User ID: ${userId}, Invoice ID: ${invoiceId}`);
    console.log(`Email params:`, { email, subject, message });

    if (isNaN(invoiceId)) {
      console.log('❌ Invalid invoice ID');
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    // Check if invoice exists and has a contact
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        contact: true
      }
    });

    if (!invoice) {
      console.log('❌ Invoice not found');
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.userId !== userId) {
      console.log('❌ User not authorized');
      return res.status(403).json({ message: "You don't have permission to send this invoice" });
    }

    if (!invoice.contactId || !invoice.contact || !invoice.contact.email) {
      return res.status(400).json({ message: "Invoice must have a customer with a valid email address to send emails" });
    }

    if (!invoice.contact.email) {
      console.log('❌ Contact has no email');
      return res.status(400).json({ message: "Customer must have a valid email address to send invoice emails" });
    }

    console.log('📧 Calling sendInvoiceEmail...');
    // Use the working sendInvoiceEmail function from storage
    const result = await sendInvoiceEmail(invoiceId, userId, { email, subject, message });
    console.log('📧 sendInvoiceEmail result:', result);
    
    if (result.success) {
      console.log('✅ Email sent successfully, notifying WebSocket clients...');
      // Notify connected clients about the invoice update
      if (wsService) {
        wsService.broadcastToResource('invoices', id, 'invoice_sent', {
          invoiceId: invoiceId,
          timestamp: new Date().toISOString()
        });
      }

      return res.json({
        message: "Invoice sent successfully",
        success: true
      });
    } else {
      console.log('❌ Email sending failed:', result.error);
      return res.status(500).json({ 
        message: "Failed to send invoice, invoice.ts",
        error: result.error 
      });
    }
  } catch (error: any) {
    console.error("❌ Route error sending invoice:", {
      message: error.message,
      stack: error.stack,
      details: error
    });
    return res.status(500).json({ message: "Failed to send invoice, invoice.ts" });
  }
});

// Generate a public link for an invoice
router.post("/:id/public-link", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { expiresIn = 30, permissions = { view: true, pay: true, download: true } } = req.body;

    // Check if invoice exists and belongs to user
    const invoice = await db.query.invoices.findFirst({
      where: (invoices, { eq }) => eq(invoices.id, parseInt(id)),
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
      where: (invoices, { eq }) => eq(invoices.id, parseInt(id)),
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
      
      // Resolve company logo if available for customization
      let logoUrl: string | undefined = undefined;
      try {
        const user = req.user ? await db.query.users.findFirst({ where: eq(users.id, req.user.id) }) : null;
        if (user && user.companyId) {
          const company = await db.query.companies.findFirst({ where: eq(companies.id, user.companyId) });
          if (company && (company as any).logo) {
            logoUrl = `/uploads/company/${(company as any).logo}`;
          }
        }
      } catch (_) {
        // non-fatal
      }
      // Generate PDF with optional logo
      const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoiceId, {
        includeLogo: !!logoUrl,
        customization: { logoUrl }
      });
      
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
  router.post('/api/invoices/:id/send', isAuthenticated, async (req, res) => {
    const invoiceId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const { email, subject, message } = req.body;
    
    console.log(`🚀 [ROUTE 2] POST /api/invoices/${req.params.id}/send - Starting...`);
    console.log(`User ID: ${userId}, Invoice ID: ${invoiceId}`);
    console.log(`Email params:`, { email, subject, message });
    
    if (!userId || isNaN(invoiceId)) {
      console.log('❌ [ROUTE 2] Invalid user or invoice ID');
      return res.status(400).json({ error: 'Invalid user or invoice ID' });
    }
    try {
      console.log('📧 [ROUTE 2] Calling sendInvoiceEmail...');
      const result = await sendInvoiceEmail(invoiceId, userId, { email, subject, message });
      console.log('📧 [ROUTE 2] sendInvoiceEmail result:', result);
      
      if (result.success) {
        console.log('✅ [ROUTE 2] Email sent successfully');
        return res.json({ success: true });
      } else {
        console.log('❌ [ROUTE 2] Email sending failed:', result.error);
        return res.status(500).json({ error: result.error || 'Failed to send invoice email, invoice.ts' });
      }
    } catch (err: any) {
      console.error("❌ [ROUTE 2] Route error sending invoice:", {
        message: err.message,
        stack: err.stack,
        details: err
      });
      return res.status(500).json({ error: err.message || 'Internal server error' });
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
        wsService.broadcastToResource(
          'finance',
          'invoices',
          'invoice_deleted',
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            totalAmount: invoice.total_amount,
            userId: req.user!.id
          }
        );

        // Notify sales module
        wsService.broadcastToResource(
          'sales',
          'orders',
          'invoice_deleted',
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            totalAmount: invoice.total_amount,
            userId: req.user!.id
          }
        );

        // Notify dashboard
        wsService.broadcastToResource(
          'dashboard',
          'all',
          'invoice_deleted',
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            totalAmount: invoice.total_amount,
            userId: req.user!.id
          }
        );
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
