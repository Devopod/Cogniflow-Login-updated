import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  FileText, 
  Download,
  CheckCircle,
  XCircle,
  Edit,
  User,
  CreditCard,
  Tag
} from "lucide-react";
import { useExpense } from "@/hooks/use-expenses";
import { formatCurrency } from "@/lib/utils";

interface ExpenseDetailsDialogProps {
  expenseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (expenseId: number) => void;
  onReject: (expenseId: number, notes: string) => void;
}

export default function ExpenseDetailsDialog({
  expenseId,
  open,
  onOpenChange,
  onApprove,
  onReject
}: ExpenseDetailsDialogProps) {
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  
  const { data: expense, isLoading } = useExpense(expenseId);

  if (!expense && !isLoading) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', variant: 'default', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', variant: 'destructive', className: 'bg-red-100 text-red-800' },
      paid: { label: 'Paid', variant: 'success', className: 'bg-blue-100 text-blue-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleApprove = () => {
    if (expenseId) {
      onApprove(expenseId);
    }
  };

  const handleReject = () => {
    if (expenseId && rejectionNotes.trim()) {
      onReject(expenseId, rejectionNotes);
      setRejectionNotes('');
      setShowRejectionForm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expense Details
            {expense && getStatusBadge((expense as any).status || 'pending')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading expense details...</div>
        ) : expense ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="approval">Approval</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="font-medium">{expense.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Reference Number</Label>
                      <p className="font-medium">{expense.referenceNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <p className="font-medium">{(expense as any).category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Expense Date</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p className="font-medium">{expense.expenseDate ? new Date(expense.expenseDate as any).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Amount Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Amount Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tax ({(expense as any).taxRate || 0}%):</span>
                      <span className="font-medium">{formatCurrency(expense.taxAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center font-medium text-lg border-t pt-3">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(expense.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <p className="font-medium capitalize">{expense.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Account</Label>
                      <p className="font-medium">{(expense as any).account?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <p className="font-medium">{(expense as any).supplierContact ? `${(expense as any).supplierContact.firstName} ${(expense as any).supplierContact.lastName}` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {expense.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{expense.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receipts & Documents</CardTitle>
                  <CardDescription>
                    View and download all attached documents for this expense
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(expense as any).receiptPath ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Receipt</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded on {expense.createdAt ? new Date(expense.createdAt as any).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>No attachments found</p>
                      <p className="text-sm">Upload receipts to support this expense</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approval" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Approval Status</CardTitle>
                  <CardDescription>
                    Manage approval status and add approval notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Current Status:</span>
                    {getStatusBadge((expense as any).status || 'pending')}
                  </div>

                  {(expense as any).status === 'pending' && (
                    <div className="space-y-4">
                      {!showRejectionForm ? (
                        <div className="flex gap-2">
                          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Expense
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => setShowRejectionForm(true)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Expense
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 p-4 border rounded-lg bg-red-50">
                          <Label htmlFor="rejection-notes">Rejection Reason *</Label>
                          <Textarea
                            id="rejection-notes"
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            placeholder="Please provide a reason for rejecting this expense..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="destructive" 
                              onClick={handleReject}
                              disabled={!rejectionNotes.trim()}
                            >
                              Confirm Rejection
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowRejectionForm(false);
                                setRejectionNotes('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {expense.approvalDate && (
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Approved By</Label>
                          <p className="font-medium">{(expense as any).approvedBy && typeof (expense as any).approvedBy === 'object' ? `${(expense as any).approvedBy.firstName} ${(expense as any).approvedBy.lastName}` : 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Approval Date</Label>
                          <p className="font-medium">{expense.approvalDate ? new Date(expense.approvalDate as any).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      {(expense as any).approvalNotes && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-muted-foreground">Approval Notes</Label>
                          <p className="text-sm bg-green-50 p-3 rounded border">{(expense as any).approvalNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audit Trail</CardTitle>
                  <CardDescription>
                    Track all changes and activities for this expense
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Expense Created</p>
                        <p className="text-sm text-muted-foreground">
                          Created by {(expense as any).user ? `${(expense as any).user.firstName} ${(expense as any).user.lastName}` : 'Unknown'} 
                          on {expense.createdAt ? new Date(expense.createdAt as any).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {expense.updatedAt !== expense.createdAt && (
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Edit className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Expense Modified</p>
                          <p className="text-sm text-muted-foreground">
                            Last updated on {expense.updatedAt ? new Date(expense.updatedAt as any).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {expense.approvalDate && (
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Expense Approved</p>
                          <p className="text-sm text-muted-foreground">
                            Approved by {(expense as any).approvedBy && typeof (expense as any).approvedBy === 'object'
                              ? `${(expense as any).approvedBy.firstName || ''} ${(expense as any).approvedBy.lastName || ''}`.trim() || 'Unknown'
                              : 'Unknown'} 
                            on {expense.approvalDate ? new Date(expense.approvalDate as any).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Expense not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}