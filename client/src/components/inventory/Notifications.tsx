import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  AlertTriangle,
  ArchiveRestore,
  Bell,
  BellOff,
  Box,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  HandCoins,
  History,
  Infinity,
  Info,
  ListFilter,
  LucideIcon,
  PackageOpen,
  Percent,
  RefreshCw,
  Truck,
  PackageCheck,
  User,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "stock" | "order" | "delivery" | "system" | "expiry";
  priority: "low" | "medium" | "high" | "critical";
  status: "unread" | "read" | "dismissed";
  timestamp: string;
  actionRequired?: boolean;
  actionText?: string;
  actionLink?: string;
  relatedItemId?: number;
  relatedItemName?: string;
}

// Sample data for notifications
const sampleNotifications: Notification[] = [
  {
    id: 1,
    title: "Low Stock Alert",
    message: "HP LaserJet Pro Printer (SKU: PRINT-HP-002) has reached its reorder level. Current stock: 3 units.",
    type: "stock",
    priority: "high",
    status: "unread",
    timestamp: "2023-05-07T08:30:00Z",
    actionRequired: true,
    actionText: "Create Purchase Order",
    actionLink: "/inventory/purchase-orders/new",
    relatedItemId: 3,
    relatedItemName: "HP LaserJet Pro Printer"
  },
  {
    id: 2,
    title: "Stock-Out Alert",
    message: "A4 Paper 500 Sheets (SKU: PAPER-A4-500) is out of stock. This item appears in 3 pending orders.",
    type: "stock",
    priority: "critical",
    status: "unread",
    timestamp: "2023-05-07T09:15:00Z",
    actionRequired: true,
    actionText: "Create Emergency Order",
    actionLink: "/inventory/purchase-orders/new?priority=high",
    relatedItemId: 7,
    relatedItemName: "A4 Paper 500 Sheets"
  },
  {
    id: 3,
    title: "Purchase Order Received",
    message: "Purchase Order PO-2023-042 has been received. 15 items need to be processed and added to inventory.",
    type: "order",
    priority: "medium",
    status: "unread",
    timestamp: "2023-05-06T14:22:00Z",
    actionRequired: true,
    actionText: "Process GRN",
    actionLink: "/inventory/grn/new?po=PO-2023-042"
  },
  {
    id: 4,
    title: "Inventory Count Discrepancy",
    message: "Physical count for 24-inch LED Monitor (SKU: MONITOR-24) shows 6 units, but system records 9 units.",
    type: "stock",
    priority: "medium",
    status: "read",
    timestamp: "2023-05-05T16:48:00Z",
    actionRequired: true,
    actionText: "Adjust Inventory",
    actionLink: "/inventory/stock/adjust",
    relatedItemId: 10,
    relatedItemName: "24-inch LED Monitor"
  },
  {
    id: 5,
    title: "New Delivery Ready",
    message: "Order #10428 for ABC Corporation is packed and ready for delivery. Delivery Note: GDN-2023-018.",
    type: "delivery",
    priority: "medium",
    status: "read",
    timestamp: "2023-05-05T11:20:00Z",
    actionRequired: false,
    actionText: "View Delivery Note",
    actionLink: "/inventory/gdn/GDN-2023-018"
  },
  {
    id: 6,
    title: "Expiry Date Alert",
    message: "5 items in your inventory will expire within 30 days. Review needed to prevent wastage.",
    type: "expiry",
    priority: "high",
    status: "read",
    timestamp: "2023-05-04T09:10:00Z",
    actionRequired: true,
    actionText: "View Expiring Items",
    actionLink: "/inventory/stock/expiring"
  },
  {
    id: 7,
    title: "Inventory Optimization Suggestion",
    message: "10 items have had no movement for over 90 days. Consider running a promotion or relocating these items.",
    type: "system",
    priority: "low",
    status: "dismissed",
    timestamp: "2023-05-03T13:45:00Z",
    actionRequired: false,
    actionText: "View Slow-Moving Items",
    actionLink: "/inventory/stock/slow-moving"
  },
  {
    id: 8,
    title: "Warehouse Transfer Completed",
    message: "Stock transfer #ST-2023-042 from Warehouse A to Warehouse B has been completed. 25 items transferred.",
    type: "system",
    priority: "low",
    status: "dismissed",
    timestamp: "2023-05-02T15:30:00Z",
    actionRequired: false,
    actionText: "View Transfer Details",
    actionLink: "/inventory/transfers/ST-2023-042"
  },
  {
    id: 9,
    title: "Supplier Shipment Delay",
    message: "Shipment for PO-2023-038 from XYZ Ltd has been delayed by 5 days. New estimated arrival: May 12.",
    type: "order",
    priority: "high",
    status: "unread",
    timestamp: "2023-05-07T10:05:00Z",
    actionRequired: true,
    actionText: "Contact Supplier",
    actionLink: "/suppliers/detail/2"
  },
  {
    id: 10,
    title: "Automatic Stock Adjustment",
    message: "System performed automatic stock adjustment for 3 items based on cycle count results.",
    type: "system",
    priority: "low",
    status: "read",
    timestamp: "2023-05-04T16:20:00Z",
    actionRequired: false,
    actionText: "View Adjustment Details",
    actionLink: "/inventory/stock/adjustments"
  }
];

