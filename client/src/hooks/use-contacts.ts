import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Hook to fetch all contacts
export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      return response.json();
    },
  });
}

// Hook to fetch a single contact by ID
export function useContact(id: number | string | null) {
  return useQuery<Contact>({
    queryKey: ["/api/contacts", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/contacts/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook to create a new contact
export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newContact: Partial<Contact>) => {
      const response = await apiRequest("POST", "/api/contacts", newContact);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });
}

// Hook to update a contact
export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Contact>) => {
      const response = await apiRequest("PUT", `/api/contacts/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", variables.id] });
    },
  });
}

// Hook to delete a contact
export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/contacts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });
}