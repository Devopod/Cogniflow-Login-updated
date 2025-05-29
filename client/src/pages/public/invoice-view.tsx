import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentGatewaySelector } from '@/components/payments/payment-gateway-selector';

export function PublicInvoiceView() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/public/invoices/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch invoice');
        }
        
        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching the invoice');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [token]);

  const handleDownloadPdf = () => {
    window.open(`/public/invoices/${token}/pdf`, '_blank');
  };

  const handlePaymentSuccess = () => {
    // Refresh the invoice data to show updated payment status
    setLoading(true);
    fetch(`/public/invoices/${token}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to refresh invoice');
        return response.json();
      })
      .then(data => {
        setInvoice(data);
        setShowPayment(false);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handlePaymentError = (error: any) => {
    setError('Payment failed: ' + (error.message || 'Unknown error'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading invoice...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested invoice could not be found or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice: invoiceData, payments, totalPaid, balanceDue, isPaid, isOverdue } = invoice;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoice #{invoiceData.invoice_number}</h1>
            <p className="text-muted-foreground">
              {formatDate(invoiceData.issue_date)}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <div className="flex space-x-2 mb-2">
              {isPaid ? (
                <Badge className="bg-green-500">Paid</Badge>
              ) : isOverdue ? (
                <Badge className="bg-red-500">Overdue</Badge>
              ) : (
                <Badge className="bg-amber-500">Pending</Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From (Company) */}
              <div>
                <h3 className="font-semibold mb-2">From</h3>
                <p>Your Company Name</p>
                <p>123 Business Street</p>
                <p>City, State ZIP</p>
                <p>accounts@yourcompany.com</p>
              </div>

              {/* To (Customer) */}
              <div>
                <h3 className="font-semibold mb-2">Bill To</h3>
                {invoiceData.contact && (
                  <>
                    {invoiceData.contact.company && <p>{invoiceData.contact.company}</p>}
                    <p>{invoiceData.contact.firstName} {invoiceData.contact.lastName}</p>
                    {invoiceData.contact.address && <p>{invoiceData.contact.address}</p>}
                    {invoiceData.contact.city && (
                      <p>
                        {invoiceData.contact.city}
                        {invoiceData.contact.state && `, ${invoiceData.contact.state}`}
                        {invoiceData.contact.postalCode && ` ${invoiceData.contact.postalCode}`}
                      </p>
                    )}
                    {invoiceData.contact.email && <p>{invoiceData.contact.email}</p>}
                  </>
                )}
              </div>

              {/* Invoice Info */}
              <div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Invoice Number:</span>
                  <span>{invoiceData.invoice_number}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Issue Date:</span>
                  <span>{formatDate(invoiceData.issue_date)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Due Date:</span>
                  <span>{formatDate(invoiceData.due_date)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Status:</span>
                  <span>
                    {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Amount Due:</span>
                  <span className={`font-semibold ${balanceDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(balanceDue, invoiceData.currency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceData.items && invoiceData.items.length > 0 ? (
                  invoiceData.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || 'Custom Item'}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price, invoiceData.currency)}</TableCell>
                      <TableCell className="text-right">{item.tax_rate}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total, invoiceData.currency)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No items found for this invoice.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Invoice Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoiceData.subtotal, invoiceData.currency)}</span>
                </div>
                {invoiceData.tax_amount > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoiceData.tax_amount, invoiceData.currency)}</span>
                  </div>
                )}
                {invoiceData.discount_amount > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoiceData.discount_amount, invoiceData.currency)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between py-1 font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoiceData.total_amount, invoiceData.currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(totalPaid, invoiceData.currency)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between py-1 font-bold">
                  <span>Balance Due:</span>
                  <span className={balanceDue > 0 ? 'text-red-500' : 'text-green-500'}>
                    {formatCurrency(balanceDue, invoiceData.currency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(payment.amount, invoiceData.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {invoiceData.notes && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{invoiceData.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        {invoiceData.terms && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{invoiceData.terms}</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Button */}
        {balanceDue > 0 && (
          <div className="mt-8 flex justify-center">
            {showPayment ? (
              <PaymentGatewaySelector
                invoiceId={invoiceData.id}
                invoiceNumber={invoiceData.invoice_number}
                amount={balanceDue * 100} // Convert to cents for payment processors
                currency={invoiceData.currency || 'USD'}
                customerName={invoiceData.contact ? `${invoiceData.contact.firstName} ${invoiceData.contact.lastName}` : undefined}
                customerEmail={invoiceData.contact?.email}
                tokenId={token}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            ) : (
              <Button size="lg" onClick={() => setShowPayment(true)}>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay Now {formatCurrency(balanceDue, invoiceData.currency)}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}