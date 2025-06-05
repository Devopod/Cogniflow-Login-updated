import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { StripeButton } from './stripe-button';
import { RazorpayButton } from './razorpay-button';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/format';

interface PaymentGatewaySelectorProps {
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  tokenId: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: any) => void;
  onCancel?: () => void;
  allowPartialPayment?: boolean;
}

export function PaymentGatewaySelector({
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  customerName,
  customerEmail,
  tokenId,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  allowPartialPayment = true
}: PaymentGatewaySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [stripeSession, setStripeSession] = useState<{ url: string } | null>(null);
  const [razorpaySession, setRazorpaySession] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>(amount.toString());
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [selectedGateway, setSelectedGateway] = useState<string>('stripe');
  const { toast } = useToast();

  // Initialize payment amount
  useEffect(() => {
    setPaymentAmount(amount.toString());
  }, [amount]);

  // Check URL for payment verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const gateway = urlParams.get('gateway');
    
    if (sessionId && gateway === 'stripe') {
      verifyStripePayment(sessionId);
    }
  }, []);

  const createPaymentSession = async (gateway: 'stripe' | 'razorpay') => {
    setLoading(true);
    try {
      // Validate payment amount
      const amountValue = parseFloat(paymentAmount);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid payment amount.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      if (amountValue > amount) {
        toast({
          title: 'Amount Exceeds Balance',
          description: `The payment amount exceeds the balance due (${formatCurrency(amount, currency)}).`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      if (!allowPartialPayment && amountValue < amount) {
        toast({
          title: 'Partial Payment Not Allowed',
          description: 'This invoice requires full payment.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const response = await apiRequest('POST', `/api/public/invoices/${tokenId}/pay`, {
        successUrl: `${window.location.origin}${window.location.pathname}?session_id={CHECKOUT_SESSION_ID}&gateway=${gateway}`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?canceled=true&gateway=${gateway}`,
        gateway,
        amount: amountValue
      });

      const data = await response.json();

      if (gateway === 'stripe') {
        setStripeSession(data);
      } else {
        setRazorpaySession(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payment session. Please try again.',
        variant: 'destructive',
      });
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyStripePayment = async (sessionId: string) => {
    try {
      const response = await apiRequest('POST', `/public/invoices/${tokenId}/verify-payment`, {
        gateway: 'stripe',
        sessionId
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment Successful',
          description: `Your payment for invoice #${invoiceNumber} has been processed successfully.`,
        });
        onPaymentSuccess();
        
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('session_id');
        url.searchParams.delete('gateway');
        window.history.replaceState({}, document.title, url.toString());
      } else {
        toast({
          title: 'Payment Verification Failed',
          description: 'There was an issue verifying your payment. Please contact support.',
          variant: 'destructive',
        });
        onPaymentError(new Error('Payment verification failed'));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify payment. Please contact support.',
        variant: 'destructive',
      });
      onPaymentError(error);
    }
  };

  const handleRazorpaySuccess = async (paymentId: string, orderId: string, signature: string) => {
    try {
      const response = await apiRequest('POST', `/public/invoices/${tokenId}/verify-payment`, {
        gateway: 'razorpay',
        paymentId,
        orderId,
        signature
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment Successful',
          description: `Your payment for invoice #${invoiceNumber} has been processed successfully.`,
        });
        onPaymentSuccess();
      } else {
        toast({
          title: 'Payment Verification Failed',
          description: 'There was an issue verifying your payment. Please contact support.',
          variant: 'destructive',
        });
        onPaymentError(new Error('Payment verification failed'));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify payment. Please contact support.',
        variant: 'destructive',
      });
      onPaymentError(error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
        <CardDescription>
          Pay invoice #{invoiceNumber} using your preferred payment method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allowPartialPayment && (
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setIsCustomAmount(parseFloat(e.target.value) !== amount);
                  // Reset sessions when amount changes
                  setStripeSession(null);
                  setRazorpaySession(null);
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentAmount(amount.toString());
                  setIsCustomAmount(false);
                  // Reset sessions when amount changes
                  setStripeSession(null);
                  setRazorpaySession(null);
                }}
                disabled={!isCustomAmount}
              >
                Pay Full
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCustomAmount ? 'Partial payment' : 'Full payment'}: {formatCurrency(parseFloat(paymentAmount) || 0, currency)}
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Select Payment Method</Label>
          <Tabs defaultValue={selectedGateway} onValueChange={setSelectedGateway} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="stripe" 
                onClick={() => {
                  if (!stripeSession) {
                    createPaymentSession('stripe');
                  }
                }}
              >
                Stripe
              </TabsTrigger>
              <TabsTrigger 
                value="razorpay" 
                onClick={() => {
                  if (!razorpaySession) {
                    createPaymentSession('razorpay');
                  }
                }}
              >
                Razorpay
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stripe" className="mt-4">
              {stripeSession ? (
                <StripeButton
                  sessionUrl={stripeSession.url}
                  onError={onPaymentError}
                />
              ) : (
                <div className="text-center py-4">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Preparing Stripe checkout...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p>Click the button below to proceed with Stripe payment</p>
                      <Button onClick={() => createPaymentSession('stripe')} disabled={loading}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay with Stripe
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="razorpay" className="mt-4">
              {razorpaySession ? (
                <RazorpayButton
                  orderId={razorpaySession.orderId}
                  amount={razorpaySession.amount}
                  currency={razorpaySession.currency}
                  keyId={razorpaySession.keyId}
                  invoiceId={invoiceId}
                  invoiceNumber={invoiceNumber}
                  customerName={customerName}
                  customerEmail={customerEmail}
                  onSuccess={handleRazorpaySuccess}
                  onError={onPaymentError}
                />
              ) : (
                <div className="text-center py-4">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Preparing Razorpay checkout...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p>Click the button below to proceed with Razorpay payment</p>
                      <Button onClick={() => createPaymentSession('razorpay')} disabled={loading}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay with Razorpay
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          Amount: {formatCurrency(parseFloat(paymentAmount) || 0, currency)}
        </p>
      </CardFooter>
    </Card>
  );
}