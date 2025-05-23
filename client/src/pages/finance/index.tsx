import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  FileText, 
  Filter, 
  Settings, 
  Plus,
  BarChart3,
  LineChart,
  Receipt
} from "lucide-react";
import ModuleLayout from "@/components/layout/ModuleLayout";
import FinanceOverview from "@/components/finance/FinanceOverview";
import InvoicesList from "@/components/finance/InvoicesList";

const FinanceManagement = () => {
  const [location] = useLocation();
  const [currentView, setCurrentView] = useState<string>("overview");
  
  // Setup effect to determine current view based on URL
  useEffect(() => {
    if (location === "/finance/invoices") {
      setCurrentView("invoices");
    } else if (location === "/finance/expenses") {
      setCurrentView("expenses");
    } else if (location === "/finance/accounts") {
      setCurrentView("accounts");
    } else if (location === "/finance/reports") {
      setCurrentView("reports");
    } else if (location === "/finance/taxes") {
      setCurrentView("taxes");
    } else {
      setCurrentView("overview");
    }
  }, [location]);

  // Define module navigation
  const moduleNavigation = [
    {
      title: "Overview",
      path: "/finance",
      isActive: (path: string) => path === "/finance",
    },
    {
      title: "Invoices",
      path: "/finance/invoices",
      isActive: (path: string) => path === "/finance/invoices" || path.startsWith("/finance/invoices/"),
    },
    {
      title: "Expenses",
      path: "/finance/expenses",
      isActive: (path: string) => path === "/finance/expenses" || path.startsWith("/finance/expenses/"),
    },
    {
      title: "Chart of Accounts",
      path: "/finance/accounts",
      isActive: (path: string) => path === "/finance/accounts" || path.startsWith("/finance/accounts/"),
    },
    {
      title: "Financial Reports",
      path: "/finance/reports",
      isActive: (path: string) => path === "/finance/reports" || path.startsWith("/finance/reports/"),
    },
    {
      title: "Taxes",
      path: "/finance/taxes",
      isActive: (path: string) => path === "/finance/taxes" || path.startsWith("/finance/taxes/"),
    },
  ];

  // Module actions buttons
  const moduleActions = (
    <>
      <Button variant="outline" size="sm">
        <FileDown className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Transaction
      </Button>
    </>
  );

  return (
    <ModuleLayout
      title="Financial Management"
      description="Manage your organization's finances with powerful tools and insights"
      navigation={moduleNavigation}
      actions={moduleActions}
    >
      {/* Display content based on current view */}
      {currentView === "overview" && <FinanceOverview />}
      {currentView === "invoices" && <InvoicesList />}
      {currentView === "expenses" && (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 rounded-lg min-h-[60vh]">
          <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Expenses Management</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Track and manage all your business expenses, categorize spending, and generate expense reports.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Expense
          </Button>
        </div>
      )}
      {currentView === "accounts" && (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 rounded-lg min-h-[60vh]">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Chart of Accounts</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Organize your financial accounts in a structured hierarchy for effective financial management.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Account
          </Button>
        </div>
      )}
      {currentView === "reports" && (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 rounded-lg min-h-[60vh]">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Financial Reports</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Generate comprehensive financial reports including profit & loss, balance sheets, and cash flow statements.
          </p>
          <Button>
            <FileDown className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      )}
      {currentView === "taxes" && (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 rounded-lg min-h-[60vh]">
          <Settings className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Tax Management</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Track, calculate, and manage taxes for compliance with local regulations and reporting requirements.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Configure Tax Settings
          </Button>
        </div>
      )}
    </ModuleLayout>
  );
};

export default FinanceManagement;