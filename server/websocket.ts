import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface ResourceConnection {
  ws: WebSocket;
  resourceType: string;
  resourceId: string;
}

export class WSService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private resourceConnections: Map<string, Set<ResourceConnection>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });
    
    // Handle upgrade requests to parse resource paths
    server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url || '');
      
      // Only handle WebSocket connections that explicitly start with /ws
      // This ensures we don't interfere with Vite's HMR WebSockets
      if (!pathname || !pathname.startsWith('/ws')) {
        return; // Not our WebSocket connection
      }
      
      // Parse the path to determine the resource type and ID
      // Expected format: /ws/{resourceType}/{resourceId}
      const pathParts = pathname.split('/').filter(Boolean);
      
      if (pathParts.length < 2) {
        // Default global connection for /ws path
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, { resourceType: 'global', resourceId: 'all' });
        });
        return;
      }
      
      const resourceType = pathParts[1];
      const resourceId = pathParts.length > 2 ? pathParts[2] : 'all';
      
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request, { resourceType, resourceId });
      });
    });
    
    // Handle new connections
    this.wss.on('connection', (ws: WebSocket, request: any, { resourceType, resourceId }: { resourceType: string; resourceId: string }) => {
      console.log(`WebSocket connection established for ${resourceType}/${resourceId}`);
      
      // Add to general clients
      this.clients.add(ws);
      
      // Add to resource-specific connections
      const resourceKey = `${resourceType}:${resourceId}`;
      if (!this.resourceConnections.has(resourceKey)) {
        this.resourceConnections.set(resourceKey, new Set());
      }
      
      const connection: ResourceConnection = { ws, resourceType, resourceId };
      this.resourceConnections.get(resourceKey)?.add(connection);
      
      // Handle incoming messages
      ws.on('message', (message: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'new_order') {
            // Broadcast new_order event to all clients
            this.broadcast('new_order', parsed.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Handle connection errors
      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for ${resourceType}/${resourceId}:`, error.message);
        // Don't close the connection on error, let the client reconnect if needed
      });
      
      // Handle connection close
      ws.on('close', () => {
        console.log(`WebSocket connection closed for ${resourceType}/${resourceId}`);
        
        // Remove from general clients
        this.clients.delete(ws);
        
        // Remove from resource-specific connections
        const connections = this.resourceConnections.get(resourceKey);
        if (connections) {
          connections.forEach(conn => {
            if (conn.ws === ws) {
              connections.delete(conn);
            }
          });
          
          // Clean up empty sets
          if (connections.size === 0) {
            this.resourceConnections.delete(resourceKey);
          }
        }
      });
      
      // Send initial connection confirmation
      try {
        ws.send(JSON.stringify({
          type: 'connection_established',
          resourceType,
          resourceId
        }));
      } catch (error: unknown) {
        console.error(`Failed to send initial message to ${resourceType}/${resourceId}:`, error);
      }
    });
  }

  // Broadcast to all connected clients
  broadcast(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    let sentCount = 0;
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          sentCount++;
        } catch (error: unknown) {
          console.error(`Error broadcasting message:`, error);
        }
      }
    });
    
    if (sentCount > 0) {
      console.log(`Broadcast message to ${sentCount} clients`);
    }
    
    return sentCount > 0;
  }
  
  // Broadcast to clients subscribed to a specific resource
  broadcastToResource(resourceType: string, resourceId: string | number, message: { type: string; data: any }) {
    const resourceKey = `${resourceType}:${resourceId.toString()}`;
    const connections = this.resourceConnections.get(resourceKey);
    
    if (!connections || connections.size === 0) {
      return false;
    }
    
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    connections.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
        } catch (error: unknown) {
          console.error(`Error broadcasting to ${resourceType}/${resourceId}:`, error);
        }
      }
    });
    
    if (sentCount > 0) {
      console.log(`Broadcast message to ${sentCount} clients for ${resourceType}/${resourceId}`);
    }
    
    return sentCount > 0;
  }
}
