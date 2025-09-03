import { Router } from "express";
import { db } from "../../db";
import { invoices, invoice_items, payments, invoice_tokens, payment_gateway_settings, payment_history, contacts, users, companies } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { invoicePDFService } from "../services/pdf";
import { createCheckoutSession } from "../services/payment";
import { paymentService } from "../services/payment";
import { emailService } from "../services/email";
import { formatCurrency } from "../utils/format";

const router = Router();

// Define CompanyPdfData type locally
interface CompanyPdfData {
  legalName: string;
  principalBusinessAddress?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

// Get a public invoice by token
router.get("/invoices/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
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
    
    // Get payments for this invoice
    const invoicePayments = await db.query.payments.findMany({
      where: and(
        eq(payments.invoiceId, invoice.id),
        eq(payments.status, 'completed')
      ),
      orderBy: [desc(payments.paymentDate)],
    });
    
    // Calculate totals
    const totalPaid = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const balanceDue = invoice.totalAmount - totalPaid;
    
    // Get available payment gateways
    const gateways = await db.query.payment_gateway_settings.findMany({
      where: eq(payment_gateway_settings.is_enabled, true),
    });
    
    // Filter sensitive information from gateways
    const publicGateways = gateways.map(gateway => ({
      id: gateway.id,
      name: gateway.gateway_name,
      displayName: gateway.gateway_name, // Use gateway_name as display name since display_name doesn't exist
      supportedCurrencies: gateway.supported_currencies,
      publicKey: gateway.api_key_public, // Only use api_key_public since test fields don't exist in schema
    }));
    
    // Return the invoice data
    return res.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        company: {
          name: company?.legalName || 'Invoice',
          logoUrl: company?.logo ? `/uploads/company/${company.logo}` : null,
          email: company?.email || null,
        }
      },
      payments: invoicePayments.map(p => ({ id: p.id, amount: p.amount, date: p.paymentDate, method: p.payment_method })),
      totalPaid,
      balanceDue,
      isPaid: balanceDue <= 0,
      isOverdue: new Date(invoice.dueDate) < new Date() && balanceDue > 0,
      allowPartialPayment: invoice.allow_partial_payment,
      allowOnlinePayment: invoice.allow_online_payment,
      paymentGateways: publicGateways,
      paymentInstructions: invoice.payment_instructions,
      enabledPaymentMethods: invoice.enabled_payment_methods,
      token,
    });
  } catch (error) {
    console.error("Error fetching public invoice:", error);
    return res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

// Download invoice as PDF
router.get("/invoices/:token/pdf", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
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
    
    // Get company details for the PDF
    const user = await db.query.users.findFirst({
      where: eq(users.id, invoice.userId),
      columns: { companyId: true }
    });

    let companyDataForPdf: CompanyPdfData = {
      legalName: "Your Company Name", // Fallback
    };

    if (user && user.companyId) {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, user.companyId)
      });
      if (company) {
        companyDataForPdf = {
          legalName: company.legalName,
          principalBusinessAddress: company.principalBusinessAddress,
          phone: company.phone,
          email: company.email,
          logo: company.logo ? `/uploads/company/${company.logo}` : undefined,
        };
      }
    }
    
    // Generate PDF
    // const pdf = await generateInvoicePdf(invoice, companyDataForPdf);
    // Instead, use invoicePDFService.generateInvoicePDF
    // We'll pass invoice.id and options for company info as customization
    const pdfBuffer = await invoicePDFService.generateInvoicePDF(invoice.id, {
      customization: {
        logoUrl: companyDataForPdf.logo,
        footerText: undefined,
        primaryColor: undefined,
      },
      includeLogo: !!companyDataForPdf.logo,
    });
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    // Send the PDF
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return res.status(500).json({ message: "Failed to generate invoice PDF" });
  }
});

