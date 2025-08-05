import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter,
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Star
} from "lucide-react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, usePurchaseRealtime, useSupplierPerformance } from "@/hooks/use-purchase";
import { formatCurrency, formatDate } from "@/lib/utils";
import SupplierForm from "./SupplierForm";

interface SuppliersFilters {
  search?: string;
  status?: string;
  page?: number;
}

export default function SuppliersTab() {
  const [filters, setFilters] = useState<SuppliersFilters>({ page: 1 });
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers(filters);
  const { data: performanceData } = useSupplierPerformance();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  
  // Enable real-time updates
  usePurchaseRealtime();

  const suppliers = suppliersData?.suppliers || [];
  const pagination = suppliersData?.pagination || {};

  const handleCreateSupplier = async (supplierData: any) => {
    try {
      await createSupplier.mutateAsync(supplierData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create supplier:', error);
    }
  };

  const handleUpdateSupplier = async (supplierData: any) => {
    try {
      await updateSupplier.mutateAsync({ id: selectedSupplier.supplier.id, ...supplierData });
      setShowEditDialog(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Failed to update supplier:', error);
    }
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier.mutateAsync(supplierId);
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceRating = (performance: number) => {
    if (performance >= 95) return { stars: 5, color: 'text-green-500' };
    if (performance >= 90) return { stars: 4, color: 'text-blue-500' };
    if (performance >= 80) return { stars: 3, color: 'text-yellow-500' };
    if (performance >= 70) return { stars: 2, color: 'text-orange-500' };
    return { stars: 1, color: 'text-red-500' };
  };

  if (suppliersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-gray-600">Manage your supplier relationships</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Create a new supplier to manage purchase orders and relationships.
              </DialogDescription>
            </DialogHeader>
            <SupplierForm
              onSubmit={handleCreateSupplier}
              isLoading={createSupplier.isPending}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search suppliers..."
            className="pl-10"
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <Select 
          value={filters.status || "all"} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? undefined : value }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {filters.search || filters.status 
                ? "No suppliers match your current filters. Try adjusting your search criteria."
                : "You haven't added any suppliers yet. Get started by adding your first supplier to manage purchase orders."
              }
            </p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>
                    Create a new supplier to manage purchase orders and relationships.
                  </DialogDescription>
                </DialogHeader>
                <SupplierForm
                  onSubmit={handleCreateSupplier}
                  isLoading={createSupplier.isPending}
                  onCancel={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplierData: any) => {
          const supplier = supplierData.supplier;
          // Find performance data for this supplier
          const supplierPerformance = performanceData?.find((p: any) => p.supplier.id === supplier.id);
          const performance = supplierPerformance?.overallScore || 0;
          const rating = getPerformanceRating(performance);
          
          return (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <CardDescription>{supplier.contactPerson}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(supplier.status)}>
                    {supplier.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{supplier.phone}</span>
                  </div>
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>

                {/* Performance & Stats */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-lg font-bold text-gray-900">{supplierData.orderCount || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Spend</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(supplierData.totalSpend || 0)}
                    </p>
                  </div>
                </div>

                {/* Performance Rating */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < rating.stars ? `${rating.color} fill-current` : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{performance.toFixed(1)}%</span>
                </div>

                {/* Last Order Date */}
                {supplierData.lastOrderDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Last order: {formatDate(supplierData.lastOrderDate)}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedSupplier(supplierData);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedSupplier(supplierData);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteSupplier(supplier.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            disabled={pagination.page <= 1}
            onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button 
            variant="outline" 
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Supplier Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm
              supplier={selectedSupplier.supplier}
              onSubmit={handleUpdateSupplier}
              isLoading={updateSupplier.isPending}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedSupplier(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
            <DialogDescription>
              Complete supplier information and performance metrics.
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Supplier Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-sm text-gray-900">{selectedSupplier.supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Person</label>
                    <p className="text-sm text-gray-900">{selectedSupplier.supplier.contactPerson}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedSupplier.supplier.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{selectedSupplier.supplier.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-sm text-gray-900">{selectedSupplier.supplier.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                    <p className="text-sm text-gray-900">{selectedSupplier.supplier.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">{selectedSupplier.orderCount || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(selectedSupplier.totalSpend || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Spend</p>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedSupplier.lastOrderDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Order Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedSupplier.lastOrderDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}