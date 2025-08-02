import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useInventoryApi } from "@/hooks/use-api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ErpNavigation from "@/components/ErpNavigation";
import ProductCatalog from "@/components/inventory/ProductCatalog";
import PurchaseOrders from "@/components/inventory/PurchaseOrders";
import BillOfMaterials from "@/components/inventory/BillOfMaterials";
import GoodsReceiptNote from "@/components/inventory/GoodsReceiptNote";
import GoodsDeliveryNote from "@/components/inventory/GoodsDeliveryNote";
import ProductGroup from "@/components/inventory/ProductGroup";
import SetupMaster from "@/components/inventory/SetupMaster";
import BrandingMaster from "@/components/inventory/BrandingMaster";
import StockManagement from "@/components/inventory/StockManagement";
import TaskScheduler from "@/components/inventory/TaskScheduler";
import NotificationCenter from "@/components/inventory/Notifications";
import ReorderLevelManagement from "@/components/inventory/ReorderLevelManagement";
import {
  BarChart3,
  Box,
  Calendar,
  Clock,
  Cog,
  FileText,
  Filter,
  GitBranch,
  History,
  Package,
  PackageOpen,
  PlusSquare,
  RefreshCw,
  Settings,
  TrendingUp,
  Truck,
  Warehouse,
} from "lucide-react";