// Pay invoice via payment gateway
router.post("/invoices/:token/pay", async (req, res) => {
  try {
    const { token } = req.params;
    const { 
      successUrl, 
      cancelUrl, 
      gateway = 'stripe',
      amount, // Optional for partial payments
      paymentMethod,
    } = req.body;
    
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ message: "Success and cancel URLs are required" });
    }
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
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
    
    // Calculate the amount due
    const totalPaid = invoice.amountPaid || 0;
    const totalDue = invoice.totalAmount - totalPaid;
    
    if (totalDue <= 0) {
      return res.status(400).json({ message: "Invoice is already fully paid" });
    }
    
    // Validate payment amount if provided
    let paymentAmount = amount;
    if (paymentAmount) {
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Payment amount must be greater than zero" });
      }
      
      if (paymentAmount > totalDue) {
        return res.status(400).json({ message: "Payment amount cannot exceed the balance due" });
      }
      
      if (!invoice.allow_partial_payment && paymentAmount < totalDue) {
        return res.status(400).json({ message: "Partial payments are not allowed for this invoice" });
      }
    } else {
      // Use full amount due if not specified
      paymentAmount = totalDue;
    }
    
    // Check if the selected gateway is enabled
    const gatewaySettings = await db.query.payment_gateway_settings.findFirst({
      where: and(
        eq(payment_gateway_settings.gateway_name, gateway),
        eq(payment_gateway_settings.is_enabled, true)
      ),
    });
    
    if (!gatewaySettings) {
      return res.status(400).json({ message: `Payment gateway '${gateway}' is not available` });
    }
    
    // Process the payment through the gateway
    // const paymentResult = await processPayment({ ... });
    // Instead, use paymentService.createInvoicePaymentIntent
    const paymentResult = await paymentService.createInvoicePaymentIntent(invoice.id, {
      payment_method_types: [gateway],
      custom_amount: paymentAmount,
    });
    
    return res.json(paymentResult);
  } catch (error) {
    console.error("Error creating payment session:", error);
    return res.status(500).json({ message: "Failed to create payment session", error: error.message });
  }
});

// Verify payment from gateway
router.post("/invoices/:token/verify-payment", async (req, res) => {
  try {
    const { token } = req.params;
    const { 
      gateway,
      sessionId,
      orderId,
      paymentId,
      signature,
    } = req.body;
    
    if (!gateway) {
      return res.status(400).json({ message: "Payment gateway is required" });
    }
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    // Verify the payment based on the gateway
    let verificationResult;
    
    if (gateway === 'razorpay') {
      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ message: "Missing Razorpay verification fields" });
      }
      const crypto = await import('crypto');
      const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        return res.status(500).json({ message: "Razorpay secret not configured" });
      }
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${orderId}|${paymentId}`);
      const expected = hmac.digest('hex');
      const valid = expected === signature;
      if (!valid) {
        return res.status(400).json({ message: "Invalid Razorpay signature" });
      }
      verificationResult = {
        success: true,
        gateway: 'razorpay',
        amount: invoice.totalAmount - (invoice.amountPaid || 0),
        paymentMethod: 'razorpay',
        transactionId: paymentId,
        gatewayResponse: { orderId, paymentId },
      };
      const result = await recordSuccessfulPayment(verificationResult, invoice.id);
      return res.json(result);
    } else if (gateway === 'stripe') {
      if (!sessionId) {
        return res.status(400).json({ message: 'Missing Stripe sessionId' });
      }
      // Defer to webhook for source of truth; here we optimistically confirm
      verificationResult = {
        success: true,
        gateway: 'stripe',
        amount: invoice.totalAmount - (invoice.amountPaid || 0),
        paymentMethod: 'stripe',
        transactionId: sessionId,
        gatewayResponse: { sessionId },
      };
      const result = await recordSuccessfulPayment(verificationResult, invoice.id);
      return res.json(result);
    } else {
      return res.status(501).json({ message: 'Gateway not supported yet' });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
});

// Record a successful payment
async function recordSuccessfulPayment(verificationResult: any, invoiceId: number) {
  // Generate a unique payment number
  const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Get the invoice
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: {
      contact: true,
      // Eager load company data through user
      user: {
        with: {
          // company: true, // Removed as it doesn't exist in schema
        }
      }
    },
  });
  
  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }
  
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
  if (newPaymentStatus === 'Paid' && !invoice.payment_thank_you_sent && invoice.contactId) {
    try {
      const formattedAmount = formatCurrency(verificationResult.amount, invoice.currency || 'USD');
      
      const contactEmail = invoice.contact?.email || undefined;
      if (contactEmail) {
        await emailService.sendEmail({
          to: contactEmail,
          subject: `Thank you for your payment - Invoice #${invoice.invoiceNumber}`,
          text: `Dear ${invoice.contact?.firstName || 'Customer'},\n\nThank you for your payment of ${formattedAmount} for invoice #${invoice.invoiceNumber}. Your payment has been received and processed successfully.\n\nRegards,\n${process.env.COMPANY_NAME || 'Our Company'}`,
          html: `<p>Dear ${invoice.contact?.firstName || 'Customer'},</p><p>Thank you for your payment of ${formattedAmount} for invoice #${invoice.invoiceNumber}. Your payment has been received and processed successfully.</p><p>Regards,<br>${process.env.COMPANY_NAME || 'Our Company'}</p>`,
        });
      }
      
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
  
  return {
    success: true,
    payment,
    invoice: updatedInvoice,
    paymentStatus: newPaymentStatus,
  };
}

