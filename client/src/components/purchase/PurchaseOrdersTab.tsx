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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Truck,
  Package,
  Clock,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import { 
  usePurchaseOrders, 
  useCreatePurchaseOrder, 
  useUpdatePurchaseOrderStatus,
  usePurchaseDashboard,
  usePurchaseRealtime
} from "@/hooks/use-purchase";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderFilters {
  search?: string;
  status?: string;
  supplierId?: number;
  page?: number;
}

export default function PurchaseOrdersTab() {
  const [filters, setFilters] = useState<OrderFilters>({ page: 1 });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = usePurchaseOrders(filters);
  const { data: dashboard } = usePurchaseDashboard();
  const createOrder = useCreatePurchaseOrder();
  const updateOrderStatus = useUpdatePurchaseOrderStatus();
  
  // Enable real-time updates
  usePurchaseRealtime();

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sent_to_supplier': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'partially_delivered': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'sent_to_supplier': return <FileText className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'partially_delivered': return <Package className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (ordersLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600">Manage purchase orders and track deliveries</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{dashboard?.totalPurchaseOrders || 0}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-3 text-yellow-600" />
            <p className="text-2xl font-bold text-gray-900">{dashboard?.pendingOrders || 0}</p>
            <p className="text-sm text-gray-600">Pending Orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Truck className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{dashboard?.deliveredOrders || 0}</p>
            <p className="text-sm text-gray-600">Delivered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard?.pendingAmount || 0)}</p>
            <p className="text-sm text-gray-600">Pending Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value, page: 1 }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="sent_to_supplier">Sent to Supplier</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            {pagination.total || 0} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
                        <p className="text-gray-600 text-center mb-6 max-w-md">
                          {filters.status || filters.supplierId 
                            ? "No purchase orders match your current filters. Try adjusting your search criteria."
                            : "You haven't created any purchase orders yet. Purchase orders are typically created from approved purchase requests or directly with suppliers."
                          }
                        </p>
                        <div className="flex gap-3">
                          <Button onClick={() => alert('Purchase Order form coming soon!')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Purchase Order
                          </Button>
                          <Button variant="outline" onClick={() => window.location.href = '/purchase/requests'}>
                            View Purchase Requests
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((orderRow: any) => {
                    const order = orderRow.order;
                    const supplier = orderRow.supplier;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(order.orderDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{orderRow.itemCount || 0} items</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            {formatCurrency(order.totalAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'Not set'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(orderRow);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order?.orderNumber}</DialogTitle>
            <DialogDescription>
              Complete order information and status tracking
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Order Number:</span> {selectedOrder.order.orderNumber}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge variant="outline" className={`ml-2 ${getStatusColor(selectedOrder.order.status)}`}>
                        {selectedOrder.order.status.replace('_', ' ')}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Order Date:</span> {formatDate(selectedOrder.order.orderDate)}</p>
                    <p><span className="font-medium">Expected Delivery:</span> {selectedOrder.order.expectedDeliveryDate ? formatDate(selectedOrder.order.expectedDeliveryDate) : 'Not set'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Supplier Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Supplier:</span> {selectedOrder.supplier.name}</p>
                    <p><span className="font-medium">Contact Person:</span> {selectedOrder.supplier.contactPerson}</p>
                    <p><span className="font-medium">Payment Terms:</span> {selectedOrder.order.paymentTerms || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Financial Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <p><span className="font-medium">Subtotal:</span> {formatCurrency(selectedOrder.order.subtotal)}</p>
                  <p><span className="font-medium">Tax:</span> {formatCurrency(selectedOrder.order.taxAmount || 0)}</p>
                  <p><span className="font-medium">Total:</span> <span className="font-bold">{formatCurrency(selectedOrder.order.totalAmount)}</span></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}