// Constants for notification appearance
const getNotificationIcon = (type: string): LucideIcon => {
  switch (type) {
    case "stock":
      return Box;
    case "order":
      return PackageCheck;
    case "delivery":
      return Truck;
    case "expiry":
      return Calendar;
    case "system":
      return RefreshCw;
    default:
      return Info;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "low":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">Low</Badge>;
    case "medium":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-200">Medium</Badge>;
    case "high":
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-200">High</Badge>;
    case "critical":
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-200">Critical</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "unread":
      return <div className="h-2 w-2 rounded-full bg-primary"></div>;
    case "read":
      return <div className="h-2 w-2 rounded-full bg-muted"></div>;
    case "dismissed":
      return <div className="h-2 w-2 rounded-full bg-gray-300"></div>;
    default:
      return null;
  }
};

// Format date relative to now
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffDays > 0) {
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return "Just now";
  }
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "archived">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enablePushNotifications: true,
    lowStockAlerts: true,
    purchaseOrderUpdates: true,
    deliveryAlerts: true,
    expiryReminders: true,
    systemUpdates: false,
    digestFrequency: "daily"
  });
  
  // Filter notifications based on active tab and filters
  const filteredNotifications = notifications.filter(notification => {
    // Filter by tab
    if (activeTab === "unread" && notification.status !== "unread") return false;
    if (activeTab === "archived" && notification.status !== "dismissed") return false;
    
    // Filter by priority and type
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority;
    const matchesType = filterType === "all" || notification.type === filterType;
    
    return matchesPriority && matchesType;
  });
  
  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, status: notification.status === "unread" ? "read" : notification.status }
          : notification
      )
    );
  };
  
  // Mark notification as dismissed/archived
  const dismissNotification = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, status: "dismissed" }
          : notification
      )
    );
  };
  
  // Restore notification from archived
  const restoreNotification = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, status: "read" }
          : notification
      )
    );
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.status === "unread"
          ? { ...notification, status: "read" }
          : notification
      )
    );
  };
  
  // View notification details
  const viewNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetails(true);
    markAsRead(notification.id);
  };
  
  // Update notification settings
  const updateNotificationSetting = (setting: string, value: boolean | string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Get unread count
  const unreadCount = notifications.filter(n => n.status === "unread").length;
  
  // Get counts by priority
  const criticalCount = notifications.filter(n => n.priority === "critical" && n.status !== "dismissed").length;
  const highCount = notifications.filter(n => n.priority === "high" && n.status !== "dismissed").length;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Notifications</h2>
          <p className="text-muted-foreground">
            Manage alerts and notifications for your inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogDescription>
                  Configure how you receive inventory notifications and alerts
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Delivery</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <span className="text-xs text-muted-foreground">
                        Receive notifications via email
                      </span>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={notificationSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting("enableEmailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <span className="text-xs text-muted-foreground">
                        Receive notifications in-app and on mobile
                      </span>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={notificationSettings.enablePushNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting("enablePushNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="digest-frequency">Digest Frequency</Label>
                      <span className="text-xs text-muted-foreground">
                        How often to send notification digests
                      </span>
                    </div>
                    <Select 
                      value={notificationSettings.digestFrequency}
                      onValueChange={(value) => updateNotificationSetting("digestFrequency", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="low-stock-alerts" className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-blue-500" />
                        Low Stock Alerts
                      </Label>
                      <Switch 
                        id="low-stock-alerts" 
                        checked={notificationSettings.lowStockAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting("lowStockAlerts", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="po-updates" className="flex items-center gap-2">
                        <PackageCheck className="h-4 w-4 text-purple-500" />
                        Purchase Order Updates
                      </Label>
                      <Switch 
                        id="po-updates" 
                        checked={notificationSettings.purchaseOrderUpdates}
                        onCheckedChange={(checked) => updateNotificationSetting("purchaseOrderUpdates", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="delivery-alerts" className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-green-500" />
                        Delivery Alerts
                      </Label>
                      <Switch 
                        id="delivery-alerts" 
                        checked={notificationSettings.deliveryAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting("deliveryAlerts", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expiry-reminders" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        Expiry Date Reminders
                      </Label>
                      <Switch 
                        id="expiry-reminders" 
                        checked={notificationSettings.expiryReminders}
                        onCheckedChange={(checked) => updateNotificationSetting("expiryReminders", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-updates" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                        System Updates
                      </Label>
                      <Switch 
                        id="system-updates" 
                        checked={notificationSettings.systemUpdates}
                        onCheckedChange={(checked) => updateNotificationSetting("systemUpdates", checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowSettings(false)}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Notifications</p>
                <h2 className="text-3xl font-bold">{notifications.length}</h2>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <Bell className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {unreadCount} unread notifications
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Critical Alerts</p>
                <h2 className="text-3xl font-bold">{criticalCount}</h2>
              </div>
              <div className="bg-red-500/10 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-red-500">
              Requires immediate attention
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">High Priority</p>
                <h2 className="text-3xl font-bold">{highCount}</h2>
              </div>
              <div className="bg-orange-500/10 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-orange-500">
              Needs attention soon
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Read Rate</p>
                <h2 className="text-3xl font-bold">
                  {notifications.length === 0 
                    ? "0%" 
                    : `${Math.round((notifications.filter(n => n.status !== "unread").length / notifications.length) * 100)}%`}
                </h2>
              </div>
              <div className="bg-green-500/10 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Notification engagement
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <CardTitle>Notification Center</CardTitle>
              <CardDescription>
                View and manage inventory-related notifications
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={filterPriority}
                onValueChange={setFilterPriority}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="expiry">Expiry</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "all" | "unread" | "archived")}
          className="w-full"
        >
          <CardContent className="pb-0">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="all" className="flex gap-1 items-center">
                <Infinity className="h-4 w-4 mr-1" />
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex gap-1 items-center">
                <Bell className="h-4 w-4 mr-1" />
                Unread
                {unreadCount > 0 && <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex gap-1 items-center">
                <BellOff className="h-4 w-4 mr-1" />
                Archived
              </TabsTrigger>
            </TabsList>
          </CardContent>
          
          <TabsContent value="all" className="pt-0">
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium">No notifications found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filterPriority !== "all" || filterType !== "all" 
                      ? "Try changing the filters to see more results" 
                      : "You don't have any notifications at the moment"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const NotificationIcon = getNotificationIcon(notification.type);
                    
                    return (
                      <div 
                        key={notification.id}
                        className={`p-4 border rounded-lg flex items-start gap-4 ${
                          notification.status === "unread" ? "bg-muted/50" : ""
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          notification.type === "stock" ? "bg-blue-500/10 text-blue-500" :
                          notification.type === "order" ? "bg-purple-500/10 text-purple-500" :
                          notification.type === "delivery" ? "bg-green-500/10 text-green-500" :
                          notification.type === "expiry" ? "bg-orange-500/10 text-orange-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          <NotificationIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="mr-1">
                              {getStatusIcon(notification.status)}
                            </div>
                            <h4 className="font-medium truncate">{notification.title}</h4>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(notification.timestamp)}
                            </span>
                            
                            {notification.actionRequired && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Action Required
                              </Badge>
                            )}
                            
                            {notification.actionText && (
                              <Button variant="link" size="sm" className="h-6 p-0 text-xs">
                                {notification.actionText}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewNotificationDetails(notification)}>
                                View Details
                              </DropdownMenuItem>
                              
                              {notification.status === "unread" && (
                                <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              
                              {notification.status !== "dismissed" ? (
                                <DropdownMenuItem onClick={() => dismissNotification(notification.id)}>
                                  Archive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => restoreNotification(notification.id)}>
                                  Restore
                                </DropdownMenuItem>
                              )}
                              
                              {notification.actionText && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-primary">
                                    {notification.actionText}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="unread" className="pt-0">
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have any unread notifications
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const NotificationIcon = getNotificationIcon(notification.type);
                    
                    return (
                      <div 
                        key={notification.id}
                        className="p-4 border rounded-lg flex items-start gap-4 bg-muted/50"
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          notification.type === "stock" ? "bg-blue-500/10 text-blue-500" :
                          notification.type === "order" ? "bg-purple-500/10 text-purple-500" :
                          notification.type === "delivery" ? "bg-green-500/10 text-green-500" :
                          notification.type === "expiry" ? "bg-orange-500/10 text-orange-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          <NotificationIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="mr-1">
                              <div className="h-2 w-2 rounded-full bg-primary"></div>
                            </div>
                            <h4 className="font-medium truncate">{notification.title}</h4>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(notification.timestamp)}
                            </span>
                            
                            {notification.actionRequired && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                Action Required
                              </Badge>
                            )}
                            
                            {notification.actionText && (
                              <Button variant="link" size="sm" className="h-6 p-0 text-xs">
                                {notification.actionText}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewNotificationDetails(notification)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                Mark as Read
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => dismissNotification(notification.id)}>
                                Archive
                              </DropdownMenuItem>
                              
                              {notification.actionText && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-primary">
                                    {notification.actionText}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="archived" className="pt-0">
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <ArchiveRestore className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium">No archived notifications</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have any archived notifications
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const NotificationIcon = getNotificationIcon(notification.type);
                    
                    return (
                      <div 
                        key={notification.id}
                        className="p-4 border rounded-lg flex items-start gap-4 opacity-70"
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          notification.type === "stock" ? "bg-blue-500/10 text-blue-500" :
                          notification.type === "order" ? "bg-purple-500/10 text-purple-500" :
                          notification.type === "delivery" ? "bg-green-500/10 text-green-500" :
                          notification.type === "expiry" ? "bg-orange-500/10 text-orange-500" :
                          "bg-gray-500/10 text-gray-500"
                        }`}>
                          <NotificationIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="mr-1">
                              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                            </div>
                            <h4 className="font-medium truncate">{notification.title}</h4>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewNotificationDetails(notification)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => restoreNotification(notification.id)}>
                                Restore
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="border-t p-4 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredNotifications.length} {activeTab === "all" ? "notifications" : activeTab === "unread" ? "unread notifications" : "archived notifications"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Clear All
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Notification Details Dialog */}
      <Dialog open={showNotificationDetails} onOpenChange={setShowNotificationDetails}>
        <DialogContent className="sm:max-w-[525px]">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    selectedNotification.type === "stock" ? "bg-blue-500/10 text-blue-500" :
                    selectedNotification.type === "order" ? "bg-purple-500/10 text-purple-500" :
                    selectedNotification.type === "delivery" ? "bg-green-500/10 text-green-500" :
                    selectedNotification.type === "expiry" ? "bg-orange-500/10 text-orange-500" :
                    "bg-gray-500/10 text-gray-500"
                  }`}>
                    {(() => {
                      const NotificationIcon = getNotificationIcon(selectedNotification.type);
                      return <NotificationIcon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{selectedNotification.title}</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">{formatDate(selectedNotification.timestamp)}</span>
                        {getPriorityBadge(selectedNotification.priority)}
                      </div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-4">
                <p className="text-sm">{selectedNotification.message}</p>
                
                {selectedNotification.relatedItemName && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <h4 className="text-sm font-medium mb-1">Related Item</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{selectedNotification.relatedItemName}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        View Item
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedNotification.actionRequired && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Required Action</h4>
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                      <p className="text-sm">{selectedNotification.actionText}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="gap-2">
                {selectedNotification.actionText && (
                  <Button>
                    {selectedNotification.actionText}
                  </Button>
                )}
                
                {selectedNotification.status !== "dismissed" ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      dismissNotification(selectedNotification.id);
                      setShowNotificationDetails(false);
                    }}
                  >
                    Archive
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      restoreNotification(selectedNotification.id);
                      setShowNotificationDetails(false);
                    }}
                  >
                    Restore
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  onClick={() => setShowNotificationDetails(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;