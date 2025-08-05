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
  Check,
  X,
  FileText,
  Calendar,
  User,
  DollarSign,
  Package,
  Building2,
  AlertCircle,
  Clock
} from "lucide-react";
import { 
  usePurchaseRequests, 
  useCreatePurchaseRequest, 
  useApprovePurchaseRequest,
  usePurchaseRealtime
} from "@/hooks/use-purchase";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RequestFilters {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
}

export default function PurchaseRequestsTab() {
  const [filters, setFilters] = useState<RequestFilters>({ page: 1 });
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data: requestsData, isLoading: requestsLoading } = usePurchaseRequests(filters);
  const createRequest = useCreatePurchaseRequest();
  const approveRequest = useApprovePurchaseRequest();
  
  // Enable real-time updates
  usePurchaseRealtime();

  const requests = requestsData?.requests || [];

  const handleApprove = async (requestId: number) => {
    try {
      await approveRequest.mutateAsync({ id: requestId, status: 'approved' });
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await approveRequest.mutateAsync({ id: requestId, status: 'rejected' });
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      case 'in_review': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (requestsLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Purchase Requests</h2>
          <p className="text-gray-600">Manage and approve purchase requests from departments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Request</DialogTitle>
              <DialogDescription>
                Submit a new purchase request for approval.
              </DialogDescription>
            </DialogHeader>
            {/* Purchase Request Form would go here */}
            <div className="p-4 text-center text-gray-500">
              Purchase Request Form Component
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search requests..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.department || "all"} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, department: value === "all" ? undefined : value }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="it">IT Department</SelectItem>
            <SelectItem value="hr">HR Department</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Requests</CardTitle>
          <CardDescription>
            All purchase requests requiring approval or in various stages of processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <FileText className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase requests found</h3>
                      <p className="text-gray-600 text-center mb-6 max-w-md">
                        {filters.status || filters.department 
                          ? "No purchase requests match your current filters. Try adjusting your search criteria."
                          : "You haven't created any purchase requests yet. Create your first request to get started with the procurement process."
                        }
                      </p>
                      <Button onClick={() => alert('Purchase Request form coming soon!')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Purchase Request
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((requestData: any) => {
                  const request = requestData.request;
                  const department = requestData.department;
                  const requestedByUser = requestData.requestedByUser;
                  
                  // Mock data for demonstration
                  const mockData = {
                    requestNumber: `PR-${new Date().getFullYear()}-${String(request.id).padStart(3, '0')}`,
                    departmentName: department?.name || 'IT Department',
                    requestedBy: requestedByUser ? `${requestedByUser.firstName} ${requestedByUser.lastName}` : 'John Doe',
                    itemCount: requestData.itemCount || Math.floor(Math.random() * 5) + 1,
                    totalAmount: Math.floor(Math.random() * 10000) + 1000,
                    priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                    status: ['pending', 'approved', 'rejected', 'in_review'][Math.floor(Math.random() * 4)],
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                  };

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {mockData.requestNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {mockData.departmentName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {mockData.requestedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          {mockData.itemCount} items
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          {formatCurrency(mockData.totalAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getPriorityColor(mockData.priority)}`}>
                          {mockData.priority.charAt(0).toUpperCase() + mockData.priority.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(mockData.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(mockData.status)}
                            {mockData.status.replace('_', ' ').charAt(0).toUpperCase() + mockData.status.replace('_', ' ').slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(mockData.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest({ ...requestData, mockData });
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {mockData.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(request.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleReject(request.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Purchase Request Details</DialogTitle>
            <DialogDescription>
              Complete information about the purchase request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Request Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Request Number</label>
                      <p className="text-sm text-gray-900">{selectedRequest.mockData.requestNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-sm text-gray-900">{selectedRequest.mockData.departmentName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Requested By</label>
                      <p className="text-sm text-gray-900">{selectedRequest.mockData.requestedBy}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status & Priority</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedRequest.mockData.status)}>
                          {selectedRequest.mockData.status.replace('_', ' ').charAt(0).toUpperCase() + selectedRequest.mockData.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Priority</label>
                      <p className={`text-sm font-medium ${getPriorityColor(selectedRequest.mockData.priority)}`}>
                        {selectedRequest.mockData.priority.charAt(0).toUpperCase() + selectedRequest.mockData.priority.slice(1)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedRequest.mockData.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Amount</label>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedRequest.mockData.totalAmount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Number of Items</label>
                      <p className="text-sm text-gray-900">{selectedRequest.mockData.itemCount} items</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Items Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Requested Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Office Desk Chairs (Ergonomic)</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell>{formatCurrency(250)}</TableCell>
                      <TableCell>{formatCurrency(1250)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Laptop Computers (Dell Latitude)</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>{formatCurrency(1200)}</TableCell>
                      <TableCell>{formatCurrency(3600)}</TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell>{formatCurrency(selectedRequest.mockData.totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              {selectedRequest.mockData.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleReject(selectedRequest.request.id);
                      setShowDetailsDialog(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Request
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedRequest.request.id);
                      setShowDetailsDialog(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Request
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}