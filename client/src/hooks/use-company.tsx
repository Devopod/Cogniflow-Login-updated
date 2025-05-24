import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useCompany() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [companyStatus, setCompanyStatus] = useState<{
    hasCompany: boolean;
    isLoading: boolean;
    companyId?: number;
    companyName?: string;
    setupComplete?: boolean;
    refresh?: (force?: boolean) => Promise<void>;
  }>({
    hasCompany: false,
    isLoading: true,
  });
  
  // Use a ref to track if the initial request has been made
  const initialRequestMade = useRef(false);

  const checkCompanyStatus = useCallback(async (force = false) => {
    // If we've already made the initial request and we're not forcing a refresh, don't proceed
    if (initialRequestMade.current && !force) return;
    
    // Mark that we've made the initial request
    initialRequestMade.current = true;
    
    try {
      // Add a timestamp to prevent browser caching if forcing refresh
      const timestamp = force ? `?t=${Date.now()}` : '';
      
      const response = await fetch(`/api/company/status${timestamp}`, {
        credentials: "include",
        headers: {
          'Cache-Control': force ? 'no-cache' : 'max-age=60',
          'Pragma': force ? 'no-cache' : 'cache'
        }
      });

      if (!response.ok) {
        // If the API returns an error, assume no company
        setCompanyStatus(prev => ({
          ...prev,
          hasCompany: false,
          isLoading: false,
        }));
        return;
      }

      const data = await response.json();
      
      setCompanyStatus(prev => ({
        ...prev,
        hasCompany: data.hasCompany,
        isLoading: false,
        companyId: data.companyId,
        companyName: data.companyName,
        setupComplete: data.setupComplete,
      }));

      // If user is logged in but doesn't have a company, redirect to company registration
      if (!data.hasCompany && window.location.pathname !== "/company-registration") {
        toast({
          title: "Company Registration Required",
          description: "Please complete your company registration to continue.",
        });
        setLocation("/company-registration");
      }
    } catch (error) {
      console.error("Error checking company status:", error);
      setCompanyStatus(prev => ({
        ...prev,
        hasCompany: false,
        isLoading: false,
      }));
    }
  }, [setLocation, toast]);

  // Set up the refresh function
  useEffect(() => {
    setCompanyStatus(prev => ({
      ...prev,
      refresh: (force = false) => checkCompanyStatus(force)
    }));
  }, [checkCompanyStatus]);

  // Initial check - only run once
  useEffect(() => {
    checkCompanyStatus();
  }, []);  // Empty dependency array to run only once

  return companyStatus;
}