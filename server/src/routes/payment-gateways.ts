import { Router } from "express";
import { db } from "../../db";
import { payment_gateway_settings } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Get all payment gateway settings (admin only)
router.get("/", authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can view payment gateway settings" });
    }
    
    const gateways = await db.query.payment_gateway_settings.findMany({
      orderBy: [asc(payment_gateway_settings.gateway_name)],
    });
    
    return res.json(gateways);
  } catch (error) {
    console.error("Error fetching payment gateway settings:", error);
    return res.status(500).json({ message: "Failed to fetch payment gateway settings" });
  }
});

// Get a single payment gateway setting (admin only)
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can view payment gateway settings" });
    }
    
    const gateway = await db.query.payment_gateway_settings.findFirst({
      where: eq(payment_gateway_settings.id, parseInt(id)),
    });
    
    if (!gateway) {
      return res.status(404).json({ message: "Payment gateway setting not found" });
    }
    
    return res.json(gateway);
  } catch (error) {
    console.error("Error fetching payment gateway setting:", error);
    return res.status(500).json({ message: "Failed to fetch payment gateway setting" });
  }
});

// Create a new payment gateway setting (admin only)
router.post("/", authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can create payment gateway settings" });
    }
    
    const { 
      gateway_name, 
      display_name,
      api_key_public, 
      api_key_secret, 
      webhook_secret,
      is_enabled = false,
      is_default = false,
      supported_currencies,
      transaction_fees,
      supported_payment_methods,
      checkout_settings,
      test_mode = true,
      test_api_key_public,
      test_api_key_secret,
      test_webhook_secret,
      logo_url,
      webhook_url,
      success_url,
      cancel_url,
      additional_config,
    } = req.body;
    
    // Validate required fields
    if (!gateway_name) {
      return res.status(400).json({ message: "Gateway name is required" });
    }
    
    // Check if gateway already exists
    const existingGateway = await db.query.payment_gateway_settings.findFirst({
      where: eq(payment_gateway_settings.gateway_name, gateway_name),
    });
    
    if (existingGateway) {
      return res.status(400).json({ message: `Gateway with name '${gateway_name}' already exists` });
    }
    
    // If this gateway is set as default, unset any existing default
    if (is_default) {
      await db.update(payment_gateway_settings)
        .set({ is_default: false })
        .where(eq(payment_gateway_settings.is_default, true));
    }
    
    // Create the gateway setting
    const [newGateway] = await db.insert(payment_gateway_settings)
      .values({
        gateway_name,
        display_name,
        api_key_public,
        api_key_secret,
        webhook_secret,
        is_enabled,
        is_default,
        supported_currencies,
        transaction_fees,
        supported_payment_methods,
        checkout_settings,
        test_mode,
        test_api_key_public,
        test_api_key_secret,
        test_webhook_secret,
        logo_url,
        webhook_url,
        success_url,
        cancel_url,
        additional_config,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    
    // Best-effort refresh (no-op if not implemented)
    try {
      if ((req.app as any).locals?.paymentService?.refreshGateways) {
        await (req.app as any).locals.paymentService.refreshGateways();
      }
    } catch (e) {
      console.warn('Gateway refresh not available:', e);
    }
    
    return res.status(201).json(newGateway);
  } catch (error) {
    console.error("Error creating payment gateway setting:", error);
    return res.status(500).json({ message: "Failed to create payment gateway setting" });
  }
});

