import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "react-toastify";

// ==================== DASHBOARD HOOKS ====================

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ["/api/inventory/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/inventory/dashboard");
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time metrics
  });
}

// ==================== PRODUCT HOOKS ====================

export function useProducts(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  location?: string;
}) {
  return useQuery({
    queryKey: ["/api/inventory/products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      
      const url = `/api/inventory/products${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      const products = (data?.products || []).map((p: any) => ({ ...p, unitPrice: p.price }));
      return products;
    },
    staleTime: 30000,
  });
}

export function useProduct(id: number | string | null) {
  return useQuery<Product>({
    queryKey: ["/api/inventory/products", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/inventory/products/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
      const response = await apiRequest("POST", "/api/inventory/products", newProduct);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // Legacy support
      toast.success("Product created successfully!");
    },
    onError: (error: any) => {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Product>) => {
      const response = await apiRequest("PUT", `/api/inventory/products/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // Legacy support
      queryClient.invalidateQueries({ queryKey: ["/api/products", variables.id] });
      toast.success("Product updated successfully!");
    },
    onError: (error: any) => {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/inventory/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // Legacy support
      toast.success("Product deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    },
  });
}

// ==================== STOCK MANAGEMENT HOOKS ====================

export function useAdjustStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      adjustment, 
      reason 
    }: { 
      id: number; 
      adjustment: number; 
      reason: string; 
    }) => {
      const response = await apiRequest("POST", `/api/inventory/products/${id}/adjust-stock`, {
        adjustment,
        reason
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products/alerts/low-stock"] });
      
      const adjustmentText = data.adjustment > 0 ? 'increased' : 'decreased';
      const absoluteAdjustment = Math.abs(data.adjustment);
      toast.success(`Stock ${adjustmentText} by ${absoluteAdjustment} units`);
    },
    onError: (error: any) => {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    },
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ["/api/inventory/products/alerts/low-stock"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/inventory/products/alerts/low-stock");
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

export function useStockMovements() {
  return useQuery({
    queryKey: ["/api/inventory/stock-movements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/inventory/stock-movements");
      return response.json();
    },
    staleTime: 30000,
  });
}

// ==================== IMPORT/EXPORT HOOKS ====================

export function useImportProducts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (products: Partial<Product>[]) => {
      const response = await apiRequest("POST", "/api/inventory/products/import", {
        products
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      toast.success(`Import completed: ${data.success} products imported successfully`);
    },
    onError: (error: any) => {
      console.error("Error importing products:", error);
      toast.error("Failed to import products");
    },
  });
}

// ==================== LEGACY PRODUCT HOOKS FOR BACKWARD COMPATIBILITY ====================

export function useLegacyProducts() {
  return useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json();
    },
  });
}

export function useLegacyProduct(id: number | string | null) {
  return useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/products/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

export function useLegacyCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
      const response = await apiRequest("POST", "/api/products", newProduct);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });
}

export function useLegacyUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Product>) => {
      const response = await apiRequest("PUT", `/api/products/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", variables.id] });
    },
  });
}

export function useLegacyDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });
}