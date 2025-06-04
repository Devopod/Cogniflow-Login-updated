import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  holderName?: string;
  bankName?: string;
  accountLast4?: string;
  createdAt: string;
}

interface PaymentMethodsManagerProps {
  contactId: number;
  token?: string; // For public access
  paymentMethods: PaymentMethod[];
  onUpdate: () => void;
}

export function PaymentMethodsManager({
  contactId,
  token,
  paymentMethods,
  onUpdate
}: PaymentMethodsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state for adding a new payment method
  const [methodType, setMethodType] = useState<string>('card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardHolderName, setCardHolderName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [routingNumber, setRoutingNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');

  // Handle adding a new payment method
  const handleAddPaymentMethod = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate form based on method type
      if (methodType === 'card') {
        if (!cardNumber || !cardExpiry || !cardCvc || !cardHolderName) {
          toast({
            title: 'Missing Information',
            description: 'Please fill in all card details.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        
        // Basic validation
        if (cardNumber.replace(/\s/g, '').length < 13) {
          toast({
            title: 'Invalid Card Number',
            description: 'Please enter a valid card number.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      } else if (methodType === 'bank_account') {
        if (!bankName || !accountNumber || !routingNumber || !accountHolderName) {
          toast({
            title: 'Missing Information',
            description: 'Please fill in all bank account details.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // In a real implementation, you would use a secure payment gateway SDK
      // to tokenize the card/bank details before sending to your server
      
      // For this demo, we'll simulate tokenization by creating a mock payment method
      // with masked data (never store actual card numbers or full bank details)
      
      // Prepare the payment method data
      let paymentMethodData: Partial<PaymentMethod> = {
        type: methodType,
      };
      
      if (methodType === 'card') {
        // Extract last 4 digits and mask the rest
        const last4 = cardNumber.replace(/\s/g, '').slice(-4);
        
        // Parse expiry date (MM/YY format)
        const [expiryMonth, expiryYear] = cardExpiry.split('/');
        
        paymentMethodData = {
          ...paymentMethodData,
          cardBrand: getCardBrand(cardNumber),
          last4,
          expiryMonth,
          expiryYear: `20${expiryYear}`, // Assuming 2-digit year
          holderName: cardHolderName,
        };
      } else if (methodType === 'bank_account') {
        // Mask account number, keeping only last 4 digits
        const last4 = accountNumber.slice(-4);
        
        paymentMethodData = {
          ...paymentMethodData,
          bankName,
          accountLast4: last4,
          holderName: accountHolderName,
        };
      }
      
      // Save the payment method
      const endpoint = token 
        ? `/public/contact/${token}/payment-methods`
        : `/api/contacts/${contactId}/payment-methods`;
      
      const response = await apiRequest('POST', endpoint, {
        paymentMethod: paymentMethodData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Payment Method Added',
          description: 'Your payment method has been saved successfully.',
        });
        
        // Close dialog and reset form
        setIsAddDialogOpen(false);
        resetForm();
        
        // Refresh payment methods list
        onUpdate();
      } else {
        throw new Error(result.message || 'Failed to save payment method');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a payment method
  const handleDeletePaymentMethod = async () => {
    if (!selectedMethod) return;
    
    setIsSubmitting(true);
    
    try {
      const endpoint = token 
        ? `/public/contact/${token}/payment-methods/${selectedMethod.id}`
        : `/api/contacts/${contactId}/payment-methods/${selectedMethod.id}`;
      
      const response = await apiRequest('DELETE', endpoint);
      
      if (response.ok) {
        toast({
          title: 'Payment Method Deleted',
          description: 'Your payment method has been removed successfully.',
        });
        
        // Close dialog
        setIsDeleteDialogOpen(false);
        setSelectedMethod(null);
        
        // Refresh payment methods list
        onUpdate();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete payment method');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment method. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setMethodType('card');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardHolderName('');
    setBankName('');
    setAccountNumber('');
    setRoutingNumber('');
    setAccountHolderName('');
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format card expiry date (MM/YY)
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  // Determine card brand from number
  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s+/g, '');
    
    // Very basic detection - in a real app, use a proper library
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    
    return 'Unknown';
  };

  // Render card icon based on brand
  const renderCardIcon = (brand?: string) => {
    // In a real app, you would use actual card brand logos
    return <CreditCard className="h-4 w-4 mr-2" />;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your saved payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No payment methods saved yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    {method.type === 'card' ? (
                      <>
                        {renderCardIcon(method.cardBrand)}
                        <div>
                          <p className="font-medium">
                            {method.cardBrand || 'Card'} •••• {method.last4}
                          </p>
                          {method.expiryMonth && method.expiryYear && (
                            <p className="text-sm text-muted-foreground">
                              Expires {method.expiryMonth}/{method.expiryYear.substring(2)}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">
                            {method.bankName} •••• {method.accountLast4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Bank Account
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedMethod(method);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </CardFooter>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method to your account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="methodType">Payment Method Type</Label>
              <Select
                value={methodType}
                onValueChange={setMethodType}
              >
                <SelectTrigger id="methodType">
                  <SelectValue placeholder="Select payment method type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {methodType === 'card' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19} // 16 digits + 3 spaces
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Expiry Date</Label>
                    <Input
                      id="cardExpiry"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5} // MM/YY format
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardCvc">CVC</Label>
                    <Input
                      id="cardCvc"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      maxLength={4} // 3-4 digits
                      type="password"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardHolderName">Cardholder Name</Label>
                  <Input
                    id="cardHolderName"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank of America"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456789"
                    type="password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </>
            )}
            
            <div className="bg-muted/50 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>This is a demo implementation. In a production environment:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Never store full card numbers or bank details</li>
                  <li>Use a secure payment gateway's SDK for tokenization</li>
                  <li>Implement proper PCI compliance measures</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPaymentMethod} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMethod && (
            <div className="py-4">
              <div className="flex items-center p-3 border rounded-md">
                {selectedMethod.type === 'card' ? (
                  <>
                    {renderCardIcon(selectedMethod.cardBrand)}
                    <div>
                      <p className="font-medium">
                        {selectedMethod.cardBrand || 'Card'} •••• {selectedMethod.last4}
                      </p>
                      {selectedMethod.expiryMonth && selectedMethod.expiryYear && (
                        <p className="text-sm text-muted-foreground">
                          Expires {selectedMethod.expiryMonth}/{selectedMethod.expiryYear.substring(2)}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    <div>
                      <p className="font-medium">
                        {selectedMethod.bankName} •••• {selectedMethod.accountLast4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bank Account
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePaymentMethod}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}