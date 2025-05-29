import { Router } from "express";
import { handleStripeWebhook, verifyRazorpayPayment } from "../services/payment";
import bodyParser from "body-parser";

const router = Router();

// Stripe webhook handler
// This needs to use the raw body for signature verification
router.post("/stripe", 
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ message: "Missing Stripe signature" });
      }
      
      // Process the webhook
      const result = await handleStripeWebhook(signature, req.body);
      
      return res.json(result);
    } catch (error) {
      console.error("Error handling Stripe webhook:", error);
      return res.status(400).json({ message: "Webhook Error" });
    }
  }
);

// Razorpay webhook handler
router.post("/razorpay", 
  bodyParser.json(),
  async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        invoice_id 
      } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoice_id) {
        return res.status(400).json({ 
          message: "Missing required parameters. Required: razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id" 
        });
      }
      
      // Verify the payment
      const result = await verifyRazorpayPayment({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        invoiceId: parseInt(invoice_id),
      });
      
      return res.json(result);
    } catch (error) {
      console.error("Error handling Razorpay webhook:", error);
      return res.status(400).json({ message: "Webhook Error", error: error.message });
    }
  }
);

export default router;