const InventoryManagement = () => {
  const [location, setLocation] = useLocation();
  
  // Get tab from URL or default to overview
  const getTabFromUrl = () => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get('tab');
    return tabParam || "overview";
  };
  
  const [currentTab, setCurrentTab] = useState(getTabFromUrl());
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'overview') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Use dynamic API data instead of mock data
  const { toast } = useToast();
  const inventoryApi = useInventoryApi();
  
  // Extract data from API hooks
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = inventoryApi.dashboard;
  
  // Use real data or show loading states
  const inventoryMetrics = Array.isArray(dashboardData) && dashboardData.length > 0 ? dashboardData[0] : null;

  return (
    <ErpNavigation>
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage your products, stock levels, and warehouse locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button variant="outline" size="sm">
              <Cog className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <PlusSquare className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Items</p>
                  <h2 className="text-3xl font-bold">{inventoryMetrics?.totalItems || 0}</h2>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Across {inventoryMetrics?.warehouseCount || 0} warehouses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Inventory Value</p>
                  <h2 className="text-3xl font-bold">${(inventoryMetrics?.totalValue || 0).toLocaleString()}</h2>
                </div>
                <div className="bg-green-500/10 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {((inventoryMetrics?.inventoryToSalesRatio || 0) * 100).toFixed(1)}% of total sales
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock Items</p>
                  <h2 className="text-3xl font-bold">{inventoryMetrics?.lowStockItems || 0}</h2>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-red-500">
                {inventoryMetrics?.expiringSoon || 0} items need attention
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Stock Turnover</p>
                  <h2 className="text-3xl font-bold">{inventoryMetrics?.stockTurnover || 0}x</h2>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {inventoryMetrics?.avgInventoryDays || 0} days avg. inventory
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Management Tabs */}
        <Tabs
          defaultValue="overview"
          className="w-full"
          value={currentTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
            <TabsTrigger value="stock">Stock Count</TabsTrigger>
            <TabsTrigger value="reorder" className="bg-amber-100 dark:bg-amber-900/30">Reorder Levels</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="analysis">Inventory Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Inventory Performance</CardTitle>
                      <CardDescription>Stock levels and turnover analytics</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Last 30 Days
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="font-medium">Inventory Value Trends</p>
                    <p className="text-sm text-muted-foreground mt-1">(Chart showing inventory value over time)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Health</CardTitle>
                  <CardDescription>Status of your current stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Healthy Stock</span>
                      <Badge className="bg-green-500/10 text-green-500">{(inventoryMetrics?.totalItems || 0) - (inventoryMetrics?.lowStockItems || 0) - (inventoryMetrics?.deadStock || 0)}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low Stock</span>
                      <Badge className="bg-amber-500/10 text-amber-500">{inventoryMetrics?.lowStockItems || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Out of Stock</span>
                      <Badge className="bg-red-500/10 text-red-500">7</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dead Stock (No movement)</span>
                      <Badge className="bg-slate-500/10 text-slate-500">{inventoryMetrics?.deadStock || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expiring Soon</span>
                      <Badge className="bg-purple-500/10 text-purple-500">{inventoryMetrics?.expiringSoon || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-sm font-medium">Overall Health</span>
                      <Badge className="bg-green-500 text-white">Good</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Movements</CardTitle>
                  <CardDescription>Latest inventory transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <PackageOpen className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Stock Adjustment</p>
                        <p className="text-xs text-muted-foreground">5 units added to Business Laptop Pro</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Today, 10:42 AM</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <Truck className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Purchase Order Received</p>
                        <p className="text-xs text-muted-foreground">PO-2023-042 - Multiple items</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Yesterday, 2:15 PM</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <GitBranch className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Stock Transfer</p>
                        <p className="text-xs text-muted-foreground">10 Safety Helmets from Warehouse C to B</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Yesterday, 11:30 AM</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <Box className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Sales Order Fulfilled</p>
                        <p className="text-xs text-muted-foreground">SO-2023-078 - Office Stationery Kit (3 units)</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">April 25, 2023</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Activities</CardTitle>
                  <CardDescription>Scheduled inventory events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Purchase Order Due</p>
                        <p className="text-xs text-muted-foreground">PO-2023-045 from TechSource Inc.</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Due in 2 days</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Inventory Count</p>
                        <p className="text-xs text-muted-foreground">Scheduled for Warehouse A</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">May 15, 2023</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-md">
                      <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Product Expiration</p>
                        <p className="text-xs text-muted-foreground">8 items expiring next month</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Review by May 20, 2023</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Utilization</CardTitle>
                  <CardDescription>Space and capacity analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Warehouse A</p>
                        <Badge className="bg-green-500/10 text-green-500">68% Full</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">142 items</span>
                        <span className="text-xs text-muted-foreground">Electronics</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Warehouse B</p>
                        <Badge className="bg-amber-500/10 text-amber-500">84% Full</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '84%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">86 items</span>
                        <span className="text-xs text-muted-foreground">Furniture</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Warehouse C</p>
                        <Badge className="bg-green-500/10 text-green-500">42% Full</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">52 items</span>
                        <span className="text-xs text-muted-foreground">Office Supplies</span>
                      </div>
                    </div>
                    <div className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Secure Warehouse</p>
                        <Badge className="bg-green-500/10 text-green-500">26% Full</Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '26%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">26 items</span>
                        <span className="text-xs text-muted-foreground">High Value</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>AI-Powered Inventory Insights</CardTitle>
                    <CardDescription>Machine learning recommendations for inventory optimization</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Insights
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                    <h3 className="text-lg font-medium">Demand Forecast</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Predictive analytics show a 14% increase in demand for electronics in the next quarter. Consider increasing stock of Business Laptop Pro and LaserJet Printer Pro.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View detailed forecast</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <RefreshCw className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                    <h3 className="text-lg font-medium">Stockout Prevention</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on historical data and lead times, 3 products are at risk of stockout in the next 30 days. Recommended to place purchase orders now.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View at-risk items</Button>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                    <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                    <h3 className="text-lg font-medium">Optimization Opportunities</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Identified $12,540 in potential inventory cost savings through better warehouse distribution and reduced overstocking of slow-moving items.
                    </p>
                    <Button variant="link" className="px-0 mt-2">View optimization plan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductCatalog />
          </TabsContent>

          {/* Warehouses Tab */}
          <TabsContent value="warehouses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Management</CardTitle>
                <CardDescription>
                  Manage warehouse locations and zones
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Warehouse className="h-16 w-16 text-primary/40" />
                <h3 className="text-xl font-semibold">Warehouse Management Module</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  This module is coming in the next implementation phase. You'll be able to set up and manage 
                  warehouses, zones, bins, and storage locations for your inventory.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Count Tab */}
          <TabsContent value="stock" className="space-y-6">
            <StockManagement />
          </TabsContent>

          {/* Reorder Levels Tab */}
          <TabsContent value="reorder" className="space-y-6">
            <ReorderLevelManagement />
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <PurchaseOrders />
          </TabsContent>

          {/* Inventory Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Analysis</CardTitle>
                <CardDescription>
                  Advanced analytics and insights for inventory optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stock Movement Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Stock movement trends</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ABC Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Product categorization</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Turnover Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] bg-muted/20 rounded-md flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Inventory turnover metrics</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm font-medium">Business Laptop Pro</span>
                          <Badge className="bg-green-500/10 text-green-500">High Turnover</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm font-medium">Office Chair Deluxe</span>
                          <Badge className="bg-green-500/10 text-green-500">High Turnover</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm font-medium">LaserJet Printer Pro</span>
                          <Badge className="bg-blue-500/10 text-blue-500">Medium Turnover</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Slow Moving Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm font-medium">Vintage Desk Lamp</span>
                          <Badge className="bg-red-500/10 text-red-500">Slow Moving</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm font-medium">Classic Bookshelf</span>
                          <Badge className="bg-amber-500/10 text-amber-500">Low Turnover</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm font-medium">Executive Pen Set</span>
                          <Badge className="bg-red-500/10 text-red-500">Dead Stock</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErpNavigation>
  );
};

export default InventoryManagement;
