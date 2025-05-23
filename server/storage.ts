import { 
  users, type User, type InsertUser, 
  contacts, type Contact, type InsertContact, 
  products, type Product, type InsertProduct, 
  employees, type Employee, type InsertEmployee, 
  invoices, type Invoice, type InsertInvoice,
  suppliers, type Supplier, type InsertSupplier,
  purchaseRequests, type PurchaseRequest, type InsertPurchaseRequest,
  purchaseRequestItems, type PurchaseRequestItem, type InsertPurchaseRequestItem,
  purchaseOrders, type PurchaseOrder, type InsertPurchaseOrder,
  purchaseOrderItems, type PurchaseOrderItem, type InsertPurchaseOrderItem
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

// Create PostgreSQL-based session store
const PostgresSessionStore = connectPg(session);

// Define the interface for our storage system
export interface IStorage {
  // Authentication/Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // CRM
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByUser(userId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Inventory
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByUser(userId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // HRMS
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeesByUser(userId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Finance
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUser(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Purchase Management - Suppliers
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSuppliersByUser(userId: number): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  
  // Purchase Management - Purchase Requests
  getPurchaseRequest(id: number): Promise<PurchaseRequest | undefined>;
  getPurchaseRequestsByUser(userId: number): Promise<PurchaseRequest[]>;
  createPurchaseRequest(purchaseRequest: InsertPurchaseRequest): Promise<PurchaseRequest>;
  updatePurchaseRequest(id: number, data: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest | undefined>;
  deletePurchaseRequest(id: number): Promise<boolean>;
  
  // Purchase Management - Purchase Request Items
  getPurchaseRequestItem(id: number): Promise<PurchaseRequestItem | undefined>;
  getPurchaseRequestItemsByRequestId(requestId: number): Promise<PurchaseRequestItem[]>;
  createPurchaseRequestItem(requestItem: InsertPurchaseRequestItem): Promise<PurchaseRequestItem>;
  updatePurchaseRequestItem(id: number, data: Partial<InsertPurchaseRequestItem>): Promise<PurchaseRequestItem | undefined>;
  deletePurchaseRequestItem(id: number): Promise<boolean>;
  
  // Purchase Management - Purchase Orders
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  getPurchaseOrdersByUser(userId: number): Promise<PurchaseOrder[]>;
  createPurchaseOrder(purchaseOrder: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  deletePurchaseOrder(id: number): Promise<boolean>;
  
  // Purchase Management - Purchase Order Items
  getPurchaseOrderItem(id: number): Promise<PurchaseOrderItem | undefined>;
  getPurchaseOrderItemsByOrderId(orderId: number): Promise<PurchaseOrderItem[]>;
  createPurchaseOrderItem(orderItem: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: number, data: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined>;
  deletePurchaseOrderItem(id: number): Promise<boolean>;
  
  // Session store for auth
  sessionStore: session.Store;
}

// Implementation with Postgres database
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Contact management (CRM)
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }
  
  async getContactsByUser(userId: number): Promise<Contact[]> {
    const contactList = await db.select().from(contacts).where(eq(contacts.userId, userId));
    return contactList;
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }
  
  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(data)
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }
  
  async deleteContact(id: number): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(eq(contacts.id, id));
    return true;
  }
  
  // Product management (Inventory)
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductsByUser(userId: number): Promise<Product[]> {
    const productList = await db.select().from(products).where(eq(products.userId, userId));
    return productList;
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }
  
  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return product;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    await db
      .delete(products)
      .where(eq(products.id, id));
    return true;
  }
  
  // Employee management (HRMS)
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }
  
  async getEmployeesByUser(userId: number): Promise<Employee[]> {
    const employeeList = await db.select().from(employees).where(eq(employees.userId, userId));
    return employeeList;
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }
  
  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set(data)
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    await db
      .delete(employees)
      .where(eq(employees.id, id));
    return true;
  }
  
  // Invoice management (Finance)
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async getInvoicesByUser(userId: number): Promise<Invoice[]> {
    const invoiceList = await db.select().from(invoices).where(eq(invoices.userId, userId));
    return invoiceList;
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }
  
  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set(data)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));
    return true;
  }

  // Supplier management (Purchase Management)
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }
  
  async getSuppliersByUser(userId: number): Promise<Supplier[]> {
    const supplierList = await db.select().from(suppliers).where(eq(suppliers.userId, userId));
    return supplierList;
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }
  
  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(data)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }
  
  async deleteSupplier(id: number): Promise<boolean> {
    await db
      .delete(suppliers)
      .where(eq(suppliers.id, id));
    return true;
  }

  // Purchase Request management
  async getPurchaseRequest(id: number): Promise<PurchaseRequest | undefined> {
    const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id));
    return request;
  }
  
  async getPurchaseRequestsByUser(userId: number): Promise<PurchaseRequest[]> {
    const requestList = await db.select().from(purchaseRequests).where(eq(purchaseRequests.userId, userId));
    return requestList;
  }
  
  async createPurchaseRequest(request: InsertPurchaseRequest): Promise<PurchaseRequest> {
    // Generate a unique request number
    const requestNumber = `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const [newRequest] = await db
      .insert(purchaseRequests)
      .values({
        ...request,
        requestNumber,
        requestDate: new Date(),
      })
      .returning();
    return newRequest;
  }
  
  async updatePurchaseRequest(id: number, data: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest | undefined> {
    const [request] = await db
      .update(purchaseRequests)
      .set(data)
      .where(eq(purchaseRequests.id, id))
      .returning();
    return request;
  }
  
  async deletePurchaseRequest(id: number): Promise<boolean> {
    await db
      .delete(purchaseRequests)
      .where(eq(purchaseRequests.id, id));
    return true;
  }

  // Purchase Request Item management
  async getPurchaseRequestItem(id: number): Promise<PurchaseRequestItem | undefined> {
    const [item] = await db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.id, id));
    return item;
  }
  
  async getPurchaseRequestItemsByRequestId(requestId: number): Promise<PurchaseRequestItem[]> {
    const itemList = await db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.purchaseRequestId, requestId));
    return itemList;
  }
  
  async createPurchaseRequestItem(item: InsertPurchaseRequestItem): Promise<PurchaseRequestItem> {
    // Calculate estimated total
    let estimatedTotal = 0;
    if (item.quantity && item.estimatedUnitPrice) {
      estimatedTotal = item.quantity * item.estimatedUnitPrice;
    }
    
    const [newItem] = await db
      .insert(purchaseRequestItems)
      .values({
        ...item,
        estimatedTotal
      })
      .returning();
    
    // Update the purchase request's total amount
    const items = await this.getPurchaseRequestItemsByRequestId(item.purchaseRequestId);
    const totalAmount = items.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);
    
    await db
      .update(purchaseRequests)
      .set({ totalAmount })
      .where(eq(purchaseRequests.id, item.purchaseRequestId));
    
    return newItem;
  }
  
  async updatePurchaseRequestItem(id: number, data: Partial<InsertPurchaseRequestItem>): Promise<PurchaseRequestItem | undefined> {
    const [item] = await db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.id, id));
    
    // Recalculate estimated total if needed
    let estimatedTotal = item.estimatedTotal;
    if ((data.quantity || item.quantity) && (data.estimatedUnitPrice || item.estimatedUnitPrice)) {
      estimatedTotal = (data.quantity || item.quantity) * (data.estimatedUnitPrice || item.estimatedUnitPrice);
    }
    
    const [updatedItem] = await db
      .update(purchaseRequestItems)
      .set({
        ...data,
        estimatedTotal
      })
      .where(eq(purchaseRequestItems.id, id))
      .returning();
    
    // Update the purchase request's total amount
    const items = await this.getPurchaseRequestItemsByRequestId(item.purchaseRequestId);
    const totalAmount = items.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);
    
    await db
      .update(purchaseRequests)
      .set({ totalAmount })
      .where(eq(purchaseRequests.id, item.purchaseRequestId));
    
    return updatedItem;
  }
  
  async deletePurchaseRequestItem(id: number): Promise<boolean> {
    const [item] = await db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.id, id));
    const requestId = item.purchaseRequestId;
    
    await db
      .delete(purchaseRequestItems)
      .where(eq(purchaseRequestItems.id, id));
    
    // Update the purchase request's total amount
    const items = await this.getPurchaseRequestItemsByRequestId(requestId);
    const totalAmount = items.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);
    
    await db
      .update(purchaseRequests)
      .set({ totalAmount })
      .where(eq(purchaseRequests.id, requestId));
    
    return true;
  }

  // Purchase Order management
  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }
  
  async getPurchaseOrdersByUser(userId: number): Promise<PurchaseOrder[]> {
    const orderList = await db.select().from(purchaseOrders).where(eq(purchaseOrders.userId, userId));
    return orderList;
  }
  
  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    // Generate a unique order number
    const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const [newOrder] = await db
      .insert(purchaseOrders)
      .values({
        ...order,
        orderNumber,
        orderDate: new Date(),
      })
      .returning();
    return newOrder;
  }
  
  async updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [order] = await db
      .update(purchaseOrders)
      .set(data)
      .where(eq(purchaseOrders.id, id))
      .returning();
    return order;
  }
  
  async deletePurchaseOrder(id: number): Promise<boolean> {
    await db
      .delete(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    return true;
  }

  // Purchase Order Item management
  async getPurchaseOrderItem(id: number): Promise<PurchaseOrderItem | undefined> {
    const [item] = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id));
    return item;
  }
  
  async getPurchaseOrderItemsByOrderId(orderId: number): Promise<PurchaseOrderItem[]> {
    const itemList = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, orderId));
    return itemList;
  }
  
  async createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    // Calculate total
    const total = item.quantity * item.unitPrice;
    
    // Calculate tax amount if applicable
    let taxAmount = 0;
    if (item.taxRate) {
      taxAmount = total * (item.taxRate / 100);
    }
    
    const [newItem] = await db
      .insert(purchaseOrderItems)
      .values({
        ...item,
        taxAmount,
        total,
        receivedQuantity: 0
      })
      .returning();
    
    // Update the purchase order's subtotal, tax amount, and total amount
    const items = await this.getPurchaseOrderItemsByOrderId(item.purchaseOrderId);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalTaxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    
    // Get existing purchase order to get shipping amount and discount amount
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, item.purchaseOrderId));
    const shippingAmount = order.shippingAmount || 0;
    const discountAmount = order.discountAmount || 0;
    
    const totalAmount = subtotal + totalTaxAmount + shippingAmount - discountAmount;
    
    await db
      .update(purchaseOrders)
      .set({ 
        subtotal,
        taxAmount: totalTaxAmount,
        totalAmount
      })
      .where(eq(purchaseOrders.id, item.purchaseOrderId));
    
    return newItem;
  }
  
  async updatePurchaseOrderItem(id: number, data: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined> {
    const [item] = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id));
    
    // Recalculate total and tax amount if needed
    let quantity = data.quantity !== undefined ? data.quantity : item.quantity;
    let unitPrice = data.unitPrice !== undefined ? data.unitPrice : item.unitPrice;
    let taxRate = data.taxRate !== undefined ? data.taxRate : item.taxRate;
    
    const total = quantity * unitPrice;
    let taxAmount = 0;
    if (taxRate) {
      taxAmount = total * (taxRate / 100);
    }
    
    const [updatedItem] = await db
      .update(purchaseOrderItems)
      .set({
        ...data,
        taxAmount,
        total
      })
      .where(eq(purchaseOrderItems.id, id))
      .returning();
    
    // Update the purchase order's subtotal, tax amount, and total amount
    const items = await this.getPurchaseOrderItemsByOrderId(item.purchaseOrderId);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalTaxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    
    // Get existing purchase order to get shipping amount and discount amount
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, item.purchaseOrderId));
    const shippingAmount = order.shippingAmount || 0;
    const discountAmount = order.discountAmount || 0;
    
    const totalAmount = subtotal + totalTaxAmount + shippingAmount - discountAmount;
    
    await db
      .update(purchaseOrders)
      .set({ 
        subtotal,
        taxAmount: totalTaxAmount,
        totalAmount
      })
      .where(eq(purchaseOrders.id, item.purchaseOrderId));
    
    return updatedItem;
  }
  
  async deletePurchaseOrderItem(id: number): Promise<boolean> {
    const [item] = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id));
    const orderId = item.purchaseOrderId;
    
    await db
      .delete(purchaseOrderItems)
      .where(eq(purchaseOrderItems.id, id));
    
    // Update the purchase order's subtotal, tax amount, and total amount
    const items = await this.getPurchaseOrderItemsByOrderId(orderId);
    
    if (items.length === 0) {
      // If all items are deleted, reset the order totals
      await db
        .update(purchaseOrders)
        .set({ 
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0
        })
        .where(eq(purchaseOrders.id, orderId));
    } else {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const totalTaxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      
      // Get existing purchase order to get shipping amount and discount amount
      const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId));
      const shippingAmount = order.shippingAmount || 0;
      const discountAmount = order.discountAmount || 0;
      
      const totalAmount = subtotal + totalTaxAmount + shippingAmount - discountAmount;
      
      await db
        .update(purchaseOrders)
        .set({ 
          subtotal,
          taxAmount: totalTaxAmount,
          totalAmount
        })
        .where(eq(purchaseOrders.id, orderId));
    }
    
    return true;
  }
}

export const storage = new DatabaseStorage();
