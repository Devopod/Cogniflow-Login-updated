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
  
  const { sendMessage } = useWebSocket({
    resource: 'crm',
    resourceId: 'all',
    onMessage: (message) => {
      // Handle CRM-specific WebSocket messages
      handleCrmWebSocketMessage(message, queryClient);
    },
    invalidateQueries: [
      ['/api/crm/leads'],
      ['/api/crm/activities'], 
      ['/api/crm/tasks'],
      ['/api/crm/metrics'],
      ['/api/crm/dashboard'],
      ['/api/crm/pipeline'],
      ['/api/crm/lead-analytics'],
      ['/api/crm/lead-source-analytics'],
      ['/api/crm/conversion-funnel'],
      ['/api/crm/companies'],
      ['/api/crm/phone-calls'],
      ['/api/crm/deal-stages'],
      ['/api/contacts'],
      ['/api/deals']
    ]
  });

  const handleCrmWebSocketMessage = (message: any, queryClient: any) => {
    const { type, data } = message;

    // ==================== LEAD EVENTS ====================
    
    const handleLeadCreated = (data: CrmEventData) => {
      // Invalidate all relevant queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-source-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
      
      if (data.lead) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", data.lead.id] });
      }
    };

    const handleLeadDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/lead-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/conversion-funnel"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      
      if (data.task) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks", data.task.id] });
      }
    };

    const handleTaskCompleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/tasks/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
    };

    // ==================== COMPANY EVENTS ====================
    
    const handleCompanyCreated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      
      if (data.company) {
        toast.success(`New company: ${data.company.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleCompanyUpdated = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      
      if (data.company) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", data.company.id] });
      }
    };

    const handleCompanyDeleted = (data: CrmEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
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

    // ==================== HANDLE MESSAGE TYPES ====================
    
    switch (type) {
      // Lead events
      case 'lead_created':
        handleLeadCreated(data);
        break;
      case 'lead_updated':
        handleLeadUpdated(data);
        break;
      case 'lead_deleted':
        handleLeadDeleted(data);
        break;
      case 'lead_converted':
        handleLeadConverted(data);
        break;
      case 'leads_imported':
        handleLeadsImported(data);
        break;
      
      // Contact events
      case 'contact_created':
        handleContactCreated(data);
        break;
      case 'contact_updated':
        handleContactUpdated(data);
        break;
      case 'contact_deleted':
        handleContactDeleted(data);
        break;
      
      // Deal events
      case 'deal_created':
        handleDealCreated(data);
        break;
      case 'deal_updated':
        handleDealUpdated(data);
        break;
      case 'deal_stage_updated':
        handleDealStageUpdated(data);
        break;
      case 'deal_deleted':
        handleDealDeleted(data);
        break;
      case 'deal_converted_to_invoice':
        handleDealConvertedToInvoice(data);
        break;
      
      // Activity events
      case 'activity_created':
        handleActivityCreated(data);
        break;
      case 'activity_updated':
        handleActivityUpdated(data);
        break;
      case 'activity_deleted':
        handleActivityDeleted(data);
        break;
      
      // Task events
      case 'task_created':
        handleTaskCreated(data);
        break;
      case 'task_updated':
        handleTaskUpdated(data);
        break;
      case 'task_completed':
        handleTaskCompleted(data);
        break;
      case 'task_deleted':
        handleTaskDeleted(data);
        break;
      
      // Company events
      case 'company_created':
        handleCompanyCreated(data);
        break;
      case 'company_updated':
        handleCompanyUpdated(data);
        break;
      case 'company_deleted':
        handleCompanyDeleted(data);
        break;
      
      // Phone call events
      case 'phone_call_created':
        handlePhoneCallCreated(data);
        break;
      case 'phone_call_updated':
        handlePhoneCallUpdated(data);
        break;
      case 'phone_call_deleted':
        handlePhoneCallDeleted(data);
        break;
      
      // Deal stage events
      case 'deal_stage_created':
        handleDealStageCreated(data);
        break;
      case 'deal_stage_definition_updated':
        handleDealStageDefinitionUpdated(data);
        break;
      case 'deal_stage_deleted':
        handleDealStageDeleted(data);
        break;
      case 'deal_stages_reordered':
        handleDealStagesReordered(data);
        break;
      
      // Metrics events
      case 'metrics_updated':
        handleMetricsUpdated(data);
        break;
      
      // Email events
      case 'email_sent':
        handleEmailSent(data);
        break;
      
      // Error events
      case 'crm_error':
        handleCrmError(data);
        break;
      
      default:
        if (type === 'connection_established' || type === 'ping' || type === 'pong') {
          // benign control messages
          break;
        }
        console.log('Unknown CRM WebSocket message type:', type);
        break;
    }
  };

  return {
    sendMessage,
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