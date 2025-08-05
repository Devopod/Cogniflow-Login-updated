import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Truck,
  Building2
} from "lucide-react";
import { 
  usePurchaseDashboard, 
  usePurchaseRealtime, 
  useSuppliers, 
  usePurchaseRequests, 
  usePurchaseOrders 
} from "@/hooks/use-purchase";
import { formatCurrency } from "@/lib/utils";
import SuppliersTab from "./SuppliersTab";
import PurchaseRequestsTab from "./PurchaseRequestsTab";
import PurchaseOrdersTab from "./PurchaseOrdersTab";
import PurchaseAnalytics from "./PurchaseAnalytics";

export default function PurchaseManagement() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: dashboard, isLoading: dashboardLoading } = usePurchaseDashboard();
  const { isConnected } = usePurchaseRealtime(); // Initialize real-time updates
  
  // Determine current view based on URL
  const getCurrentView = () => {
    if (location === "/purchase/orders") return "orders";
    if (location === "/purchase/requests") return "requests";
    if (location === "/purchase/suppliers") return "suppliers";
    if (location === "/purchase/analytics") return "analytics";
    return "overview"; // default dashboard view
  };
  
  const currentView = getCurrentView();

  const dashboardCards = [
    {
      title: "Total Purchase Requests",
      value: dashboard?.totalPurchaseRequests || 0,
      description: `${dashboard?.pendingRequests || 0} pending approval`,
      icon: FileText,
      color: "blue",
      trend: "+12%"
    },
    {
      title: "Active Purchase Orders",
      value: dashboard?.totalPurchaseOrders || 0,
      description: `${dashboard?.pendingOrders || 0} pending delivery`,
      icon: ShoppingCart,
      color: "green",
      trend: "+8%"
    },
    {
      title: "Total Suppliers",
      value: dashboard?.totalSuppliers || 0,
      description: "Active supplier relationships",
      icon: Building2,
      color: "purple",
      trend: "+3%"
    },
    {
      title: "Total Spend (YTD)",
      value: formatCurrency(dashboard?.totalSpend || 0),
      description: `${formatCurrency(dashboard?.pendingAmount || 0)} pending`,
      icon: DollarSign,
      color: "orange",
      trend: "+15%"
    }
  ];

  const performanceMetrics = [
    {
      label: "On-Time Delivery Rate",
      value: `${dashboard?.onTimeDeliveryRate?.toFixed(1) || 0}%`,
      icon: Truck,
      color: dashboard?.onTimeDeliveryRate >= 90 ? "text-green-600" : "text-yellow-600"
    },
    {
      label: "Supplier Performance",
      value: `${dashboard?.supplierPerformance?.toFixed(1) || 0}%`,
      icon: Users,
      color: dashboard?.supplierPerformance >= 95 ? "text-green-600" : "text-blue-600"
    },
    {
      label: "Average Order Value",
      value: formatCurrency(dashboard?.avgOrderValue || 0),
      icon: Package,
      color: "text-purple-600"
    }
  ];

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time status and actions */}
      <div className="flex justify-end items-center gap-3">
        {/* Real-time connection indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Real-time updates active' : 'Disconnected'}
          </span>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Quick Actions
        </Button>
      </div>

      {/* Render content based on current view */}
      {currentView === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                      </div>
                      <div className={`p-3 rounded-full bg-${card.color}-100`}>
                        <Icon className={`h-6 w-6 text-${card.color}-600`} />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 font-medium">{card.trend}</span>
                      <span className="text-sm text-gray-500 ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-3 ${metric.color}`} />
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                    <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Purchase Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Purchase Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Office Supplies Request</p>
                      <p className="text-sm text-gray-600">IT Department • 2 hours ago</p>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Equipment Purchase</p>
                      <p className="text-sm text-gray-600">Operations • 5 hours ago</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Approved
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Marketing Materials</p>
                      <p className="text-sm text-gray-600">Marketing • 1 day ago</p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      In Review
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Recent Purchase Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">PO-2024-001</p>
                      <p className="text-sm text-gray-600">ABC Office Supplies • {formatCurrency(2500)}</p>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Sent to Supplier
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">PO-2024-002</p>
                      <p className="text-sm text-gray-600">Tech Equipment Co. • {formatCurrency(15000)}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Delivered
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">PO-2024-003</p>
                      <p className="text-sm text-gray-600">Global Manufacturing • {formatCurrency(8750)}</p>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pending Delivery
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Suppliers View */}
      {currentView === "suppliers" && <SuppliersTab />}

      {/* Purchase Requests View */}
      {currentView === "requests" && <PurchaseRequestsTab />}

      {/* Purchase Orders View */}
      {currentView === "orders" && <PurchaseOrdersTab />}

      {/* Analytics View */}
      {currentView === "analytics" && <PurchaseAnalytics />}
    </div>
  );
}