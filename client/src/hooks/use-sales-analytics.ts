import { useMemo } from 'react';
import { Order, Quotation } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface SalesAnalytics {
  totalSales: number;
  averageOrderValue: number;
  salesByCategory: Record<string, number>;
  salesByDate: Record<string, number>;
  recentOrders: Order[];
  topCustomers: { contactId: number | null; total: number }[];
}

export interface QuotationAnalytics {
  totalQuotationValue: number;
  quotationsByCategory: Record<string, number>;
  quotationsByDate: Record<string, number>;
}

export function useSalesAnalytics(orders: Order[] | undefined): SalesAnalytics {
  return useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalSales: 0,
        averageOrderValue: 0,
        salesByCategory: {},
        salesByDate: {},
        recentOrders: [],
        topCustomers: []
      };
    }

    // Calculate total sales
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate average order value
    const averageOrderValue = totalSales / orders.length;

    // Group sales by category
    const salesByCategory = orders.reduce((acc, order) => {
      const category = order.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Group sales by date
    const salesByDate = orders.reduce((acc, order) => {
      const date = new Date(order.orderDate).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Get recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);

    // Group orders by customer and calculate total
    const customerSales = orders.reduce((acc, order) => {
      const contactId = order.contactId;
      if (!acc[contactId]) {
        acc[contactId] = 0;
      }
      acc[contactId] += order.totalAmount;
      return acc;
    }, {} as Record<number | null, number>);

    // Get top customers
    const topCustomers = Object.entries(customerSales)
      .map(([contactId, total]) => ({
        contactId: contactId === 'null' ? null : Number(contactId),
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalSales,
      averageOrderValue,
      salesByCategory,
      salesByDate,
      recentOrders,
      topCustomers
    };
  }, [orders]);
}

export function useQuotationAnalytics(quotations: Quotation[] | undefined): QuotationAnalytics {
  return useMemo(() => {
    if (!quotations || quotations.length === 0) {
      return {
        totalQuotationValue: 0,
        quotationsByCategory: {},
        quotationsByDate: {}
      };
    }

    // Calculate total quotation value
    const totalQuotationValue = quotations.reduce((sum, quotation) => sum + quotation.totalAmount, 0);

    // Group quotations by category
    const quotationsByCategory = quotations.reduce((acc, quotation) => {
      const category = quotation.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + quotation.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Group quotations by date
    const quotationsByDate = quotations.reduce((acc, quotation) => {
      const date = new Date(quotation.issueDate).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + quotation.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQuotationValue,
      quotationsByCategory,
      quotationsByDate
    };
  }, [quotations]);
}