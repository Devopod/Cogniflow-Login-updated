import { WSService } from "../../websocket";

// This will be set by the main server when the WSService is initialized
let wsServiceInstance: WSService | null = null;

export function setWSService(instance: WSService) {
  wsServiceInstance = instance;
}

export const wsService = {
  broadcast: (type: string, data: any) => {
    if (wsServiceInstance) {
      return wsServiceInstance.broadcast(type, data);
    }
    console.warn('WSService not initialized yet');
    return false;
  },
  
  broadcastToResource: (resourceType: string, resourceId: string | number, message: { type: string; data: any }) => {
    if (wsServiceInstance) {
      return wsServiceInstance.broadcastToResource(resourceType, resourceId, message.type, message.data);
    }
    console.warn('WSService not initialized yet');
    return false;
  }
};