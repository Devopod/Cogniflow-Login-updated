import { 
  users, type User, type InsertUser, 
  contacts, type Contact, type InsertContact, 
  products, type Product, type InsertProduct, 
  employees, type Employee, type InsertEmployee, 
  invoices, type Invoice, type InsertInvoice,
  invoiceItems, type InvoiceItem, type InsertInvoiceItem,
  payments, type Payment, type InsertPayment,
  taxRates, type TaxRate, type InsertTaxRate,
  invoiceTemplates, type InvoiceTemplate, type InsertInvoiceTemplate,
  emailTemplates, type EmailTemplate, type InsertEmailTemplate,
  invoiceActivities, type InvoiceActivity, type InsertInvoiceActivity,
  paymentLinks, type PaymentLink, type InsertPaymentLink,
  currencyRates, type CurrencyRate, type InsertCurrencyRate,
  suppliers, type Supplier, type InsertSupplier,
  purchaseRequests, type PurchaseRequest, type InsertPurchaseRequest,
  purchaseRequestItems, type PurchaseRequestItem, type InsertPurchaseRequestItem,
  purchaseOrders, type PurchaseOrder, type InsertPurchaseOrder,
  purchaseOrderItems, type PurchaseOrderItem, type InsertPurchaseOrderItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  quotations, type Quotation, type InsertQuotation,
  quotationItems, type QuotationItem, type InsertQuotationItem,
  auditLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import { Resend } from 'resend';
import Stripe from 'stripe';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { wsService } from './src/services/websocket';

// Create PostgreSQL-based session store
const PostgresSessionStore = connectPg(session);

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' });

// Define the interface for our storage system
export interface IStorage {
  // Authentication/Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser> & Partial<Omit<User, keyof InsertUser>>): Promise<User | undefined>;
  
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
  
  // Finance - Invoices
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUser(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getInvoiceWithItems(id: number): Promise<Invoice & { items: InvoiceItem[] } | undefined>;
  
  // Finance - Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]>;
  createPayment(payment: Partial<InsertPayment>): Promise<Payment>;
  updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  
  // Tax Rates
  getTaxRate(id: number): Promise<TaxRate | undefined>;
  getTaxRatesByUser(userId: number): Promise<TaxRate[]>;
  createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate>;
  updateTaxRate(id: number, data: Partial<InsertTaxRate>): Promise<TaxRate | undefined>;
  deleteTaxRate(id: number): Promise<boolean>;
  
  // Invoice Templates
  getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
  getInvoiceTemplatesByUser(userId: number): Promise<InvoiceTemplate[]>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
  deleteInvoiceTemplate(id: number): Promise<boolean>;
  
  // Email Templates
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplatesByUser(userId: number): Promise<EmailTemplate[]>;
  getEmailTemplateByType(userId: number, templateType: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // Invoice Activities
  getInvoiceActivity(id: number): Promise<InvoiceActivity | undefined>;
  getInvoiceActivitiesByInvoice(invoiceId: number): Promise<InvoiceActivity[]>;
  createInvoiceActivity(activity: InsertInvoiceActivity): Promise<InvoiceActivity>;
  
  // Payment Links
  getPaymentLink(id: number): Promise<PaymentLink | undefined>;
  getPaymentLinkByToken(token: string): Promise<PaymentLink | undefined>;
  getPaymentLinksByInvoice(invoiceId: number): Promise<PaymentLink[]>;
  createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink>;
  updatePaymentLink(id: number, data: Partial<InsertPaymentLink>): Promise<PaymentLink | undefined>;
  deletePaymentLink(id: number): Promise<boolean>;
  
  // Currency Rates
  getCurrencyRate(fromCurrency: string, toCurrency: string, date?: string): Promise<CurrencyRate | undefined>;
  getCurrencyRatesByDate(date: string): Promise<CurrencyRate[]>;
  createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate>;
  updateCurrencyRate(id: number, data: Partial<InsertCurrencyRate>): Promise<CurrencyRate | undefined>;
  
  // Enhanced Invoice Methods
  generateInvoiceNumber(userId: number, prefix?: string): Promise<string>;
  createRecurringInvoice(parentInvoiceId: number): Promise<Invoice>;
  getRecurringInvoices(userId: number): Promise<Invoice[]>;
  getOverdueInvoices(userId: number): Promise<Invoice[]>;
  generateInvoicePDF(invoiceId: number): Promise<string>;
  sendInvoiceEmail(invoiceId: number, templateId?: number): Promise<boolean>;
  
  // Sales - Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;
  
  // Sales - Quotations
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationsByUser(userId: number): Promise<Quotation[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, data: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<boolean>;
  getQuotationItemsByQuotationId(quotationId: number): Promise<QuotationItem[]>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotationItem(id: number, data: Partial<InsertQuotationItem>): Promise<QuotationItem | undefined>;
  deleteQuotationItem(id: number): Promise<boolean>;
  
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
    try {
      // Try to use PostgreSQL session store
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true,
        tableName: 'sessions',
        conObject: {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
      });
      console.log('✅ PostgreSQL session store initialized');
    } catch (error) {
      console.warn('⚠️ PostgreSQL session store failed, falling back to memory store');
      console.warn('Session data will be lost on server restart');
      // Fallback to memory store for development
      this.sessionStore = new session.MemoryStore();
    }
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
  
  async updateUser(id: number, data: Partial<InsertUser> & Partial<Omit<User, keyof InsertUser>>): Promise<User | undefined> {
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
    // Use a simple query without relations to avoid the error
    const invoiceList = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        contactId: invoices.contactId,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        notes: invoices.notes,
        terms: invoices.terms,
        taxRate: invoices.taxRate,
        discountRate: invoices.discountRate,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt
      })
      .from(invoices)
      .where(eq(invoices.userId, userId));
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
  
  async getInvoiceWithItems(id: number): Promise<Invoice & { items: InvoiceItem[] } | undefined> {
    // Use explicit field selection to avoid relation inference issues
    const [invoice] = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        contactId: invoices.contactId,
        invoiceNumber: invoices.invoiceNumber,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        notes: invoices.notes,
        terms: invoices.terms,
        taxRate: invoices.taxRate,
        discountRate: invoices.discountRate,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt
      })
      .from(invoices)
      .where(eq(invoices.id, id));
      
    if (!invoice) return undefined;
    
    // Fetch items separately with explicit field selection
    const items = await db
      .select({
        id: invoiceItems.id,
        invoiceId: invoiceItems.invoiceId,
        productId: invoiceItems.productId,
        description: invoiceItems.description,
        quantity: invoiceItems.quantity,
        unitPrice: invoiceItems.unitPrice,
        taxRate: invoiceItems.taxRate
      })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));
      
    return { ...invoice, items };
  }
  
  // Payment management
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }
  
  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    const paymentList = await db.select().from(payments).where(eq(payments.userId, userId));
    return paymentList;
  }
  
  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    const paymentList = await db.select().from(payments)
      .where(and(
        eq(payments.relatedDocumentType, 'invoice'),
        eq(payments.relatedDocumentId, invoiceId)
      ));
    return paymentList;
  }
  
  async createPayment(payment: Partial<InsertPayment>): Promise<Payment> {
    // Generate a unique payment number
    const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const [newPayment] = await db
      .insert(payments)
      .values({
        ...payment,
        paymentNumber,
        paymentDate: new Date().toISOString(),
      } as InsertPayment)
      .returning();
    
    // If this is for an invoice, update the invoice's amount paid
    if (payment.relatedDocumentType === 'invoice' && payment.relatedDocumentId) {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.relatedDocumentId));
      if (invoice) {
        const newAmountPaid = (invoice.amountPaid || 0) + (payment.amount || 0);
        let newStatus = invoice.status;
        
        // Update invoice status based on payment
        if (newAmountPaid >= invoice.totalAmount) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partial';
        }
        
        await db
          .update(invoices)
          .set({ 
            amountPaid: newAmountPaid,
            status: newStatus,
            updatedAt: new Date().toISOString()
          })
          .where(eq(invoices.id, payment.relatedDocumentId));
      }
    }
    
    return newPayment;
  }
  
  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }
  
  async deletePayment(id: number): Promise<boolean> {
    // Get the payment first to update related invoice
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    
    if (payment && payment.relatedDocumentType === 'invoice' && payment.relatedDocumentId) {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.relatedDocumentId));
      if (invoice) {
        const newAmountPaid = Math.max(0, (invoice.amountPaid || 0) - payment.amount);
        let newStatus = invoice.status;
        
        // Update invoice status based on remaining payment
        if (newAmountPaid === 0) {
          newStatus = 'pending';
          if (new Date(invoice.dueDate) < new Date()) {
            newStatus = 'overdue';
          }
        } else if (newAmountPaid < invoice.totalAmount) {
          newStatus = 'partial';
        }
        
        await db
          .update(invoices)
          .set({ 
            amountPaid: newAmountPaid,
            status: newStatus,
            updatedAt: new Date().toISOString()
          })
          .where(eq(invoices.id, payment.relatedDocumentId));
      }
    }
    
    await db
      .delete(payments)
      .where(eq(payments.id, id));
    return true;
  }
  
  // Tax Rates
  async getTaxRate(id: number): Promise<TaxRate | undefined> {
    const [taxRate] = await db.select().from(taxRates).where(eq(taxRates.id, id));
    return taxRate;
  }
  
  async getTaxRatesByUser(userId: number): Promise<TaxRate[]> {
    const taxRateList = await db.select().from(taxRates).where(eq(taxRates.userId, userId));
    return taxRateList;
  }
  
  async createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate> {
    const [newTaxRate] = await db
      .insert(taxRates)
      .values(taxRate)
      .returning();
    return newTaxRate;
  }
  
  async updateTaxRate(id: number, data: Partial<InsertTaxRate>): Promise<TaxRate | undefined> {
    const [taxRate] = await db
      .update(taxRates)
      .set(data)
      .where(eq(taxRates.id, id))
      .returning();
    return taxRate;
  }
  
  async deleteTaxRate(id: number): Promise<boolean> {
    await db
      .delete(taxRates)
      .where(eq(taxRates.id, id));
    return true;
  }
  
  // Invoice Templates
  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    const [template] = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.id, id));
    return template;
  }
  
  async getInvoiceTemplatesByUser(userId: number): Promise<InvoiceTemplate[]> {
    const templateList = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.userId, userId));
    return templateList;
  }
  
  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const [newTemplate] = await db
      .insert(invoiceTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }
  
  async updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .update(invoiceTemplates)
      .set(data)
      .where(eq(invoiceTemplates.id, id))
      .returning();
    return template;
  }
  
  async deleteInvoiceTemplate(id: number): Promise<boolean> {
    await db
      .delete(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
    return true;
  }
  
  // Email Templates
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }
  
  async getEmailTemplatesByUser(userId: number): Promise<EmailTemplate[]> {
    const templateList = await db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
    return templateList;
  }
  
  async getEmailTemplateByType(userId: number, templateType: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates)
      .where(and(
        eq(emailTemplates.userId, userId),
        eq(emailTemplates.templateType, templateType)
      ));
    return template;
  }
  
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }
  
  async updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .update(emailTemplates)
      .set(data)
      .where(eq(emailTemplates.id, id))
      .returning();
    return template;
  }
  
  async deleteEmailTemplate(id: number): Promise<boolean> {
    await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return true;
  }
  
  // Invoice Activities
  async getInvoiceActivity(id: number): Promise<InvoiceActivity | undefined> {
    const [activity] = await db.select().from(invoiceActivities).where(eq(invoiceActivities.id, id));
    return activity;
  }
  
  async getInvoiceActivitiesByInvoice(invoiceId: number): Promise<InvoiceActivity[]> {
    const activityList = await db.select().from(invoiceActivities).where(eq(invoiceActivities.invoiceId, invoiceId));
    return activityList;
  }
  
  async createInvoiceActivity(activity: InsertInvoiceActivity): Promise<InvoiceActivity> {
    const [newActivity] = await db
      .insert(invoiceActivities)
      .values(activity)
      .returning();
    return newActivity;
  }
  
  // Payment Links
  async getPaymentLink(id: number): Promise<PaymentLink | undefined> {
    const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, id));
    return link;
  }
  
  async getPaymentLinkByToken(token: string): Promise<PaymentLink | undefined> {
    const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.link_token, token));
    return link;
  }
  
  async getPaymentLinksByInvoice(invoiceId: number): Promise<PaymentLink[]> {
    const linkList = await db.select().from(paymentLinks).where(eq(paymentLinks.invoiceId, invoiceId));
    return linkList;
  }
  
  async createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink> {
    const [newLink] = await db
      .insert(paymentLinks)
      .values(link)
      .returning();
    return newLink;
  }
  
  async updatePaymentLink(id: number, data: Partial<InsertPaymentLink>): Promise<PaymentLink | undefined> {
    const [link] = await db
      .update(paymentLinks)
      .set(data)
      .where(eq(paymentLinks.id, id))
      .returning();
    return link;
  }
  
  async deletePaymentLink(id: number): Promise<boolean> {
    await db
      .delete(paymentLinks)
      .where(eq(paymentLinks.id, id));
    return true;
  }
  
  // Currency Rates
  async getCurrencyRate(fromCurrency: string, toCurrency: string, date?: string): Promise<CurrencyRate | undefined> {
    const [rate] = await db.select().from(currencyRates)
      .where(and(
        eq(currencyRates.from_currency, fromCurrency),
        eq(currencyRates.to_currency, toCurrency),
        eq(currencyRates.rate_date, date || new Date().toISOString().slice(0, 10))
      ));
    return rate;
  }
  
  async getCurrencyRatesByDate(date: string): Promise<CurrencyRate[]> {
    const rateList = await db.select().from(currencyRates).where(eq(currencyRates.rate_date, date));
    return rateList;
  }
  
  async createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const [newRate] = await db
      .insert(currencyRates)
      .values(rate)
      .returning();
    return newRate;
  }
  
  async updateCurrencyRate(id: number, data: Partial<InsertCurrencyRate>): Promise<CurrencyRate | undefined> {
    const [rate] = await db
      .update(currencyRates)
      .set(data)
      .where(eq(currencyRates.id, id))
      .returning();
    return rate;
  }
  
  // Enhanced Invoice Methods
  async generateInvoiceNumber(userId: number, prefix?: string): Promise<string> {
    const invoicePrefix = prefix || 'INV';
    const year = new Date().getFullYear();
    const searchPattern = `${invoicePrefix}-${year}-%`;
    
    // Get all existing invoice numbers for this user and year
    const existingInvoices = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        sql`${invoices.invoiceNumber} LIKE ${searchPattern}`
      ));
    
    // Extract numbers from invoice numbers and find the maximum
    let maxNumber = 0;
    for (const invoice of existingInvoices) {
      const match = invoice.invoiceNumber.match(new RegExp(`${invoicePrefix}-${year}-(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
    return `${invoicePrefix}-${year}-${nextNumber}`;
  }
  
  async createRecurringInvoice(parentInvoiceId: number): Promise<Invoice> {
    const [parentInvoice] = await db.select().from(invoices).where(eq(invoices.id, parentInvoiceId));
    if (!parentInvoice) {
      throw new Error('Parent invoice not found');
    }
 
    // Generate new invoice number
    const newInvoiceNumber = await this.generateInvoiceNumber(parentInvoice.userId);
     
    // Calculate new dates based on recurring frequency
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
     
    const newInvoiceData = {
      userId: parentInvoice.userId,
      contactId: parentInvoice.contactId,
      invoiceNumber: newInvoiceNumber,
      issueDate: issueDate.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      subtotal: parentInvoice.subtotal,
      taxAmount: parentInvoice.taxAmount,
      discountAmount: parentInvoice.discountAmount,
      totalAmount: parentInvoice.totalAmount,
      amountPaid: 0,
      status: 'draft',
      payment_status: 'Unpaid',
      notes: parentInvoice.notes,
      terms: parentInvoice.terms,
      currency: parentInvoice.currency,
      payment_terms: parentInvoice.payment_terms,
      is_recurring: false, // This is a generated invoice, not a template
      parent_recurring_invoice_id: parentInvoiceId
    };
 
    const [recurringInvoice] = await db
      .insert(invoices)
      .values(newInvoiceData)
      .returning();
 
    // Copy invoice items
    const parentItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, parentInvoiceId));
    if (parentItems.length > 0) {
      const newItems = parentItems.map(item => ({
        invoiceId: recurringInvoice.id,
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
      }));
      
      await db.insert(invoiceItems).values(newItems);
    }
 
    return recurringInvoice;
  }
  
  async getRecurringInvoices(userId: number): Promise<Invoice[]> {
    const recurringInvoices = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.is_recurring, true)
      ))
      .orderBy(invoices.createdAt);
    return recurringInvoices;
  }
  
  async getOverdueInvoices(userId: number): Promise<Invoice[]> {
    const today = new Date().toISOString().slice(0, 10);
    const overdueInvoices = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        sql`${invoices.dueDate} < ${today}`,
        sql`${invoices.payment_status} != 'Paid'`
      ))
      .orderBy(invoices.dueDate);
    return overdueInvoices;
  }
  
  async generateInvoicePDF(invoiceId: number): Promise<string> {
    // This would integrate with the PDF service
    // For now, return a placeholder URL
    const timestamp = new Date().getTime();
    const pdfUrl = `/api/invoices/${invoiceId}/pdf?t=${timestamp}`;
    
    // Update invoice to mark PDF as generated
    await db
      .update(invoices)
      .set({ 
        pdf_generated: true,
        pdf_url: pdfUrl,
        updatedAt: new Date().toISOString()
      })
      .where(eq(invoices.id, invoiceId));
    
    return pdfUrl;
  }
  
  async sendInvoiceEmail(invoiceId: number, userId: number, emailOptions?: { email?: string; subject?: string; message?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🚀 Starting sendInvoiceEmail for invoice ${invoiceId}, user ${userId}`);
      
      // Import the enhanced email service
      const { emailService } = await import('./src/services/email');
      
      // Check if the invoice exists and belongs to the user
      let invoice;
      try {
        invoice = await this.getInvoice(invoiceId);
        if (!invoice || invoice.userId !== userId) {
          console.log('❌ Invoice not found or access denied');
          return { success: false, error: 'Invoice not found or access denied' };
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        return { success: false, error: 'Failed to fetch invoice' };
      }

      console.log(`📧 Sending invoice to: ${emailOptions?.email || 'contact email'}`);

      // Prepare invoice email options with custom email support  
      const invoiceEmailOptions = {
        customMessage: emailOptions?.message,
        includePDF: true,
        customEmail: emailOptions?.email, // Pass custom email to the service
      };

      // Send the email using the enhanced email service
      const result = await emailService.sendInvoiceEmail(invoiceId, invoiceEmailOptions);
      
      if (result.success) {
        console.log('✅ Invoice email sent successfully via enhanced email service');
        
        // Broadcast WebSocket event
        if (wsService) {
          wsService.broadcast('invoice_sent', { invoiceId });
        }
      } else {
        console.log('❌ Invoice email failed:', result.error);
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ SendInvoiceEmail error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return { success: false, error: error.message || 'Failed to send invoice email' };
    }
  }
  
  // Order management (Sales)
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    // Fetch orders with customer information and item count
    const orderList = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        contactId: orders.contactId,
        orderNumber: orders.orderNumber,
        orderDate: orders.orderDate,
        deliveryDate: orders.deliveryDate,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        discountAmount: orders.discountAmount,
        totalAmount: orders.totalAmount,
        status: orders.status,
        notes: orders.notes,
        category: orders.category,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        currency: orders.currency,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Customer information
        customerName: sql<string>`COALESCE(${contacts.firstName} || ' ' || ${contacts.lastName}, 'Unknown Customer')`,
        customerEmail: contacts.email,
        customerPhone: contacts.phone,
        // Item count from order_items
        itemCount: sql<number>`COALESCE((
          SELECT COUNT(*) FROM order_items 
          WHERE order_items.order_id = ${orders.id}
        ), 0)`
      })
      .from(orders)
      .leftJoin(contacts, eq(orders.contactId, contacts.id))
      .where(eq(orders.userId, userId))
      .orderBy(sql`${orders.createdAt} DESC`);

    return orderList;
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }
  
  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    await db
      .delete(orders)
      .where(eq(orders.id, id));
    return true;
  }
  
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return items;
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return newItem;
  }
  
  async updateOrderItem(id: number, data: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [item] = await db
      .update(orderItems)
      .set(data)
      .where(eq(orderItems.id, id))
      .returning();
    return item;
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    await db
      .delete(orderItems)
      .where(eq(orderItems.id, id));
    return true;
  }
  
  // Quotation management (Sales)
  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation;
  }
  
  async getQuotationsByUser(userId: number): Promise<Quotation[]> {
    // Use a simple query without relations to avoid the error
    const quotationList = await db
      .select({
        id: quotations.id,
        userId: quotations.userId,
        contactId: quotations.contactId,
        quotationNumber: quotations.quotationNumber,
        issueDate: quotations.issueDate,
        expiryDate: quotations.expiryDate,
        subtotal: quotations.subtotal,
        taxAmount: quotations.taxAmount,
        discountAmount: quotations.discountAmount,
        totalAmount: quotations.totalAmount,
        status: quotations.status,
        notes: quotations.notes,
        terms: quotations.terms,
        category: quotations.category,
        currency: quotations.currency,
        convertedToOrder: quotations.convertedToOrder,
        convertedOrderId: quotations.convertedOrderId,
        createdAt: quotations.createdAt,
        updatedAt: quotations.updatedAt
      })
      .from(quotations)
      .where(eq(quotations.userId, userId));
    return quotationList;
  }
  
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [newQuotation] = await db
      .insert(quotations)
      .values(quotation)
      .returning();
    return newQuotation;
  }
  
  async updateQuotation(id: number, data: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [quotation] = await db
      .update(quotations)
      .set(data)
      .where(eq(quotations.id, id))
      .returning();
    return quotation;
  }
  
  async deleteQuotation(id: number): Promise<boolean> {
    await db
      .delete(quotations)
      .where(eq(quotations.id, id));
    return true;
  }
  
  async getQuotationItemsByQuotationId(quotationId: number): Promise<QuotationItem[]> {
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    return items;
  }
  
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const [newItem] = await db
      .insert(quotationItems)
      .values(item)
      .returning();
    return newItem;
  }
  
  async updateQuotationItem(id: number, data: Partial<InsertQuotationItem>): Promise<QuotationItem | undefined> {
    const [item] = await db
      .update(quotationItems)
      .set(data)
      .where(eq(quotationItems.id, id))
      .returning();
    return item;
  }
  
  async deleteQuotationItem(id: number): Promise<boolean> {
    await db
      .delete(quotationItems)
      .where(eq(quotationItems.id, id));
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

async function generateInvoicePdfWithLogo(invoice: any, contact: any, paymentLink: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('INVOICE', 50, 50, { align: 'center' });
      doc.moveDown(2);

      // Invoice details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`, 50, 120);
      doc.text(`Issue Date: ${invoice.issueDate || 'N/A'}`, 50, 140);
      doc.text(`Due Date: ${invoice.dueDate || 'N/A'}`, 50, 160);
      
      // Bill to
      const contactName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Client';
      doc.text(`Bill To: ${contactName}`, 50, 200);
      doc.text(`Email: ${contact.email || 'N/A'}`, 50, 220);
      
      // Amount
      doc.fontSize(14).text(`Total Amount: ${invoice.currency || 'USD'} ${invoice.totalAmount || '0'}`, 50, 260);
      
      // Items
      if (invoice.items && invoice.items.length > 0) {
        doc.moveDown(2);
        doc.fontSize(12).text('Items:', 50, 300);
        let yPos = 320;
        invoice.items.forEach((item: any, idx: number) => {
          const description = item.description || item.product_name || 'Item';
          const quantity = item.quantity || '1';
          const unitPrice = item.unit_price || item.unitPrice || '0';
          doc.text(`${idx + 1}. ${description} - Qty: ${quantity} @ ${unitPrice}`, 50, yPos);
          yPos += 20;
        });
      }
      
      // Payment link
      if (paymentLink && paymentLink !== '#') {
        doc.moveDown(2);
        doc.text(`Payment Link: ${paymentLink}`, 50, 450);
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export const storage = new DatabaseStorage();

// Standalone function for sending invoice emails
export async function sendInvoiceEmail(invoiceId: number, userId: number, emailOptions?: { email?: string; subject?: string; message?: string }): Promise<{ success: boolean; error?: string }> {
  return storage.sendInvoiceEmail(invoiceId, userId, emailOptions);
}
