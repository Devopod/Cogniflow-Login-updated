import { pgTable, text, serial, integer, boolean, timestamp, varchar, real, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// System Configuration Tables
export const systemModules = pgTable("system_modules", {
  id: serial("id").primaryKey(),
  moduleId: varchar("module_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemSubModules = pgTable("system_sub_modules", {
  id: serial("id").primaryKey(),
  subModuleId: varchar("sub_module_id", { length: 50 }).notNull().unique(),
  moduleId: varchar("module_id", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification System
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // info, warning, error, success
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  actionType: varchar("action_type", { length: 50 }), // button, link, none
  actionUrl: varchar("action_url", { length: 500 }),
  actionLabel: varchar("action_label", { length: 100 }),
  metadata: jsonb("metadata"), // Additional data for notification
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Categories and Groups
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productGroups = pgTable("product_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id"),
  isActive: boolean("is_active").default(true),
  properties: jsonb("properties"), // Custom properties for the group
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bill of Materials
export const billOfMaterials = pgTable("bill_of_materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  productId: integer("product_id").notNull(),
  version: varchar("version", { length: 20 }).default("1.0"),
  description: text("description"),
  unitCost: real("unit_cost").default(0),
  laborCost: real("labor_cost").default(0),
  overheadCost: real("overhead_cost").default(0),
  totalCost: real("total_cost").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").default(0),
  totalCost: real("total_cost").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Management System
export const taskCategories = pgTable("task_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id"),
  moduleId: varchar("module_id", { length: 50 }),
  assignedTo: integer("assigned_to"),
  createdBy: integer("created_by").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  scheduledDate: timestamp("scheduled_date"),
  frequency: varchar("frequency", { length: 50 }), // once, daily, weekly, monthly, yearly
  isRecurring: boolean("is_recurring").default(false),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"), // Additional task data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Goods Delivery Note System
export const goodsDeliveryNotes = pgTable("goods_delivery_notes", {
  id: serial("id").primaryKey(),
  gdnNumber: varchar("gdn_number", { length: 50 }).notNull().unique(),
  invoiceId: integer("invoice_id"),
  customerId: integer("customer_id").notNull(),
  warehouseId: integer("warehouse_id").notNull(),
  deliveryMethod: varchar("delivery_method", { length: 50 }).notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryDate: date("delivery_date").notNull(),
  driverName: varchar("driver_name", { length: 100 }),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_transit, delivered, cancelled
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gdnItems = pgTable("gdn_items", {
  id: serial("id").primaryKey(),
  gdnId: integer("gdn_id").notNull(),
  productId: integer("product_id").notNull(),
  requestedQuantity: real("requested_quantity").notNull(),
  deliveredQuantity: real("delivered_quantity").default(0),
  unitPrice: real("unit_price").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Goods Receipt Note System
export const goodsReceiptNotes = pgTable("goods_receipt_notes", {
  id: serial("id").primaryKey(),
  grnNumber: varchar("grn_number", { length: 50 }).notNull().unique(),
  purchaseOrderId: integer("purchase_order_id"),
  supplierId: integer("supplier_id").notNull(),
  warehouseId: integer("warehouse_id").notNull(),
  receivedDate: date("received_date").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, partial, completed
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const grnItems = pgTable("grn_items", {
  id: serial("id").primaryKey(),
  grnId: integer("grn_id").notNull(),
  productId: integer("product_id").notNull(),
  orderedQuantity: real("ordered_quantity").notNull(),
  receivedQuantity: real("received_quantity").notNull(),
  unitPrice: real("unit_price").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branding and Template System
export const brandingTemplates = pgTable("branding_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // invoice, quotation, report, etc.
  description: text("description"),
  template: jsonb("template").notNull(), // Template configuration
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 20 }).default("text"), // text, number, boolean, json
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  isEditable: boolean("is_editable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dashboard Analytics Cache
export const analyticsCache = pgTable("analytics_cache", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // sales_metrics, inventory_overview, etc.
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Management
export const leadSources = pgTable("lead_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id"),
  sourceId: integer("source_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("new"), // new, contacted, qualified, proposal, negotiation, closed_won, closed_lost
  priority: varchar("priority", { length: 20 }).default("medium"),
  estimatedValue: real("estimated_value").default(0),
  probability: integer("probability").default(0), // 0-100%
  expectedCloseDate: date("expected_close_date"),
  assignedTo: integer("assigned_to"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export schemas for validation
export const insertSystemModuleSchema = createInsertSchema(systemModules);
export const insertSystemSubModuleSchema = createInsertSchema(systemSubModules);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertProductCategorySchema = createInsertSchema(productCategories);
export const insertProductGroupSchema = createInsertSchema(productGroups);
export const insertBillOfMaterialsSchema = createInsertSchema(billOfMaterials);
export const insertBomItemSchema = createInsertSchema(bomItems);
export const insertTaskCategorySchema = createInsertSchema(taskCategories);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertGoodsDeliveryNoteSchema = createInsertSchema(goodsDeliveryNotes);
export const insertGdnItemSchema = createInsertSchema(gdnItems);
export const insertGoodsReceiptNoteSchema = createInsertSchema(goodsReceiptNotes);
export const insertGrnItemSchema = createInsertSchema(grnItems);
export const insertBrandingTemplateSchema = createInsertSchema(brandingTemplates);
export const insertSystemSettingSchema = createInsertSchema(systemSettings);
export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache);
export const insertLeadSourceSchema = createInsertSchema(leadSources);
export const insertLeadSchema = createInsertSchema(leads);

// Type exports
export type SystemModule = typeof systemModules.$inferSelect;
export type InsertSystemModule = typeof systemModules.$inferInsert;
export type SystemSubModule = typeof systemSubModules.$inferSelect;
export type InsertSystemSubModule = typeof systemSubModules.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;
export type ProductGroup = typeof productGroups.$inferSelect;
export type InsertProductGroup = typeof productGroups.$inferInsert;
export type BillOfMaterials = typeof billOfMaterials.$inferSelect;
export type InsertBillOfMaterials = typeof billOfMaterials.$inferInsert;
export type BomItem = typeof bomItems.$inferSelect;
export type InsertBomItem = typeof bomItems.$inferInsert;
export type TaskCategory = typeof taskCategories.$inferSelect;
export type InsertTaskCategory = typeof taskCategories.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type GoodsDeliveryNote = typeof goodsDeliveryNotes.$inferSelect;
export type InsertGoodsDeliveryNote = typeof goodsDeliveryNotes.$inferInsert;
export type GdnItem = typeof gdnItems.$inferSelect;
export type InsertGdnItem = typeof gdnItems.$inferInsert;
export type GoodsReceiptNote = typeof goodsReceiptNotes.$inferSelect;
export type InsertGoodsReceiptNote = typeof goodsReceiptNotes.$inferInsert;
export type GrnItem = typeof grnItems.$inferSelect;
export type InsertGrnItem = typeof grnItems.$inferInsert;
export type BrandingTemplate = typeof brandingTemplates.$inferSelect;
export type InsertBrandingTemplate = typeof brandingTemplates.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = typeof analyticsCache.$inferInsert;
export type LeadSource = typeof leadSources.$inferSelect;
export type InsertLeadSource = typeof leadSources.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;