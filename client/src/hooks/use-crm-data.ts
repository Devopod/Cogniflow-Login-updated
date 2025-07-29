import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Lead,
  Contact,
  Deal,
  Activity,
  Task,
  CrmCompany,
  PhoneCall,
  DealStage,
  InsertLead,
  InsertActivity,
  InsertTask,
  InsertCrmCompany,
  InsertPhoneCall,
  InsertDealStage,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// ==================== LEADS HOOKS ====================

export function useLeads(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  priority?: string;
}) {
  return useQuery({
    queryKey: ["/api/crm/leads", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      
      const url = `/api/crm/leads${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: ["/api/crm/leads", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/crm/leads/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: InsertLead) => {
      const response = await apiRequest("POST", "/api/crm/leads", leadData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      toast.success("Lead created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead");
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertLead>) => {
      const response = await apiRequest("PUT", `/api/crm/leads/${id}`, data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Lead updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/crm/leads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Lead deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: number) => {
      const response = await apiRequest("POST", `/api/crm/leads/${leadId}/convert`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Lead converted to contact successfully!");
    },
    onError: (error: any) => {
      console.error("Error converting lead:", error);
      toast.error("Failed to convert lead");
    },
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/crm/leads/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Import failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success(`Import completed: ${data.success} leads imported successfully`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} rows had errors`);
      }
    },
    onError: (error: any) => {
      console.error("Error importing leads:", error);
      toast.error("Failed to import leads");
    },
  });
}

