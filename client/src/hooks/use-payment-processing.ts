import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentProcessingOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

interface ProcessPaymentOptions {
  invoiceId: number;
  gateway: string;
  amount?: number;
  paymentMethod?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

interface VerifyPaymentOptions {
  gateway: string;
  sessionId?: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  invoiceId: number;
  token?: string;
}

/**
 * Hook for processing payments through various gateways
 */
export function usePaymentProcessing(options: PaymentProcessingOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Process a payment through a payment gateway
   */
  const processPayment = async (paymentOptions: ProcessPaymentOptions) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Set default return URL if not provided
      const returnUrl = paymentOptions.returnUrl || window.location.href;
      
      // Process the payment
      const response = await apiRequest('POST', '/api/payments/process', {
        ...paymentOptions,
        returnUrl,
      });
      
      const result = await response.json();
      setPaymentResult(result);
      
      // Handle different gateway responses
      if (result.gateway === 'stripe' && result.redirectUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.redirectUrl;
      } else if (result.gateway === 'razorpay' && result.orderId) {
        // For Razorpay, the component will handle the payment UI
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      } else {
        // For other gateways or direct processing
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        
        toast({
          title: 'Payment Processed',
          description: 'Your payment has been processed successfully.',
        });
      }
      
      return result;
    } catch (err: any) {
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsProcessing(false);
      
      if (options.onComplete) {
        options.onComplete();
      }
    }
  };

  /**
   * Verify a payment after gateway processing
   */
  const verifyPayment = async (verifyOptions: VerifyPaymentOptions) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Determine the endpoint based on whether we have a token (public) or not (authenticated)
      const endpoint = verifyOptions.token
        ? `/public/invoices/${verifyOptions.token}/verify-payment`
        : `/api/payments/verify`;
      
      // Verify the payment
      const response = await apiRequest('POST', endpoint, {
        gateway: verifyOptions.gateway,
        sessionId: verifyOptions.sessionId,
        orderId: verifyOptions.orderId,
        paymentId: verifyOptions.paymentId,
        signature: verifyOptions.signature,
        invoiceId: verifyOptions.invoiceId,
      });
      
      const result = await response.json();
      setPaymentResult(result);
      
      if (result.success) {
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        
        toast({
          title: 'Payment Verified',
          description: 'Your payment has been verified successfully.',
        });
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
      
      return result;
    } catch (err: any) {
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: 'Verification Error',
        description: err.message || 'Failed to verify payment. Please contact support.',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsProcessing(false);
      
      if (options.onComplete) {
        options.onComplete();
      }
    }
  };

  /**
   * Process a refund for a payment
   */
  const processRefund = async (paymentId: number, amount?: number, reason?: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', `/api/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      
      const result = await response.json();
      setPaymentResult(result);
      
      if (result.success) {
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        
        toast({
          title: 'Refund Processed',
          description: 'The refund has been processed successfully.',
        });
      } else {
        throw new Error(result.message || 'Refund processing failed');
      }
      
      return result;
    } catch (err: any) {
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }
      
      toast({
        title: 'Refund Error',
        description: err.message || 'Failed to process refund. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsProcessing(false);
      
      if (options.onComplete) {
        options.onComplete();
      }
    }
  };

  return {
    isProcessing,
    paymentResult,
    error,
    processPayment,
    verifyPayment,
    processRefund,
  };
}

/**
 * Hook for handling Razorpay payments
 */
export function useRazorpayPayment(options: PaymentProcessingOptions = {}) {
  const { isProcessing, error, verifyPayment } = usePaymentProcessing(options);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  /**
   * Load the Razorpay script
   */
  const loadRazorpayScript = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).Razorpay) {
        setIsRazorpayLoaded(true);
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsRazorpayLoaded(true);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      
      document.body.appendChild(script);
    });
  };

  /**
   * Open the Razorpay payment modal
   */
  const openRazorpayCheckout = async (paymentData: any, invoiceId: number, token?: string) => {
    try {
      await loadRazorpayScript();
      
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay script failed to load');
      }
      
      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Your Company',
        description: `Payment for invoice #${paymentData.notes?.invoiceNumber || ''}`,
        order_id: paymentData.orderId,
        prefill: paymentData.prefill,
        notes: paymentData.notes,
        theme: {
          color: '#3399cc',
        },
        handler: async function(response: any) {
          try {
            await verifyPayment({
              gateway: 'razorpay',
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              invoiceId,
              token,
            });
          } catch (err) {
            console.error('Razorpay verification error:', err);
          }
        },
      };
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
      return true;
    } catch (err: any) {
      toast({
        title: 'Razorpay Error',
        description: err.message || 'Failed to open Razorpay checkout',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  return {
    isProcessing,
    error,
    isRazorpayLoaded,
    loadRazorpayScript,
    openRazorpayCheckout,
  };
}

/**
 * Hook for handling Stripe payments
 */
export function useStripePayment(options: PaymentProcessingOptions = {}) {
  const { isProcessing, error, verifyPayment } = usePaymentProcessing(options);
  const [isStripeLoaded, setIsStripeLoaded] = useState(false);
  const { toast } = useToast();

  /**
   * Load the Stripe script
   */
  const loadStripeScript = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).Stripe) {
        setIsStripeLoaded(true);
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => {
        setIsStripeLoaded(true);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Stripe script'));
      };
      
      document.body.appendChild(script);
    });
  };

  /**
   * Verify a Stripe payment from URL parameters
   */
  const verifyStripePaymentFromUrl = async (invoiceId: number, token?: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      try {
        await verifyPayment({
          gateway: 'stripe',
          sessionId,
          invoiceId,
          token,
        });
        
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('session_id');
        url.searchParams.delete('gateway');
        window.history.replaceState({}, document.title, url.toString());
        
        return true;
      } catch (err) {
        console.error('Stripe verification error:', err);
        return false;
      }
    }
    
    return false;
  };

  return {
    isProcessing,
    error,
    isStripeLoaded,
    loadStripeScript,
    verifyStripePaymentFromUrl,
  };
}