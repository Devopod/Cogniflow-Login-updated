import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface StripeButtonProps {
  sessionUrl: string;
  onError: (error: any) => void;
}

export function StripeButton({ sessionUrl, onError }: StripeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    try {
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      setLoading(false);
      onError(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting to Stripe...
        </>
      ) : (
        'Pay with Stripe'
      )}
    </Button>
  );
}