// Get payment methods for a contact
router.get("/contact/:token/payment-methods", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
      with: {
        contact: true,
      },
    });
    
    if (!invoice || !invoice.contactId) {
      return res.status(404).json({ message: "Invoice or contact not found" });
    }
    
    // Get the contact's saved payment methods
    const [contact] = await db.select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      savedPaymentMethods: contacts.saved_payment_methods,
    })
    .from(contacts)
    .where(eq(contacts.id, invoice.contactId));
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    // Return the payment methods
    return res.json({
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      contactEmail: contact.email,
      paymentMethods: contact.savedPaymentMethods || [],
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return res.status(500).json({ message: "Failed to fetch payment methods" });
  }
});

// Save a payment method for a contact
router.post("/contact/:token/payment-methods", async (req, res) => {
  try {
    const { token } = req.params;
    const { paymentMethod } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method data is required" });
    }
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
    });
    
    if (!invoice || !invoice.contactId) {
      return res.status(404).json({ message: "Invoice or contact not found" });
    }
    
    // Get the contact's current payment methods
    const [contact] = await db.select({
      id: contacts.id,
      savedPaymentMethods: contacts.saved_payment_methods,
    })
    .from(contacts)
    .where(eq(contacts.id, invoice.contactId));
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    // Add the new payment method
    const currentMethods = contact.savedPaymentMethods || [];
    const newMethods = [...(currentMethods as any[]), {
      ...paymentMethod,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    }];
    
    // Update the contact
    const [updatedContact] = await db.update(contacts)
      .set({
        saved_payment_methods: newMethods,
      })
      .where(eq(contacts.id, invoice.contactId))
      .returning({
        id: contacts.id,
        savedPaymentMethods: contacts.saved_payment_methods,
      });
    
    return res.json({
      success: true,
      paymentMethods: updatedContact.savedPaymentMethods,
    });
  } catch (error) {
    console.error("Error saving payment method:", error);
    return res.status(500).json({ message: "Failed to save payment method" });
  }
});

// Delete a payment method for a contact
router.delete("/contact/:token/payment-methods/:methodId", async (req, res) => {
  try {
    const { token, methodId } = req.params;
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
    });
    
    if (!invoice || !invoice.contactId) {
      return res.status(404).json({ message: "Invoice or contact not found" });
    }
    
    // Get the contact's current payment methods
    const [contact] = await db.select({
      id: contacts.id,
      savedPaymentMethods: contacts.saved_payment_methods,
    })
    .from(contacts)
    .where(eq(contacts.id, invoice.contactId));
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    // Remove the payment method
    const currentMethods = contact.savedPaymentMethods || [];
    const newMethods = (currentMethods as any[]).filter((method: any) => method.id !== methodId);
    
    if ((currentMethods as any[]).length === newMethods.length) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    
    // Update the contact
    const [updatedContact] = await db.update(contacts)
      .set({
        saved_payment_methods: newMethods,
      })
      .where(eq(contacts.id, invoice.contactId))
      .returning({
        id: contacts.id,
        savedPaymentMethods: contacts.saved_payment_methods,
      });
    
    return res.json({
      success: true,
      paymentMethods: updatedContact.savedPaymentMethods,
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return res.status(500).json({ message: "Failed to delete payment method" });
  }
});

// Get payment history for an invoice
router.get("/invoices/:token/payment-history", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the token in the database
    const [tokenRecord] = await db.select().from(invoice_tokens).where(eq(invoice_tokens.token, token));
    
    if (!tokenRecord) {
      return res.status(404).json({ message: "Invoice not found or link has expired" });
    }
    
    // Check if token has expired
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(403).json({ message: "Invoice link has expired" });
    }
    
    // Get the invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, tokenRecord.invoice_id),
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    // Get payment history
    const history = await db.query.payment_history.findMany({
      where: eq(payment_history.invoiceId, invoice.id),
      with: {
        payment: true,
      },
      orderBy: [desc(payment_history.event_timestamp)],
    });
    
    return res.json({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      history,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

export default router;