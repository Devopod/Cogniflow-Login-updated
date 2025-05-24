import { useState, useEffect, useCallback, useRef } from 'react';

interface CompanyStatus {
  hasCompany: boolean;
  companyId?: number;
  companyName?: string;
  setupComplete?: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
}

export function useCompany(): CompanyStatus {
  const [status, setStatus] = useState<CompanyStatus>({
    hasCompany: false,
    isLoading: true,
    error: null,
    refresh: async (force = false) => {}
  });
  
  // Use a ref to track if we've already made the initial request
  const initialRequestMade = useRef(false);
  // Use a ref to track loading state to avoid dependency cycle
  const isLoadingRef = useRef(true);

  const checkCompanyStatus = useCallback(async (force = false) => {
    try {
      // If we're already loading and not forcing a refresh, don't make another request
      if (isLoadingRef.current && !force && initialRequestMade.current) return;
      
      // Update loading state
      isLoadingRef.current = true;
      setStatus(prev => ({ ...prev, isLoading: true }));
      
      // Mark that we've made the initial request
      initialRequestMade.current = true;
      
      // Add a timestamp to prevent browser caching
      const timestamp = force ? `?t=${Date.now()}` : '';
      
      const response = await fetch(`/api/company/status${timestamp}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': force ? 'no-cache' : 'max-age=60',
          'Pragma': force ? 'no-cache' : 'cache'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, don't show error
          isLoadingRef.current = false;
          setStatus(prev => ({
            ...prev,
            hasCompany: false,
            isLoading: false,
            error: null
          }));
          return;
        }
        
        throw new Error('Failed to fetch company status');
      }

      const data = await response.json();
      
      // Update loading state ref
      isLoadingRef.current = false;
      
      setStatus(prev => ({
        ...prev,
        hasCompany: data.hasCompany,
        companyId: data.companyId,
        companyName: data.companyName,
        setupComplete: data.setupComplete,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error checking company status:', error);
      // Update loading state ref
      isLoadingRef.current = false;
      
      setStatus(prev => ({
        ...prev,
        hasCompany: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []); // Remove the dependency on status.isLoading

  // Set the refresh function only once
  const refreshFn = useCallback((force = false) => checkCompanyStatus(force), [checkCompanyStatus]);

  useEffect(() => {
    setStatus(prev => ({ 
      ...prev, 
      refresh: refreshFn
    }));
  }, [refreshFn]);

  // Initial check - only run once
  useEffect(() => {
    checkCompanyStatus();
    // We don't include checkCompanyStatus in the dependency array
    // to prevent infinite loops
  }, []);

  return status;
}