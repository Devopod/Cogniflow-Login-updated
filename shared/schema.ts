import { pgTable, text, serial, integer, boolean, timestamp, varchar, real, date, jsonb, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User and Authentication related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default('user'),
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
  status: varchar("status", { length: 50 }).default('draft'),
  notes: text("notes"),
  terms: text("terms"),
  currency: varchar("currency", { length: 3 }).default('USD'),
  paymentMethod: varchar("payment_method", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  accountId: integer("account_id").notNull().references(() => accounts.id),
  contactId: integer("contact_id").references(() => contacts.id),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  amount: real("amount").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default('completed'),
  relatedDocumentType: varchar("related_document_type", { length: 50 }),  // invoice, expense, etc.
  relatedDocumentId: integer("related_document_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  departments: many(departments),
  positions: many(positions),
  suppliers: many(suppliers),
  purchaseRequests: many(purchaseRequests),
  purchaseOrders: many(purchaseOrders),
  expenses: many(expenses),
  payments: many(payments),
  mpesaTransactions: many(mpesaTransactions),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  deals: many(deals),
  invoices: many(invoices),
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

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [payments.accountId],
    references: [accounts.id],
  }),
  contact: one(contacts, {
    fields: [payments.contactId],
    references: [contacts.id],
  }),
}));

// MPESA Relations
export const mpesaTransactionsRelations = relations(mpesaTransactions, ({ one }) => ({
  user: one(users, {
    fields: [mpesaTransactions.userId],
    references: [users.id],
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
  paymentNumber: true,
  paymentDate: true,
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
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type InsertPurchaseRequestItem = z.infer<typeof insertPurchaseRequestItemSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertAccountCategory = z.infer<typeof insertAccountCategorySchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertMpesaTransaction = z.infer<typeof insertMpesaTransactionSchema>;

export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
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
