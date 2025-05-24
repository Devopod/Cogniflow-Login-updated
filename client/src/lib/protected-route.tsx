import { useEffect, useState, useRef } from "react";
import { Route, Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useCompany } from "@/hooks/use-company";

type ProtectedRouteProps = {
  path: string;
  component: () => JSX.Element;
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const companyStatus = useCompany();
  const [, setLocation] = useLocation();
  
  // Use a ref to prevent infinite loading states
  const authCheckCompleted = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.warn("Auth check timed out - proceeding with application");
      }
    }, 10000); // 10 second timeout
    
    async function checkAuth() {
      if (authCheckCompleted.current) return;
      
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
          headers: {
            'Cache-Control': 'max-age=60',
            'Pragma': 'cache'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        authCheckCompleted.current = true;
        setLoading(false);
        
        // Clear the timeout if auth check completes
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      }
    }

    checkAuth();
    
    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Set a maximum loading time for company status
  useEffect(() => {
    const companyStatusTimeout = setTimeout(() => {
      if (companyStatus.isLoading) {
        console.warn("Company status check timed out - proceeding with application");
        // Force a refresh of company status
        if (companyStatus.refresh) {
          companyStatus.refresh(true).catch(console.error);
        }
      }
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(companyStatusTimeout);
  }, [companyStatus]);

  return (
    <Route path={path}>
      {() => {
        // If auth is still loading, show loading spinner
        if (loading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Checking authentication...</span>
            </div>
          );
        }

        // If not authenticated, redirect to auth page
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // If this is the company registration page, allow access
        if (path === "/company-registration") {
          // If user has a company and is on registration page, redirect to dashboard
          if (companyStatus.hasCompany && !companyStatus.isLoading) {
            return <Redirect to="/dashboard" />;
          }
          return <Component />;
        }
        
        // If company status is still loading, show loading spinner
        // But only for a reasonable amount of time
        if (companyStatus.isLoading) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mt-4">Loading company information...</span>
            </div>
          );
        }
        
        // If user doesn't have a company, redirect to company registration
        if (!companyStatus.hasCompany && path !== "/company-registration") {
          return <Redirect to="/company-registration" />;
        }

        return <Component />;
      }}
    </Route>
  );
}