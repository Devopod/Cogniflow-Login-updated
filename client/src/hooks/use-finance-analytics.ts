import { useMemo } from 'react';
import { Invoice } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface FinanceAnalytics {
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  invoicesByStatus: Record<string, number>;
  invoicesByMonth: Record<string, number>;
  recentInvoices: Invoice[];
  topCustomers: { contactId: number | null; total: number }[];
  monthlyFinancialData: Array<{ month: string; revenue: number; expenses: number }>;
}

export function useFinanceAnalytics(invoices: Invoice[] | undefined): FinanceAnalytics {
  return useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        totalRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        invoicesByStatus: {},
        invoicesByMonth: {},
        recentInvoices: [],
        topCustomers: [],
        monthlyFinancialData: []
      };
    }

    // Calculate total revenue
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    // Calculate total paid amount
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
    
    // Calculate total outstanding amount
    const totalOutstanding = totalRevenue - totalPaid;

    // Group invoices by status
    const invoicesByStatus = invoices.reduce((acc, invoice) => {
      const status = invoice.status || 'unknown';
      acc[status] = (acc[status] || 0) + invoice.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Group invoices by month
    const invoicesByMonth = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.issueDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = (acc[month] || 0) + invoice.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Get recent invoices (last 5)
    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 5);

    // Group invoices by customer and calculate total
    const customerInvoices = invoices.reduce((acc, invoice) => {
      const contactId = invoice.contactId;
      if (!acc[contactId]) {
        acc[contactId] = 0;
      }
      acc[contactId] += invoice.totalAmount;
      return acc;
    }, {} as Record<number | null, number>);

    // Get top customers
    const topCustomers = Object.entries(customerInvoices)
      .map(([contactId, total]) => ({
        contactId: contactId === 'null' ? null : Number(contactId),
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Generate monthly financial data for the last 6 months
    const monthlyFinancialData = generateMonthlyFinancialData(invoices);

    return {
      totalRevenue,
      totalPaid,
      totalOutstanding,
      invoicesByStatus,
      invoicesByMonth,
      recentInvoices,
      topCustomers,
      monthlyFinancialData
    };
  }, [invoices]);
}

// Helper function to generate monthly financial data
function generateMonthlyFinancialData(invoices: Invoice[]): Array<{ month: string; revenue: number; expenses: number }> {
  const today = new Date();
  const months = [];
  
  // Generate the last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    months.push({
      month: monthName,
      monthKey,
      revenue: 0,
      expenses: 0
    });
  }
  
  // Calculate revenue for each month
  invoices.forEach(invoice => {
    const date = new Date(invoice.issueDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const monthIndex = months.findIndex(m => m.monthKey === monthKey);
    if (monthIndex !== -1) {
      months[monthIndex].revenue += invoice.totalAmount;
      
      // For this example, we'll estimate expenses as 60-80% of revenue
      // In a real app, you would get this from actual expense data
      const expenseRatio = 0.6 + (Math.random() * 0.2); // Random between 60-80%
      months[monthIndex].expenses += invoice.totalAmount * expenseRatio;
    }
  });
  
  // Format and return the data without the monthKey
  return months.map(({ month, revenue, expenses }) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
    expenses: Math.round(expenses * 100) / 100
  }));
}