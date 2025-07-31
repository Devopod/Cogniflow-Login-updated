import { pgTable, text, serial, integer, boolean, timestamp, varchar, real, date, jsonb, uuid, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Company table for organization details
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  businessType: varchar("business_type", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  industryType: varchar("industry_type", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  taxIdNumber: varchar("tax_id_number", { length: 100 }),
  taxRegistrationStatus: varchar("tax_registration_status", { length: 50 }),
  taxCodes: jsonb("tax_codes"),
  principalBusinessAddress: jsonb("principal_business_address"),
  additionalBusinessAddresses: jsonb("additional_business_addresses"),
  addressProofType: varchar("address_proof_type", { length: 100 }),
  addressProofDocument: varchar("address_proof_document", { length: 500 }),
  bankName: varchar("bank_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 100 }),
  routingCode: varchar("routing_code", { length: 100 }),
  bankAddress: text("bank_address"),
  bankDocument: varchar("bank_document", { length: 500 }),
  signatoryName: varchar("signatory_name", { length: 255 }),
  signatoryDesignation: varchar("signatory_designation", { length: 100 }),
  signatoryTaxId: varchar("signatory_tax_id", { length: 100 }),
  signatoryIdentificationNumber: varchar("signatory_identification_number", { length: 100 }),
  signatoryPhoto: varchar("signatory_photo", { length: 500 }),
  signatoryContact: jsonb("signatory_contact"),
  businessRegistrationNumber: varchar("business_registration_number", { length: 100 }),
  registrationCertificate: varchar("registration_certificate", { length: 500 }),
  partnershipAgreement: varchar("partnership_agreement", { length: 500 }),
  proofOfAppointment: varchar("proof_of_appointment", { length: 500 }),
  taxRegistrationCertificate: varchar("tax_registration_certificate", { length: 500 }),
  logo: varchar("logo", { length: 500 }),
  businessSize: varchar("business_size", { length: 50 }),
  preferredLanguage: varchar("preferred_language", { length: 50 }).default('English'),
  currency: varchar("currency", { length: 3 }).default('USD'),
  timeZone: varchar("time_zone", { length: 100 }),
  smallBusinessRegistration: varchar("small_business_registration", { length: 255 }),
  industryLicenses: jsonb("industry_licenses"),
  eInvoicingRequirements: jsonb("e_invoicing_requirements"),
  localTaxRegistrations: jsonb("local_tax_registrations"),
  setupComplete: boolean("setup_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User and Authentication related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default('user'),
  companyId: integer("company_id").references(() => companies.id),
  phone: varchar("phone", { length: 20 }),
  jobTitle: varchar("job_title", { length: 100 }),
  profileImage: varchar("profile_image", { length: 500 }),
  bio: text("bio"),
  lastLogin: timestamp("last_login"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  isActive: boolean("is_active").default(true),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  module: varchar("module", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete, approve, etc.
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.roleId, table.permissionId),
  };
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.userId, table.roleId),
  };
});

export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  granted: boolean("granted").default(true), // For overriding role permissions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    unq: unique().on(table.userId, table.permissionId),
  };
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// CRM Module
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 100 }),
  position: varchar("position", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  notes: text("notes"),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }).default('active'),
  type: varchar("type", { length: 50 }).default('lead'),
  payment_portal_token: varchar("payment_portal_token", { length: 255 }),
  saved_payment_methods: jsonb("saved_payment_methods"), // Stores saved cards or bank accounts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  value: real("value"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  stage: varchar("stage", { length: 50 }).notNull(),
  probability: integer("probability"),
  expectedCloseDate: date("expected_close_date"),
  actualCloseDate: date("actual_close_date"),
  status: varchar("status", { length: 50 }).default('open'),
  source: varchar("source", { length: 100 }),
  priority: varchar("priority", { length: 50 }).default('medium'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Module
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  barcode: varchar("barcode", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  price: real("price").notNull(),
  costPrice: real("cost_price"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  taxRate: real("tax_rate"),
  stockQuantity: integer("stock_quantity").default(0),
  reorderPoint: integer("reorder_point"),
  status: varchar("status", { length: 50 }).default('active'),
  unit: varchar("unit", { length: 20 }).default('piece'),
  weight: real("weight"),
  weightUnit: varchar("weight_unit", { length: 10 }),
  dimensions: jsonb("dimensions"),
  images: jsonb("images"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  contactPerson: varchar("contact_person", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  quantity: integer("quantity").notNull().default(0),
  location: varchar("location", { length: 100 }),
  batchNumber: varchar("batch_number", { length: 100 }),
  expiryDate: date("expiry_date"),
  lastStockCount: timestamp("last_stock_count"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  type: varchar("type", { length: 50 }).notNull(), // purchase, sale, transfer, adjustment
  quantity: integer("quantity").notNull(),
  relatedDocumentType: varchar("related_document_type", { length: 50 }),
  relatedDocumentId: integer("related_document_id"),
  notes: text("notes"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Finance Module
export const accountGroups = pgTable("account_groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // asset, liability, equity, revenue, expense
  parentId: integer("parent_id"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add self-reference after creating the table
export const accountGroupRelations = pgTable("account_group_relations", {
  id: serial("id").primaryKey(),
  accountGroupId: integer("account_group_id").notNull().references(() => accountGroups.id),
  parentAccountGroupId: integer("parent_account_group_id").notNull().references(() => accountGroups.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).unique(),
  accountGroupId: integer("account_group_id").references(() => accountGroups.id),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  openingBalance: real("opening_balance").default(0),
  currentBalance: real("current_balance").default(0),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  entryDate: date("entry_date").notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  source: varchar("source", { length: 50 }), // manual, sales, purchase, etc.
  status: varchar("status", { length: 50 }).default('posted'), // draft, posted, etc.
  isRecurring: boolean("is_recurring").default(false),
  recurringSchedule: jsonb("recurring_schedule"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const journalItems = pgTable("journal_items", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  description: text("description"),
  debitAmount: real("debit_amount").default(0),
  creditAmount: real("credit_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fiscalYears = pgTable("fiscal_years", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isClosed: boolean("is_closed").default(false),
  status: varchar("status", { length: 50 }).default('active'), // active, closed, locked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fiscalPeriods = pgTable("fiscal_periods", {
  id: serial("id").primaryKey(),
  fiscalYearId: integer("fiscal_year_id").notNull().references(() => fiscalYears.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "January 2023"
  periodNumber: integer("period_number").notNull(), // 1, 2, 3, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  reportType: varchar("report_type", { length: 50 }).notNull(), // "profit_loss", "balance_sheet", "cash_flow", "trial_balance", "general_ledger", "account_summary"
  name: varchar("name", { length: 100 }).notNull(),
  fiscalYearId: integer("fiscal_year_id").references(() => fiscalYears.id),
  fiscalPeriodId: integer("fiscal_period_id").references(() => fiscalPeriods.id),
  dateFrom: date("date_from"),
  dateTo: date("date_to"),
  parameters: jsonb("parameters"), // Additional parameters for the report
  generatedBy: integer("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  status: varchar("status", { length: 50 }).default('draft'), // draft, published
  reportData: jsonb("report_data"), // Store the report results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  transactionDate: timestamp("transaction_date").defaultNow(),
  type: varchar("type", { length: 50 }).notNull(), // debit, credit
  amount: real("amount").notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  relatedDocumentType: varchar("related_document_type", { length: 50 }),
  relatedDocumentId: integer("related_document_id"),
  status: varchar("status", { length: 50 }).default('completed'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount"),
  discountAmount: real("discount_amount"),
  totalAmount: real("total_amount").notNull(),
  amountPaid: real("amount_paid").default(0),
  status: varchar("status", { length: 50 }).default('draft'), // document status (draft, sent, etc.)
  payment_status: varchar("payment_status", { length: 50, enum: ["Unpaid", "Partial Payment", "Paid", "Void", "Refunded", "Overdue"] }).default('Unpaid'),
  last_payment_date: timestamp("last_payment_date"),
  last_payment_amount: real("last_payment_amount"),
  last_payment_method: varchar("last_payment_method", { length: 50 }),
  payment_due_reminder_sent: boolean("payment_due_reminder_sent").default(false),
  payment_overdue_reminder_sent: boolean("payment_overdue_reminder_sent").default(false),
  payment_thank_you_sent: boolean("payment_thank_you_sent").default(false),
  allow_partial_payment: boolean("allow_partial_payment").default(true),
  allow_online_payment: boolean("allow_online_payment").default(true),
  enabled_payment_methods: jsonb("enabled_payment_methods"), // Array of allowed payment methods
  payment_instructions: text("payment_instructions"),
  notes: text("notes"),
  terms: text("terms"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  
  // Payment terms and recurring invoice features
  payment_terms: varchar("payment_terms", { length: 100 }).default('Net 30'), // e.g., 'Due on receipt', 'Net 15', 'Net 30', 'Net 60'
  
  // Recurring invoice settings
  is_recurring: boolean("is_recurring").default(false),
  recurring_frequency: varchar("recurring_frequency", { length: 50 }), // 'weekly', 'monthly', 'quarterly', 'yearly'
  recurring_start_date: date("recurring_start_date"),
  recurring_end_date: date("recurring_end_date"),
  recurring_count: integer("recurring_count"), // Number of times to repeat
  recurring_remaining: integer("recurring_remaining"), // Remaining occurrences
  next_invoice_date: date("next_invoice_date"), // When the next invoice should be generated
  parent_recurring_invoice_id: integer("parent_recurring_invoice_id"), // For tracking recurring invoice template
  
  // Client portal and PDF settings
  client_portal_url: varchar("client_portal_url", { length: 500 }), // URL for client to view/pay invoice
  pdf_generated: boolean("pdf_generated").default(false),
  pdf_url: varchar("pdf_url", { length: 500 }),
  email_sent: boolean("email_sent").default(false),
  email_sent_date: timestamp("email_sent_date"),
  
  // Tax calculation settings
  tax_inclusive: boolean("tax_inclusive").default(false), // Whether prices include tax
  tax_type: varchar("tax_type", { length: 50 }), // 'GST', 'VAT', 'Sales Tax', etc.
  
  // Multi-currency support
  exchange_rate: real("exchange_rate").default(1.0), // Exchange rate when invoice was created
  base_currency: varchar("base_currency", { length: 3 }).default('USD'), // Company's base currency
  
  // Stripe payment link
  payment_link: varchar("payment_link", { length: 1000 }), // Stripe payment link for this invoice
  
  // Workflow and automation
  auto_reminder_enabled: boolean("auto_reminder_enabled").default(true),
  late_fee_enabled: boolean("late_fee_enabled").default(false),
  late_fee_amount: real("late_fee_amount"),
  late_fee_percentage: real("late_fee_percentage"),
  
  recurring_invoice_id: integer("recurring_invoice_id"), // For recurring invoices
  recurring_schedule: jsonb("recurring_schedule"), // For recurring invoices
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  payment_portal_token: text("payment_portal_token"), // Added for payment portal access
}, (table) => {
  return {
    paymentStatusIdx: index("payment_status_idx").on(table.payment_status),
    dueDateIdx: index("invoice_due_date_idx").on(table.dueDate),
    contactIdIdx: index("invoice_contact_id_idx").on(table.contactId),
    recurringIdx: index("invoice_recurring_idx").on(table.is_recurring),
    nextInvoiceDateIdx: index("invoice_next_date_idx").on(table.next_invoice_date),
  };
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate"),
  taxAmount: real("tax_amount"),
  discountRate: real("discount_rate"),
  discountAmount: real("discount_amount"),
  subtotal: real("subtotal").notNull(),
  totalAmount: real("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Module - Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  orderDate: date("order_date").notNull().defaultNow(),
  deliveryDate: date("delivery_date"),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount"),
  discountAmount: real("discount_amount"),
  totalAmount: real("total_amount").notNull(),
  status: varchar("status", { length: 50 }).default('pending'),
  notes: text("notes"),
  category: varchar("category", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default('unpaid'),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate"),
  taxAmount: real("tax_amount"),
  discountRate: real("discount_rate"),
  discountAmount: real("discount_amount"),
  subtotal: real("subtotal").notNull(),
  totalAmount: real("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Module - Quotations
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  quotationNumber: varchar("quotation_number", { length: 50 }).notNull().unique(),
  issueDate: date("issue_date").notNull().defaultNow(),
  expiryDate: date("expiry_date"),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount"),
  discountAmount: real("discount_amount"),
  totalAmount: real("total_amount").notNull(),
  status: varchar("status", { length: 50 }).default('draft'),
  notes: text("notes"),
  terms: text("terms"),
  category: varchar("category", { length: 50 }),
  currency: varchar("currency", { length: 3 }).default('USD'),
  convertedToOrder: boolean("converted_to_order").default(false),
  convertedOrderId: integer("converted_order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate"),
  taxAmount: real("tax_amount"),
  discountRate: real("discount_rate"),
  discountAmount: real("discount_amount"),
  subtotal: real("subtotal").notNull(),
  totalAmount: real("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HRMS Module
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  description: text("description"),
  parentDepartmentId: integer("parent_department_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// After creating the departments table, add the self-reference
// This avoids the circular reference issue
export const departmentRelations = pgTable("department_relations", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull().references(() => departments.id),
  parentDepartmentId: integer("parent_department_id").notNull().references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 100 }).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  description: text("description"),
  isManagement: boolean("is_management").default(false),
  minSalary: real("min_salary"),
  maxSalary: real("max_salary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  employeeId: varchar("employee_id", { length: 50 }).unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  hireDate: date("hire_date"),
  terminationDate: date("termination_date"),
  departmentId: integer("department_id").references(() => departments.id),
  positionId: integer("position_id").references(() => positions.id),
  managerId: integer("manager_id"),
  status: varchar("status", { length: 50 }).default('active'),
  employmentType: varchar("employment_type", { length: 50 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 50 }),
  gender: varchar("gender", { length: 20 }),
  maritalStatus: varchar("marital_status", { length: 20 }),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  taxIdentificationNumber: varchar("tax_identification_number", { length: 50 }),
  faceRecognitionData: jsonb("face_recognition_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create a separate table for employee manager relationships
export const employeeRelations = pgTable("employee_relations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  managerId: integer("manager_id").notNull().references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  status: varchar("status", { length: 50 }).default('present'),
  notes: text("notes"),
  faceRecognitionVerified: boolean("face_recognition_verified"),
  verificationMethod: varchar("verification_method", { length: 50 }),
  geoLocation: jsonb("geo_location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  colorCode: varchar("color_code", { length: 20 }),
  defaultDays: integer("default_days"),
  isPaid: boolean("is_paid").default(true),
  requiresApproval: boolean("requires_approval").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id),
  fiscalYearId: integer("fiscal_year_id").references(() => fiscalYears.id),
  allocated: real("allocated").notNull(),
  used: real("used").default(0),
  pending: real("pending").default(0),
  carryOver: real("carry_over").default(0),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: 'cascade' }),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  duration: real("duration").notNull(), // In days
  halfDay: boolean("half_day").default(false),
  reason: text("reason"),
  status: varchar("status", { length: 50 }).default('pending'), // pending, approved, rejected, cancelled
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  payPeriodStart: date("pay_period_start").notNull(),
  payPeriodEnd: date("pay_period_end").notNull(),
  payDate: date("pay_date").notNull(),
  baseSalary: real("base_salary").notNull(),
  overtimePay: real("overtime_pay").default(0),
  bonuses: real("bonuses").default(0),
  commissions: real("commissions").default(0),
  deductions: real("deductions").default(0),
  taxWithholdings: real("tax_withholdings").default(0),
  netPay: real("net_pay").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 50 }).default('pending'),
  notes: text("notes"),
  payrollItems: jsonb("payroll_items"), // Detailed breakdown of earnings and deductions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const speechRecognitionProfiles = pgTable("speech_recognition_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  audioSamples: jsonb("audio_samples"), // Array of audio sample URLs or data
  voiceprintData: jsonb("voiceprint_data"), // Processed voice recognition data
  language: varchar("language", { length: 50 }).default('en-US'),
  isActive: boolean("is_active").default(true),
  accuracy: real("accuracy"), // Recognition accuracy percentage
  lastTrainingDate: timestamp("last_training_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Management Module
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  taxId: varchar("tax_id", { length: 50 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestNumber: varchar("request_number", { length: 50 }).notNull().unique(),
  requestDate: timestamp("request_date").defaultNow(),
  requiredDate: date("required_date"),
  status: varchar("status", { length: 20 }).default('draft'),
  notes: text("notes"),
  requestedBy: integer("requested_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  departmentId: integer("department_id").references(() => departments.id),
  totalAmount: real("total_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseRequestItems = pgTable("purchase_request_items", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: 'cascade' }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  estimatedUnitPrice: real("estimated_unit_price"),
  estimatedTotal: real("estimated_total"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  purchaseRequestId: integer("purchase_request_id").references(() => purchaseRequests.id),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDeliveryDate: date("expected_delivery_date"),
  status: varchar("status", { length: 20 }).default('pending'),
  shippingAddress: text("shipping_address"),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  notes: text("notes"),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount"),
  shippingAmount: real("shipping_amount"),
  discountAmount: real("discount_amount"),
  totalAmount: real("total_amount").notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  receivedQuantity: real("received_quantity").default(0),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate"),
  taxAmount: real("tax_amount"),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounting Module Extensions
export const accountCategories = pgTable("account_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),  // asset, liability, equity, income, expense
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").references(() => accounts.id),
  categoryId: integer("category_id").references(() => accountCategories.id),
  supplierContactId: integer("supplier_contact_id").references(() => contacts.id),
  expenseDate: timestamp("expense_date").defaultNow(),
  referenceNumber: varchar("reference_number", { length: 50 }),
  amount: real("amount").notNull(),
  taxAmount: real("tax_amount"),
  totalAmount: real("total_amount").notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default('unpaid'), // unpaid, partial, paid
  receiptImage: text("receipt_image"),
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").references(() => accounts.id), // Made optional for direct invoice payments
  contactId: integer("contact_id").references(() => contacts.id),
  invoiceId: integer("invoice_id").references(() => invoices.id), // Link payment to a specific invoice
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  amount: real("amount").notNull(),
  payment_method: varchar("payment_method", { length: 50 }).notNull(), // e.g., card, ACH, cash
  payment_gateway: varchar("payment_gateway", { length: 50 }), // e.g., Stripe, PayPal
  transaction_id: varchar("transaction_id", { length: 255 }), // For online payments
  gateway_fee: real("gateway_fee"), // Fee charged by payment gateway
  gateway_response: jsonb("gateway_response"), // Store the raw response from the gateway
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default('completed'), // e.g., completed, pending, failed, refunded
  refund_status: varchar("refund_status", { length: 20 }), // e.g., none, partial, full
  refund_amount: real("refund_amount"),
  refund_transaction_id: varchar("refund_transaction_id", { length: 255 }),
  refund_date: timestamp("refund_date"),
  refund_reason: text("refund_reason"),
  is_recurring: boolean("is_recurring").default(false),
  recurring_profile_id: varchar("recurring_profile_id", { length: 255 }),
  relatedDocumentType: varchar("related_document_type", { length: 50 }),  // invoice, expense, etc. - kept for broader use
  relatedDocumentId: integer("related_document_id"), // kept for broader use
  metadata: jsonb("metadata"), // For additional payment data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    paymentGatewayIdx: index("payment_gateway_idx").on(table.payment_gateway),
    invoiceIdIdx: index("payments_invoice_id_idx").on(table.invoiceId),
    statusIdx: index("payments_status_idx").on(table.status),
    paymentDateIdx: index("payments_date_idx").on(table.paymentDate),
  };
});

// MPESA Integration
export const mpesaTransactions = pgTable("mpesa_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // stk_push, b2c, c2b, etc.
  transactionId: varchar("transaction_id", { length: 100 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  amount: real("amount").notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default('pending'), // pending, completed, failed
  resultCode: varchar("result_code", { length: 10 }),
  resultDescription: text("result_description"),
  conversationId: varchar("conversation_id", { length: 100 }),
  originatorConversationId: varchar("originator_conversation_id", { length: 100 }),
  checkoutRequestId: varchar("checkout_request_id", { length: 100 }),
  accountReference: varchar("account_reference", { length: 100 }),
  mpesaReceiptNumber: varchar("mpesa_receipt_number", { length: 100 }),
  balance: real("balance"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  relatedDocumentType: varchar("related_document_type", { length: 50 }),
  relatedDocumentId: integer("related_document_id"),
  rawResponse: jsonb("raw_response"),  // Store the raw response for debugging
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payment_reminders = pgTable("payment_reminders", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  reminder_date: date("reminder_date").notNull(),
  status: varchar("status", { length: 50 }).default('pending'), // pending, sent, failed
  channel: varchar("channel", { length: 50 }).notNull(), // email, SMS
  template_used: varchar("template_used", { length: 100 }),
  sent_at: timestamp("sent_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  // Configuration for reminder schedule (e.g., days before/after due date)
  days_offset: integer("days_offset"), // e.g., -3 for 3 days before, 7 for 7 days after
  offset_type: varchar("offset_type", { length: 20}), // 'before_due', 'after_due', 'on_due'
}, (table) => {
  return {
    invoiceIdIdx: index("payment_reminders_invoice_id_idx").on(table.invoiceId),
    reminderDateIdx: index("payment_reminders_reminder_date_idx").on(table.reminder_date),
    statusIdx: index("payment_reminders_status_idx").on(table.status),
  };
});

export const payment_history = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  paymentId: integer("payment_id").references(() => payments.id), // Optional, if direct payment record exists
  event_type: varchar("event_type", { length: 100 }).notNull(), // e.g., 'payment_recorded', 'status_changed_to_paid', 'reminder_sent', 'refund_processed'
  event_timestamp: timestamp("event_timestamp").defaultNow(),
  details: jsonb("details"), // Store relevant data like old_status, new_status, amount, gateway_response
  user_id: integer("user_id").references(() => users.id), // User who initiated or system event
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    eventTimestampIdx: index("payment_history_event_timestamp_idx").on(table.event_timestamp),
    invoiceIdIdx: index("payment_history_invoice_id_idx").on(table.invoiceId),
    paymentIdIdx: index("payment_history_payment_id_idx").on(table.paymentId),
  };
});

export const payment_gateway_settings = pgTable("payment_gateway_settings", {
  id: serial("id").primaryKey(),
  gateway_name: varchar("gateway_name", { length: 100 }).notNull().unique(), // e.g., 'Stripe', 'PayPal'
  api_key_public: varchar("api_key_public", { length: 255 }),
  api_key_secret: varchar("api_key_secret", { length: 255 }), // Ensure this is stored securely
  webhook_secret: varchar("webhook_secret", {length: 255}),
  is_enabled: boolean("is_enabled").default(false),
  supported_currencies: jsonb("supported_currencies"), // e.g., ['USD', 'EUR']
  transaction_fees: jsonb("transaction_fees"), // e.g., { percentage: 2.9, fixed: 0.30 }
  additional_config: jsonb("additional_config"), // For gateway-specific settings
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tax rates table for different regions/products
export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "GST 18%", "VAT 20%"
  rate: real("rate").notNull(), // Tax rate as percentage
  type: varchar("type", { length: 50 }).notNull(), // 'GST', 'VAT', 'Sales Tax', 'Service Tax'
  region: varchar("region", { length: 100 }), // Country/state where applicable
  description: text("description"),
  is_default: boolean("is_default").default(false),
  is_active: boolean("is_active").default(true),
  effective_from: date("effective_from"),
  effective_to: date("effective_to"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Invoice templates for customization
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  template_data: jsonb("template_data").notNull(), // Stores template configuration
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Email templates for automation
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  template_type: varchar("template_type", { length: 50 }).notNull(), // 'invoice_send', 'payment_reminder', 'payment_thank_you', 'overdue_notice'
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(), // HTML email template
  variables: jsonb("variables"), // Available template variables
  is_default: boolean("is_default").default(false),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Invoice activities/audit log
export const invoiceActivities = pgTable("invoice_activities", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id),
  activity_type: varchar("activity_type", { length: 100 }).notNull(), // 'created', 'sent', 'viewed', 'paid', 'reminder_sent', 'updated'
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional activity data
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    invoiceIdIdx: index("invoice_activities_invoice_id_idx").on(table.invoiceId),
    activityTypeIdx: index("invoice_activities_type_idx").on(table.activity_type),
    createdAtIdx: index("invoice_activities_created_at_idx").on(table.created_at),
  };
});

// Payment links/portals for clients
export const paymentLinks = pgTable("payment_links", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  link_token: varchar("link_token", { length: 255 }).notNull().unique(),
  expires_at: timestamp("expires_at"),
  max_uses: integer("max_uses"),
  current_uses: integer("current_uses").default(0),
  is_active: boolean("is_active").default(true),
  custom_message: text("custom_message"),
  redirect_url: varchar("redirect_url", { length: 500 }),
  created_at: timestamp("created_at").defaultNow(),
  last_accessed: timestamp("last_accessed"),
}, (table) => {
  return {
    linkTokenIdx: index("payment_links_token_idx").on(table.link_token),
    invoiceIdIdx: index("payment_links_invoice_id_idx").on(table.invoiceId),
  };
});

// Currency exchange rates for multi-currency support
export const currencyRates = pgTable("currency_rates", {
  id: serial("id").primaryKey(),
  from_currency: varchar("from_currency", { length: 3 }).notNull(),
  to_currency: varchar("to_currency", { length: 3 }).notNull(),
  rate: real("rate").notNull(),
  rate_date: date("rate_date").notNull(),
  source: varchar("source", { length: 50 }), // e.g., 'manual', 'api', 'ecb'
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    currencyPairIdx: index("currency_rates_pair_idx").on(table.from_currency, table.to_currency),
    rateDateIdx: index("currency_rates_date_idx").on(table.rate_date),
  };
});


// Establish relations
export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  sessions: many(sessions),
  contacts: many(contacts),
  deals: many(deals),
  products: many(products),
  warehouses: many(warehouses),
  accounts: many(accounts),
  transactions: many(transactions),
  invoices: many(invoices),
  orders: many(orders),
  quotations: many(quotations),
  departments: many(departments),
  positions: many(positions),
  suppliers: many(suppliers),
  purchaseRequests: many(purchaseRequests),
  purchaseOrders: many(purchaseOrders),
  expenses: many(expenses),
  payments: many(payments),
  mpesaTransactions: many(mpesaTransactions),
  payment_history_entries: many(payment_history, { relationName: "payment_history_user" }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  deals: many(deals),
  invoices: many(invoices),
  orders: many(orders),
  quotations: many(quotations),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  user: one(users, {
    fields: [deals.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  inventoryItems: many(inventory),
  transactions: many(inventoryTransactions),
  invoiceItems: many(invoiceItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventory.warehouseId],
    references: [warehouses.id],
  }),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  user: one(users, {
    fields: [warehouses.userId],
    references: [users.id],
  }),
  inventoryItems: many(inventory),
  transactions: many(inventoryTransactions),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [invoices.contactId],
    references: [contacts.id],
  }),
  items: many(invoiceItems),
  tokens: many(invoice_tokens),
  payment_reminders: many(payment_reminders),
  payment_history_entries: many(payment_history, { relationName: "invoice_payment_history" }), // Renamed relation for clarity
  payments: many(payments), // Added relation to payments
  activities: many(invoiceActivities),
  payment_links: many(paymentLinks),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// Invoice tokens for public sharing
export const invoice_tokens = pgTable("invoice_tokens", {
  id: serial("id").primaryKey(),
  invoice_id: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  token: uuid("token").notNull().defaultRandom().unique(),
  created_by: integer("created_by").notNull().references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  is_active: boolean("is_active").default(true),
  access_count: integer("access_count").default(0),
  last_accessed: timestamp("last_accessed"),
  permissions: jsonb("permissions").default({}), // e.g., { view: true, pay: true, download: true }
});

export const invoice_tokensRelations = relations(invoice_tokens, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoice_tokens.invoice_id],
    references: [invoices.id],
  }),
  creator: one(users, {
    fields: [invoice_tokens.created_by],
    references: [users.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  managerRelations: many(employeeRelations, { relationName: 'employee' }),
  subordinateRelations: many(employeeRelations, { relationName: 'manager' }),
  attendanceRecords: many(attendance),
  payrolls: many(payroll),
}));

export const employeeRelationsRelations = relations(employeeRelations, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeRelations.employeeId],
    references: [employees.id],
  }),
  manager: one(employees, {
    fields: [employeeRelations.managerId],
    references: [employees.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  user: one(users, {
    fields: [departments.userId],
    references: [users.id],
  }),
  employees: many(employees),
  positions: many(positions),
  parentDepartment: one(departments, {
    fields: [departments.parentDepartmentId],
    references: [departments.id],
  }),
  subDepartments: many(departments, { relationName: 'parentDepartment' }),
  purchaseRequests: many(purchaseRequests),
}));

// Purchase Management Relations
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [purchaseRequests.userId],
    references: [users.id],
  }),
  requestedBy: one(users, {
    fields: [purchaseRequests.requestedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [purchaseRequests.approvedBy],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [purchaseRequests.departmentId],
    references: [departments.id],
  }),
  items: many(purchaseRequestItems),
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseRequestItemsRelations = relations(purchaseRequestItems, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [purchaseRequestItems.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
  product: one(products, {
    fields: [purchaseRequestItems.productId],
    references: [products.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [purchaseOrders.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  purchaseRequest: one(purchaseRequests, {
    fields: [purchaseOrders.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
  approvedBy: one(users, {
    fields: [purchaseOrders.approvedBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

// Accounting Relations
export const accountCategoriesRelations = relations(accountCategories, ({ one, many }) => ({
  user: one(users, {
    fields: [accountCategories.userId],
    references: [users.id],
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [expenses.accountId],
    references: [accounts.id],
  }),
  category: one(accountCategories, {
    fields: [expenses.categoryId],
    references: [accountCategories.id],
  }),
  supplierContact: one(contacts, {
    fields: [expenses.supplierContactId],
    references: [contacts.id],
  }),
  approvedBy: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  account: one(accounts, { // Kept for now, might be optional if linking directly to invoice
    fields: [payments.accountId],
    references: [accounts.id],
  }),
  contact: one(contacts, {
    fields: [payments.contactId],
    references: [contacts.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  history_entries: many(payment_history),
}));

export const paymentRemindersRelations = relations(payment_reminders, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payment_reminders.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentHistoryRelations = relations(payment_history, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payment_history.invoiceId],
    references: [invoices.id],
    relationName: "invoice_payment_history" // Ensure this matches the one in invoicesRelations
  }),
  payment: one(payments, {
    fields: [payment_history.paymentId],
    references: [payments.id],
  }),
  user: one(users, {
    fields: [payment_history.user_id],
    references: [users.id],
    relationName: "payment_history_user"
  }),
}));

// No direct relations for payment_gateway_settings as it's a configuration table.

// MPESA Relations
export const mpesaTransactionsRelations = relations(mpesaTransactions, ({ one }) => ({
  user: one(users, {
    fields: [mpesaTransactions.userId],
    references: [users.id],
  }),
}));

// Orders relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [orders.contactId],
    references: [contacts.id],
  }),
  items: many(orderItems),
  quotation: many(quotations, { relationName: "convertedQuotation" }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Quotations relations
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  user: one(users, {
    fields: [quotations.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [quotations.contactId],
    references: [contacts.id],
  }),
  items: many(quotationItems),
  convertedOrder: one(orders, {
    fields: [quotations.convertedOrderId],
    references: [orders.id],
    relationName: "convertedQuotation",
  }),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
}));

// New table relations
export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  user: one(users, {
    fields: [taxRates.userId],
    references: [users.id],
  }),
}));

export const invoiceTemplatesRelations = relations(invoiceTemplates, ({ one }) => ({
  user: one(users, {
    fields: [invoiceTemplates.userId],
    references: [users.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, {
    fields: [emailTemplates.userId],
    references: [users.id],
  }),
}));

export const invoiceActivitiesRelations = relations(invoiceActivities, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceActivities.invoiceId],
    references: [invoices.id],
  }),
  user: one(users, {
    fields: [invoiceActivities.userId],
    references: [users.id],
  }),
}));

export const paymentLinksRelations = relations(paymentLinks, ({ one }) => ({
  invoice: one(invoices, {
    fields: [paymentLinks.invoiceId],
    references: [invoices.id],
  }),
}));

// Input Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
  failedLoginAttempts: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  emailVerificationToken: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Sales Management Schemas
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  quotationNumber: true,
  createdAt: true,
  updatedAt: true,
  convertedToOrder: true,
  convertedOrderId: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Purchase Management Schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestNumber: true,
  requestDate: true,
  approvalDate: true,
  totalAmount: true,
});

export const insertPurchaseRequestItemSchema = createInsertSchema(purchaseRequestItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  estimatedTotal: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  orderNumber: true,
  orderDate: true,
  approvalDate: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  receivedQuantity: true,
  taxAmount: true,
});

// Accounting Schemas
export const insertAccountCategorySchema = createInsertSchema(accountCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvalDate: true,
  taxAmount: true,
  totalAmount: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // paymentNumber: true, // Should be generated by backend
  // paymentDate: true, // Should be set by backend
});

export const insertPaymentReminderSchema = createInsertSchema(payment_reminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sent_at: true,
});

export const insertPaymentHistorySchema = createInsertSchema(payment_history).omit({
  id: true,
  createdAt: true,
  event_timestamp: true,
});

export const insertPaymentGatewaySettingSchema = createInsertSchema(payment_gateway_settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Company schema for validation
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  setupComplete: true,
});

// Extended company schema with additional validations
export const extendedCompanySchema = insertCompanySchema.extend({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  legalName: z.string().min(2, "Legal name must be at least 2 characters"),
  businessType: z.string().min(2, "Business type must be at least 2 characters"),
  industryType: z.string().min(2, "Industry type must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
});

// MPESA Schemas
export const insertMpesaTransactionSchema = createInsertSchema(mpesaTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  transactionDate: true,
  resultCode: true,
  resultDescription: true,
  mpesaReceiptNumber: true,
  rawResponse: true,
});

// Export all the types needed for the application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type InsertPurchaseRequestItem = z.infer<typeof insertPurchaseRequestItemSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertAccountCategory = z.infer<typeof insertAccountCategorySchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertMpesaTransaction = z.infer<typeof insertMpesaTransactionSchema>;
export type InsertPaymentReminder = z.infer<typeof insertPaymentReminderSchema>;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type InsertPaymentGatewaySetting = z.infer<typeof insertPaymentGatewaySettingSchema>;


export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InvoiceWithItems = Invoice & { items?: InvoiceItem[] };
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type PurchaseRequestItem = typeof purchaseRequestItems.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type AccountCategory = typeof accountCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type MpesaTransaction = typeof mpesaTransactions.$inferSelect;
export type PaymentReminder = typeof payment_reminders.$inferSelect;
export type PaymentHistory = typeof payment_history.$inferSelect;
export type PaymentGatewaySetting = typeof payment_gateway_settings.$inferSelect;

// New table schemas
export const insertTaxRateSchema = createInsertSchema(taxRates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertInvoiceActivitySchema = createInsertSchema(invoiceActivities).omit({
  id: true,
  created_at: true,
});

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks).omit({
  id: true,
  created_at: true,
  last_accessed: true,
});

export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  created_at: true,
});

// New table types
export type TaxRate = typeof taxRates.$inferSelect;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InvoiceActivity = typeof invoiceActivities.$inferSelect;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type CurrencyRate = typeof currencyRates.$inferSelect;

// New insert types
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type InsertInvoiceActivity = z.infer<typeof insertInvoiceActivitySchema>;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;

// Audit logs table for tracking user actions (email, payment, etc.)
// CRM Module - Extended
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }).default('new'), // new, contacted, qualified, unqualified
  notes: text("notes"),
  estimatedValue: real("estimated_value"),
  priority: varchar("priority", { length: 50 }).default('medium'), // low, medium, high
  assignedTo: integer("assigned_to").references(() => users.id),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadsRelations = relations(leads, ({ one, many }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  activities: many(activities),
  tasks: many(tasks),
  phoneCalls: many(phoneCallsTable),
}));

export const dealStages = pgTable("deal_stages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  order: integer("order").notNull(),
  color: varchar("color", { length: 20 }).default('#3B82F6'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dealStagesRelations = relations(dealStages, ({ one, many }) => ({
  user: one(users, {
    fields: [dealStages.userId],
    references: [users.id],
  }),
  deals: many(deals),
}));

// Update deals table to include more CRM fields
export const dealsUpdated = pgTable("deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  leadId: integer("lead_id").references(() => leads.id),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  value: real("value"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  stage: varchar("stage", { length: 50 }).notNull(),
  stageId: integer("stage_id").references(() => dealStages.id),
  probability: integer("probability").default(0), // 0-100
  expectedCloseDate: date("expected_close_date"),
  actualCloseDate: date("actual_close_date"),
  status: varchar("status", { length: 50 }).default('open'), // open, won, lost
  source: varchar("source", { length: 100 }),
  priority: varchar("priority", { length: 50 }).default('medium'),
  ownerId: integer("owner_id").references(() => users.id),
  notes: text("notes"),
  lostReason: text("lost_reason"),
  products: jsonb("products"), // Array of product references
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  leadId: integer("lead_id").references(() => leads.id),
  dealId: integer("deal_id").references(() => deals.id),
  type: varchar("type", { length: 50 }).notNull(), // call, email, meeting, note, task
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default('completed'), // completed, pending, cancelled
  duration: integer("duration"), // in minutes
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  outcome: varchar("outcome", { length: 100 }), // successful, unsuccessful, rescheduled
  notes: text("notes"),
  attendees: jsonb("attendees"), // Array of user IDs or email addresses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
  lead: one(leads, {
    fields: [activities.leadId],
    references: [leads.id],
  }),
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id],
  }),
}));

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  leadId: integer("lead_id").references(() => leads.id),
  dealId: integer("deal_id").references(() => deals.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // call, email, meeting, follow_up, demo
  priority: varchar("priority", { length: 50 }).default('medium'), // low, medium, high, urgent
  status: varchar("status", { length: 50 }).default('pending'), // pending, in_progress, completed, cancelled
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  reminderDate: timestamp("reminder_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
  lead: one(leads, {
    fields: [tasks.leadId],
    references: [leads.id],
  }),
  deal: one(deals, {
    fields: [tasks.dealId],
    references: [deals.id],
  }),
}));

export const crmCompanies = pgTable("crm_companies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  employees: integer("employees"),
  revenue: real("revenue"),
  notes: text("notes"),
  tags: jsonb("tags"), // Array of tags
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const phoneCallsTable = pgTable("phone_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  leadId: integer("lead_id").references(() => leads.id),
  dealId: integer("deal_id").references(() => deals.id),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  status: varchar("status", { length: 50 }).notNull(), // completed, missed, busy, no_answer
  duration: integer("duration"), // in seconds
  recordingUrl: varchar("recording_url", { length: 500 }),
  notes: text("notes"),
  outcome: varchar("outcome", { length: 100 }),
  followUpRequired: boolean("follow_up_required").default(false),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // lead, contact, deal, activity, etc.
  resourceId: integer("resource_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// CRM Schema Types
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealStageSchema = createInsertSchema(dealStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrmCompanySchema = createInsertSchema(crmCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhoneCallSchema = createInsertSchema(phoneCallsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// CRM Types
export type Lead = typeof leads.$inferSelect;
export type DealStage = typeof dealStages.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type CrmCompany = typeof crmCompanies.$inferSelect;
export type PhoneCall = typeof phoneCallsTable.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertDealStage = z.infer<typeof insertDealStageSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCrmCompany = z.infer<typeof insertCrmCompanySchema>;
export type InsertPhoneCall = z.infer<typeof insertPhoneCallSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
