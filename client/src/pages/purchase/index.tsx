import { Suspense, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, FileDown, Settings } from "lucide-react";
import ModuleLayout from "@/components/layout/ModuleLayout";
import PurchaseManagement from "@/components/purchase/PurchaseManagement";

export default function PurchasePage() {
  const [location] = useLocation();
  const [currentView, setCurrentView] = useState<string>("overview");
  
  // Setup effect to determine current view based on URL
  useEffect(() => {
    if (location === "/purchase/orders") {
      setCurrentView("orders");
    } else if (location === "/purchase/requests") {
      setCurrentView("requests");
    } else if (location === "/purchase/suppliers") {
      setCurrentView("suppliers");
    } else if (location === "/purchase/analytics") {
      setCurrentView("analytics");
    } else {
      setCurrentView("overview");
    }
  }, [location]);

  // Define module navigation
  const moduleNavigation = [
    {
      title: "Overview",
      path: "/purchase",
      isActive: (path: string) => path === "/purchase",
    },
    {
      title: "Purchase Orders",
      path: "/purchase/orders",
      isActive: (path: string) => path === "/purchase/orders" || path.startsWith("/purchase/orders/"),
    },
    {
      title: "Purchase Requests",
      path: "/purchase/requests",
      isActive: (path: string) => path === "/purchase/requests" || path.startsWith("/purchase/requests/"),
    },
    {
      title: "Suppliers",
      path: "/purchase/suppliers",
      isActive: (path: string) => path === "/purchase/suppliers" || path.startsWith("/purchase/suppliers/"),
    },
    {
      title: "Analytics",
      path: "/purchase/analytics",
      isActive: (path: string) => path === "/purchase/analytics" || path.startsWith("/purchase/analytics/"),
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
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Purchase Order
      </Button>
    </>
  );

  return (
    <ModuleLayout
      title="Purchase Management"
      description="Manage purchase orders, requests, suppliers, and procurement analytics"
      navigation={moduleNavigation}
      actions={moduleActions}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <PurchaseManagement />
      </Suspense>
    </ModuleLayout>
  );
}