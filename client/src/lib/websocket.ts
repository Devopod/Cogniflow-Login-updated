// WebSocket client for real-time updates
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectInterval = 3000; // 3 seconds
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private resourceType: string;
  private resourceId: string | number;
  private isConnecting = false;
  private manualClose = false; // prevent auto-reconnect on intentional close

  constructor(resourceType: string, resourceId: string | number) {
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  // Connect to the WebSocket server
  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnected = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnected);
            resolve();
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    return new Promise((resolve, reject) => {
      try {
        this.manualClose = false; // reset on connect
        // Create WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/${this.resourceType}/${this.resourceId}`;
        
        this.socket = new WebSocket(wsUrl);

        // Connection opened
        this.socket.addEventListener('open', () => {
          console.debug(`WS connected ${this.resourceType}/${this.resourceId}`);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        });

        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (_err) {
            // Swallow parse errors to avoid console noise
          }
        });

        // Connection closed
        this.socket.addEventListener('close', () => {
          this.isConnecting = false;
          if (!this.manualClose) {
            this.attemptReconnect();
          }
        });

        // Connection error
        this.socket.addEventListener('error', () => {
          this.isConnecting = false;
          // Do not log to console to keep it clean; rely on reconnect logic
          resolve(); // prevent unhandled rejection
        });
      } catch (error) {
        this.isConnecting = false;
        // Avoid noisy console logs
        reject(error);
      }
    });
  }

  // Attempt to reconnect to the WebSocket server
  private attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch((error) => {
          // Log the error but don't throw it
          console.warn('Reconnection attempt failed:', error);
          // The close event will trigger another reconnection attempt
        });
      }, this.reconnectInterval);
    } else {
      console.warn('Max reconnect attempts reached. WebSocket connection will not be retried.');
      // Don't ask to refresh the page, just continue without WebSocket
    }
  }

  // Handle incoming messages
  private handleMessage(message: any) {
    const { type, ...data } = message;
    
    if (!type) {
      console.warn('Received WebSocket message without type:', message);
      return;
    }

    // Notify all listeners for this message type
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for message type "${type}":`, error);
        }
      });
    }

    // Also notify global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener({ type, ...data });
        } catch (error) {
          console.error('Error in global listener:', error);
        }
      });
    }
  }

  // Add a listener for a specific message type
  on(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)?.add(callback);

    // Return a function to remove this listener
    return () => {
      this.listeners.get(type)?.delete(callback);
      
      // Clean up empty sets
      if (this.listeners.get(type)?.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  // Send a message to the server
  send(type: string, data: any = {}): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Message not sent.');
      return false;
    }

    try {
      this.socket.send(JSON.stringify({ type, ...data }));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  // Close the WebSocket connection
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.manualClose = true;

    if (this.socket) {
      if (this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.addEventListener('open', () => this.socket?.close(), { once: true });
      } else {
        this.socket.close();
      }
      this.socket = null;
    }

    this.listeners.clear();
  }
}

// WebSocket connection manager to reuse connections
export class WebSocketManager {
  private static connections: Map<string, WebSocketClient> = new Map();

  // Get or create a WebSocket connection for a resource
  static getConnection(resourceType: string, resourceId: string | number): WebSocketClient {
    const key = `${resourceType}:${resourceId}`;
    
    if (!this.connections.has(key)) {
      const client = new WebSocketClient(resourceType, resourceId);
      this.connections.set(key, client);
      
      // Connect immediately but handle errors gracefully
      client.connect().catch(error => {
        console.warn(`Failed to connect to ${resourceType}/${resourceId}:`, error);
        // Continue without WebSocket - the app should still work without real-time updates
      });
    }
    
    return this.connections.get(key)!;
  }

  // Close and remove a WebSocket connection
  static closeConnection(resourceType: string, resourceId: string | number): boolean {
    const key = `${resourceType}:${resourceId}`;
    
    if (this.connections.has(key)) {
      const client = this.connections.get(key)!;
      client.disconnect();
      this.connections.delete(key);
      return true;
    }
    
    return false;
  }

  // Close all WebSocket connections
  static closeAll() {
    this.connections.forEach(client => {
      client.disconnect();
    });
    
    this.connections.clear();
  }
}

// Hook to use WebSocket in React components
export function useWebSocket(resourceType: string, resourceId: string | number) {
  const client = WebSocketManager.getConnection(resourceType, resourceId);
  
  return {
    // Subscribe to WebSocket events
    subscribe: (type: string, callback: (data: any) => void) => {
      return client.on(type, callback);
    },
    
    // Send a message through the WebSocket
    send: (type: string, data?: any) => {
      return client.send(type, data);
    }
  };
}