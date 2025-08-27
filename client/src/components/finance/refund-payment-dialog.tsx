import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePaymentProcessing } from '@/hooks/use-payment-processing';
import { formatCurrency, formatDate } from '@/lib/format';
import { Payment } from '@shared/schema';

interface RefundPaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefundComplete?: () => void;
}

export function RefundPaymentDialog({
  payment,
  open,
  onOpenChange,
  onRefundComplete
}: RefundPaymentDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [fullRefund, setFullRefund] = useState<boolean>(true);
  const [reason, setReason] = useState<string>('');
  const { processRefund, isProcessing, error } = usePaymentProcessing({
    onSuccess: () => {
      onOpenChange(false);
      if (onRefundComplete) {
        onRefundComplete();
      }
    }
  });

  // Reset form when payment changes
  useState(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setFullRefund(true);
      setReason('');
    }
  });

  const handleRefund = async () => {
    if (!payment) return;

    const refundAmount = fullRefund ? payment.amount : parseFloat(amount);
    
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return; // Invalid amount
    }
    
    if (refundAmount > payment.amount) {
      return; // Amount exceeds payment
    }
    
    await processRefund(payment.id, refundAmount, reason);
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Refund Payment</DialogTitle>
          <DialogDescription>
            Process a refund for payment #{payment.paymentNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Payment Date</Label>
              <p>{formatDate(payment.payment_date)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment Method</Label>
              <p>{payment.payment_method}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Original Amount</Label>
              <p className="font-medium">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Transaction ID</Label>
              <p className="truncate">{payment.transaction_id || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="fullRefund" 
              checked={fullRefund} 
              onCheckedChange={(checked) => {
                setFullRefund(!!checked);
                if (checked) {
                  setAmount(payment.amount.toString());
                }
              }}
            />
            <Label htmlFor="fullRefund">Process full refund</Label>
          </div>
          
          {!fullRefund && (
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum refund amount: {formatCurrency(payment.amount)}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund"
              rows={3}
            />
          </div>
          
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/90">{error.message || 'Failed to process refund'}</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRefund} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}