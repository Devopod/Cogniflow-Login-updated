import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { toast } from "react-toastify";

// Types for WebSocket events
interface CrmEventData {
  lead?: any;
  contact?: any;
  deal?: any;
  activity?: any;
  task?: any;
  company?: any;
  phoneCall?: any;
  stage?: any;
  metrics?: any;
  count?: number;
  success?: number;
  errors?: any[];
}

export function useCrmWebSocket() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // ==================== LEAD EVENTS ====================
    
    const handleLeadCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-source-analytics"] });
      
      if (data.lead) {
        toast.success(`New lead: ${data.lead.firstName} ${data.lead.lastName}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleLeadUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      
      if (data.lead) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", data.lead.id] });
      }
    };

    const handleLeadDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
    };

    const handleLeadConverted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
      
      if (data.contact) {
        toast.success(`Lead converted to contact: ${data.contact.name}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    };

    const handleLeadsImported = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      
      if (data.success !== undefined) {
        toast.success(`${data.success} leads imported successfully!`, {
          position: "top-right",
          autoClose: 5000,
        });
        
        if (data.errors && data.errors.length > 0) {
          toast.warning(`${data.errors.length} rows had errors`, {
            position: "top-right",
            autoClose: 5000,
          });
        }
      }
    };

    // ==================== CONTACT EVENTS ====================
    
    const handleContactCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      
      if (data.contact) {
        toast.success(`New contact: ${data.contact.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleContactUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      if (data.contact) {
        queryClient.invalidateQueries({ queryKey: ["/api/contacts", data.contact.id] });
      }
    };

    const handleContactDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
    };

    // ==================== DEAL EVENTS ====================
    
    const handleDealCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      
      if (data.deal) {
        toast.success(`New deal: ${data.deal.title}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleDealUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      
      if (data.deal) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", data.deal.id] });
      }
    };

    const handleDealStageUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
      
      if (data.deal) {
        queryClient.invalidateQueries({ queryKey: ["/api/deals", data.deal.id] });
        toast.info(`Deal stage updated: ${data.deal.title} → ${data.deal.stage}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    };

    const handleDealDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    };

    const handleDealConvertedToInvoice = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      
      if (data.deal) {
        toast.success(`Deal converted to invoice: ${data.deal.title}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    };

    // ==================== ACTIVITY EVENTS ====================
    
    const handleActivityCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities/recent"] });
      
      if (data.activity) {
        toast.info(`New activity: ${data.activity.subject}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleActivityUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities/recent"] });
      
      if (data.activity) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", data.activity.id] });
      }
    };

    const handleActivityDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities/recent"] });
    };

    // ==================== TASK EVENTS ====================
    
    const handleTaskCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      
      if (data.task) {
        toast.info(`New task: ${data.task.title}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleTaskUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      
      if (data.task) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks", data.task.id] });
      }
    };

    const handleTaskCompleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      
      if (data.task) {
        toast.success(`Task completed: ${data.task.title}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleTaskDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
    };

    // ==================== COMPANY EVENTS ====================
    
    const handleCompanyCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      
      if (data.company) {
        toast.success(`New company: ${data.company.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleCompanyUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      
      if (data.company) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", data.company.id] });
      }
    };

    const handleCompanyDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
    };

    // ==================== PHONE CALL EVENTS ====================
    
    const handlePhoneCallCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities/recent"] });
      
      if (data.phoneCall) {
        toast.info(`Phone call logged: ${data.phoneCall.phoneNumber}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handlePhoneCallUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
      
      if (data.phoneCall) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls", data.phoneCall.id] });
      }
    };

    const handlePhoneCallDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
    };

    // ==================== DEAL STAGE EVENTS ====================
    
    const handleDealStageCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      
      if (data.stage) {
        toast.success(`New deal stage: ${data.stage.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleDealStageDefinitionUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      
      if (data.stage) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages", data.stage.id] });
      }
    };

    const handleDealStageDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    };

    const handleDealStagesReordered = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      
      toast.success("Deal stages reordered successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    };

    // ==================== METRICS EVENTS ====================
    
    const handleMetricsUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-source-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
    };

    // ==================== EMAIL EVENTS ====================
    
    const handleEmailSent = (data: CrmEventData) => {
      if (data.lead) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
        queryClient.invalidateQueries({ queryKey: ["/api/crm/activities/recent"] });
        
        toast.success(`Email sent to ${data.lead.firstName} ${data.lead.lastName}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    // ==================== ERROR EVENTS ====================
    
    const handleCrmError = (data: { message: string; type?: string }) => {
      toast.error(data.message || "An error occurred in CRM", {
        position: "top-right",
        autoClose: 5000,
      });
    };

    // ==================== REGISTER EVENT LISTENERS ====================
    
    // Lead events
    socket.on("lead_created", handleLeadCreated);
    socket.on("lead_updated", handleLeadUpdated);
    socket.on("lead_deleted", handleLeadDeleted);
    socket.on("lead_converted", handleLeadConverted);
    socket.on("leads_imported", handleLeadsImported);

    // Contact events
    socket.on("contact_created", handleContactCreated);
    socket.on("contact_updated", handleContactUpdated);
    socket.on("contact_deleted", handleContactDeleted);

    // Deal events
    socket.on("deal_created", handleDealCreated);
    socket.on("deal_updated", handleDealUpdated);
    socket.on("deal_stage_updated", handleDealStageUpdated);
    socket.on("deal_deleted", handleDealDeleted);
    socket.on("deal_converted_to_invoice", handleDealConvertedToInvoice);

    // Activity events
    socket.on("activity_created", handleActivityCreated);
    socket.on("activity_updated", handleActivityUpdated);
    socket.on("activity_deleted", handleActivityDeleted);

    // Task events
    socket.on("task_created", handleTaskCreated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_completed", handleTaskCompleted);
    socket.on("task_deleted", handleTaskDeleted);

    // Company events
    socket.on("company_created", handleCompanyCreated);
    socket.on("company_updated", handleCompanyUpdated);
    socket.on("company_deleted", handleCompanyDeleted);

    // Phone call events
    socket.on("phone_call_created", handlePhoneCallCreated);
    socket.on("phone_call_updated", handlePhoneCallUpdated);
    socket.on("phone_call_deleted", handlePhoneCallDeleted);

    // Deal stage events
    socket.on("deal_stage_created", handleDealStageCreated);
    socket.on("deal_stage_updated", handleDealStageDefinitionUpdated);
    socket.on("deal_stage_deleted", handleDealStageDeleted);
    socket.on("deal_stages_reordered", handleDealStagesReordered);

    // Metrics events
    socket.on("metrics_updated", handleMetricsUpdated);

    // Email events
    socket.on("email_sent", handleEmailSent);

    // Error events
    socket.on("crm_error", handleCrmError);

    // ==================== CLEANUP FUNCTION ====================
    
    return () => {
      // Lead events
      socket.off("lead_created", handleLeadCreated);
      socket.off("lead_updated", handleLeadUpdated);
      socket.off("lead_deleted", handleLeadDeleted);
      socket.off("lead_converted", handleLeadConverted);
      socket.off("leads_imported", handleLeadsImported);

      // Contact events
      socket.off("contact_created", handleContactCreated);
      socket.off("contact_updated", handleContactUpdated);
      socket.off("contact_deleted", handleContactDeleted);

      // Deal events
      socket.off("deal_created", handleDealCreated);
      socket.off("deal_updated", handleDealUpdated);
      socket.off("deal_stage_updated", handleDealStageUpdated);
      socket.off("deal_deleted", handleDealDeleted);
      socket.off("deal_converted_to_invoice", handleDealConvertedToInvoice);

      // Activity events
      socket.off("activity_created", handleActivityCreated);
      socket.off("activity_updated", handleActivityUpdated);
      socket.off("activity_deleted", handleActivityDeleted);

      // Task events
      socket.off("task_created", handleTaskCreated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_completed", handleTaskCompleted);
      socket.off("task_deleted", handleTaskDeleted);

      // Company events
      socket.off("company_created", handleCompanyCreated);
      socket.off("company_updated", handleCompanyUpdated);
      socket.off("company_deleted", handleCompanyDeleted);

      // Phone call events
      socket.off("phone_call_created", handlePhoneCallCreated);
      socket.off("phone_call_updated", handlePhoneCallUpdated);
      socket.off("phone_call_deleted", handlePhoneCallDeleted);

      // Deal stage events
      socket.off("deal_stage_created", handleDealStageCreated);
      socket.off("deal_stage_updated", handleDealStageDefinitionUpdated);
      socket.off("deal_stage_deleted", handleDealStageDeleted);
      socket.off("deal_stages_reordered", handleDealStagesReordered);

      // Metrics events
      socket.off("metrics_updated", handleMetricsUpdated);

      // Email events
      socket.off("email_sent", handleEmailSent);

      // Error events
      socket.off("crm_error", handleCrmError);
    };
  }, [socket, isConnected, queryClient]);

  return {
    isConnected,
    socket,
  };
}

// Utility hook to manually trigger specific cache invalidations
export function useCrmCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidateLeads = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
  };

  const invalidateContacts = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
  };

  const invalidateDeals = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
  };

  const invalidateActivities = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/crm/activities"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/activities/recent"] });
  };

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks/upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
  };

  const invalidateMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-source-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
  };

  const invalidateAll = () => {
    invalidateLeads();
    invalidateContacts();
    invalidateDeals();
    invalidateActivities();
    invalidateTasks();
    invalidateMetrics();
    queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/phone-calls"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/deal-stages"] });
    queryClient.invalidateQueries({ queryKey: ["/api/crm/audit-logs"] });
  };

  return {
    invalidateLeads,
    invalidateContacts,
    invalidateDeals,
    invalidateActivities,
    invalidateTasks,
    invalidateMetrics,
    invalidateAll,
  };
}