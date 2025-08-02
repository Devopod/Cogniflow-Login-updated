import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './use-websocket';
import { useEffect } from 'react';

// Types
export interface Lead {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  notes?: string;
  estimatedValue?: number;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: number;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  source?: string;
  status: 'active' | 'inactive';
  type: 'lead' | 'customer' | 'partner';
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: number;
  userId: number;
  contactId?: number;
  title: string;
  description?: string;
  value?: number;
  currency: string;
  stage: string;
  probability?: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  status: 'open' | 'won' | 'lost';
  source?: string;
  priority: 'low' | 'medium' | 'high';
  ownerId?: number;
  notes?: string;
  lostReason?: string;
  products?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: number;
  userId: number;
  contactId?: number;
  leadId?: number;
  dealId?: number;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject: string;
  description?: string;
  status: 'completed' | 'pending' | 'cancelled';
  duration?: number;
  dueDate?: Date;
  completedAt?: Date;
  outcome?: string;
  notes?: string;
  attendees?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: number;
  userId: number;
  assignedTo?: number;
  contactId?: number;
  leadId?: number;
  dealId?: number;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedAt?: Date;
  reminderDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmCompany {
  id: number;
  userId: number;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  employees?: number;
  revenue?: number;
  notes?: string;
  tags?: string[];
  customFields?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhoneCall {
  id: number;
  userId: number;
  contactId?: number;
  leadId?: number;
  dealId?: number;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'busy' | 'no_answer';
  duration?: number;
  recordingUrl?: string;
  notes?: string;
  outcome?: string;
  followUpRequired: boolean;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmMetrics {
  totalLeads: number;
  totalContacts: number;
  openDeals: number;
  totalDealValue: number;
  wonDeals: number;
  wonDealValue: number;
  pendingTasks: number;
  recentActivities: number;
  conversionRate: number;
}

// API functions
const crmApi = {
  // Leads
  getLeads: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/leads?${query}`);
    if (!response.ok) throw new Error('Failed to fetch leads');
    return response.json();
  },
  
  createLead: async (data: Partial<Lead>) => {
    const response = await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create lead');
    return response.json();
  },
  
  updateLead: async ({ id, data }: { id: number; data: Partial<Lead> }) => {
    const response = await fetch(`/api/crm/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update lead');
    return response.json();
  },
  
  deleteLead: async (id: number) => {
    const response = await fetch(`/api/crm/leads/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete lead');
    return response.json();
  },
  
  convertLead: async (id: number) => {
    const response = await fetch(`/api/crm/leads/${id}/convert`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to convert lead');
    return response.json();
  },
  
  sendLeadEmail: async ({ id, data }: { id: number; data: any }) => {
    const response = await fetch(`/api/crm/leads/${id}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send email');
    return response.json();
  },
  
  importLeads: async (csvData: string) => {
    const response = await fetch('/api/crm/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData }),
    });
    if (!response.ok) throw new Error('Failed to import leads');
    return response.json();
  },
  
  exportLeads: async () => {
    const response = await fetch('/api/crm/leads/export');
    if (!response.ok) throw new Error('Failed to export leads');
    return response.blob();
  },
  
  // Contacts
  getContacts: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/contacts?${query}`);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return response.json();
  },
  
  createContact: async (data: Partial<Contact>) => {
    const response = await fetch('/api/crm/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create contact');
    return response.json();
  },
  
  updateContact: async ({ id, data }: { id: number; data: Partial<Contact> }) => {
    const response = await fetch(`/api/crm/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update contact');
    return response.json();
  },
  
  deleteContact: async (id: number) => {
    const response = await fetch(`/api/crm/contacts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete contact');
    return response.json();
  },
  
  getContactTimeline: async (id: number) => {
    const response = await fetch(`/api/crm/contacts/${id}/timeline`);
    if (!response.ok) throw new Error('Failed to fetch contact timeline');
    return response.json();
  },
  
  // Deals
  getDeals: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/deals?${query}`);
    if (!response.ok) throw new Error('Failed to fetch deals');
    return response.json();
  },
  
  createDeal: async (data: Partial<Deal>) => {
    const response = await fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create deal');
    return response.json();
  },
  
  updateDeal: async ({ id, data }: { id: number; data: Partial<Deal> }) => {
    const response = await fetch(`/api/crm/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update deal');
    return response.json();
  },
  
  updateDealStage: async ({ id, stage, probability }: { id: number; stage: string; probability?: number }) => {
    const response = await fetch(`/api/crm/deals/${id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, probability }),
    });
    if (!response.ok) throw new Error('Failed to update deal stage');
    return response.json();
  },
  
  deleteDeal: async (id: number) => {
    const response = await fetch(`/api/crm/deals/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete deal');
    return response.json();
  },
  
  convertDealToInvoice: async ({ id, invoiceData }: { id: number; invoiceData?: any }) => {
    const response = await fetch(`/api/crm/deals/${id}/convert-to-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceData }),
    });
    if (!response.ok) throw new Error('Failed to convert deal to invoice');
    return response.json();
  },
  
  // Activities
  getActivities: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/activities?${query}`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },
  
  createActivity: async (data: Partial<Activity>) => {
    const response = await fetch('/api/crm/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create activity');
    return response.json();
  },

  updateActivity: async ({ id, data }: { id: number; data: Partial<Activity> }) => {
    const response = await fetch(`/api/crm/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update activity');
    return response.json();
  },

  deleteActivity: async (id: number) => {
    const response = await fetch(`/api/crm/activities/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete activity');
    return response.json();
  },
  
  // Tasks
  getTasks: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/tasks?${query}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },
  
  createTask: async (data: Partial<Task>) => {
    const response = await fetch('/api/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },
  
  completeTask: async (id: number) => {
    const response = await fetch(`/api/crm/tasks/${id}/complete`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to complete task');
    return response.json();
  },
  
  // Companies
  getCompanies: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/companies?${query}`);
    if (!response.ok) throw new Error('Failed to fetch companies');
    return response.json();
  },
  
  createCompany: async (data: Partial<CrmCompany>) => {
    const response = await fetch('/api/crm/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create company');
    return response.json();
  },
  
  // Phone Calls
  getPhoneCalls: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/crm/phone-calls?${query}`);
    if (!response.ok) throw new Error('Failed to fetch phone calls');
    return response.json();
  },
  
  createPhoneCall: async (data: Partial<PhoneCall>) => {
    const response = await fetch('/api/crm/phone-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create phone call');
    return response.json();
  },
  
  // Metrics and Analytics
  getMetrics: async () => {
    const response = await fetch('/api/crm/metrics');
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },
  
  getLeadAnalytics: async () => {
    const response = await fetch('/api/crm/lead-analytics');
    if (!response.ok) throw new Error('Failed to fetch lead analytics');
    return response.json();
  },
  
  getContactAnalytics: async () => {
    const response = await fetch('/api/crm/contact-analytics');
    if (!response.ok) throw new Error('Failed to fetch contact analytics');
    return response.json();
  },
  
  getPipeline: async () => {
    const response = await fetch('/api/crm/pipeline');
    if (!response.ok) throw new Error('Failed to fetch pipeline');
    return response.json();
  },
  
  getConversionFunnel: async () => {
    const response = await fetch('/api/crm/conversion-funnel');
    if (!response.ok) throw new Error('Failed to fetch conversion funnel');
    return response.json();
  },
};

// React Query hooks
export const useLeads = (params?: any) => {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => crmApi.getLeads(params),
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Lead created successfully');
    },
    onError: () => {
      toast.error('Failed to create lead');
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.updateLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully');
    },
    onError: () => {
      toast.error('Failed to update lead');
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Lead deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });
};

export const useConvertLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.convertLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Lead converted to contact successfully');
    },
    onError: () => {
      toast.error('Failed to convert lead');
    },
  });
};

export const useContacts = (params?: any) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => crmApi.getContacts(params),
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Contact created successfully');
    },
    onError: () => {
      toast.error('Failed to create contact');
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.updateContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated successfully');
    },
    onError: () => {
      toast.error('Failed to update contact');
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Contact deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    },
  });
};

export const useContactTimeline = (id: number) => {
  return useQuery({
    queryKey: ['contact-timeline', id],
    queryFn: () => crmApi.getContactTimeline(id),
    enabled: !!id,
  });
};

export const useDeals = (params?: any) => {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => crmApi.getDeals(params),
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      toast.success('Deal created successfully');
    },
    onError: () => {
      toast.error('Failed to create deal');
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.updateDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      toast.success('Deal updated successfully');
    },
    onError: () => {
      toast.error('Failed to update deal');
    },
  });
};

export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.updateDealStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      toast.success('Deal stage updated successfully');
    },
    onError: () => {
      toast.error('Failed to update deal stage');
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      toast.success('Deal deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete deal');
    },
  });
};

export const useConvertDealToInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.convertDealToInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Deal converted to invoice successfully');
    },
    onError: () => {
      toast.error('Failed to convert deal to invoice');
    },
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['contact-timeline'] });
      toast.success('Activity created successfully');
    },
    onError: () => {
      toast.error('Failed to create activity');
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.updateActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['contact-timeline'] });
      toast.success('Activity updated successfully');
    },
    onError: () => {
      toast.error('Failed to update activity');
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['contact-timeline'] });
      toast.success('Activity deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete activity');
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Task completed successfully');
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });
};

export const useCompanies = (params?: any) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => crmApi.getCompanies(params),
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
    onError: () => {
      toast.error('Failed to create company');
    },
  });
};

export const usePhoneCalls = (params?: any) => {
  return useQuery({
    queryKey: ['phone-calls', params],
    queryFn: () => crmApi.getPhoneCalls(params),
  });
};

export const useCreatePhoneCall = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.createPhoneCall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-calls'] });
      queryClient.invalidateQueries({ queryKey: ['contact-timeline'] });
      toast.success('Phone call logged successfully');
    },
    onError: () => {
      toast.error('Failed to log phone call');
    },
  });
};

// WebSocket integration for real-time updates
export const useCrmRealTime = () => {
  const queryClient = useQueryClient();
  
  useWebSocket({
    resource: 'crm',
    resourceId: 'all',
    onMessage: (message) => {
      switch (message.type) {
        case 'lead_created':
        case 'lead_updated':
        case 'lead_deleted':
        case 'lead_converted':
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
          break;
          
        case 'contact_created':
        case 'contact_updated':
        case 'contact_deleted':
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
          queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
          break;
          
        case 'deal_created':
        case 'deal_updated':
        case 'deal_deleted':
        case 'deal_stage_updated':
          queryClient.invalidateQueries({ queryKey: ['deals'] });
          queryClient.invalidateQueries({ queryKey: ['pipeline'] });
          queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
          break;
          
        case 'activity_created':
        case 'activity_updated':
        case 'activity_deleted':
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          queryClient.invalidateQueries({ queryKey: ['contact-timeline', message.contactId] });
          break;
          
        case 'task_created':
        case 'task_updated':
        case 'task_completed':
        case 'task_reminder':
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
          break;
          
        case 'company_created':
        case 'company_updated':
        case 'company_deleted':
          queryClient.invalidateQueries({ queryKey: ['companies'] });
          break;
          
        case 'phone_call_created':
        case 'phone_call_updated':
        case 'phone_call_deleted':
          queryClient.invalidateQueries({ queryKey: ['phone-calls'] });
          queryClient.invalidateQueries({ queryKey: ['contact-timeline', message.contactId] });
          break;
          
        case 'metrics_updated':
          queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
          break;
      }
    }
  });

};

// Email integration hooks
export const useSendLeadEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.sendLeadEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Email sent successfully');
    },
    onError: () => {
      toast.error('Failed to send email');
    },
  });
};

export const useImportLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.importLeads,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success(`Successfully imported ${data.leads?.length || 0} leads`);
    },
    onError: () => {
      toast.error('Failed to import leads');
    },
  });
};

export const useExportLeads = () => {
  return useMutation({
    mutationFn: crmApi.exportLeads,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'leads.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Leads exported successfully');
    },
    onError: () => {
      toast.error('Failed to export leads');
    },
  });
};

// CRM Metrics hook
export const useCrmMetrics = () => {
  return useQuery({
    queryKey: ['crm-metrics'],
    queryFn: () => crmApi.getMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Lead Analytics hook
export const useLeadAnalytics = () => {
  return useQuery({
    queryKey: ['lead-analytics'],
    queryFn: () => crmApi.getLeadAnalytics(),
    staleTime: 1000 * 60 * 5,
  });
};

// Sales Pipeline hook (alias for compatibility)
export const useSalesPipeline = () => {
  return usePipeline();
};

// Pipeline hook
export const usePipeline = () => {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: () => crmApi.getPipeline(),
    staleTime: 1000 * 60 * 5,
  });
};

// Conversion Funnel hook
export const useConversionFunnel = () => {
  return useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: () => crmApi.getConversionFunnel(),
    staleTime: 1000 * 60 * 5,
  });
};

// Tasks hook
export const useTasks = (params?: any) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => crmApi.getTasks(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Activities hook
export const useActivities = (params?: any) => {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => crmApi.getActivities(params),
    staleTime: 1000 * 60 * 2,
  });
};

// Dashboard hook
export const useCrmDashboard = () => {
  const metricsQuery = useCrmMetrics();
  const leadAnalyticsQuery = useLeadAnalytics();
  const pipelineQuery = usePipeline();
  const conversionFunnelQuery = useConversionFunnel();
  const upcomingTasksQuery = useTasks({ upcoming: true });
  const recentActivitiesQuery = useActivities({ limit: 10 });

  return {
    metrics: metricsQuery.data,
    leadAnalytics: leadAnalyticsQuery.data,
    pipeline: pipelineQuery.data,
    conversionFunnel: conversionFunnelQuery.data,
    upcomingTasks: upcomingTasksQuery.data?.data || [],
    recentActivities: recentActivitiesQuery.data?.data || [],
    isLoading: metricsQuery.isLoading || leadAnalyticsQuery.isLoading || pipelineQuery.isLoading,
    error: metricsQuery.error || leadAnalyticsQuery.error || pipelineQuery.error,
  };
};

// Generate report hook
export const useGenerateReport = () => {
  return useMutation({
    mutationFn: async ({ type, format, dateRange }: { type: string; format: string; dateRange?: any }) => {
      // Implementation for generating reports
      const response = await fetch('/api/crm/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, format, dateRange }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `crm-report-${variables.type}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report generated successfully');
    },
    onError: () => {
      toast.error('Failed to generate report');
    },
  });
};