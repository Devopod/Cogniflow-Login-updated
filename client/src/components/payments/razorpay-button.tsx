import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayButtonProps {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  invoiceId: number;
  invoiceNumber: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onError: (error: any) => void;
}

export function RazorpayButton({
  orderId,
  amount,
  currency,
  keyId,
  invoiceId,
  invoiceNumber,
  customerName,
  customerEmail,
  onSuccess,
  onError
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to load Razorpay. Please try again later.',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [toast]);

  const handlePayment = () => {
    if (!scriptLoaded) {
      toast({
        title: 'Error',
        description: 'Razorpay is still loading. Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'CogniFlow ERP',
        description: `Payment for Invoice #${invoiceNumber}`,
        order_id: orderId,
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
        },
        notes: {
          invoice_id: invoiceId.toString(),
          invoice_number: invoiceNumber,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: function (response: any) {
          onSuccess(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setLoading(false);
      onError(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Pay with Razorpay'
      )}
    </Button>
  );
}