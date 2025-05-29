import { Router } from "express";
import { db } from "../../db";
import { invoices, invoice_items, payments, invoice_tokens } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { generateInvoicePdf } from "../services/pdf";
import { createCheckoutSession, verifyRazorpayPayment } from "../services/payment";

const router = Router();

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
        eq(payments.related_document_type, 'invoice'),
        eq(payments.related_document_id, invoice.id)
      ),
      orderBy: [db.desc(payments.payment_date)],
    });
    
    // Calculate totals
    const totalPaid = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const balanceDue = invoice.total_amount - totalPaid;
    
    // Return the invoice data
    return res.json({
      invoice,
      payments: invoicePayments,
      totalPaid,
      balanceDue,
      isPaid: balanceDue <= 0,
      isOverdue: new Date(invoice.due_date) < new Date() && balanceDue > 0,
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
    
    // Generate PDF
    const pdf = await generateInvoicePdf(invoice);
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    
    // Send the PDF
    return res.send(pdf);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return res.status(500).json({ message: "Failed to generate invoice PDF" });
  }
});

// Pay invoice via payment gateway (Stripe or Razorpay)
router.post("/invoices/:token/pay", async (req, res) => {
  try {
    const { token } = req.params;
    const { successUrl, cancelUrl, gateway = 'stripe' } = req.body;
    
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ message: "Success and cancel URLs are required" });
    }
    
    // Validate gateway
    if (gateway !== 'stripe' && gateway !== 'razorpay') {
      return res.status(400).json({ message: "Invalid payment gateway. Supported: stripe, razorpay" });
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
    
    // Create a checkout session with the specified gateway
    const session = await createCheckoutSession({
      invoiceId: invoice.id,
      successUrl,
      cancelUrl,
      customerEmail: invoice.contact?.email,
      gateway: gateway as 'stripe' | 'razorpay',
    });
    
    return res.json(session);
  } catch (error) {
    console.error("Error creating payment session:", error);
    return res.status(500).json({ message: "Failed to create payment session", error: error.message });
  }
});

// Verify Razorpay payment
router.post("/invoices/:token/verify-payment", async (req, res) => {
  try {
    const { token } = req.params;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        message: "Missing required parameters. Required: razorpay_order_id, razorpay_payment_id, razorpay_signature" 
      });
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
    
    // Verify the payment
    const result = await verifyRazorpayPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      invoiceId: tokenRecord.invoice_id,
    });
    
    return res.json(result);
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
});

export default router;