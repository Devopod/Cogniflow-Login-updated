import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Global WebSocket instance
let globalSocket: Socket | null = null;
let connectionCount = 0;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Increment connection count
    connectionCount++;

    // Create socket connection if it doesn't exist
    if (!globalSocket) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const url = `${protocol}//${host}`;
      
      globalSocket = io(url, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      globalSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      });

      globalSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (error) => {
        console.warn('WebSocket connection error:', error);
        setIsConnected(false);
      });
    } else {
      // Use existing connection
      setIsConnected(globalSocket.connected);
    }

    socketRef.current = globalSocket;

    // Cleanup function
    return () => {
      connectionCount--;
      
      // Only disconnect if no other components are using the socket
      if (connectionCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setIsConnected(false);
      }
    };
  }, []);

  // Update connection status when socket changes
  useEffect(() => {
    if (globalSocket) {
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      globalSocket.on('connect', handleConnect);
      globalSocket.on('disconnect', handleDisconnect);

      return () => {
        globalSocket?.off('connect', handleConnect);
        globalSocket?.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

export default useWebSocket;