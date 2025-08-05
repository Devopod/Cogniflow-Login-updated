import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Receipt,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useExpenses, useExpenseStats, useExpenseTrends, useCreateExpense, useUpdateExpense, useDeleteExpense, useApproveExpense, useRejectExpense } from "@/hooks/use-expenses";
import { useExpenseCategories } from "@/hooks/use-expenses";
import { formatCurrency } from "@/lib/utils";
import ExpenseForm from "./ExpenseForm";
import ExpenseDetailsDialog from "./ExpenseDetailsDialog";
import { useFinanceRealtime } from "@/hooks/use-finance-realtime";

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  status?: string;
  search?: string;
}

export default function ExpenseManagement() {
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [selectedExpense, setSelectedExpense] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const { data: expenses, isLoading: expensesLoading } = useExpenses(filters);
  const { data: expenseStats } = useExpenseStats();
  const { data: expenseTrends } = useExpenseTrends();
  const { data: categories } = useExpenseCategories();
  const { isConnected } = useFinanceRealtime();
  
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();

  const handleCreateExpense = async (expenseData: any) => {
    try {
      await createExpense.mutateAsync(expenseData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const handleApprove = async (expenseId: number) => {
    try {
      await approveExpense.mutateAsync({ id: expenseId });
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const handleReject = async (expenseId: number, notes: string) => {
    try {
      await rejectExpense.mutateAsync({ id: expenseId, notes });
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense.mutateAsync(expenseId);
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
      paid: { label: 'Paid', variant: 'success', icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Real-time connection status */}
      {isConnected && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Real-time updates active
        </div>
      )}

      {/* Expense Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
                <h2 className="text-2xl font-bold">{formatCurrency(expenseStats?.totalExpenses || 0)}</h2>
              </div>
              <div className="bg-red-500/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {(expenseStats?.monthlyChange || 0) >= 0 ? (
                <TrendingUp className="mr-1 h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4 text-green-600" />
              )}
              <span className={(expenseStats?.monthlyChange || 0) >= 0 ? "text-red-600" : "text-green-600"}>
                {Math.abs(expenseStats?.monthlyChange || 0)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</p>
                <h2 className="text-2xl font-bold">{formatCurrency(expenseStats?.pendingAmount || 0)}</h2>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                {expenseStats?.pendingCount || 0} expenses waiting
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">This Month</p>
                <h2 className="text-2xl font-bold">{formatCurrency(expenseStats?.currentMonth || 0)}</h2>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                vs {formatCurrency(expenseStats?.lastMonth || 0)} last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg per Expense</p>
                <h2 className="text-2xl font-bold">{formatCurrency(expenseStats?.averageAmount || 0)}</h2>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-full">
                <Receipt className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                {expenseStats?.totalCount || 0} total expenses
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search expenses..."
              className="pl-10 w-64"
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.categoryId?.toString() || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value === 'all' ? undefined : parseInt(value) }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Expense</DialogTitle>
                <DialogDescription>
                  Add a new expense to track your business spending.
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm 
                onSubmit={handleCreateExpense}
                isLoading={createExpense.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Manage and track all your business expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : !expenses?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No expenses found</p>
              <p className="text-sm">Create your first expense to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-2 rounded-full">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{expense.description}</h3>
                        {getStatusBadge(expense.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{expense.category?.name}</span>
                        <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                        <span>Ref: {expense.referenceNumber}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(expense.totalAmount)}</div>
                      {expense.taxAmount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Tax: {formatCurrency(expense.taxAmount)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense.id);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {expense.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(expense.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(expense.id, 'Rejected via quick action')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog
        expenseId={selectedExpense}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}