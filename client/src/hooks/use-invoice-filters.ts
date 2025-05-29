import { useState, useEffect, useMemo } from 'react';
import { Invoice } from '@shared/schema';
import { useDebounce } from './use-debounce';

interface InvoiceFilters {
  search: string;
  status: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
  contactId: number | null;
}

interface UseInvoiceFiltersProps {
  invoices: Invoice[] | undefined;
  initialFilters?: Partial<InvoiceFilters>;
}

export function useInvoiceFilters({ 
  invoices = [], 
  initialFilters = {} 
}: UseInvoiceFiltersProps) {
  // Initialize filters with defaults
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: initialFilters.search || '',
    status: initialFilters.status || [],
    dateRange: initialFilters.dateRange || { from: null, to: null },
    amountRange: initialFilters.amountRange || { min: null, max: null },
    contactId: initialFilters.contactId || null,
  });
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Apply filters to invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = 
          invoice.invoice_number?.toLowerCase().includes(searchLower) ||
          invoice.notes?.toLowerCase().includes(searchLower) ||
          invoice.contact?.firstName?.toLowerCase().includes(searchLower) ||
          invoice.contact?.lastName?.toLowerCase().includes(searchLower) ||
          invoice.contact?.company?.toLowerCase().includes(searchLower) ||
          invoice.contact?.email?.toLowerCase().includes(searchLower);
          
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(invoice.status)) {
        return false;
      }
      
      // Date range filter - issue date
      if (filters.dateRange.from && new Date(invoice.issue_date) < filters.dateRange.from) {
        return false;
      }
      
      if (filters.dateRange.to) {
        const toDateEnd = new Date(filters.dateRange.to);
        toDateEnd.setHours(23, 59, 59, 999);
        if (new Date(invoice.issue_date) > toDateEnd) {
          return false;
        }
      }
      
      // Amount range filter
      if (filters.amountRange.min !== null && invoice.total_amount < filters.amountRange.min) {
        return false;
      }
      
      if (filters.amountRange.max !== null && invoice.total_amount > filters.amountRange.max) {
        return false;
      }
      
      // Contact filter
      if (filters.contactId !== null && invoice.contact_id !== filters.contactId) {
        return false;
      }
      
      return true;
    });
  }, [invoices, debouncedSearch, filters]);
  
  // Update a single filter
  const updateFilter = <K extends keyof InvoiceFilters>(
    key: K, 
    value: InvoiceFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: [],
      dateRange: { from: null, to: null },
      amountRange: { min: null, max: null },
      contactId: null,
    });
  };
  
  // Get available filter options from the data
  const filterOptions = useMemo(() => {
    if (!invoices) return { statuses: [] };
    
    const statuses = Array.from(new Set(invoices.map(invoice => invoice.status)));
    
    return {
      statuses
    };
  }, [invoices]);
  
  return {
    filters,
    updateFilter,
    resetFilters,
    filteredInvoices,
    filterOptions
  };
}