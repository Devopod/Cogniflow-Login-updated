
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useRealTimeData(key: string[], fetchFn: () => Promise<any>, interval = 5000) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: key,
    queryFn: fetchFn,
    refetchInterval: interval
  });

  useEffect(() => {
    // Setup WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === key[0]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    return () => ws.close();
  }, [key, queryClient]);

  return query;
}
