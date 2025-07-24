import { QueryClient } from "@tanstack/react-query";

// Function to throw an error if the response is not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || `HTTP error: ${res.status}`;
    } catch (e) {
      errorMessage = `HTTP error: ${res.status}`;
    }
    throw new Error(errorMessage);
  }
  return res;
}

// Function to make API requests with timeout
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers: HeadersInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      credentials: "include",
      signal: controller.signal,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(endpoint, options);
    clearTimeout(timeoutId);
    return throwIfResNotOk(res);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Options for controlling 401 behavior
type UnauthorizedBehavior = "returnNull" | "throw";

// Create a query function factory
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: string[] }): Promise<T | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for queries

    try {
      const endpoint = queryKey[0];
      const res = await fetch(endpoint, {
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 based on options
      if (res.status === 401) {
        if (options.on401 === "returnNull") {
          return null;
        } else {
          throw new Error("Unauthorized");
        }
      }

      await throwIfResNotOk(res);
      return res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn("Query timeout for:", queryKey[0]);
        if (options.on401 === "returnNull") {
          return null; // Return null on timeout for auth checks
        }
        throw new Error("Request timeout");
      }
      console.error("Query error:", error);
      throw error;
    }
  };
};

// Create and configure the QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
    },
  },
});