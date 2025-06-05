import { useState } from "react";
import apiRequest from "@/lib/axios";

export function useAIInvoiceAssistant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDescription(invoiceId: number, notes: string): Promise<string> {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest.post(`/api/invoices/${invoiceId}/ai/generate-description`, { notes });
      setLoading(false);
      return response.data.description;
    } catch (err: any) {
      setError(err.message || "Failed to generate description");
      setLoading(false);
      throw err;
    }
  }

  async function suggestPricing(invoiceId: number, productName: string, currentPrice: number): Promise<string> {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest.post(`/api/invoices/${invoiceId}/ai/suggest-pricing`, { productName, currentPrice });
      setLoading(false);
      return response.data.suggestion;
    } catch (err: any) {
      setError(err.message || "Failed to get pricing suggestion");
      setLoading(false);
      throw err;
    }
  }

  async function predictPaymentDelay(invoiceId: number, clientName: string, paymentHistorySummary: string): Promise<string> {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest.post(`/api/invoices/${invoiceId}/ai/predict-payment-delay`, { clientName, paymentHistorySummary });
      setLoading(false);
      return response.data.prediction;
    } catch (err: any) {
      setError(err.message || "Failed to predict payment delay");
      setLoading(false);
      throw err;
    }
  }

  async function categorizeExpenses(invoiceId: number, expenseList: string): Promise<string> {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest.post(`/api/invoices/${invoiceId}/ai/categorize-expenses`, { expenseList });
      setLoading(false);
      return response.data.categories;
    } catch (err: any) {
      setError(err.message || "Failed to categorize expenses");
      setLoading(false);
      throw err;
    }
  }

  return {
    loading,
    error,
    generateDescription,
    suggestPricing,
    predictPaymentDelay,
    categorizeExpenses,
  };
}
