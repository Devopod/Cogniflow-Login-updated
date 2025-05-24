import { Switch, Route, Redirect } from "wouter";
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
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/home" component={HomePage} />
      
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
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
