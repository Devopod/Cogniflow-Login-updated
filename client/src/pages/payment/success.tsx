import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get query parameters
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const gateway = params.get('gateway');
    
    // In a real implementation, you would verify the payment status with the backend
    // For now, we'll just show a success message
    
    // You could also extract the invoice ID from the session if needed
    // For this example, we'll just use a placeholder
    setInvoiceId('12345');
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your payment. Your transaction has been completed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {invoiceId && (
            <p className="text-muted-foreground">
              Your payment for invoice #{invoiceId} has been processed.
            </p>
          )}
          <p className="mt-4 text-muted-foreground">
            A receipt has been sent to your email address.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => window.close()} className="mr-2">
            Close Window
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Invoice
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}