import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StripeButton } from './stripe-button';
import { RazorpayButton } from './razorpay-button';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  onPaymentError
}: PaymentGatewaySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [stripeSession, setStripeSession] = useState<{ url: string } | null>(null);
  const [razorpaySession, setRazorpaySession] = useState<any | null>(null);
  const { toast } = useToast();

  const createPaymentSession = async (gateway: 'stripe' | 'razorpay') => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', `/public/invoices/${tokenId}/pay`, {
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        gateway
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

  const handleRazorpaySuccess = async (paymentId: string, orderId: string, signature: string) => {
    try {
      const response = await apiRequest('POST', `/public/invoices/${tokenId}/verify-payment`, {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature
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
        <CardTitle>Choose Payment Method</CardTitle>
        <CardDescription>
          Select your preferred payment method to pay invoice #{invoiceNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stripe" onClick={() => !stripeSession && createPaymentSession('stripe')}>
              Stripe
            </TabsTrigger>
            <TabsTrigger value="razorpay" onClick={() => !razorpaySession && createPaymentSession('razorpay')}>
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
                  <p>Click the tab to load Stripe payment options</p>
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
                  <p>Click the tab to load Razorpay payment options</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount / 100)}
        </p>
      </CardFooter>
    </Card>
  );
}