// Update a payment gateway setting (admin only)
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can update payment gateway settings" });
    }
    
    const { 
      gateway_name, 
      display_name,
      api_key_public, 
      api_key_secret, 
      webhook_secret,
      is_enabled,
      is_default,
      supported_currencies,
      transaction_fees,
      supported_payment_methods,
      checkout_settings,
      test_mode,
      test_api_key_public,
      test_api_key_secret,
      test_webhook_secret,
      logo_url,
      webhook_url,
      success_url,
      cancel_url,
      additional_config,
    } = req.body;
    
    // Get the current gateway setting
    const existingGateway = await db.query.payment_gateway_settings.findFirst({
      where: eq(payment_gateway_settings.id, parseInt(id)),
    });
    
    if (!existingGateway) {
      return res.status(404).json({ message: "Payment gateway setting not found" });
    }
    
    // If changing the gateway name, check if the new name already exists
    if (gateway_name && gateway_name !== existingGateway.gateway_name) {
      const nameExists = await db.query.payment_gateway_settings.findFirst({
        where: eq(payment_gateway_settings.gateway_name, gateway_name),
      });
      
      if (nameExists) {
        return res.status(400).json({ message: `Gateway with name '${gateway_name}' already exists` });
      }
    }
    
    // If this gateway is being set as default, unset any existing default
    if (is_default && !existingGateway.is_default) {
      await db.update(payment_gateway_settings)
        .set({ is_default: false })
        .where(eq(payment_gateway_settings.is_default, true));
    }
    
    // Update the gateway setting
    const [updatedGateway] = await db.update(payment_gateway_settings)
      .set({
        gateway_name: gateway_name || undefined,
        display_name: display_name !== undefined ? display_name : undefined,
        api_key_public: api_key_public !== undefined ? api_key_public : undefined,
        api_key_secret: api_key_secret !== undefined ? api_key_secret : undefined,
        webhook_secret: webhook_secret !== undefined ? webhook_secret : undefined,
        is_enabled: is_enabled !== undefined ? is_enabled : undefined,
        is_default: is_default !== undefined ? is_default : undefined,
        supported_currencies: supported_currencies !== undefined ? supported_currencies : undefined,
        transaction_fees: transaction_fees !== undefined ? transaction_fees : undefined,
        supported_payment_methods: supported_payment_methods !== undefined ? supported_payment_methods : undefined,
        checkout_settings: checkout_settings !== undefined ? checkout_settings : undefined,
        test_mode: test_mode !== undefined ? test_mode : undefined,
        test_api_key_public: test_api_key_public !== undefined ? test_api_key_public : undefined,
        test_api_key_secret: test_api_key_secret !== undefined ? test_api_key_secret : undefined,
        test_webhook_secret: test_webhook_secret !== undefined ? test_webhook_secret : undefined,
        logo_url: logo_url !== undefined ? logo_url : undefined,
        webhook_url: webhook_url !== undefined ? webhook_url : undefined,
        success_url: success_url !== undefined ? success_url : undefined,
        cancel_url: cancel_url !== undefined ? cancel_url : undefined,
        additional_config: additional_config !== undefined ? additional_config : undefined,
        updated_at: new Date(),
      })
      .where(eq(payment_gateway_settings.id, parseInt(id)))
      .returning();
    
    // TODO: Refresh gateway settings in the payment service
    
    return res.json(updatedGateway);
  } catch (error) {
    console.error("Error updating payment gateway setting:", error);
    return res.status(500).json({ message: "Failed to update payment gateway setting" });
  }
});

// Delete a payment gateway setting (admin only)
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can delete payment gateway settings" });
    }
    
    // Get the gateway setting
    const existingGateway = await db.query.payment_gateway_settings.findFirst({
      where: eq(payment_gateway_settings.id, parseInt(id)),
    });
    
    if (!existingGateway) {
      return res.status(404).json({ message: "Payment gateway setting not found" });
    }
    
    // Delete the gateway setting
    const [deletedGateway] = await db.delete(payment_gateway_settings)
      .where(eq(payment_gateway_settings.id, parseInt(id)))
      .returning();
    
    // If this was the default gateway, set another one as default if available
    if (existingGateway.is_default) {
      const anotherGateway = await db.query.payment_gateway_settings.findFirst({
        where: eq(payment_gateway_settings.is_enabled, true),
        orderBy: [asc(payment_gateway_settings.created_at)],
      });
      
      if (anotherGateway) {
        await db.update(payment_gateway_settings)
          .set({ is_default: true })
          .where(eq(payment_gateway_settings.id, anotherGateway.id));
      }
    }
    
    // TODO: Refresh gateway settings in the payment service
    
    return res.json({ 
      message: "Payment gateway setting deleted successfully",
      gateway: deletedGateway
    });
  } catch (error) {
    console.error("Error deleting payment gateway setting:", error);
    return res.status(500).json({ message: "Failed to delete payment gateway setting" });
  }
});

