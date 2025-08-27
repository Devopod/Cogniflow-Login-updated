import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useExpenseCategories } from "@/hooks/use-expenses";
import { useAccounts } from "@/hooks/use-accounts";

interface ExpenseFormProps {
  expense?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function ExpenseForm({ expense, onSubmit, isLoading, onCancel }: ExpenseFormProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const { data: categories } = useExpenseCategories();
  const { data: accounts } = useAccounts();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || '',
      categoryId: expense?.categoryId || '',
      accountId: expense?.accountId || '',
      expenseDate: expense?.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      referenceNumber: expense?.referenceNumber || '',
      notes: expense?.notes || '',
      paymentMethod: expense?.paymentMethod || 'cash',
      supplierContactId: expense?.supplierContactId || '',
      taxRate: expense?.taxRate || '0',
      isRecurring: expense?.isRecurring || false,
      recurringFrequency: expense?.recurringFrequency || 'monthly',
    }
  });

  const watchAmount = watch('amount');
  const watchTaxRate = watch('taxRate');
  
  const taxAmount = parseFloat(watchAmount || '0') * (parseFloat(watchTaxRate || '0') / 100);
  const totalAmount = parseFloat(watchAmount || '0') + taxAmount;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: any) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
      taxRate: parseFloat(data.taxRate),
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      accountId: data.accountId ? parseInt(data.accountId) : null,
      supplierContactId: data.supplierContactId ? parseInt(data.supplierContactId) : null,
      attachments: attachments,
    };
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            {...register('description', { required: 'Description is required' })}
            placeholder="Enter expense description"
          />
          {errors.description?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.description.message)}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { required: 'Amount is required', min: 0.01 })}
            placeholder="0.00"
          />
          {errors.amount?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.amount.message)}</p>
          )}
        </div>

        {/* Tax Rate */}
        <div>
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            {...register('taxRate')}
            placeholder="0.00"
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="categoryId">Category *</Label>
          <Select onValueChange={(value) => setValue('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-red-600 mt-1">Category is required</p>
          )}
        </div>

        {/* Account */}
        <div>
          <Label htmlFor="accountId">Account</Label>
          <Select onValueChange={(value) => setValue('accountId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.filter((account: any) => account.accountType === 'expense' || account.accountType === 'asset')
                .map((account: any) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name} ({account.accountNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expense Date */}
        <div>
          <Label htmlFor="expenseDate">Expense Date *</Label>
          <Input
            id="expenseDate"
            type="date"
            {...register('expenseDate', { required: 'Expense date is required' })}
          />
          {errors.expenseDate && (
            <p className="text-sm text-red-600 mt-1">{errors.expenseDate.message}</p>
          )}
        </div>

        {/* Reference Number */}
        <div>
          <Label htmlFor="referenceNumber">Reference Number</Label>
          <Input
            id="referenceNumber"
            {...register('referenceNumber')}
            placeholder="Invoice/Receipt number"
          />
        </div>

        {/* Payment Method */}
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select onValueChange={(value) => setValue('paymentMethod', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="debit_card">Debit Card</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount Summary */}
      {(watchAmount || watchTaxRate) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>${parseFloat(watchAmount || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({watchTaxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes or comments"
          rows={3}
        />
      </div>

      {/* File Upload */}
      <div>
        <Label>Receipts & Attachments</Label>
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to upload receipts, invoices, or other documents
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, PDF up to 10MB each
          </p>
        </div>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-accent rounded">
                <span className="text-sm">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
        </Button>
      </div>
    </form>
  );
}