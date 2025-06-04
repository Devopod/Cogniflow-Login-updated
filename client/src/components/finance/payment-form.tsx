import { useState, useEffect } from "react";
import { useCreatePayment } from "@/hooks/use-payments";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CreditCard, Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Invoice } from "@shared/schema";

interface PaymentFormProps {
  invoice: Invoice;
  balanceDue: number;
  onPaymentRecorded?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ invoice, balanceDue, onPaymentRecorded, onCancel }: PaymentFormProps) {
  const [amount, setAmount] = useState(balanceDue.toString());
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { toast } = useToast();
  const { mutate: createPayment, isPending } = useCreatePayment();
  
  // Update amount when balance due changes
  useEffect(() => {
    setAmount(balanceDue.toString());
  }, [balanceDue]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive"
      });
      return;
    }
    
    if (paymentAmount > balanceDue) {
      toast({
        title: "Amount Exceeds Balance",
        description: `The payment amount exceeds the balance due (${formatCurrency(balanceDue)}).`,
        variant: "destructive"
      });
      return;
    }
    
    createPayment({
      amount: paymentAmount,
      payment_method: paymentMethod,
      reference,
      description: notes, // Use description field instead of notes
      paymentDate: new Date(paymentDate), // Convert string to Date object
      relatedDocumentType: 'invoice',
      relatedDocumentId: invoice.id,
      contactId: invoice.contactId,
      userId: invoice.userId
    }, {
      onSuccess: () => {
        toast({
          title: "Payment Recorded",
          description: `Payment of ${formatCurrency(paymentAmount)} has been recorded.`,
        });
        
        // Reset form
        setAmount("");
        setReference("");
        setNotes("");
        
        // Notify parent component
        if (onPaymentRecorded) {
          onPaymentRecorded();
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to record payment: ${error.message}`,
          variant: "destructive"
        });
      }
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>
          Enter payment details for invoice {invoice.invoiceNumber}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction ID, Check #, etc."
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}