// Test a payment gateway connection (admin only)
router.post("/:id/test", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can test payment gateways" });
    }
    
    // Get the gateway setting
    const gateway = await db.query.payment_gateway_settings.findFirst({
      where: eq(payment_gateway_settings.id, parseInt(id)),
    });
    
    if (!gateway) {
      return res.status(404).json({ message: "Payment gateway setting not found" });
    }
    
    // Test the gateway connection based on the gateway type
    let testResult;
    
    switch (gateway.gateway_name.toLowerCase()) {
      case 'stripe':
        // Test Stripe connection
        try {
          const Stripe = require('stripe');
          const apiKey = gateway.test_mode ? gateway.test_api_key_secret : gateway.api_key_secret;
          
          if (!apiKey) {
            return res.status(400).json({ message: "API key is required for testing" });
          }
          
          const stripe = new Stripe(apiKey, {
            apiVersion: '2023-10-16',
          });
          
          // Try to fetch account details to verify connection
          const account = await stripe.account.retrieve();
          
          testResult = {
            success: true,
            message: `Successfully connected to Stripe account: ${account.id}`,
            details: {
              accountId: account.id,
              businessType: account.business_type,
              country: account.country,
              email: account.email,
            },
          };
        } catch (error) {
          testResult = {
            success: false,
            message: `Failed to connect to Stripe: ${error.message}`,
            error: error.message,
          };
        }
        break;
        
      case 'razorpay':
        // Test Razorpay connection
        try {
          const Razorpay = require('razorpay');
          const keyId = gateway.test_mode ? gateway.test_api_key_public : gateway.api_key_public;
          const keySecret = gateway.test_mode ? gateway.test_api_key_secret : gateway.api_key_secret;
          
          if (!keyId || !keySecret) {
            return res.status(400).json({ message: "API key ID and secret are required for testing" });
          }
          
          const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          });
          
          // Try to fetch payments to verify connection
          const payments = await razorpay.payments.all({ count: 1 });
          
          testResult = {
            success: true,
            message: "Successfully connected to Razorpay",
            details: {
              count: payments.count,
            },
          };
        } catch (error) {
          testResult = {
            success: false,
            message: `Failed to connect to Razorpay: ${error.message}`,
            error: error.message,
          };
        }
        break;
        
      default:
        testResult = {
          success: false,
          message: `Testing not implemented for gateway type: ${gateway.gateway_name}`,
        };
    }
    
    return res.json(testResult);
  } catch (error) {
    console.error("Error testing payment gateway:", error);
    return res.status(500).json({ message: "Failed to test payment gateway" });
  }
});

// Get public gateway information (for client-side use)
router.get("/public", async (req, res) => {
  try {
    const gateways = await db.query.payment_gateway_settings.findMany({
      where: eq(payment_gateway_settings.is_enabled, true),
      orderBy: [asc(payment_gateway_settings.gateway_name)],
    });
    
    // Filter sensitive information
    const publicGateways = gateways.map(gateway => ({
      id: gateway.id,
      name: gateway.gateway_name,
      displayName: gateway.display_name || gateway.gateway_name,
      supportedCurrencies: gateway.supported_currencies,
      supportedPaymentMethods: gateway.supported_payment_methods,
      isDefault: gateway.is_default,
      logoUrl: gateway.logo_url,
      testMode: gateway.test_mode,
      publicKey: gateway.test_mode ? gateway.test_api_key_public : gateway.api_key_public,
    }));
    
    return res.json(publicGateways);
  } catch (error) {
    console.error("Error fetching public gateway information:", error);
    return res.status(500).json({ message: "Failed to fetch payment gateway information" });
  }
});

// Refresh gateway settings in the payment service (admin only)
router.post("/refresh", authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Only administrators can refresh gateway settings" });
    }
    
    try {
      if ((req.app as any).locals?.paymentService?.refreshGateways) {
        await (req.app as any).locals.paymentService.refreshGateways();
        return res.json({ message: "Gateway settings refreshed" });
      }
    } catch (e) {
      console.warn('Gateway refresh not available:', e);
    }
    return res.json({ message: "Gateway settings refresh endpoint available" });
  } catch (error) {
    console.error("Error refreshing gateway settings:", error);
    return res.status(500).json({ message: "Failed to refresh gateway settings" });
  }
});

export default router;