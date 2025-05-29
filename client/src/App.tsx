import React, { Suspense, lazy, Component } from "react";
import { Switch, Route } from "wouter";
import NewInvoicePage from "@/pages/finance/invoices/new";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard";
import CompanyRegistrationPage from "@/pages/company-registration";
import CRMPage from "@/pages/crm";
import SalesManagement from "@/pages/sales";
import QuotationsPage from "@/pages/sales/quotations";
import InventoryManagement from "@/pages/inventory";
import FinanceManagement from "@/pages/finance";
import HRManagement from "@/pages/hrms";
import SupplierManagement from "@/pages/suppliers";
import PaymentsManagement from "@/pages/payments";
import ReportsManagement from "@/pages/reports";
import PurchaseManagement from "@/pages/purchase";
import { PublicInvoiceView } from "@/pages/public/invoice-view";
import { PaymentSuccessPage } from "@/pages/payment/success";
import { PaymentCancelPage } from "@/pages/payment/cancel";
import TestPage from "@/pages/test-page";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";

// Error Boundary Component
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error Loading Page</h2>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  const InvoiceDetail = lazy(() => import("@/pages/finance/invoices/[id]").catch(() => {
    console.error("Failed to load InvoiceDetailPage");
    return { default: () => <div>Error loading invoice details</div> };
  }));

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/home" component={HomePage} />
      
      {/* Public Invoice View */}
      <Route path="/public/invoices/:token" component={PublicInvoiceView} />
      
      {/* Payment Result Pages */}
      <Route path="/payment/success" component={PaymentSuccessPage} />
      <Route path="/payment/cancel" component={PaymentCancelPage} />
      
      {/* Company Registration */}
      <ProtectedRoute path="/company-registration" component={CompanyRegistrationPage} />
      
      {/* Protected Routes - ERP Modules */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      
      {/* CRM Module */}
      <ProtectedRoute path="/crm" component={CRMPage} />
      <ProtectedRoute path="/crm/contacts" component={CRMPage} />
      <ProtectedRoute path="/crm/deals" component={CRMPage} />
      <ProtectedRoute path="/crm/activities" component={CRMPage} />
      <ProtectedRoute path="/crm/calls" component={CRMPage} />
      <ProtectedRoute path="/crm/companies" component={CRMPage} />
      
      {/* Sales Module */}
      <ProtectedRoute path="/sales" component={SalesManagement} />
      <ProtectedRoute path="/sales/deals" component={SalesManagement} />
      <ProtectedRoute path="/sales/forecasting" component={SalesManagement} />
      <ProtectedRoute path="/sales/analytics" component={SalesManagement} />
      <ProtectedRoute path="/sales/team" component={SalesManagement} />
      <ProtectedRoute path="/sales/quotations" component={QuotationsPage} />
      
      {/* Inventory Module */}
      <ProtectedRoute path="/inventory" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/products" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/stock" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/purchase-orders" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/warehouses" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/transfers" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/grn" component={InventoryManagement} />
      <ProtectedRoute path="/inventory/gdn" component={InventoryManagement} />
      
      {/* HR Module */}
      <ProtectedRoute path="/hrms" component={HRManagement} />
      <ProtectedRoute path="/hrms/employees" component={HRManagement} />
      <ProtectedRoute path="/hrms/attendance" component={HRManagement} />
      <ProtectedRoute path="/hrms/leave" component={HRManagement} />
      <ProtectedRoute path="/hrms/payroll" component={HRManagement} />
      <ProtectedRoute path="/hrms/recruitment" component={HRManagement} />
      <ProtectedRoute path="/hrms/performance" component={HRManagement} />
      
      {/* Finance Module */}
      <ProtectedRoute path="/finance" component={FinanceManagement} />
      <ProtectedRoute path="/finance/transactions" component={FinanceManagement} />
      <ProtectedRoute path="/finance/invoices" component={FinanceManagement} />
      <ProtectedRoute path="/finance/invoices/new" component={NewInvoicePage} />
      <ProtectedRoute 
        path="/finance/invoices/:id" 
        component={() => (
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <InvoiceDetail />
            </Suspense>
          </ErrorBoundary>
        )} 
      />
      <ProtectedRoute path="/finance/expenses" component={FinanceManagement} />
      <ProtectedRoute path="/finance/accounts" component={FinanceManagement} />
      <ProtectedRoute path="/finance/reports" component={FinanceManagement} />
      <ProtectedRoute path="/finance/taxes" component={FinanceManagement} />
      
      {/* Supplier Module */}
      <ProtectedRoute path="/suppliers" component={SupplierManagement} />
      <ProtectedRoute path="/suppliers/suppliers" component={SupplierManagement} />
      <ProtectedRoute path="/suppliers/orders" component={SupplierManagement} />
      <ProtectedRoute path="/suppliers/performance" component={SupplierManagement} />
      <ProtectedRoute path="/suppliers/contracts" component={SupplierManagement} />
      <ProtectedRoute path="/suppliers/catalogs" component={SupplierManagement} />
      
      {/* Purchase Module */}
      <ProtectedRoute path="/purchase" component={PurchaseManagement} />
      <ProtectedRoute path="/purchase/orders" component={PurchaseManagement} />
      <ProtectedRoute path="/purchase/requisitions" component={PurchaseManagement} />
      <ProtectedRoute path="/purchase/suppliers" component={PurchaseManagement} />
      <ProtectedRoute path="/purchase/reports" component={PurchaseManagement} />
      
      {/* Payments Module */}
      <ProtectedRoute path="/payments" component={PaymentsManagement} />
      <ProtectedRoute path="/payments/transactions" component={PaymentsManagement} />
      <ProtectedRoute path="/payments/mpesa" component={PaymentsManagement} />
      <ProtectedRoute path="/payments/stripe" component={PaymentsManagement} />
      <ProtectedRoute path="/payments/razorpay" component={PaymentsManagement} />
      <ProtectedRoute path="/payments/settings" component={PaymentsManagement} />
      
      {/* Reports Module */}
      <ProtectedRoute path="/reports" component={ReportsManagement} />
      <ProtectedRoute path="/reports/reports" component={ReportsManagement} />
      <ProtectedRoute path="/reports/templates" component={ReportsManagement} />
      <ProtectedRoute path="/reports/scheduled" component={ReportsManagement} />
      <ProtectedRoute path="/reports/dashboards" component={ReportsManagement} />
      <ProtectedRoute path="/reports/analytics" component={ReportsManagement} />
      
      {/* Settings & Support */}
      <ProtectedRoute path="/settings" component={() => <div>Settings Coming Soon</div>} />
      <ProtectedRoute path="/support" component={() => <div>Support Coming Soon</div>} />
      
      {/* Test Page */}
      <ProtectedRoute path="/test" component={TestPage} />
      
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="cogniflow-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <ErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
                <Router />
              </Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;