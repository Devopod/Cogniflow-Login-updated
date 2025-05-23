import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSupplierSchema, type Supplier } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ErpNavigation from "@/components/ErpNavigation";
import { ArrowLeft, Loader2 } from "lucide-react";

// Define a validation schema for supplier
const formSchema = insertSupplierSchema.extend({
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  contactPerson: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  paymentTerms: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.string().default("active"),
});

type FormData = z.infer<typeof formSchema>;

export default function SupplierForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/purchase/suppliers/:id");
  const { toast } = useToast();
  const isEdit = params?.id !== "new";

  // Fetch supplier if editing
  const { data: supplier, isLoading: isLoadingSupplier } = useQuery<Supplier>({
    queryKey: [`/api/suppliers/${params?.id}`],
    enabled: isEdit,
    retry: 1,
  });

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      contactPerson: "",
      address: "",
      paymentTerms: "",
      notes: "",
      status: "active",
    },
  });

  // Update form values when supplier data is loaded
  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        email: supplier.email || "",
        phone: supplier.phone || "",
        contactPerson: supplier.contactPerson || "",
        address: supplier.address || "",
        paymentTerms: supplier.paymentTerms || "",
        notes: supplier.notes || "",
        status: supplier.status || "active",
      });
    }
  }, [supplier, form]);

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setLocation("/purchase");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PUT", `/api/suppliers/${params?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${params?.id}`] });
      setLocation("/purchase");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateSupplierMutation.mutate(data);
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const isSubmitting = createSupplierMutation.isPending || updateSupplierMutation.isPending;

  return (
    <ErpNavigation>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/purchase")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? "Edit Supplier" : "Add New Supplier"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? "Update supplier information and preferences"
                : "Create a new supplier record in the system"}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
            <CardDescription>
              Enter the supplier details below. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEdit && isLoadingSupplier ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter supplier name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Primary contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Net 30, COD" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Active Supplier
                            </FormLabel>
                            <FormDescription>
                              Inactive suppliers won't appear in order selections
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "active"}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? "active" : "inactive")
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full postal address" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional information about this supplier"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/purchase")}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {isEdit ? "Update Supplier" : "Create Supplier"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </ErpNavigation>
  );
}