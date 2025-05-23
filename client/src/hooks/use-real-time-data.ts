
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
    const ws = new WebSocket(`wss://${window.location.host}/api/ws`);
    
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
