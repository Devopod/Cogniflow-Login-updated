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

// Function to make API requests
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  headers: HeadersInit = {}
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(endpoint, options);
  return throwIfResNotOk(res);
}

// Options for controlling 401 behavior
type UnauthorizedBehavior = "returnNull" | "throw";

// Create a query function factory
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: string[] }): Promise<T | null> => {
    try {
      const endpoint = queryKey[0];
      const res = await fetch(endpoint, {
        credentials: "include",
      });

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
      console.error("Query error:", error);
      throw error;
    }
  };
};

// Create and configure the QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});