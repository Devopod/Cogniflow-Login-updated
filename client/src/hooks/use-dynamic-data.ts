import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './use-websocket';

// System Modules Hook
export const useSystemModules = () => {
  const queryClient = useQueryClient();
  
  // Set up WebSocket for real-time updates
  useWebSocket({
    resource: 'system',
    resourceId: 'modules',
    onMessage: (message) => {
      if (message.type === 'system_modules_updated') {
        queryClient.invalidateQueries({ queryKey: ['systemModules'] });
        queryClient.invalidateQueries({ queryKey: ['systemSubModules'] });
      }
    }
  });

  return useQuery({
    queryKey: ['systemModules'],
    queryFn: async () => {
      const response = await fetch('/api/system/modules');
      if (!response.ok) throw new Error('Failed to fetch system modules');
      return response.json();
    }
  });
};

export const useSystemSubModules = (moduleId?: string) => {
  return useQuery({
    queryKey: ['systemSubModules', moduleId],
    queryFn: async () => {
      const url = moduleId 
        ? `/api/system/modules/${moduleId}/submodules`
        : '/api/system/modules/all/submodules';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch system sub-modules');
      return response.json();
    },
    enabled: !!moduleId
  });
};

// Notifications Hook
export const useNotifications = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'notifications',
    resourceId: 'all',
    onMessage: (message) => {
      if (['notification_created', 'notification_read'].includes(message.type)) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      }
    }
  });

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    }
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread');
      if (!response.ok) throw new Error('Failed to fetch unread notifications');
      return response.json();
    }
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    }
  });
};

// Product Categories Hook
export const useProductCategories = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'products',
    resourceId: 'categories',
    onMessage: (message) => {
      if (message.type === 'product_categories_updated') {
        queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      }
    }
  });

  return useQuery({
    queryKey: ['productCategories'],
    queryFn: async () => {
      const response = await fetch('/api/product-categories');
      if (!response.ok) throw new Error('Failed to fetch product categories');
      return response.json();
    }
  });
};

// Product Groups Hook
export const useProductGroups = (categoryId?: number) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'products',
    resourceId: 'groups',
    onMessage: (message) => {
      if (message.type === 'product_groups_updated') {
        queryClient.invalidateQueries({ queryKey: ['productGroups'] });
      }
    }
  });

  return useQuery({
    queryKey: ['productGroups', categoryId],
    queryFn: async () => {
      const url = categoryId 
        ? `/api/product-groups?categoryId=${categoryId}`
        : '/api/product-groups';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch product groups');
      return response.json();
    }
  });
};

// Bill of Materials Hook
export const useBillOfMaterials = (productId?: number) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'bom',
    resourceId: 'all',
    onMessage: (message) => {
      if (message.type === 'bom_updated') {
        queryClient.invalidateQueries({ queryKey: ['billOfMaterials'] });
      }
    }
  });

  return useQuery({
    queryKey: ['billOfMaterials', productId],
    queryFn: async () => {
      const url = productId 
        ? `/api/bill-of-materials?productId=${productId}`
        : '/api/bill-of-materials';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch bill of materials');
      return response.json();
    }
  });
};

export const useBillOfMaterial = (id: number) => {
  return useQuery({
    queryKey: ['billOfMaterial', id],
    queryFn: async () => {
      const response = await fetch(`/api/bill-of-materials/${id}`);
      if (!response.ok) throw new Error('Failed to fetch bill of material');
      return response.json();
    },
    enabled: !!id
  });
};

export const useBomItems = (bomId: number) => {
  return useQuery({
    queryKey: ['bomItems', bomId],
    queryFn: async () => {
      const response = await fetch(`/api/bill-of-materials/${bomId}/items`);
      if (!response.ok) throw new Error('Failed to fetch BOM items');
      return response.json();
    },
    enabled: !!bomId
  });
};

// Task Management Hook
export const useTaskCategories = () => {
  return useQuery({
    queryKey: ['taskCategories'],
    queryFn: async () => {
      const response = await fetch('/api/task-categories');
      if (!response.ok) throw new Error('Failed to fetch task categories');
      return response.json();
    }
  });
};

export const useTasks = (assignedTo?: number, status?: string) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'tasks',
    resourceId: 'all',
    onMessage: (message) => {
      if (['tasks_updated', 'task_assigned'].includes(message.type)) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    }
  });

  return useQuery({
    queryKey: ['tasks', assignedTo, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assignedTo) params.append('assignedTo', assignedTo.toString());
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
};

// Goods Delivery Notes Hook
export const useGoodsDeliveryNotes = (customerId?: number) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'gdn',
    resourceId: 'all',
    onMessage: (message) => {
      if (message.type === 'gdn_updated') {
        queryClient.invalidateQueries({ queryKey: ['goodsDeliveryNotes'] });
      }
    }
  });

  return useQuery({
    queryKey: ['goodsDeliveryNotes', customerId],
    queryFn: async () => {
      const url = customerId 
        ? `/api/goods-delivery-notes?customerId=${customerId}`
        : '/api/goods-delivery-notes';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch goods delivery notes');
      return response.json();
    }
  });
};

