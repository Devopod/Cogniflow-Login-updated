import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  PlusSquare,
  SearchIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface SuppliersTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function SuppliersTable({ searchTerm, onSearchChange }: SuppliersTableProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch suppliers
  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    isError: suppliersError,
    refetch: refetchSuppliers,
  } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    retry: 1,
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      return apiRequest("DELETE", `/api/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      toast({
        title: "Supplier deleted",
        description: "The supplier has been successfully removed",
        variant: "default",
      });
      // Refresh the suppliers list
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier) => {
    return (
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle deleting a supplier
  const handleDeleteSupplier = (supplierId: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplierMutation.mutate(supplierId);
    }
  };

  // Handle creating a new supplier
  const handleCreateSupplier = () => {
    setLocation("/purchase/suppliers/new");
  };

  // Handle editing a supplier
  const handleEditSupplier = (supplierId: number) => {
    setLocation(`/purchase/suppliers/${supplierId}`);
  };

  if (suppliersLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (suppliersError) {
    return (
      <div className="w-full text-center py-8 text-destructive">
        <p>Error loading suppliers. Please try again.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => refetchSuppliers()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (filteredSuppliers.length === 0 && searchTerm === "") {
    return (
      <div className="w-full text-center py-8 text-muted-foreground">
        <p>No suppliers found. Add your first supplier to get started.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={handleCreateSupplier}
        >
          <PlusSquare className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>
    );
  }

  if (filteredSuppliers.length === 0 && searchTerm !== "") {
    return (
      <div className="w-full text-center py-8 text-muted-foreground">
        <p>No suppliers matching "{searchTerm}"</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => onSearchChange("")}
        >
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSuppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>{supplier.contactPerson || "-"}</TableCell>
              <TableCell>{supplier.email || "-"}</TableCell>
              <TableCell>{supplier.phone || "-"}</TableCell>
              <TableCell>
                <Badge 
                  className={supplier.status === 'active' ? "bg-green-500" : "bg-slate-500"}
                >
                  {supplier.status === 'active' ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditSupplier(supplier.id)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    disabled={deleteSupplierMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}