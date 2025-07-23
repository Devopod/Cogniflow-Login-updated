import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import {
  systemModules, systemSubModules, notifications, productCategories, productGroups,
  billOfMaterials, bomItems, taskCategories, tasks, goodsDeliveryNotes, gdnItems,
  goodsReceiptNotes, grnItems, brandingTemplates, systemSettings, analyticsCache,
  leadSources, leads,
  type SystemModule, type InsertSystemModule,
  type SystemSubModule, type InsertSystemSubModule,
  type Notification, type InsertNotification,
  type ProductCategory, type InsertProductCategory,
  type ProductGroup, type InsertProductGroup,
  type BillOfMaterials, type InsertBillOfMaterials,
  type BomItem, type InsertBomItem,
  type TaskCategory, type InsertTaskCategory,
  type Task, type InsertTask,
  type GoodsDeliveryNote, type InsertGoodsDeliveryNote,
  type GdnItem, type InsertGdnItem,
  type GoodsReceiptNote, type InsertGoodsReceiptNote,
  type GrnItem, type InsertGrnItem,
  type BrandingTemplate, type InsertBrandingTemplate,
  type SystemSetting, type InsertSystemSetting,
  type AnalyticsCache, type InsertAnalyticsCache,
  type LeadSource, type InsertLeadSource,
  type Lead, type InsertLead
} from "@shared/schema-extensions";

export class ExtendedStorageService {
  // System Modules Management
  async getSystemModules(): Promise<SystemModule[]> {
    const modules = await db.select().from(systemModules)
      .where(eq(systemModules.isActive, true))
      .orderBy(asc(systemModules.sortOrder), asc(systemModules.name));
    return modules;
  }

  async getSystemModule(id: number): Promise<SystemModule | undefined> {
    const [module] = await db.select().from(systemModules).where(eq(systemModules.id, id));
    return module;
  }

  async createSystemModule(module: InsertSystemModule): Promise<SystemModule> {
    const [newModule] = await db.insert(systemModules).values(module).returning();
    return newModule;
  }

  async updateSystemModule(id: number, data: Partial<InsertSystemModule>): Promise<SystemModule | undefined> {
    const [module] = await db.update(systemModules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(systemModules.id, id))
      .returning();
    return module;
  }

  async deleteSystemModule(id: number): Promise<boolean> {
    await db.delete(systemModules).where(eq(systemModules.id, id));
    return true;
  }

  // System Sub-Modules Management
  async getSystemSubModules(moduleId?: string): Promise<SystemSubModule[]> {
    let query = db.select().from(systemSubModules)
      .where(eq(systemSubModules.isActive, true));
    
    if (moduleId) {
      query = query.where(and(
        eq(systemSubModules.isActive, true),
        eq(systemSubModules.moduleId, moduleId)
      ));
    }
    
    const subModules = await query.orderBy(asc(systemSubModules.sortOrder), asc(systemSubModules.name));
    return subModules;
  }

  async createSystemSubModule(subModule: InsertSystemSubModule): Promise<SystemSubModule> {
    const [newSubModule] = await db.insert(systemSubModules).values(subModule).returning();
    return newSubModule;
  }