export const useGdnItems = (gdnId: number) => {
  return useQuery({
    queryKey: ['gdnItems', gdnId],
    queryFn: async () => {
      const response = await fetch(`/api/goods-delivery-notes/${gdnId}/items`);
      if (!response.ok) throw new Error('Failed to fetch GDN items');
      return response.json();
    },
    enabled: !!gdnId
  });
};

// Goods Receipt Notes Hook
export const useGoodsReceiptNotes = (supplierId?: number) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'grn',
    resourceId: 'all',
    onMessage: (message) => {
      if (message.type === 'grn_updated') {
        queryClient.invalidateQueries({ queryKey: ['goodsReceiptNotes'] });
      }
    }
  });

  return useQuery({
    queryKey: ['goodsReceiptNotes', supplierId],
    queryFn: async () => {
      const url = supplierId 
        ? `/api/goods-receipt-notes?supplierId=${supplierId}`
        : '/api/goods-receipt-notes';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch goods receipt notes');
      return response.json();
    }
  });
};

export const useGrnItems = (grnId: number) => {
  return useQuery({
    queryKey: ['grnItems', grnId],
    queryFn: async () => {
      const response = await fetch(`/api/goods-receipt-notes/${grnId}/items`);
      if (!response.ok) throw new Error('Failed to fetch GRN items');
      return response.json();
    },
    enabled: !!grnId
  });
};

// Branding Templates Hook
export const useBrandingTemplates = (type?: string) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'branding',
    resourceId: 'templates',
    onMessage: (message) => {
      if (message.type === 'branding_templates_updated') {
        queryClient.invalidateQueries({ queryKey: ['brandingTemplates'] });
      }
    }
  });

  return useQuery({
    queryKey: ['brandingTemplates', type],
    queryFn: async () => {
      const url = type 
        ? `/api/branding-templates?type=${type}`
        : '/api/branding-templates';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch branding templates');
      return response.json();
    }
  });
};

// System Settings Hook
export const useSystemSettings = (category?: string) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'system',
    resourceId: 'settings',
    onMessage: (message) => {
      if (message.type === 'system_settings_updated') {
        queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      }
    }
  });

  return useQuery({
    queryKey: ['systemSettings', category],
    queryFn: async () => {
      const url = category 
        ? `/api/system/settings?category=${category}`
        : '/api/system/settings';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch system settings');
      return response.json();
    }
  });
};

export const useSystemSetting = (key: string) => {
  return useQuery({
    queryKey: ['systemSetting', key],
    queryFn: async () => {
      const response = await fetch(`/api/system/settings/${key}`);
      if (!response.ok) throw new Error('Failed to fetch system setting');
      return response.json();
    },
    enabled: !!key
  });
};

// Lead Management Hook
export const useLeadSources = () => {
  return useQuery({
    queryKey: ['leadSources'],
    queryFn: async () => {
      const response = await fetch('/api/lead-sources');
      if (!response.ok) throw new Error('Failed to fetch lead sources');
      return response.json();
    }
  });
};

export const useLeads = (assignedTo?: number, status?: string) => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'leads',
    resourceId: 'all',
    onMessage: (message) => {
      if (['leads_updated', 'lead_assigned'].includes(message.type)) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }
    }
  });

  return useQuery({
    queryKey: ['leads', assignedTo, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assignedTo) params.append('assignedTo', assignedTo.toString());
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    }
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: any) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (!response.ok) throw new Error('Failed to create lead');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
};

// Dynamic Dashboard Data Hooks
export const useLowStockItems = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'inventory',
    resourceId: 'stock',
    onMessage: (message) => {
      if (message.type === 'inventory_updated') {
        queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      }
    }
  });

  return useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/low-stock-items');
      if (!response.ok) throw new Error('Failed to fetch low stock items');
      return response.json();
    }
  });
};

export const useUpcomingLeaves = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'hr',
    resourceId: 'leaves',
    onMessage: (message) => {
      if (message.type === 'leave_updated') {
        queryClient.invalidateQueries({ queryKey: ['upcomingLeaves'] });
      }
    }
  });

  return useQuery({
    queryKey: ['upcomingLeaves'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/upcoming-leaves');
      if (!response.ok) throw new Error('Failed to fetch upcoming leaves');
      return response.json();
    }
  });
};

export const useWarehouseCapacity = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'warehouse',
    resourceId: 'capacity',
    onMessage: (message) => {
      if (message.type === 'warehouse_capacity_updated') {
        queryClient.invalidateQueries({ queryKey: ['warehouseCapacity'] });
      }
    }
  });

  return useQuery({
    queryKey: ['warehouseCapacity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/warehouse-capacity');
      if (!response.ok) throw new Error('Failed to fetch warehouse capacity');
      return response.json();
    }
  });
};

export const useDeliveryPerformance = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'delivery',
    resourceId: 'performance',
    onMessage: (message) => {
      if (message.type === 'delivery_performance_updated') {
        queryClient.invalidateQueries({ queryKey: ['deliveryPerformance'] });
      }
    }
  });

  return useQuery({
    queryKey: ['deliveryPerformance'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/delivery-performance');
      if (!response.ok) throw new Error('Failed to fetch delivery performance');
      return response.json();
    }
  });
};