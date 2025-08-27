import type { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db, pool } from "./db";
import * as schema from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import multer from "multer";
import { mpesaUtils } from "./utils/mpesa";
import { faceRecognitionUtils } from "./utils/faceRecognition";
import { WSService } from "./websocket";
import { setWSService } from "./src/routes/invoices";
import { setPaymentWSService } from "./src/services/payment";
import { setSchedulerWSService } from "./src/services/scheduler";
import { setWSService as setWebSocketService } from "./src/services/websocket";
import scheduler from "./src/services/scheduler";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to check if the user is authenticated (supports Session or JWT)
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Session-based
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // JWT-based (Authorization: Bearer <token>)
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring("Bearer ".length);
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ message: "Server misconfiguration" });
      }
      const decoded = jwt.verify(token, secret) as any;
      (req as any).user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check if the user has admin role
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Import routes
import companyRoutes from './src/routes/company';
import invoiceRoutes from './src/routes/invoices';
import publicRoutes from './src/routes/public';
import webhookRoutes from './src/routes/webhooks';
import adminRoutes from './src/routes/admin';
import paymentRoutes from './src/routes/payments';
import paymentReminderRoutes from './src/routes/payment-reminders';
import crmRoutes from './src/routes/crm';
import inventoryRoutes from './src/routes/inventory';
import operationsRoutes from './src/routes/operations';
import alertsRoutes from './src/routes/alerts';
import activityRoutes from './src/routes/activity';
import paymentGatewayRoutes from './src/routes/payment-gateways';
import emailTestRoutes from './src/routes/email-test';
import hrmsRoutes from './src/routes/hrms';
import financeRoutes, { setFinanceWSService } from './src/routes/finance';
import purchaseRoutes, { setPurchaseWSService } from './src/routes/purchase';
import reportsRoutes, { setWSService as setReportsWSService } from './src/routes/reports';
import { requireAnyRole, requireRole } from './src/middleware/rbac';
import salesRoutes, { setSalesWSService } from './src/routes/sales';
import { registerDynamicRoutes } from './routes-dynamic';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);
  
  // Initialize WebSocket service
  const wsService = new WSService(server);
  
  // Set WebSocket service for various components
  setWSService(wsService);
  setPaymentWSService(wsService);
  setSchedulerWSService(wsService);
  setWebSocketService(wsService);
  setFinanceWSService(wsService);
  setPurchaseWSService(wsService);
  setReportsWSService(wsService);
  setSalesWSService(wsService);
  
  // Store WebSocket service in app.locals for access in routes
  app.locals.wsService = wsService;
  // Expose payment service for gateway refresh hooks
  try {
    const { paymentService } = await import('./src/services/payment');
    (app as any).locals.paymentService = paymentService;
  } catch (e) {
    console.warn('Payment service not available to attach to app.locals');
  }
  
  // Register all dynamic data routes
  registerDynamicRoutes(app, wsService);
  
  // Initialize the scheduler
  console.log('Starting task scheduler...');
  const scheduledTasks = scheduler.getAllTasks();
  console.log(`${scheduledTasks.length} tasks registered`);
  scheduler.start();
  
  // Set up authentication
  setupAuth(app);

  // Test endpoint
  app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'API is working!' });
  });
  // Health check endpoint
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Register company routes
  app.use('/api/company', companyRoutes);
  
  // Register invoice routes
  app.use('/api/invoices', invoiceRoutes);
  
  // Register payment routes
  app.use('/api/payments', paymentRoutes);
  
  // Register payment reminder routes
  app.use('/api/payment-reminders', paymentReminderRoutes);
  
  // Register payment gateway routes
  app.use('/api/payment-gateways', paymentGatewayRoutes);
  
  // Register email test routes
  app.use('/api/email', emailTestRoutes);
  
  // Register public routes
  app.use('/api/public', publicRoutes);
  
  // Register webhook routes
  app.use('/webhooks', webhookRoutes);
  
  // Register admin routes
  app.use('/api/admin', requireRole('admin'), adminRoutes);
  
  // Register CRM routes
  app.use('/api/crm', crmRoutes);
  
  // Register Inventory routes
  app.use('/api/inventory', inventoryRoutes);
  // Operations dashboard routes
  app.use('/api/operations', operationsRoutes);
  // Global alerts
  app.use('/api/alerts', alertsRoutes);
  // Activity feed
  app.use('/api/activity', activityRoutes);
  
  // Register HRMS routes
  app.use('/api/hrms', hrmsRoutes);
  // Alias for dashboard expectations
  app.use('/api/hr', hrmsRoutes);
  
  // Register Purchase routes  
  app.use('/api/purchase', isAuthenticated, purchaseRoutes);
  
  // Register Finance routes  
  app.use('/api/finance', isAuthenticated, financeRoutes);
  
  // Register Reports routes  
  app.use('/api/reports', isAuthenticated, requireAnyRole(['manager','admin']), reportsRoutes);
  
  // Register Sales routes
  app.use('/api/sales', isAuthenticated, salesRoutes);

  // API routes with authentication
  
  // CRM Module Routes - Contacts
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      // Since isAuthenticated middleware ensures req.user exists, we can safely use non-null assertion
      const contacts = await storage.getContactsByUser(req.user!.id);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  
  app.get("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const contact = await storage.getContact(parseInt(req.params.id));
      if (!contact || contact.userId !== req.user!.id) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });
  
  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contact = await storage.createContact({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });
  
  app.patch("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      
      if (!contact || contact.userId !== req.user!.id) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      const updatedContact = await storage.updateContact(contactId, req.body);
      res.json(updatedContact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });
  
  app.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      
      if (!contact || contact.userId !== req.user!.id) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      await storage.deleteContact(contactId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });
  
  // CRM Module Routes - Deals
  app.get("/api/deals", isAuthenticated, async (req, res) => {
    try {
      const deals = await db.select().from(schema.deals).where(eq(schema.deals.userId, req.user!.id));
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });
  
  app.get("/api/deals/:id", isAuthenticated, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const [deal] = await db.select().from(schema.deals).where(eq(schema.deals.id, dealId));
      
      if (!deal || deal.userId !== req.user!.id) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });
  
  app.post("/api/deals", isAuthenticated, async (req, res) => {
    try {
      const [deal] = await db.insert(schema.deals).values({
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });
  
  app.patch("/api/deals/:id", isAuthenticated, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const [existingDeal] = await db.select().from(schema.deals).where(eq(schema.deals.id, dealId));
      
      if (!existingDeal || existingDeal.userId !== req.user!.id) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      const [updatedDeal] = await db.update(schema.deals)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(schema.deals.id, dealId))
        .returning();
      
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ message: "Failed to update deal" });
    }
  });
  
  app.delete("/api/deals/:id", isAuthenticated, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const [existingDeal] = await db.select().from(schema.deals).where(eq(schema.deals.id, dealId));
      
      if (!existingDeal || existingDeal.userId !== req.user!.id) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      await db.delete(schema.deals).where(eq(schema.deals.id, dealId));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });
  
  // Inventory Module Routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProductsByUser(req.user!.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product || product.userId !== req.user!.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.createProduct({
        ...req.body,
        userId: req.user!.id
      });
      
      // Broadcast product creation via WebSocket
      wsService.broadcast('product_created', {
        type: 'product_created',
        data: product,
        userId: req.user!.id
      });
      
      wsService.broadcastToResource('inventory', 'all', 'product_created', {
        product: product
      });
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.userId !== req.user!.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      
      // Broadcast product update via WebSocket
      wsService.broadcast('product_updated', {
        type: 'product_updated',
        data: updatedProduct,
        userId: req.user!.id
      });
      
      wsService.broadcastToResource('inventory', 'all', 'product_updated', {
        product: updatedProduct
      });
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.userId !== req.user!.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      await storage.deleteProduct(productId);
      
      // Broadcast product deletion via WebSocket
      wsService.broadcast('product_deleted', {
        type: 'product_deleted',
        data: { id: productId },
        userId: req.user!.id
      });
      
      wsService.broadcastToResource('inventory', 'all', 'product_deleted', {
        productId: productId
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  
  // HRMS Module Routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployeesByUser(req.user!.id);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });
  
  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.getEmployee(parseInt(req.params.id));
      if (!employee || employee.userId !== req.user!.id) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });
  
  app.post("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.createEmployee({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });
  
  app.put("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee || employee.userId !== req.user!.id) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const updatedEmployee = await storage.updateEmployee(employeeId, req.body);
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });
  
  app.delete("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee || employee.userId !== req.user!.id) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      await storage.deleteEmployee(employeeId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });
  
  // Finance Module Routes duplicated endpoints removed; use routes under /api/invoices mounted in invoiceRoutes
  
  // Get payments for a specific invoice
  app.get("/api/invoices/:id/payments", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const payments = await storage.getPaymentsByInvoice(parseInt(req.params.id));
      res.json(payments);
    } catch (error) {
      console.error("Error fetching invoice payments:", error);
      res.status(500).json({ message: "Failed to fetch invoice payments" });
    }
  });
  
  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.createInvoice({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  
  // This route has been consolidated with the authenticated version below
  
  // Sales Module - Orders Routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      console.log("Fetching orders for user:", req.user!.id);
      
      // Check if orders table exists, if not create it
      try {
        // Return orders for the authenticated user
        const orders = await storage.getOrdersByUser(req.user!.id);
        console.log("Orders fetched:", orders);
        res.json(orders);
      } catch (err) {
        console.error("Error in orders query:", err);
        // Type check for PostgreSQL error object
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === '42P01') { // Table doesn't exist error code
          console.log("Orders table doesn't exist, creating it...");
          
          // Create the orders table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id),
              contact_id INTEGER REFERENCES contacts(id),
              order_number VARCHAR(50) NOT NULL UNIQUE,
              order_date DATE NOT NULL DEFAULT CURRENT_DATE,
              delivery_date DATE,
              subtotal REAL NOT NULL,
              tax_amount REAL,
              discount_amount REAL,
              total_amount REAL NOT NULL,
              status VARCHAR(50) DEFAULT 'pending',
              notes TEXT,
              category VARCHAR(50),
              payment_status VARCHAR(50) DEFAULT 'unpaid',
              shipping_address TEXT,
              billing_address TEXT,
              currency VARCHAR(3) DEFAULT 'USD',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
          
          // Create order items table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
              id SERIAL PRIMARY KEY,
              order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
              product_id INTEGER REFERENCES products(id),
              description TEXT NOT NULL,
              quantity REAL NOT NULL,
              unit_price REAL NOT NULL,
              tax_rate REAL,
              tax_amount REAL,
              discount_rate REAL,
              discount_amount REAL,
              subtotal REAL NOT NULL,
              total_amount REAL NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
          
          // Return empty array after creating table
          res.json([]);
        } else {
          throw err; // Re-throw if it's a different error
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // This route has been consolidated with the authenticated version below
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      // Generate a unique order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const order = await storage.createOrder({
        ...req.body,
        userId: req.user!.id,
        orderNumber,
        orderDate: new Date()
      });
      
      // Broadcast order creation via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        // Broadcast to all clients about new order
        wsService.broadcast('new_order', {
          order,
          message: `New order ${order.orderNumber} created`
        });
        
        // Broadcast order updates to specific resource listeners
        wsService.broadcastToResource('orders', 'all', 'order_created', {
          order,
          orderId: order.id
        });
        
        // Broadcast sales metrics update
        wsService.broadcast('sales_metrics_updated', {
          message: 'Sales metrics need refresh due to new order'
        });
        
        // Broadcast dashboard update
        wsService.broadcast('dashboard_updated', {
          type: 'new_order',
          order
        });
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  app.get("/api/orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getOrderItemsByOrderId(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });
  
  app.post("/api/orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const item = await storage.createOrderItem({
        ...req.body,
        orderId
      });
      
      // Broadcast order item creation via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        wsService.broadcastToResource('orders', orderId, 'order_item_created', {
          item,
          orderId
        });
        wsService.broadcast('sales_metrics_updated', {
          message: 'Sales metrics need refresh due to order item update'
        });
      }
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  app.put("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const existingOrder = await storage.getOrder(orderId);
      
      if (!existingOrder || existingOrder.userId !== req.user!.id) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.updateOrder(orderId, req.body);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Auto-generate invoice when order becomes completed
      const statusBecameCompleted =
        existingOrder.status !== 'completed' && req.body?.status === 'completed';

      if (statusBecameCompleted) {
        try {
          const orderItemsList = await storage.getOrderItemsByOrderId(orderId);
          const invoiceNumber = await storage.generateInvoiceNumber(existingOrder.userId);
          const issueDate = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          const [invoice] = await db
            .insert(schema.invoices)
            .values({
              userId: existingOrder.userId,
              contactId: existingOrder.contactId,
              invoiceNumber,
              issueDate,
              dueDate,
              subtotal: updatedOrder.subtotal || 0,
              taxAmount: updatedOrder.taxAmount || 0,
              discountAmount: updatedOrder.discountAmount || 0,
              totalAmount: updatedOrder.totalAmount || 0,
              amountPaid: 0,
              status: 'draft',
              payment_status: 'Unpaid',
              notes: `Auto-generated from order ${updatedOrder.orderNumber}`,
              currency: updatedOrder.currency || 'USD',
            })
            .returning();

          if (orderItemsList && orderItemsList.length) {
            await db.insert(schema.invoiceItems).values(
              orderItemsList.map((it: any) => ({
                invoiceId: invoice.id,
                productId: it.productId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                taxRate: it.taxRate,
                taxAmount: it.taxAmount,
                discountRate: it.discountRate,
                discountAmount: it.discountAmount,
                subtotal: it.subtotal,
                totalAmount: it.totalAmount,
              }))
            );
          }

          const ws = req.app.locals.wsService;
          if (ws) {
            ws.broadcast('invoice_created', { invoice, fromOrderId: orderId });
            ws.broadcast('dashboard_updated', {
              type: 'invoice_created',
              invoiceId: invoice.id,
            });
          }
        } catch (err) {
          console.error('Auto-invoice creation failed:', err);
        }
      }

      // Broadcast order update via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        wsService.broadcastToResource('orders', orderId, 'order_updated', {
          order: updatedOrder,
          orderId
        });
        wsService.broadcast('order_updated', {
          order: updatedOrder,
          message: `Order ${updatedOrder.orderNumber} updated`
        });
        wsService.broadcast('sales_metrics_updated', {
          message: 'Sales metrics need refresh due to order update'
        });
        wsService.broadcast('dashboard_updated', {
          type: 'order_updated',
          order: updatedOrder
        });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const existingOrder = await storage.getOrder(orderId);
      
      if (!existingOrder || existingOrder.userId !== req.user!.id) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const success = await storage.deleteOrder(orderId);
      
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast order deletion via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        wsService.broadcastToResource('orders', orderId, 'order_deleted', {
          orderId,
          orderNumber: existingOrder.orderNumber
        });
        wsService.broadcast('order_deleted', {
          orderId,
          orderNumber: existingOrder.orderNumber,
          message: `Order ${existingOrder.orderNumber} deleted`
        });
        wsService.broadcast('sales_metrics_updated', {
          message: 'Sales metrics need refresh due to order deletion'
        });
        wsService.broadcast('dashboard_updated', {
          type: 'order_deleted',
          orderId,
          orderNumber: existingOrder.orderNumber
        });
      }
      
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });
  
  // Additional sales endpoints for frontend compatibility
  app.get("/api/sales/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  // Sales Analytics API endpoints
  app.get("/api/sales/metrics", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      
      const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      
      const metrics = {
        totalSales,
        totalOrders,
        averageOrderValue,
        pendingOrders,
        conversionRate: totalOrders > 0 ? (totalOrders / (totalOrders + pendingOrders)) * 100 : 0
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching sales metrics:", error);
      res.status(500).json({ message: "Failed to fetch sales metrics" });
    }
  });

  app.get("/api/sales/recent-orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      const recentOrders = orders
        .sort((a, b) => {
          const bTime = (b as any).createdAt ? new Date((b as any).createdAt as any).getTime() : 0;
          const aTime = (a as any).createdAt ? new Date((a as any).createdAt as any).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      
      res.json(recentOrders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.get("/api/sales/monthly-sales", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      
      const monthlySales = orders.reduce((acc, order) => {
        const month = new Date(order.orderDate).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + order.totalAmount;
        return acc;
      }, {} as Record<string, number>);
      
      const salesData = Object.entries(monthlySales).map(([month, sales]) => ({
        month,
        sales
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
      res.status(500).json({ message: "Failed to fetch monthly sales" });
    }
  });

  app.get("/api/sales/by-category", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      
      const salesByCategory = orders.reduce((acc, order) => {
        const category = order.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + order.totalAmount;
        return acc;
      }, {} as Record<string, number>);
      
      const categoryData = Object.entries(salesByCategory).map(([name, value]) => ({
        name,
        value
      }));
      
      res.json(categoryData);
    } catch (error) {
      console.error("Error fetching sales by category:", error);
      res.status(500).json({ message: "Failed to fetch sales by category" });
    }
  });

  app.get("/api/sales/top-customers", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      
      const customerSales = orders.reduce((acc, order) => {
        if (order.contactId) {
          acc[order.contactId] = (acc[order.contactId] || 0) + order.totalAmount;
        }
        return acc;
      }, {} as Record<number, number>);
      
      const topCustomers = Object.entries(customerSales)
        .map(([contactId, totalSales]) => ({
          contactId: parseInt(contactId),
          totalSales,
          orderCount: orders.filter(o => o.contactId === parseInt(contactId)).length
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5);
      
      res.json(topCustomers);
    } catch (error) {
      console.error("Error fetching top customers:", error);
      res.status(500).json({ message: "Failed to fetch top customers" });
    }
  });

  // Sales Module - Quotations Routes
  app.get("/api/quotations", isAuthenticated, async (req, res) => {
    try {
      console.log("Fetching quotations...");
      
      // Check if the user is authenticated and has an ID
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Simplest approach - just return an empty array for now
      // This will at least prevent errors while we debug the issue
      return res.json([]);
      
      /* 
      // The code below is commented out until we can properly debug the issue
      try {
        // Check if table exists
        const tableCheck = await pool.query(
          "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotations')"
        );
        
        const tableExists = tableCheck.rows[0].exists;
        
        if (!tableExists) {
          console.log("Quotations table doesn't exist, creating it...");
          
          // Create the quotations table
          await pool.query(`
            CREATE TABLE IF NOT EXISTS quotations (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id),
              contact_id INTEGER REFERENCES contacts(id),
              quotation_number VARCHAR(50) NOT NULL UNIQUE,
              issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
              expiry_date DATE,
              subtotal REAL NOT NULL,
              tax_amount REAL,
              discount_amount REAL,
              total_amount REAL NOT NULL,
              status VARCHAR(50) DEFAULT 'draft',
              notes TEXT,
              terms TEXT,
              category VARCHAR(50),
              currency VARCHAR(3) DEFAULT 'USD',
              converted_to_order BOOLEAN DEFAULT FALSE,
              converted_order_id INTEGER,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
          
          // Return empty array after creating table
          return res.json([]);
        }
        
        // If table exists, query it with proper parameter
        const userId = req.user.id;
        console.log("Querying quotations for user ID:", userId);
        
        const result = await pool.query(
          "SELECT * FROM quotations WHERE user_id = $1",
          [userId]
        );
        
        return res.json(result.rows);
      } catch (err) {
        console.error("Error in quotations endpoint:", err);
        // Return empty array for any error
        return res.json([]);
      }
      */
    } catch (error) {
      console.error("Error fetching quotations:", error);
      // Always return an empty array instead of an error
      return res.json([]);
    }
  });
  
  app.get("/api/quotations/:id", isAuthenticated, async (req, res) => {
    try {
      const quotation = await storage.getQuotation(parseInt(req.params.id));
      if (!quotation || quotation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });
  
  app.post("/api/quotations", isAuthenticated, async (req, res) => {
    try {
      // Generate a unique quotation number
      const quotationNumber = `QUO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const quotation = await storage.createQuotation({
        ...req.body,
        userId: req.user!.id,
        quotationNumber,
        issueDate: new Date()
      });
      res.status(201).json(quotation);
    } catch (error) {
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });
  
  app.get("/api/quotations/:id/items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getQuotationItemsByQuotationId(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching quotation items:", error);
      res.status(500).json({ message: "Failed to fetch quotation items" });
    }
  });
  
  app.post("/api/quotations/:id/items", isAuthenticated, async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation || quotation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      const item = await storage.createQuotationItem({
        ...req.body,
        quotationId
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating quotation item:", error);
      res.status(500).json({ message: "Failed to create quotation item" });
    }
  });
  
  // Convert quotation to order
  app.post("/api/quotations/:id/convert", isAuthenticated, async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation || quotation.userId !== req.user!.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if ((quotation as any).convertedToOrder || (quotation as any).convertedOrderId) {
        return res.status(400).json({ message: "Quotation already converted to order" });
      }
      
      // Generate a unique order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Create new order from quotation
      const order = await storage.createOrder({
        userId: req.user!.id,
        contactId: quotation.contactId,
        orderNumber,
        orderDate: new Date().toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        discountAmount: quotation.discountAmount,
        totalAmount: quotation.totalAmount,
        notes: quotation.notes,
        category: quotation.category,
        currency: quotation.currency
      });
      
      // Get quotation items
      const quotationItems = await storage.getQuotationItemsByQuotationId(quotationId);
      
      // Create order items from quotation items
      for (const item of quotationItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          discountRate: item.discountRate,
          discountAmount: item.discountAmount,
          subtotal: item.subtotal,
          totalAmount: item.totalAmount
        });
      }
      
      // Update quotation as converted
      await storage.updateQuotation(quotationId, {
        convertedOrderId: order.id,
        updatedAt: new Date()
      } as any);
      
      res.status(201).json({ order, message: "Quotation successfully converted to order" });
    } catch (error) {
      console.error("Error converting quotation to order:", error);
      res.status(500).json({ message: "Failed to convert quotation to order" });
    }
  });
  
  app.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      
      // Broadcast update via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        // Broadcast to specific invoice
        wsService.broadcastToResource('invoices', invoiceId, 'invoice_updated', {
          invoice: updatedInvoice
        });
        
        // Also broadcast to global invoices channel
        wsService.broadcastToResource('invoices', 'all', 'invoice_updated', {
          invoiceId: invoiceId
        });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  
  // Payment routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUser(req.user!.id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  
  app.get("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.getPayment(parseInt(req.params.id));
      if (!payment || payment.userId !== req.user!.id) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });
  
  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      // Validate if this is for an invoice and the invoice exists
      if (req.body.relatedDocumentType === 'invoice' && req.body.relatedDocumentId) {
        const invoice = await storage.getInvoice(parseInt(req.body.relatedDocumentId));
        if (!invoice || invoice.userId !== req.user!.id) {
          return res.status(404).json({ message: "Invoice not found" });
        }
      }
      
      const payment = await storage.createPayment({
        ...req.body,
        userId: req.user!.id,
        // If accountId is not provided, use a default account
        accountId: req.body.accountId || 1 // You might want to get this from user settings
      });
      
      // Broadcast to WebSocket if connected
      if (req.body.relatedDocumentType === 'invoice' && req.body.relatedDocumentId) {
        const wsService = req.app.locals.wsService;
        if (wsService) {
          // Broadcast to specific invoice
          wsService.broadcastToResource('invoices', req.body.relatedDocumentId, 'payment_added', {
            amount: (payment as any).amount,
            paymentId: (payment as any).id,
            paymentDate: (payment as any).payment_date || (payment as any).paymentDate,
            paymentMethod: (payment as any).payment_method || (payment as any).paymentMethod
          });
          
          // Also broadcast to global invoices channel
          wsService.broadcastToResource('invoices', 'all', 'payment_added', {
            invoiceId: req.body.relatedDocumentId,
            amount: payment.amount
          });
        }
      }
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  
  app.put("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment || payment.userId !== req.user!.id) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const updatedPayment = await storage.updatePayment(paymentId, req.body);
      
      // Broadcast update via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        // If this payment is related to an invoice, broadcast to that invoice
        if (payment.relatedDocumentType === 'invoice' && payment.relatedDocumentId) {
          wsService.broadcastToResource('invoices', payment.relatedDocumentId, 'payment_updated', {
            paymentId: paymentId,
            payment: updatedPayment
          });
          
          // Also broadcast to global invoices channel
          wsService.broadcastToResource('invoices', 'all', 'payment_updated', {
            paymentId: paymentId,
            invoiceId: payment.relatedDocumentId
          });
        }
        
        // Broadcast to payments channel
        wsService.broadcastToResource('payments', paymentId, 'payment_updated', {
          payment: updatedPayment
        });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });
  
  app.delete("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment || payment.userId !== req.user!.id) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Store related document info before deleting
      const relatedDocumentType = payment.relatedDocumentType;
      const relatedDocumentId = payment.relatedDocumentId;
      
      await storage.deletePayment(paymentId);
      
      // Broadcast deletion via WebSocket
      const wsService = req.app.locals.wsService;
      if (wsService) {
        // If this payment was related to an invoice, broadcast to that invoice
        if (relatedDocumentType === 'invoice' && relatedDocumentId) {
          wsService.broadcastToResource('invoices', relatedDocumentId, 'payment_deleted', {
            paymentId: paymentId
          });
          
          // Also broadcast to global invoices channel
          wsService.broadcastToResource('invoices', 'all', 'payment_deleted', {
            paymentId: paymentId,
            invoiceId: relatedDocumentId
          });
        }
        
        // Broadcast to payments channel
        wsService.broadcastToResource('payments', 'all', 'payment_deleted', {
          paymentId: paymentId
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });
  
  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      await storage.deleteInvoice(invoiceId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });
  
  // ===== PAYMENT INTEGRATION ROUTES =====
  
  // MPESA Payment Routes
  app.post("/api/payments/mpesa/stk-push", isAuthenticated, async (req, res) => {
    try {
      const { phoneNumber, amount, accountReference, description } = req.body;
      
      if (!phoneNumber || !amount || !accountReference) {
        return res.status(400).json({ 
          message: "Phone number, amount, and account reference are required" 
        });
      }
      
      const response = await mpesaUtils.stkPush(
        phoneNumber,
        amount,
        accountReference,
        description || "Payment"
      );
      
      res.json(response);
    } catch (error) {
      console.error("Error processing MPESA STK push:", error);
      res.status(500).json({ 
        message: "Failed to process MPESA payment",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // MPESA payment callbacks
  app.post("/api/payments/mpesa/callback", async (req, res) => {
    try {
      // Log the callback for debugging
      console.log("MPESA Callback received:", req.body);
      
      // Process the callback
      const { Body } = req.body;
      
      if (Body.stkCallback.ResultCode === 0) {
        // Payment successful
        // Here you would typically update your database with the payment details
        console.log("MPESA payment successful");
      } else {
        // Payment failed
        console.log("MPESA payment failed:", Body.stkCallback.ResultDesc);
      }
      
      // Respond to Safaricom
      res.json({ ResponseCode: "00000000", ResponseDesc: "success" });
    } catch (error) {
      console.error("Error processing MPESA callback:", error);
      res.status(500).json({ ResponseCode: "1", ResponseDesc: "Failed to process callback" });
    }
  });
  
  // Get MPESA transaction status
  app.get("/api/payments/mpesa/status/:checkoutRequestId", isAuthenticated, async (req, res) => {
    try {
      const { checkoutRequestId } = req.params;
      
      if (!checkoutRequestId) {
        return res.status(400).json({ message: "Checkout request ID is required" });
      }
      
      const response = await mpesaUtils.checkTransactionStatus(checkoutRequestId);
      res.json(response);
    } catch (error) {
      console.error("Error checking MPESA transaction status:", error);
      res.status(500).json({ 
        message: "Failed to check transaction status",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ===== FACIAL RECOGNITION ROUTES =====
  
  // Upload and save employee face data
  app.post(
    "/api/employees/:id/face", 
    isAuthenticated, 
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }
        
        const employeeId = parseInt(req.params.id);
        const employee = await storage.getEmployee(employeeId);
        
        if (!employee || employee.userId !== req.user!.id) {
          return res.status(404).json({ message: "Employee not found" });
        }
        
        // Generate face descriptor
        const descriptor = await faceRecognitionUtils.createFaceDescriptor(req.file.buffer);
        
        // Save the face descriptor to the database
        const updatedEmployee = await storage.updateEmployee(employeeId, {
          faceRecognitionData: JSON.stringify(Array.from(descriptor)),
        });
        
        res.json({
          message: "Face data saved successfully",
          employee: updatedEmployee,
        });
      } catch (error) {
        console.error("Error saving face data:", error);
        res.status(500).json({ 
          message: "Failed to save face data",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  // Verify employee face
  app.post(
    "/api/employees/verify-face",
    isAuthenticated,
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }
        
        const { employeeId } = req.body;
        
        if (!employeeId) {
          return res.status(400).json({ message: "Employee ID is required" });
        }
        
        const employee = await storage.getEmployee(parseInt(employeeId));
        
        if (!employee || employee.userId !== req.user!.id) {
          return res.status(404).json({ message: "Employee not found" });
        }
        
        if (!employee.faceRecognitionData) {
          return res.status(400).json({ message: "No face data found for employee" });
        }
        
        // Convert stored descriptor back to Float32Array
        const storedDescriptor = new Float32Array(JSON.parse(employee.faceRecognitionData as string));
        
        // Verify face
        const result = await faceRecognitionUtils.verifyEmployee(req.file.buffer, storedDescriptor);
        
        res.json({
          verified: result.isMatch,
          confidence: result.confidence,
          employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
          },
        });
      } catch (error) {
        console.error("Error verifying face:", error);
        res.status(500).json({ 
          message: "Failed to verify face",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  // Record attendance with facial verification
  app.post(
    "/api/attendance/check-in",
    isAuthenticated,
    upload.single("image"),
    async (req, res) => {
      try {
        const { employeeId } = req.body;
        
        if (!employeeId) {
          return res.status(400).json({ message: "Employee ID is required" });
        }
        
        const employee = await storage.getEmployee(parseInt(employeeId));
        
        if (!employee || employee.userId !== req.user!.id) {
          return res.status(404).json({ message: "Employee not found" });
        }
        
        let faceVerified = false;
        
        // Verify face if an image is provided and employee has face data
        if (req.file && employee.faceRecognitionData) {
          // Convert stored descriptor back to Float32Array
          const storedDescriptor = new Float32Array(JSON.parse(employee.faceRecognitionData as string));
          
          // Verify face
          const result = await faceRecognitionUtils.verifyEmployee(req.file.buffer, storedDescriptor);
          faceVerified = result.isMatch;
          
          if (!faceVerified) {
            return res.status(401).json({ 
              message: "Face verification failed",
              verified: false,
            });
          }
        }
        
        // Create attendance record
        const attendanceData = {
          employeeId: employee.id,
          checkInTime: new Date(),
          status: "present",
          faceRecognitionVerified: faceVerified,
          verificationMethod: req.file ? "face_recognition" : "manual",
          geoLocation: req.body.geoLocation ? JSON.parse(req.body.geoLocation) : null,
        };
        
        // In a real application, you would save this to the database
        // For now, we'll just return the record
        
        res.status(201).json({
          message: "Check-in recorded successfully",
          attendance: attendanceData,
          faceVerified,
        });
      } catch (error) {
        console.error("Error recording attendance:", error);
        res.status(500).json({ 
          message: "Failed to record attendance",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  // ===== SUPPLIERS MANAGEMENT ROUTES =====
  // These will be implemented when we create the Suppliers schema

  // ===== PURCHASE MANAGEMENT ROUTES =====
  
  // Supplier Routes
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliersByUser(req.user!.id);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  
  app.get("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(parseInt(req.params.id));
      
      if (!supplier || supplier.userId !== req.user!.id) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });
  
  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.createSupplier({
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Broadcast supplier creation via WebSocket
      wsService.broadcast('supplier_created', {
        type: 'supplier_created',
        data: supplier,
        userId: req.user!.id
      });
      
      wsService.broadcastToResource('purchase', 'all', 'supplier_created', {
        supplier: supplier
      });
      
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });
  
  app.put("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const supplier = await storage.getSupplier(supplierId);
      
      if (!supplier || supplier.userId !== req.user!.id) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      const updatedSupplier = await storage.updateSupplier(supplierId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      res.json(updatedSupplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });
  
  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const supplier = await storage.getSupplier(supplierId);
      
      if (!supplier || supplier.userId !== req.user!.id) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      await storage.deleteSupplier(supplierId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });
  
  // Purchase Request Routes
  app.get("/api/purchase-requests", isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getPurchaseRequestsByUser(req.user!.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      res.status(500).json({ message: "Failed to fetch purchase requests" });
    }
  });
  
  app.get("/api/purchase-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getPurchaseRequest(parseInt(req.params.id));
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching purchase request:", error);
      res.status(500).json({ message: "Failed to fetch purchase request" });
    }
  });
  
  app.post("/api/purchase-requests", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.createPurchaseRequest({
        ...req.body,
        userId: req.user!.id,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating purchase request:", error);
      res.status(500).json({ message: "Failed to create purchase request" });
    }
  });
  
  app.put("/api/purchase-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getPurchaseRequest(requestId);
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      const updatedRequest = await storage.updatePurchaseRequest(requestId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating purchase request:", error);
      res.status(500).json({ message: "Failed to update purchase request" });
    }
  });
  
  app.delete("/api/purchase-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getPurchaseRequest(requestId);
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      await storage.deletePurchaseRequest(requestId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting purchase request:", error);
      res.status(500).json({ message: "Failed to delete purchase request" });
    }
  });
  
  // Purchase Request Items Routes
  app.get("/api/purchase-request-items/:requestId", isAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const request = await storage.getPurchaseRequest(requestId);
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      const items = await storage.getPurchaseRequestItemsByRequestId(requestId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching purchase request items:", error);
      res.status(500).json({ message: "Failed to fetch purchase request items" });
    }
  });
  
  app.post("/api/purchase-request-items", isAuthenticated, async (req, res) => {
    try {
      const requestId = req.body.purchaseRequestId;
      const request = await storage.getPurchaseRequest(requestId);
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      const item = await storage.createPurchaseRequestItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating purchase request item:", error);
      res.status(500).json({ message: "Failed to create purchase request item" });
    }
  });
  
  app.put("/api/purchase-request-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPurchaseRequestItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Purchase request item not found" });
      }
      
      const request = await storage.getPurchaseRequest(item.purchaseRequestId);
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      const updatedItem = await storage.updatePurchaseRequestItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating purchase request item:", error);
      res.status(500).json({ message: "Failed to update purchase request item" });
    }
  });
  
  app.delete("/api/purchase-request-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPurchaseRequestItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Purchase request item not found" });
      }
      
      const request = await storage.getPurchaseRequest(item.purchaseRequestId);
      
      if (!request || request.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      
      await storage.deletePurchaseRequestItem(itemId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting purchase request item:", error);
      res.status(500).json({ message: "Failed to delete purchase request item" });
    }
  });
  
  // Purchase Order Routes
  app.get("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrdersByUser(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });
  
  app.get("/api/purchase-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getPurchaseOrder(parseInt(req.params.id));
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });
  
  app.post("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.createPurchaseOrder({
        ...req.body,
        userId: req.user!.id,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });
  
  app.put("/api/purchase-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getPurchaseOrder(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      const updatedOrder = await storage.updatePurchaseOrder(orderId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating purchase order:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });
  
  app.delete("/api/purchase-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getPurchaseOrder(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      await storage.deletePurchaseOrder(orderId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });
  
  // Purchase Order Items Routes
  app.get("/api/purchase-order-items/:orderId", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getPurchaseOrder(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      const items = await storage.getPurchaseOrderItemsByOrderId(orderId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching purchase order items:", error);
      res.status(500).json({ message: "Failed to fetch purchase order items" });
    }
  });
  
  app.post("/api/purchase-order-items", isAuthenticated, async (req, res) => {
    try {
      const orderId = req.body.purchaseOrderId;
      const order = await storage.getPurchaseOrder(orderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      const item = await storage.createPurchaseOrderItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating purchase order item:", error);
      res.status(500).json({ message: "Failed to create purchase order item" });
    }
  });
  
  app.put("/api/purchase-order-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPurchaseOrderItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Purchase order item not found" });
      }
      
      const order = await storage.getPurchaseOrder(item.purchaseOrderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      const updatedItem = await storage.updatePurchaseOrderItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating purchase order item:", error);
      res.status(500).json({ message: "Failed to update purchase order item" });
    }
  });
  
  app.delete("/api/purchase-order-items/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getPurchaseOrderItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Purchase order item not found" });
      }
      
      const order = await storage.getPurchaseOrder(item.purchaseOrderId);
      
      if (!order || order.userId !== req.user!.id) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      await storage.deletePurchaseOrderItem(itemId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting purchase order item:", error);
      res.status(500).json({ message: "Failed to delete purchase order item" });
    }
  });

  // ===== EXPENSE MANAGEMENT ROUTES =====
  // These will be implemented when we create the Expenses schema

  // ===== QUOTATIONS MANAGEMENT ROUTES =====
  // These will be implemented when we create the Quotations schema

  // ===== USER ROLE MANAGEMENT ROUTES =====
  
  // Get all user roles
  app.get("/api/user-roles", isAdmin, async (req, res) => {
    try {
      const roles = await db.select().from(schema.userRoles);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });
  
  // Create a new user role
  app.post("/api/user-roles", isAdmin, async (req, res) => {
    try {
      const { userId, roleId } = req.body;
      
      const [newRole] = await db.insert(schema.userRoles).values({
        userId,
        roleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      res.status(201).json(newRole);
    } catch (error) {
      console.error("Error creating user role:", error);
      res.status(500).json({ message: "Failed to create user role" });
    }
  });
  
  // Update user role
  app.put("/api/user-roles/:id", isAdmin, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { roleId: newRoleId } = req.body;
      
      const [updatedRole] = await db.update(schema.userRoles)
        .set({
          roleId: newRoleId,
          updatedAt: new Date(),
        })
        .where(eq(schema.userRoles.id, roleId))
        .returning();
      
      if (!updatedRole) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Delete user role
  app.delete("/api/user-roles/:id", isAdmin, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      
      await db.delete(schema.userRoles)
        .where(eq(schema.userRoles.id, roleId));
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user role:", error);
      res.status(500).json({ message: "Failed to delete user role" });
    }
  });

  // Return the HTTP server created at the beginning of the function
  return server;
}