export function useSendLeadEmail() {
  return useMutation({
    mutationFn: async ({
      leadId,
      subject,
      message,
    }: {
      leadId: number;
      subject: string;
      message: string;
    }) => {
      const response = await apiRequest("POST", `/api/crm/leads/${leadId}/email`, {
        subject,
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast.success("Email sent successfully!");
    },
    onError: (error: any) => {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    },
  });
}

// ==================== ACTIVITIES HOOKS ====================

export function useActivities(filters?: {
  contactId?: number;
  leadId?: number;
  dealId?: number;
}) {
  return useQuery({
    queryKey: ["/api/crm/activities", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const url = `/api/crm/activities${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useRecentActivities(limit?: number) {
  return useQuery({
    queryKey: ["/api/crm/activities/recent", limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", String(limit));
      
      const url = `/api/crm/activities/recent${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (activityData: InsertActivity) => {
      const response = await apiRequest("POST", "/api/crm/activities", activityData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Activity created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating activity:", error);
      toast.error("Failed to create activity");
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertActivity>) => {
      const response = await apiRequest("PUT", `/api/crm/activities/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      toast.success("Activity updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating activity:", error);
      toast.error("Failed to update activity");
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/crm/activities/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      toast.success("Activity deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    },
  });
}

// ==================== TASKS HOOKS ====================

export function useTasks(assignedTo?: number) {
  return useQuery({
    queryKey: ["/api/crm/tasks", assignedTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assignedTo) params.append("assignedTo", String(assignedTo));
      
      const url = `/api/crm/tasks${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useUpcomingTasks(days?: number) {
  return useQuery({
    queryKey: ["/api/crm/tasks/upcoming", days],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (days) params.append("days", String(days));
      
      const url = `/api/crm/tasks/upcoming${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: InsertTask) => {
      const response = await apiRequest("POST", "/api/crm/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Task created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertTask>) => {
      const response = await apiRequest("PUT", `/api/crm/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Task updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/crm/tasks/${id}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      toast.success("Task completed successfully!");
    },
    onError: (error: any) => {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/crm/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      toast.success("Task deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    },
  });
}

// ==================== COMPANIES HOOKS ====================

export function useCompanies() {
  return useQuery({
    queryKey: ["/api/crm/companies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/companies");
      return response.json();
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: InsertCrmCompany) => {
      const response = await apiRequest("POST", "/api/crm/companies", companyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast.success("Company created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating company:", error);
      toast.error("Failed to create company");
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertCrmCompany>) => {
      const response = await apiRequest("PUT", `/api/crm/companies/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast.success("Company updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/crm/companies/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      toast.success("Company deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    },
  });
}

// ==================== PHONE CALLS HOOKS ====================

export function usePhoneCalls(contactId?: number) {
  return useQuery({
    queryKey: ["/api/crm/phone-calls", contactId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (contactId) params.append("contactId", String(contactId));
      
      const url = `/api/crm/phone-calls${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useCreatePhoneCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (phoneCallData: InsertPhoneCall) => {
      const response = await apiRequest("POST", "/api/crm/phone-calls", phoneCallData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      toast.success("Phone call logged successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating phone call:", error);
      toast.error("Failed to log phone call");
    },
  });
}

export function useUpdatePhoneCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertPhoneCall>) => {
      const response = await apiRequest("PUT", `/api/crm/phone-calls/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
      toast.success("Phone call updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating phone call:", error);
      toast.error("Failed to update phone call");
    },
  });
}

export function useDeletePhoneCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/crm/phone-calls/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
      toast.success("Phone call deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting phone call:", error);
      toast.error("Failed to delete phone call");
    },
  });
}

// ==================== DEAL STAGES HOOKS ====================

export function useDealStages() {
  return useQuery({
    queryKey: ["/api/crm/deal-stages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/deal-stages");
      return response.json();
    },
  });
}

export function useCreateDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stageData: InsertDealStage) => {
      const response = await apiRequest("POST", "/api/crm/deal-stages", stageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      toast.success("Deal stage created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating deal stage:", error);
      toast.error("Failed to create deal stage");
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertDealStage>) => {
      const response = await apiRequest("PUT", `/api/crm/deal-stages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      toast.success("Deal stage updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating deal stage:", error);
      toast.error("Failed to update deal stage");
    },
  });
}

export function useReorderDealStages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stageOrders: { id: number; order: number }[]) => {
      const response = await apiRequest("POST", "/api/crm/deal-stages/reorder", {
        stageOrders,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      toast.success("Deal stages reordered successfully!");
    },
    onError: (error: any) => {
      console.error("Error reordering deal stages:", error);
      toast.error("Failed to reorder deal stages");
    },
  });
}

export function useDeleteDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/crm/deal-stages/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      toast.success("Deal stage deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting deal stage:", error);
      toast.error("Failed to delete deal stage");
    },
  });
}

// ==================== ANALYTICS & METRICS HOOKS ====================

export function useCrmMetrics() {
  return useQuery({
    queryKey: ["/api/crm/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/metrics");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

export function useLeadAnalytics() {
  return useQuery({
    queryKey: ["/api/crm/lead-analytics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/lead-analytics");
      return response.json();
    },
  });
}

export function useLeadSourceAnalytics() {
  return useQuery({
    queryKey: ["/api/crm/lead-source-analytics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/lead-source-analytics");
      return response.json();
    },
  });
}

export function useDealPipeline() {
  return useQuery({
    queryKey: ["/api/crm/pipeline"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/pipeline");
      return response.json();
    },
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ["/api/crm/conversion-funnel"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/crm/conversion-funnel");
      return response.json();
    },
  });
}

// ==================== INTEGRATIONS HOOKS ====================

export function useConvertDealToInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      dealId,
      invoiceData,
    }: {
      dealId: number;
      invoiceData?: any;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/crm/deals/${dealId}/convert-to-invoice`,
        invoiceData || {}
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      toast.success("Deal converted to invoice successfully!");
    },
    onError: (error: any) => {
      console.error("Error converting deal to invoice:", error);
      toast.error("Failed to convert deal to invoice");
    },
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async ({
      type,
      format,
      dateRange,
    }: {
      type: "leads" | "activities" | "tasks" | "metrics";
      format: "json" | "csv";
      dateRange?: { from: string; to: string };
    }) => {
      const response = await apiRequest("POST", "/api/crm/reports/generate", {
        type,
        format,
        dateRange,
      });
      
      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}-report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true };
      } else {
        return response.json();
      }
    },
    onSuccess: () => {
      toast.success("Report generated successfully!");
    },
    onError: (error: any) => {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    },
  });
}

// ==================== AUDIT LOGS HOOKS ====================

export function useAuditLogs(resourceType?: string, resourceId?: number) {
  return useQuery({
    queryKey: ["/api/crm/audit-logs", resourceType, resourceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (resourceType) params.append("resourceType", resourceType);
      if (resourceId) params.append("resourceId", String(resourceId));
      
      const url = `/api/crm/audit-logs${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

// ==================== COMPOSITE HOOKS ====================

// CRM Dashboard Hook - combines multiple queries for dashboard view
export function useCrmDashboard() {
  const metrics = useCrmMetrics();
  const recentActivities = useRecentActivities(5);
  const upcomingTasks = useUpcomingTasks(7);
  const leadAnalytics = useLeadAnalytics();
  const dealPipeline = useDealPipeline();
  
  return {
    metrics: metrics.data,
    recentActivities: recentActivities.data || [],
    upcomingTasks: upcomingTasks.data || [],
    leadAnalytics: leadAnalytics.data,
    dealPipeline: dealPipeline.data || [],
    isLoading:
      metrics.isLoading ||
      recentActivities.isLoading ||
      upcomingTasks.isLoading ||
      leadAnalytics.isLoading ||
      dealPipeline.isLoading,
    error:
      metrics.error ||
      recentActivities.error ||
      upcomingTasks.error ||
      leadAnalytics.error ||
      dealPipeline.error,
  };
}

// Lead Management Hook - combines lead operations
export function useLeadManagement() {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const importLeads = useImportLeads();
  const sendEmail = useSendLeadEmail();
  
  return {
    create: createLead.mutateAsync,
    update: updateLead.mutateAsync,
    delete: deleteLead.mutateAsync,
    convert: convertLead.mutateAsync,
    import: importLeads.mutateAsync,
    sendEmail: sendEmail.mutateAsync,
    isLoading:
      createLead.isPending ||
      updateLead.isPending ||
      deleteLead.isPending ||
      convertLead.isPending ||
      importLeads.isPending ||
      sendEmail.isPending,
  };
}

// Task Management Hook - combines task operations
export function useTaskManagement() {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  
  return {
    create: createTask.mutateAsync,
    update: updateTask.mutateAsync,
    delete: deleteTask.mutateAsync,
    complete: completeTask.mutateAsync,
    isLoading:
      createTask.isPending ||
      updateTask.isPending ||
      deleteTask.isPending ||
      completeTask.isPending,
  };
}

// Activity Management Hook - combines activity operations
export function useActivityManagement() {
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  
  return {
    create: createActivity.mutateAsync,
    update: updateActivity.mutateAsync,
    delete: deleteActivity.mutateAsync,
    isLoading:
      createActivity.isPending ||
      updateActivity.isPending ||
      deleteActivity.isPending,
  };
}

// Contacts Hook (existing contacts, for compatibility)
export function useContacts() {
  return useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      return response.json();
    },
  });
}

// Deals Hook (existing deals, for compatibility)
export function useDeals() {
  return useQuery({
    queryKey: ["/api/deals"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/deals");
      return response.json();
    },
  });
}