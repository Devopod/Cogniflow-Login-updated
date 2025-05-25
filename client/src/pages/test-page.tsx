import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPage() {
  const [testData, setTestData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [quotationsData, setQuotationsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/test');
      console.log('Test response:', response.data);
      setTestData(response.data);
    } catch (err: any) {
      console.error('Error fetching test data:', err);
      setError(err.message || 'Failed to fetch test data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/orders');
      console.log('Orders response:', response.data);
      setOrdersData(response.data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/quotations');
      console.log('Quotations response:', response.data);
      setQuotationsData(response.data);
    } catch (err: any) {
      console.error('Error fetching quotations:', err);
      setError(err.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Test API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchTestData} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Test Data'}
            </Button>
            
            {testData && (
              <div className="mt-4">
                <pre className="bg-gray-100 p-4 rounded">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Orders API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchOrders} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Orders'}
            </Button>
            
            {ordersData && (
              <div className="mt-4">
                <pre className="bg-gray-100 p-4 rounded">
                  {JSON.stringify(ordersData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quotations API</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchQuotations} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Quotations'}
            </Button>
            
            {quotationsData && (
              <div className="mt-4">
                <pre className="bg-gray-100 p-4 rounded">
                  {JSON.stringify(quotationsData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}