  // Notifications Management
  async getNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
    const notifications_list = await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return notifications_list;
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    const unread = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
    return unread;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    await db.update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, id));
    return true;
  }

  async markAllNotificationsRead(userId: number): Promise<boolean> {
    await db.update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.userId, userId));
    return true;
  }

  // Product Categories Management
  async getProductCategories(): Promise<ProductCategory[]> {
    const categories = await db.select().from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
    return categories;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db.insert(productCategories).values(category).returning();
    return newCategory;
  }

  async updateProductCategory(id: number, data: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const [category] = await db.update(productCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productCategories.id, id))
      .returning();
    return category;
  }

  // Product Groups Management
  async getProductGroups(categoryId?: number): Promise<ProductGroup[]> {
    let query = db.select().from(productGroups)
      .where(eq(productGroups.isActive, true));
    
    if (categoryId) {
      query = query.where(and(
        eq(productGroups.isActive, true),
        eq(productGroups.categoryId, categoryId)
      ));
    }
    
    const groups = await query.orderBy(asc(productGroups.name));
    return groups;
  }

  async createProductGroup(group: InsertProductGroup): Promise<ProductGroup> {
    const [newGroup] = await db.insert(productGroups).values(group).returning();
    return newGroup;
  }

  // Bill of Materials Management
  async getBillOfMaterials(productId?: number): Promise<BillOfMaterials[]> {
    let query = db.select().from(billOfMaterials)
      .where(eq(billOfMaterials.isActive, true));
    
    if (productId) {
      query = query.where(and(
        eq(billOfMaterials.isActive, true),
        eq(billOfMaterials.productId, productId)
      ));
    }
    
    const boms = await query.orderBy(desc(billOfMaterials.createdAt));
    return boms;
  }

  async getBillOfMaterial(id: number): Promise<BillOfMaterials | undefined> {
    const [bom] = await db.select().from(billOfMaterials).where(eq(billOfMaterials.id, id));
    return bom;
  }

  async createBillOfMaterial(bom: InsertBillOfMaterials): Promise<BillOfMaterials> {
    const [newBom] = await db.insert(billOfMaterials).values(bom).returning();
    return newBom;
  }

  async getBomItems(bomId: number): Promise<BomItem[]> {
    const items = await db.select().from(bomItems)
      .where(eq(bomItems.bomId, bomId))
      .orderBy(asc(bomItems.id));
    return items;
  }

  async createBomItem(item: InsertBomItem): Promise<BomItem> {
    const [newItem] = await db.insert(bomItems).values(item).returning();
    return newItem;
  }

  // Task Management
  async getTaskCategories(): Promise<TaskCategory[]> {
    const categories = await db.select().from(taskCategories)
      .where(eq(taskCategories.isActive, true))
      .orderBy(asc(taskCategories.name));
    return categories;
  }

  async createTaskCategory(category: InsertTaskCategory): Promise<TaskCategory> {
    const [newCategory] = await db.insert(taskCategories).values(category).returning();
    return newCategory;
  }

  async getTasks(assignedTo?: number, status?: string): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [];
    if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
    if (status) conditions.push(eq(tasks.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const tasksList = await query.orderBy(desc(tasks.createdAt));
    return tasksList;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Goods Delivery Notes Management
  async getGoodsDeliveryNotes(customerId?: number): Promise<GoodsDeliveryNote[]> {
    let query = db.select().from(goodsDeliveryNotes);
    
    if (customerId) {
      query = query.where(eq(goodsDeliveryNotes.customerId, customerId));
    }
    
    const gdns = await query.orderBy(desc(goodsDeliveryNotes.createdAt));
    return gdns;
  }

  async getGoodsDeliveryNote(id: number): Promise<GoodsDeliveryNote | undefined> {
    const [gdn] = await db.select().from(goodsDeliveryNotes).where(eq(goodsDeliveryNotes.id, id));
    return gdn;
  }

  async createGoodsDeliveryNote(gdn: InsertGoodsDeliveryNote): Promise<GoodsDeliveryNote> {
    const [newGdn] = await db.insert(goodsDeliveryNotes).values(gdn).returning();
    return newGdn;
  }

  async getGdnItems(gdnId: number): Promise<GdnItem[]> {
    const items = await db.select().from(gdnItems)
      .where(eq(gdnItems.gdnId, gdnId))
      .orderBy(asc(gdnItems.id));
    return items;
  }

  async createGdnItem(item: InsertGdnItem): Promise<GdnItem> {
    const [newItem] = await db.insert(gdnItems).values(item).returning();
    return newItem;
  }

  // Goods Receipt Notes Management
  async getGoodsReceiptNotes(supplierId?: number): Promise<GoodsReceiptNote[]> {
    let query = db.select().from(goodsReceiptNotes);
    
    if (supplierId) {
      query = query.where(eq(goodsReceiptNotes.supplierId, supplierId));
    }
    
    const grns = await query.orderBy(desc(goodsReceiptNotes.createdAt));
    return grns;
  }

  async getGoodsReceiptNote(id: number): Promise<GoodsReceiptNote | undefined> {
    const [grn] = await db.select().from(goodsReceiptNotes).where(eq(goodsReceiptNotes.id, id));
    return grn;
  }

  async createGoodsReceiptNote(grn: InsertGoodsReceiptNote): Promise<GoodsReceiptNote> {
    const [newGrn] = await db.insert(goodsReceiptNotes).values(grn).returning();
    return newGrn;
  }

  async getGrnItems(grnId: number): Promise<GrnItem[]> {
    const items = await db.select().from(grnItems)
      .where(eq(grnItems.grnId, grnId))
      .orderBy(asc(grnItems.id));
    return items;
  }

  async createGrnItem(item: InsertGrnItem): Promise<GrnItem> {
    const [newItem] = await db.insert(grnItems).values(item).returning();
    return newItem;
  }

  // Branding Templates Management
  async getBrandingTemplates(type?: string): Promise<BrandingTemplate[]> {
    let query = db.select().from(brandingTemplates)
      .where(eq(brandingTemplates.isActive, true));
    
    if (type) {
      query = query.where(and(
        eq(brandingTemplates.isActive, true),
        eq(brandingTemplates.type, type)
      ));
    }
    
    const templates = await query.orderBy(desc(brandingTemplates.isDefault), asc(brandingTemplates.name));
    return templates;
  }

  async createBrandingTemplate(template: InsertBrandingTemplate): Promise<BrandingTemplate> {
    const [newTemplate] = await db.insert(brandingTemplates).values(template).returning();
    return newTemplate;
  }

  // System Settings Management
  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    let query = db.select().from(systemSettings);
    
    if (category) {
      query = query.where(eq(systemSettings.category, category));
    }
    
    const settings = await query.orderBy(asc(systemSettings.category), asc(systemSettings.key));
    return settings;
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning();
    return setting;
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [newSetting] = await db.insert(systemSettings).values(setting).returning();
    return newSetting;
  }

  // Analytics Cache Management
  async getAnalyticsCache(userId: number, type: string): Promise<AnalyticsCache | undefined> {
    const [cache] = await db.select().from(analyticsCache)
      .where(and(
        eq(analyticsCache.userId, userId),
        eq(analyticsCache.type, type)
      ));
    
    // Check if cache is still valid
    if (cache && new Date() > cache.expiresAt) {
      await this.deleteAnalyticsCache(cache.id);
      return undefined;
    }
    
    return cache;
  }

  async setAnalyticsCache(userId: number, type: string, data: any, expiresInMinutes: number = 15): Promise<AnalyticsCache> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Delete existing cache for this user and type
    await db.delete(analyticsCache)
      .where(and(
        eq(analyticsCache.userId, userId),
        eq(analyticsCache.type, type)
      ));
    
    const [newCache] = await db.insert(analyticsCache).values({
      userId,
      type,
      data,
      expiresAt
    }).returning();
    
    return newCache;
  }

  async deleteAnalyticsCache(id: number): Promise<boolean> {
    await db.delete(analyticsCache).where(eq(analyticsCache.id, id));
    return true;
  }

  // Lead Management
  async getLeadSources(): Promise<LeadSource[]> {
    const sources = await db.select().from(leadSources)
      .where(eq(leadSources.isActive, true))
      .orderBy(asc(leadSources.name));
    return sources;
  }

  async createLeadSource(source: InsertLeadSource): Promise<LeadSource> {
    const [newSource] = await db.insert(leadSources).values(source).returning();
    return newSource;
  }

  async getLeads(assignedTo?: number, status?: string): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    const conditions = [];
    if (assignedTo) conditions.push(eq(leads.assignedTo, assignedTo));
    if (status) conditions.push(eq(leads.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const leadsList = await query.orderBy(desc(leads.createdAt));
    return leadsList;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db.update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }
}

export const extendedStorage = new ExtendedStorageService();