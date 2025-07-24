import { Express, Request, Response, NextFunction } from "express";
import { extendedStorage } from "./storage-extensions";

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
};

export function registerDynamicRoutes(app: Express, wsService: any) {
  // System Modules API
  app.get("/api/system/modules", async (req, res) => {
    try {
      const modules = await extendedStorage.getSystemModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching system modules:", error);
      // Return empty array instead of error to prevent startup issues
      res.json([]);
    }
  });

  app.get("/api/system/modules/:moduleId/submodules", async (req, res) => {
    try {
      const { moduleId } = req.params;
      const subModules = await extendedStorage.getSystemSubModules(moduleId);
      res.json(subModules);
    } catch (error) {
      console.error("Error fetching system sub-modules:", error);
      res.status(500).json({ message: "Failed to fetch system sub-modules" });
    }
  });

  app.post("/api/system/modules", isAuthenticated, async (req, res) => {
    try {
      const module = await extendedStorage.createSystemModule(req.body);
      
      // Broadcast system update
      if (wsService) {
        wsService.broadcast('system_modules_updated', {
          message: 'System modules updated',
          module
        });
      }
      
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating system module:", error);
      res.status(500).json({ message: "Failed to create system module" });
    }
  });

  // Notifications API
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await extendedStorage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", isAuthenticated, async (req, res) => {
    try {
      const notifications = await extendedStorage.getUnreadNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notification = await extendedStorage.createNotification({
        ...req.body,
        userId: req.user!.id
      });
      
      // Broadcast notification update
      if (wsService) {
        wsService.broadcastToResource('notifications', req.user!.id, 'notification_created', {
          notification
        });
      }
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      await extendedStorage.markNotificationRead(parseInt(req.params.id));
      
      // Broadcast notification update
      if (wsService) {
        wsService.broadcastToResource('notifications', req.user!.id, 'notification_read', {
          notificationId: parseInt(req.params.id)
        });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Product Categories API
  app.get("/api/product-categories", async (req, res) => {
    try {
      const categories = await extendedStorage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  app.post("/api/product-categories", isAuthenticated, async (req, res) => {
    try {
      const category = await extendedStorage.createProductCategory(req.body);
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('product_categories_updated', {
          message: 'Product categories updated',
          category
        });
      }
      
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating product category:", error);
      res.status(500).json({ message: "Failed to create product category" });
    }
  });

  // Product Groups API
  app.get("/api/product-groups", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const groups = await extendedStorage.getProductGroups(categoryId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching product groups:", error);
      res.status(500).json({ message: "Failed to fetch product groups" });
    }
  });

  app.post("/api/product-groups", isAuthenticated, async (req, res) => {
    try {
      const group = await extendedStorage.createProductGroup(req.body);
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('product_groups_updated', {
          message: 'Product groups updated',
          group
        });
      }
      
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating product group:", error);
      res.status(500).json({ message: "Failed to create product group" });
    }
  });

  // Bill of Materials API
  app.get("/api/bill-of-materials", isAuthenticated, async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const boms = await extendedStorage.getBillOfMaterials(productId);
      res.json(boms);
    } catch (error) {
      console.error("Error fetching BOMs:", error);
      res.status(500).json({ message: "Failed to fetch bill of materials" });
    }
  });

  app.get("/api/bill-of-materials/:id", isAuthenticated, async (req, res) => {
    try {
      const bom = await extendedStorage.getBillOfMaterial(parseInt(req.params.id));
      if (!bom) {
        return res.status(404).json({ message: "BOM not found" });
      }
      res.json(bom);
    } catch (error) {
      console.error("Error fetching BOM:", error);
      res.status(500).json({ message: "Failed to fetch bill of materials" });
    }
  });

  app.get("/api/bill-of-materials/:id/items", isAuthenticated, async (req, res) => {
    try {
      const items = await extendedStorage.getBomItems(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching BOM items:", error);
      res.status(500).json({ message: "Failed to fetch BOM items" });
    }
  });

  app.post("/api/bill-of-materials", isAuthenticated, async (req, res) => {
    try {
      const bom = await extendedStorage.createBillOfMaterial(req.body);
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('bom_updated', {
          message: 'Bill of materials updated',
          bom
        });
      }
      
      res.status(201).json(bom);
    } catch (error) {
      console.error("Error creating BOM:", error);
      res.status(500).json({ message: "Failed to create bill of materials" });
    }
  });

  // Task Management API
  app.get("/api/task-categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await extendedStorage.getTaskCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching task categories:", error);
      res.status(500).json({ message: "Failed to fetch task categories" });
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
      const status = req.query.status as string;
      const tasks = await extendedStorage.getTasks(assignedTo, status);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const task = await extendedStorage.createTask({
        ...req.body,
        createdBy: req.user!.id
      });
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('tasks_updated', {
          message: 'Tasks updated',
          task
        });
        
        if (task.assignedTo) {
          wsService.broadcastToResource('tasks', task.assignedTo, 'task_assigned', {
            task
          });
        }
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await extendedStorage.updateTask(parseInt(req.params.id), req.body);
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('tasks_updated', {
          message: 'Task updated',
          task
        });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Goods Delivery Notes API
  app.get("/api/goods-delivery-notes", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const gdns = await extendedStorage.getGoodsDeliveryNotes(customerId);
      res.json(gdns);
    } catch (error) {
      console.error("Error fetching GDNs:", error);
      res.status(500).json({ message: "Failed to fetch goods delivery notes" });
    }
  });

  app.get("/api/goods-delivery-notes/:id/items", isAuthenticated, async (req, res) => {
    try {
      const items = await extendedStorage.getGdnItems(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching GDN items:", error);
      res.status(500).json({ message: "Failed to fetch GDN items" });
    }
  });

  app.post("/api/goods-delivery-notes", isAuthenticated, async (req, res) => {
    try {
      const gdn = await extendedStorage.createGoodsDeliveryNote({
        ...req.body,
        createdBy: req.user!.id
      });
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('gdn_updated', {
          message: 'Goods delivery notes updated',
          gdn
        });
      }
      
      res.status(201).json(gdn);
    } catch (error) {
      console.error("Error creating GDN:", error);
      res.status(500).json({ message: "Failed to create goods delivery note" });
    }
  });

  // Goods Receipt Notes API
  app.get("/api/goods-receipt-notes", isAuthenticated, async (req, res) => {
    try {
      const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
      const grns = await extendedStorage.getGoodsReceiptNotes(supplierId);
      res.json(grns);
    } catch (error) {
      console.error("Error fetching GRNs:", error);
      res.status(500).json({ message: "Failed to fetch goods receipt notes" });
    }
  });

  app.get("/api/goods-receipt-notes/:id/items", isAuthenticated, async (req, res) => {
    try {
      const items = await extendedStorage.getGrnItems(parseInt(req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching GRN items:", error);
      res.status(500).json({ message: "Failed to fetch GRN items" });
    }
  });

  app.post("/api/goods-receipt-notes", isAuthenticated, async (req, res) => {
    try {
      const grn = await extendedStorage.createGoodsReceiptNote({
        ...req.body,
        createdBy: req.user!.id
      });
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('grn_updated', {
          message: 'Goods receipt notes updated',
          grn
        });
      }
      
      res.status(201).json(grn);
    } catch (error) {
      console.error("Error creating GRN:", error);
      res.status(500).json({ message: "Failed to create goods receipt note" });
    }
  });

  // Branding Templates API
  app.get("/api/branding-templates", isAuthenticated, async (req, res) => {
    try {
      const type = req.query.type as string;
      const templates = await extendedStorage.getBrandingTemplates(type);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching branding templates:", error);
      res.status(500).json({ message: "Failed to fetch branding templates" });
    }
  });

  app.post("/api/branding-templates", isAuthenticated, async (req, res) => {
    try {
      const template = await extendedStorage.createBrandingTemplate({
        ...req.body,
        createdBy: req.user!.id
      });
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('branding_templates_updated', {
          message: 'Branding templates updated',
          template
        });
      }
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating branding template:", error);
      res.status(500).json({ message: "Failed to create branding template" });
    }
  });

  // System Settings API
  app.get("/api/system/settings", isAuthenticated, async (req, res) => {
    try {
      const category = req.query.category as string;
      const settings = await extendedStorage.getSystemSettings(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.get("/api/system/settings/:key", isAuthenticated, async (req, res) => {
    try {
      const setting = await extendedStorage.getSystemSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: "Failed to fetch system setting" });
    }
  });

  app.put("/api/system/settings/:key", isAuthenticated, async (req, res) => {
    try {
      const setting = await extendedStorage.updateSystemSetting(req.params.key, req.body.value);
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('system_settings_updated', {
          message: 'System settings updated',
          setting
        });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: "Failed to update system setting" });
    }
  });

  // Lead Management API
  app.get("/api/lead-sources", isAuthenticated, async (req, res) => {
    try {
      const sources = await extendedStorage.getLeadSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      res.status(500).json({ message: "Failed to fetch lead sources" });
    }
  });

  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
      const status = req.query.status as string;
      const leads = await extendedStorage.getLeads(assignedTo, status);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const lead = await extendedStorage.createLead({
        ...req.body,
        createdBy: req.user!.id
      });
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('leads_updated', {
          message: 'Leads updated',
          lead
        });
        
        if (lead.assignedTo) {
          wsService.broadcastToResource('leads', lead.assignedTo, 'lead_assigned', {
            lead
          });
        }
      }
      
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const lead = await extendedStorage.updateLead(parseInt(req.params.id), req.body);
      
      // Broadcast update
      if (wsService) {
        wsService.broadcast('leads_updated', {
          message: 'Lead updated',
          lead
        });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // Analytics Cache API (for performance optimization)
  app.get("/api/analytics/:type", isAuthenticated, async (req, res) => {
    try {
      const cache = await extendedStorage.getAnalyticsCache(req.user!.id, req.params.type);
      
      if (cache) {
        res.json(cache.data);
      } else {
        res.status(404).json({ message: "No cached data available" });
      }
    } catch (error) {
      console.error("Error fetching analytics cache:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Dynamic dashboard data endpoints
  app.get("/api/dashboard/low-stock-items", isAuthenticated, async (req, res) => {
    try {
      // This would integrate with inventory system
      // For now, return dynamic data structure
      res.json([]);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.get("/api/dashboard/upcoming-leaves", isAuthenticated, async (req, res) => {
    try {
      // This would integrate with HR system
      // For now, return dynamic data structure
      res.json([]);
    } catch (error) {
      console.error("Error fetching upcoming leaves:", error);
      res.status(500).json({ message: "Failed to fetch upcoming leaves" });
    }
  });

  app.get("/api/dashboard/warehouse-capacity", isAuthenticated, async (req, res) => {
    try {
      // This would integrate with warehouse system
      // For now, return dynamic data structure
      res.json([]);
    } catch (error) {
      console.error("Error fetching warehouse capacity:", error);
      res.status(500).json({ message: "Failed to fetch warehouse capacity" });
    }
  });

  app.get("/api/dashboard/delivery-performance", isAuthenticated, async (req, res) => {
    try {
      // This would integrate with delivery tracking system
      // For now, return dynamic data structure
      res.json([]);
    } catch (error) {
      console.error("Error fetching delivery performance:", error);
      res.status(500).json({ message: "Failed to fetch delivery performance" });
    }
  });
}