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
  // CRM imports
  leads, type Lead, type InsertLead,
  deals,
  dealStages, type DealStage, type InsertDealStage,
  activities, type Activity, type InsertActivity,
  tasks, type Task, type InsertTask,
  crmCompanies, type CrmCompany, type InsertCrmCompany,
  phoneCallsTable, type PhoneCall, type InsertPhoneCall,
  auditLogs, type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, desc, asc, like, gte, lte, inArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import { Resend } from 'resend';
import Stripe from 'stripe';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { wsService } from './src/services/websocket';
import { paymentService } from './src/services/payment';
import { emailService } from './src/services/email';
import { invoicePDFService } from './src/services/pdf';

// Create PostgreSQL-based session store
const PostgresSessionStore = connectPg(session);

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Stripe with correct API version
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && !stripeKey.includes('dummy') ? new Stripe(stripeKey, { 
  apiVersion: '2023-10-16' as any 
}) : null;

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
  
  // CRM - Leads
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByUser(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  convertLeadToContact(leadId: number): Promise<Contact>;
  getLeadAnalytics(userId: number): Promise<any>;
  
  // CRM - Deal Stages
  getDealStage(id: number): Promise<DealStage | undefined>;
  getDealStagesByUser(userId: number): Promise<DealStage[]>;
  createDealStage(stage: InsertDealStage): Promise<DealStage>;
  updateDealStage(id: number, data: Partial<InsertDealStage>): Promise<DealStage | undefined>;
  deleteDealStage(id: number): Promise<boolean>;
  reorderDealStages(userId: number, stageOrders: { id: number; order: number }[]): Promise<boolean>;
  
  // CRM - Activities
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getActivitiesByContact(contactId: number): Promise<Activity[]>;
  getActivitiesByLead(leadId: number): Promise<Activity[]>;
  getActivitiesByDeal(dealId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, data: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  getRecentActivities(userId: number, limit?: number): Promise<Activity[]>;
  
  // CRM - Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getTasksByAssignee(assigneeId: number): Promise<Task[]>;
  getUpcomingTasks(userId: number, days?: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number): Promise<Task | undefined>;
  
  // CRM - Companies
  getCrmCompany(id: number): Promise<CrmCompany | undefined>;
  getCrmCompaniesByUser(userId: number): Promise<CrmCompany[]>;
  createCrmCompany(company: InsertCrmCompany): Promise<CrmCompany>;
  updateCrmCompany(id: number, data: Partial<InsertCrmCompany>): Promise<CrmCompany | undefined>;
  deleteCrmCompany(id: number): Promise<boolean>;
  
  // CRM - Phone Calls
  getPhoneCall(id: number): Promise<PhoneCall | undefined>;
  getPhoneCallsByUser(userId: number): Promise<PhoneCall[]>;
  getPhoneCallsByContact(contactId: number): Promise<PhoneCall[]>;
  createPhoneCall(phoneCall: InsertPhoneCall): Promise<PhoneCall>;
  updatePhoneCall(id: number, data: Partial<InsertPhoneCall>): Promise<PhoneCall | undefined>;
  deletePhoneCall(id: number): Promise<boolean>;
  
  // CRM - Metrics and Analytics
  getCrmMetrics(userId: number): Promise<any>;
  getLeadSourceAnalytics(userId: number): Promise<any>;
  getDealPipeline(userId: number): Promise<any>;
  getSalesConversionFunnel(userId: number): Promise<any>;
  
  // CRM - Integrations
  convertDealToInvoice(dealId: number, invoiceData?: Partial<InsertInvoice>): Promise<Invoice>;
  
  // Audit Logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByUser(userId: number): Promise<AuditLog[]>;
  getAuditLogsByResource(resourceType: string, resourceId: number): Promise<AuditLog[]>;
  
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
      .values({
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        userId: employee.userId,
        positionId: employee.positionId || null,
        department: employee.department || null,
      })
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
        paymentDate: new Date().toISOString().split('T')[0],
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
        eq(emailTemplates.template_type, templateType)
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
    console.log('generateInvoiceNumber called with prefix:', prefix, 'using invoicePrefix:', invoicePrefix);
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
      .values(newInvoiceData as any) // Cast to satisfy Drizzle enum union for payment_status
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
  
  // Send invoice email via the EmailService. Returns success status only.
  async sendInvoiceEmail(invoiceId: number, templateId?: number): Promise<boolean> {
    try {
      // Validate invoice exists
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        console.log('❌ Invoice not found');
        return false;
      }

      // Use the existing email service instance
      const result = await emailService.sendInvoiceEmail(invoiceId, invoice.userId, {
        templateId,
        includePDF: true,
      });

      if (result.success) {
        // Broadcast WebSocket event
        if (wsService) {
          wsService.broadcast('invoice_sent', { invoiceId });
        }
        return true;
      }

      console.log('❌ Invoice email failed:', result.error);
      return false;
    } catch (error: any) {
      console.error('❌ SendInvoiceEmail error:', error?.message || error);
      return false;
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
      .values({
        ...quotation,
        quotationNumber: `QT-${Date.now()}`,
      })
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
  
  async createPurchaseRequest(purchaseRequest: InsertPurchaseRequest): Promise<PurchaseRequest> {
    // Generate a unique request number
    const requestNumber = `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const [newRequest] = await db
      .insert(purchaseRequests)
      .values({
        ...purchaseRequest,
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
      estimatedTotal = (data.quantity || item.quantity) * (data.estimatedUnitPrice || item.estimatedUnitPrice || 0);
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

  // CRM - Leads Management
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadsByUser(userId: number): Promise<Lead[]> {
    const leadList = await db
      .select()
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(sql`${leads.createdAt} DESC`);
    return leadList;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values({
        ...lead,
        updatedAt: new Date(),
      })
      .returning();
    
    // Create audit log
    await this.createAuditLog({
      userId: lead.userId,
      action: 'create',
      resourceType: 'lead',
      resourceId: newLead.id,
      newValues: newLead,
      details: `Created new lead: ${newLead.firstName} ${newLead.lastName}`,
    });

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('lead_created', newLead);
    }

    return newLead;
  }

  async updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [oldLead] = await db.select().from(leads).where(eq(leads.id, id));
    
    const [lead] = await db
      .update(leads)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();

    if (lead) {
      // Create audit log
      await this.createAuditLog({
        userId: lead.userId,
        action: 'update',
        resourceType: 'lead',
        resourceId: id,
        oldValues: oldLead,
        newValues: lead,
        details: `Updated lead: ${lead.firstName} ${lead.lastName}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('lead_updated', lead);
      }
    }

    return lead;
  }

  async deleteLead(id: number): Promise<boolean> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    
    await db.delete(leads).where(eq(leads.id, id));

    if (lead) {
      // Create audit log
      await this.createAuditLog({
        userId: lead.userId,
        action: 'delete',
        resourceType: 'lead',
        resourceId: id,
        oldValues: lead,
        details: `Deleted lead: ${lead.firstName} ${lead.lastName}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('lead_deleted', { id });
      }
    }

    return true;
  }

  async convertLeadToContact(leadId: number): Promise<Contact> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Create contact from lead data
    const contactData: InsertContact = {
      userId: lead.userId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.notes,
      source: lead.source,
      status: 'active',
      type: 'customer',
    };

    const [contact] = await db
      .insert(contacts)
      .values(contactData)
      .returning();

    // Update lead status
    await this.updateLead(leadId, { status: 'converted' });

    // Create audit log
    await this.createAuditLog({
      userId: lead.userId,
      action: 'convert',
      resourceType: 'lead',
      resourceId: leadId,
      details: `Converted lead to contact: ${contact.firstName} ${contact.lastName}`,
    });

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('lead_converted', { lead, contact });
      wsService.broadcast('contact_created', contact);
    }

    return contact;
  }

  async getLeadAnalytics(userId: number): Promise<any> {
    const leadStats = await db
      .select({
        source: leads.source,
        status: leads.status,
        priority: leads.priority,
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`COALESCE(SUM(${leads.estimatedValue}), 0)`,
      })
      .from(leads)
      .where(eq(leads.userId, userId))
      .groupBy(leads.source, leads.status, leads.priority);

    const totalLeads = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .where(eq(leads.userId, userId));

    return {
      totalLeads: totalLeads[0]?.count || 0,
      bySource: leadStats.reduce((acc, stat) => {
        if (!acc[stat.source || 'unknown']) {
          acc[stat.source || 'unknown'] = 0;
        }
        acc[stat.source || 'unknown'] += stat.count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: leadStats.reduce((acc, stat) => {
        if (!acc[stat.status || 'new']) {
          acc[stat.status || 'new'] = 0;
        }
        acc[stat.status || 'new'] += stat.count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: leadStats.reduce((acc, stat) => {
        if (!acc[stat.priority || 'medium']) {
          acc[stat.priority || 'medium'] = 0;
        }
        acc[stat.priority || 'medium'] += stat.count;
        return acc;
      }, {} as Record<string, number>),
      totalEstimatedValue: leadStats.reduce((sum, stat) => sum + stat.totalValue, 0),
    };
  }

  // CRM - Deal Stages Management
  async getDealStage(id: number): Promise<DealStage | undefined> {
    const [stage] = await db.select().from(dealStages).where(eq(dealStages.id, id));
    return stage;
  }

  async getDealStagesByUser(userId: number): Promise<DealStage[]> {
    const stages = await db
      .select()
      .from(dealStages)
      .where(and(eq(dealStages.userId, userId), eq(dealStages.isActive, true)))
      .orderBy(dealStages.order);
    return stages;
  }

  async createDealStage(stage: InsertDealStage): Promise<DealStage> {
    const [newStage] = await db
      .insert(dealStages)
      .values({
        ...stage,
        updatedAt: new Date(),
      })
      .returning();

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('deal_stage_created', newStage);
    }

    return newStage;
  }

  async updateDealStage(id: number, data: Partial<InsertDealStage>): Promise<DealStage | undefined> {
    const [stage] = await db
      .update(dealStages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dealStages.id, id))
      .returning();

    if (stage && wsService) {
      wsService.broadcast('deal_stage_updated', stage);
    }

    return stage;
  }

  async deleteDealStage(id: number): Promise<boolean> {
    await db.update(dealStages).set({ isActive: false }).where(eq(dealStages.id, id));

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('deal_stage_deleted', { id });
    }

    return true;
  }

  async reorderDealStages(userId: number, stageOrders: { id: number; order: number }[]): Promise<boolean> {
    for (const { id, order } of stageOrders) {
      await db
        .update(dealStages)
        .set({ order, updatedAt: new Date() })
        .where(and(eq(dealStages.id, id), eq(dealStages.userId, userId)));
    }

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('deal_stages_reordered', { userId, stageOrders });
    }

    return true;
  }

  // CRM - Activities Management
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    const activityList = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(sql`${activities.createdAt} DESC`);
    return activityList;
  }

  async getActivitiesByContact(contactId: number): Promise<Activity[]> {
    const activityList = await db
      .select()
      .from(activities)
      .where(eq(activities.contactId, contactId))
      .orderBy(sql`${activities.createdAt} DESC`);
    return activityList;
  }

  async getActivitiesByLead(leadId: number): Promise<Activity[]> {
    const activityList = await db
      .select()
      .from(activities)
      .where(eq(activities.leadId, leadId))
      .orderBy(sql`${activities.createdAt} DESC`);
    return activityList;
  }

  async getActivitiesByDeal(dealId: number): Promise<Activity[]> {
    const activityList = await db
      .select()
      .from(activities)
      .where(eq(activities.dealId, dealId))
      .orderBy(sql`${activities.createdAt} DESC`);
    return activityList;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values({
        ...activity,
        updatedAt: new Date(),
      })
      .returning();

    // Create audit log
    await this.createAuditLog({
      userId: activity.userId,
      action: 'create',
      resourceType: 'activity',
      resourceId: newActivity.id,
      newValues: newActivity,
      details: `Created new activity: ${newActivity.subject}`,
    });

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('activity_created', newActivity);
    }

    return newActivity;
  }

  async updateActivity(id: number, data: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [oldActivity] = await db.select().from(activities).where(eq(activities.id, id));
    
    const [activity] = await db
      .update(activities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, id))
      .returning();

    if (activity) {
      // Create audit log
      await this.createAuditLog({
        userId: activity.userId,
        action: 'update',
        resourceType: 'activity',
        resourceId: id,
        oldValues: oldActivity,
        newValues: activity,
        details: `Updated activity: ${activity.subject}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('activity_updated', activity);
      }
    }

    return activity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    
    await db.delete(activities).where(eq(activities.id, id));

    if (activity) {
      // Create audit log
      await this.createAuditLog({
        userId: activity.userId,
        action: 'delete',
        resourceType: 'activity',
        resourceId: id,
        oldValues: activity,
        details: `Deleted activity: ${activity.subject}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('activity_deleted', { id });
      }
    }

    return true;
  }

  async getRecentActivities(userId: number, limit: number = 10): Promise<Activity[]> {
    const recentActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(sql`${activities.createdAt} DESC`)
      .limit(limit);
    return recentActivities;
  }

  // CRM - Tasks Management
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    const taskList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(sql`${tasks.dueDate} ASC`);
    return taskList;
  }

  async getTasksByAssignee(assigneeId: number): Promise<Task[]> {
    const taskList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, assigneeId))
      .orderBy(sql`${tasks.dueDate} ASC`);
    return taskList;
  }

  async getUpcomingTasks(userId: number, days: number = 7): Promise<Task[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const upcomingTasks = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        sql`${tasks.dueDate} <= ${futureDate.toISOString()}`,
        sql`${tasks.status} != 'completed'`
      ))
      .orderBy(sql`${tasks.dueDate} ASC`);
    return upcomingTasks;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        updatedAt: new Date(),
      })
      .returning();

    // Create audit log
    await this.createAuditLog({
      userId: task.userId,
      action: 'create',
      resourceType: 'task',
      resourceId: newTask.id,
      newValues: newTask,
      details: `Created new task: ${newTask.title}`,
    });

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('task_created', newTask);
    }

    return newTask;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [oldTask] = await db.select().from(tasks).where(eq(tasks.id, id));
    
    const [task] = await db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (task) {
      // Create audit log
      await this.createAuditLog({
        userId: task.userId,
        action: 'update',
        resourceType: 'task',
        resourceId: id,
        oldValues: oldTask,
        newValues: task,
        details: `Updated task: ${task.title}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('task_updated', task);
      }
    }

    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    
    await db.delete(tasks).where(eq(tasks.id, id));

    if (task) {
      // Create audit log
      await this.createAuditLog({
        userId: task.userId,
        action: 'delete',
        resourceType: 'task',
        resourceId: id,
        oldValues: task,
        details: `Deleted task: ${task.title}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('task_deleted', { id });
      }
    }

    return true;
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (task) {
      // Create audit log
      await this.createAuditLog({
        userId: task.userId,
        action: 'complete',
        resourceType: 'task',
        resourceId: id,
        details: `Completed task: ${task.title}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('task_completed', task);
      }
    }

    return task;
  }

  // CRM - Companies Management
  async getCrmCompany(id: number): Promise<CrmCompany | undefined> {
    const [company] = await db.select().from(crmCompanies).where(eq(crmCompanies.id, id));
    return company;
  }

  async getCrmCompaniesByUser(userId: number): Promise<CrmCompany[]> {
    const companyList = await db
      .select()
      .from(crmCompanies)
      .where(eq(crmCompanies.userId, userId))
      .orderBy(sql`${crmCompanies.name} ASC`);
    return companyList;
  }

  async createCrmCompany(company: InsertCrmCompany): Promise<CrmCompany> {
    const [newCompany] = await db
      .insert(crmCompanies)
      .values({
        ...company,
        updatedAt: new Date(),
      })
      .returning();

    // Create audit log
    await this.createAuditLog({
      userId: company.userId,
      action: 'create',
      resourceType: 'company',
      resourceId: newCompany.id,
      newValues: newCompany,
      details: `Created new company: ${newCompany.name}`,
    });

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('company_created', newCompany);
    }

    return newCompany;
  }

  async updateCrmCompany(id: number, data: Partial<InsertCrmCompany>): Promise<CrmCompany | undefined> {
    const [oldCompany] = await db.select().from(crmCompanies).where(eq(crmCompanies.id, id));
    
    const [company] = await db
      .update(crmCompanies)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(crmCompanies.id, id))
      .returning();

    if (company) {
      // Create audit log
      await this.createAuditLog({
        userId: company.userId,
        action: 'update',
        resourceType: 'company',
        resourceId: id,
        oldValues: oldCompany,
        newValues: company,
        details: `Updated company: ${company.name}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('company_updated', company);
      }
    }

    return company;
  }

  async deleteCrmCompany(id: number): Promise<boolean> {
    const [company] = await db.select().from(crmCompanies).where(eq(crmCompanies.id, id));
    
    await db.delete(crmCompanies).where(eq(crmCompanies.id, id));

    if (company) {
      // Create audit log
      await this.createAuditLog({
        userId: company.userId,
        action: 'delete',
        resourceType: 'company',
        resourceId: id,
        oldValues: company,
        details: `Deleted company: ${company.name}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('company_deleted', { id });
      }
    }

    return true;
  }

  // CRM - Phone Calls Management
  async getPhoneCall(id: number): Promise<PhoneCall | undefined> {
    const [phoneCall] = await db.select().from(phoneCallsTable).where(eq(phoneCallsTable.id, id));
    return phoneCall;
  }

  async getPhoneCallsByUser(userId: number): Promise<PhoneCall[]> {
    const phoneCallList = await db
      .select()
      .from(phoneCallsTable)
      .where(eq(phoneCallsTable.userId, userId))
      .orderBy(sql`${phoneCallsTable.createdAt} DESC`);
    return phoneCallList;
  }

  async getPhoneCallsByContact(contactId: number): Promise<PhoneCall[]> {
    const phoneCallList = await db
      .select()
      .from(phoneCallsTable)
      .where(eq(phoneCallsTable.contactId, contactId))
      .orderBy(sql`${phoneCallsTable.createdAt} DESC`);
    return phoneCallList;
  }

  async createPhoneCall(phoneCall: InsertPhoneCall): Promise<PhoneCall> {
    const [newPhoneCall] = await db
      .insert(phoneCallsTable)
      .values({
        ...phoneCall,
        updatedAt: new Date(),
      })
      .returning();

    // Create audit log
    await this.createAuditLog({
      userId: phoneCall.userId,
      action: 'create',
      resourceType: 'phone_call',
      resourceId: newPhoneCall.id,
      newValues: newPhoneCall,
      details: `Created new phone call to ${newPhoneCall.phoneNumber}`,
    });

    // Broadcast WebSocket event
    if (wsService) {
      wsService.broadcast('phone_call_created', newPhoneCall);
    }

    return newPhoneCall;
  }

  async updatePhoneCall(id: number, data: Partial<InsertPhoneCall>): Promise<PhoneCall | undefined> {
    const [oldPhoneCall] = await db.select().from(phoneCallsTable).where(eq(phoneCallsTable.id, id));
    
    const [phoneCall] = await db
      .update(phoneCallsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(phoneCallsTable.id, id))
      .returning();

    if (phoneCall) {
      // Create audit log
      await this.createAuditLog({
        userId: phoneCall.userId,
        action: 'update',
        resourceType: 'phone_call',
        resourceId: id,
        oldValues: oldPhoneCall,
        newValues: phoneCall,
        details: `Updated phone call to ${phoneCall.phoneNumber}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('phone_call_updated', phoneCall);
      }
    }

    return phoneCall;
  }

  async deletePhoneCall(id: number): Promise<boolean> {
    const [phoneCall] = await db.select().from(phoneCallsTable).where(eq(phoneCallsTable.id, id));
    
    await db.delete(phoneCallsTable).where(eq(phoneCallsTable.id, id));

    if (phoneCall) {
      // Create audit log
      await this.createAuditLog({
        userId: phoneCall.userId,
        action: 'delete',
        resourceType: 'phone_call',
        resourceId: id,
        oldValues: phoneCall,
        details: `Deleted phone call to ${phoneCall.phoneNumber}`,
      });

      // Broadcast WebSocket event
      if (wsService) {
        wsService.broadcast('phone_call_deleted', { id });
      }
    }

    return true;
  }

  // CRM - Metrics and Analytics
  async getCrmMetrics(userId: number): Promise<any> {
    const [totalLeads] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .where(eq(leads.userId, userId));

    const [totalContacts] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(contacts)
      .where(eq(contacts.userId, userId));

    const [openDeals] = await db
      .select({ 
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`COALESCE(SUM(${deals.value}), 0)`,
      })
      .from(deals)
      .where(and(eq(deals.userId, userId), eq(deals.status, 'open')));

    const [wonDeals] = await db
      .select({ 
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`COALESCE(SUM(${deals.value}), 0)`,
      })
      .from(deals)
      .where(and(eq(deals.userId, userId), eq(deals.status, 'won')));

    const [pendingTasks] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), sql`${tasks.status} != 'completed'`));

    const [recentActivities] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(activities)
      .where(and(
        eq(activities.userId, userId),
        sql`${activities.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`
      ));

    return {
      totalLeads: totalLeads?.count || 0,
      totalContacts: totalContacts?.count || 0,
      openDeals: openDeals?.count || 0,
      totalDealValue: openDeals?.totalValue || 0,
      wonDeals: wonDeals?.count || 0,
      wonDealValue: wonDeals?.totalValue || 0,
      pendingTasks: pendingTasks?.count || 0,
      recentActivities: recentActivities?.count || 0,
      conversionRate: totalLeads?.count ? ((wonDeals?.count || 0) / totalLeads.count * 100) : 0,
    };
  }

  async getLeadSourceAnalytics(userId: number): Promise<any> {
    const sourceStats = await db
      .select({
        source: leads.source,
        count: sql<number>`COUNT(*)`,
        converted: sql<number>`SUM(CASE WHEN ${leads.status} = 'converted' THEN 1 ELSE 0 END)`,
      })
      .from(leads)
      .where(eq(leads.userId, userId))
      .groupBy(leads.source);

    return sourceStats.map(stat => ({
      source: stat.source || 'Unknown',
      count: stat.count,
      converted: stat.converted,
      conversionRate: stat.count > 0 ? (stat.converted / stat.count * 100) : 0,
    }));
  }

  async getDealPipeline(userId: number): Promise<any> {
    const pipelineStats = await db
      .select({
        stage: deals.stage,
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`COALESCE(SUM(${deals.value}), 0)`,
        avgProbability: sql<number>`COALESCE(AVG(${deals.probability}), 0)`,
      })
      .from(deals)
      .where(and(eq(deals.userId, userId), eq(deals.status, 'open')))
      .groupBy(deals.stage);

    return pipelineStats.map(stat => ({
      stage: stat.stage,
      count: stat.count,
      totalValue: stat.totalValue,
      avgProbability: stat.avgProbability,
      weightedValue: stat.totalValue * (stat.avgProbability / 100),
    }));
  }

  async getSalesConversionFunnel(userId: number): Promise<any> {
    const [row] = await db
      .select({
        totalLeads: sql<number>`(SELECT COUNT(*) FROM ${leads} WHERE ${leads.userId} = ${userId})`,
        qualifiedLeads: sql<number>`(SELECT COUNT(*) FROM ${leads} WHERE ${leads.userId} = ${userId} AND ${leads.status} = 'qualified')`,
        convertedLeads: sql<number>`(SELECT COUNT(*) FROM ${leads} WHERE ${leads.userId} = ${userId} AND ${leads.status} = 'converted')`,
        totalDeals: sql<number>`(SELECT COUNT(*) FROM ${deals} WHERE ${deals.userId} = ${userId})`,
        wonDeals: sql<number>`(SELECT COUNT(*) FROM ${deals} WHERE ${deals.userId} = ${userId} AND ${deals.status} = 'won')`,
      });

    const data = row || { totalLeads: 0, qualifiedLeads: 0, convertedLeads: 0, totalDeals: 0, wonDeals: 0 } as any;
    
    return {
      leads: Number(data.totalLeads) || 0,
      qualified: Number(data.qualifiedLeads) || 0,
      converted: Number(data.convertedLeads) || 0,
      deals: Number(data.totalDeals) || 0,
      won: Number(data.wonDeals) || 0,
      rates: {
        qualification: Number(data.totalLeads) ? (Number(data.qualifiedLeads) / Number(data.totalLeads) * 100) : 0,
        conversion: Number(data.qualifiedLeads) ? (Number(data.convertedLeads) / Number(data.qualifiedLeads) * 100) : 0,
        closing: Number(data.totalDeals) ? (Number(data.wonDeals) / Number(data.totalDeals) * 100) : 0,
      },
    };
  }

  // Add missing deal operations
  async getDeal(id: number): Promise<any> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async updateDeal(id: number, data: any): Promise<any> {
    const [deal] = await db
      .update(deals)
      .set(data)
      .where(eq(deals.id, id))
      .returning();
    
    if (deal && wsService) {
      wsService.broadcast('deal_updated', deal);
    }
    
    return deal;
  }

  // CRM - Integrations
  async convertDealToInvoice(dealId: number, invoiceData?: Partial<InsertInvoice>): Promise<Invoice> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
    if (!deal) {
      throw new Error('Deal not found');
    }

    const contact = deal.contactId ? await this.getContact(deal.contactId) : null;
    
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(deal.userId);
    
    // Create invoice from deal
    const newInvoiceData: InsertInvoice = {
      userId: deal.userId,
      contactId: deal.contactId,
      invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      subtotal: deal.value || 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: deal.value || 0,
      amountPaid: 0,
      status: 'draft',
      payment_status: 'Unpaid',
      notes: `Invoice generated from deal: ${deal.title}`,
      currency: deal.currency || 'USD',
      ...invoiceData,
    };

    const [invoice] = await db
      .insert(invoices)
      .values(newInvoiceData as any) // Cast to satisfy Drizzle enum union for payment_status
      .returning();

    // Create a single item for the deal
    await db.insert(invoiceItems).values({
      invoiceId: invoice.id,
      productId: null,
      description: deal.title,
      quantity: 1,
      unitPrice: deal.value || 0,
      taxRate: 0,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      subtotal: deal.value || 0,
      totalAmount: deal.value || 0,
    });

    // Update deal status
    await this.updateDeal(dealId, { status: 'won', actualCloseDate: new Date().toISOString().split('T')[0] });

    // Create audit log
    await this.createAuditLog({
      userId: deal.userId,
      action: 'convert',
      resourceType: 'deal',
      resourceId: dealId,
      details: `Converted deal to invoice: ${invoice.invoiceNumber}`,
    });

    // Broadcast WebSocket events
    if (wsService) {
      wsService.broadcast('deal_converted_to_invoice', { deal, invoice });
      wsService.broadcast('invoice_created', invoice);
    }

    return invoice;
  }

  // Audit Logging
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return auditLog;
  }

  async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(100);
    return logs;
  }

  async getAuditLogsByResource(resourceType: string, resourceId: number): Promise<AuditLog[]> {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.resourceType, resourceType),
        eq(auditLogs.resourceId, resourceId)
      ))
      .orderBy(sql`${auditLogs.createdAt} DESC`);
    return logs;
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
  const success = await storage.sendInvoiceEmail(invoiceId, emailOptions?.subject as any);
  return success ? { success: true } : { success: false, error: 'Failed to send' };
}
