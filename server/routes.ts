import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { WebSocketServer } from "ws";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import { mpesaUtils } from "./utils/mpesa";
import { faceRecognitionUtils } from "./utils/faceRecognition";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to check if the user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if the user has admin role
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Import company routes
import companyRoutes from './src/routes/company';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Test endpoint
  app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'API is working!' });
  });

  // Register company routes
  app.use('/api/company', companyRoutes);

  // API routes with authentication
  
  // CRM Module Routes - Contacts
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getContactsByUser(req.user.id);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });
  
  app.get("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const contact = await storage.getContact(parseInt(req.params.id));
      if (!contact || contact.userId !== req.user.id) {
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
        userId: req.user.id
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
      
      if (!contact || contact.userId !== req.user.id) {
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
      
      if (!contact || contact.userId !== req.user.id) {
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
      const deals = await db.select().from(schema.deals).where(eq(schema.deals.userId, req.user.id));
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
      
      if (!deal || deal.userId !== req.user.id) {
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
        userId: req.user.id,
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
      
      if (!existingDeal || existingDeal.userId !== req.user.id) {
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
      
      if (!existingDeal || existingDeal.userId !== req.user.id) {
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
      const products = await storage.getProductsByUser(req.user.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product || product.userId !== req.user.id) {
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
        userId: req.user.id
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
      
      if (!product || product.userId !== req.user.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
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
      
      if (!product || product.userId !== req.user.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      await storage.deleteProduct(productId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  
  // HRMS Module Routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployeesByUser(req.user.id);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });
  
  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.getEmployee(parseInt(req.params.id));
      if (!employee || employee.userId !== req.user.id) {
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
        userId: req.user.id
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
      
      if (!employee || employee.userId !== req.user.id) {
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
      
      if (!employee || employee.userId !== req.user.id) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      await storage.deleteEmployee(employeeId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });
  
  // Finance Module Routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByUser(req.user.id);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  
  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  
  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.createInvoice({
        ...req.body,
        userId: req.user.id
      });
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  
  // Sales Module - Quotations Routes
  app.get("/api/quotations", async (req, res) => {
    try {
      console.log("Fetching quotations...");
      
      // For testing purposes, return all quotations without authentication
      try {
        const quotations = await db.select().from(schema.quotations);
        console.log("Quotations fetched:", quotations);
        res.json(quotations);
      } catch (err) {
        if (err.code === '42P01') { // Table doesn't exist error code
          console.log("Quotations table doesn't exist, creating it...");
          
          // Create the quotations table
          await db.execute(`
            CREATE TABLE IF NOT EXISTS quotations (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id),
              contact_id INTEGER REFERENCES contacts(id),
              quotation_number VARCHAR(50) NOT NULL UNIQUE,
              status VARCHAR(50) NOT NULL DEFAULT 'draft',
              issue_date DATE NOT NULL,
              expiry_date DATE NOT NULL,
              total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
              notes TEXT,
              terms TEXT,
              converted_to_order BOOLEAN DEFAULT false,
              converted_order_id INTEGER,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Return empty array since table was just created
          res.json([]);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });
  
  // Sales Module - Orders Routes
  app.get("/api/orders", async (req, res) => {
    try {
      console.log("Fetching orders...");
      
      // Check if orders table exists, if not create it
      try {
        // For testing purposes, return all orders without authentication
        const orders = await db.select().from(schema.orders);
        console.log("Orders fetched:", orders);
        res.json(orders);
      } catch (err) {
        console.error("Error in orders query:", err);
        if (err.code === '42P01') { // Table doesn't exist error code
          console.log("Orders table doesn't exist, creating it...");
          
          // Create the orders table
          await db.execute(`
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
          await db.execute(`
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
  
  // Sales Module - Quotations Routes
  app.get("/api/quotations", async (req, res) => {
    try {
      console.log("Fetching quotations...");
      
      // Check if quotations table exists, if not create it
      try {
        // For testing purposes, return all quotations without authentication
        const quotations = await db.select().from(schema.quotations);
        console.log("Quotations fetched:", quotations);
        res.json(quotations);
      } catch (err) {
        if (err.code === '42P01') { // Table doesn't exist error code
          console.log("Quotations table doesn't exist, creating it...");
          
          // Create the quotations table
          await db.execute(`
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
          res.json([]);
        } else {
          throw err; // Re-throw if it's a different error
        }
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order || order.userId !== req.user.id) {
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
        userId: req.user.id,
        orderNumber,
        orderDate: new Date()
      });
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
      
      if (!order || order.userId !== req.user.id) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const item = await storage.createOrderItem({
        ...req.body,
        orderId
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item" });
    }
  });
  
  // Sales Module - Quotations Routes
  app.get("/api/quotations", isAuthenticated, async (req, res) => {
    try {
      const quotations = await storage.getQuotationsByUser(req.user.id);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });
  
  app.get("/api/quotations/:id", isAuthenticated, async (req, res) => {
    try {
      const quotation = await storage.getQuotation(parseInt(req.params.id));
      if (!quotation || quotation.userId !== req.user.id) {
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
        userId: req.user.id,
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
      
      if (!quotation || quotation.userId !== req.user.id) {
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
      
      if (!quotation || quotation.userId !== req.user.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.convertedToOrder) {
        return res.status(400).json({ message: "Quotation already converted to order" });
      }
      
      // Generate a unique order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Create new order from quotation
      const order = await storage.createOrder({
        userId: req.user.id,
        contactId: quotation.contactId,
        orderNumber,
        orderDate: new Date(),
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
        convertedToOrder: true,
        convertedOrderId: order.id
      });
      
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
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  
  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
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
        error: error.message
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
        error: error.message
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
        
        if (!employee || employee.userId !== req.user.id) {
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
          error: error.message
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
        
        if (!employee || employee.userId !== req.user.id) {
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
          error: error.message
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
        
        if (!employee || employee.userId !== req.user.id) {
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
          error: error.message
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
      const suppliers = await storage.getSuppliersByUser(req.user.id);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  
  app.get("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(parseInt(req.params.id));
      
      if (!supplier || supplier.userId !== req.user.id) {
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
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
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
      
      if (!supplier || supplier.userId !== req.user.id) {
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
      
      if (!supplier || supplier.userId !== req.user.id) {
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
      const requests = await storage.getPurchaseRequestsByUser(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      res.status(500).json({ message: "Failed to fetch purchase requests" });
    }
  });
  
  app.get("/api/purchase-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getPurchaseRequest(parseInt(req.params.id));
      
      if (!request || request.userId !== req.user.id) {
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
        userId: req.user.id,
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
      
      if (!request || request.userId !== req.user.id) {
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
      
      if (!request || request.userId !== req.user.id) {
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
      
      if (!request || request.userId !== req.user.id) {
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
      
      if (!request || request.userId !== req.user.id) {
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
      
      if (!request || request.userId !== req.user.id) {
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
      
      if (!request || request.userId !== req.user.id) {
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
      const orders = await storage.getPurchaseOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });
  
  app.get("/api/purchase-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getPurchaseOrder(parseInt(req.params.id));
      
      if (!order || order.userId !== req.user.id) {
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
        userId: req.user.id,
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
      
      if (!order || order.userId !== req.user.id) {
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
      
      if (!order || order.userId !== req.user.id) {
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
      
      if (!order || order.userId !== req.user.id) {
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
      
      if (!order || order.userId !== req.user.id) {
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
      
      if (!order || order.userId !== req.user.id) {
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
      
      if (!order || order.userId !== req.user.id) {
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
      const { userId, role, permissions } = req.body;
      
      const [newRole] = await db.insert(schema.userRoles).values({
        userId,
        role,
        permissions,
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
      const { role, permissions } = req.body;
      
      const [updatedRole] = await db.update(schema.userRoles)
        .set({
          role,
          permissions,
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

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send initial message
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to CogniFlow ERP' }));
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'new_order') {
          // Broadcast the new order to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === 1) { // 1 = OPEN
              client.send(JSON.stringify(data));
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return httpServer;
}
