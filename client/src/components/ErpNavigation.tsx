import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import RealtimeNotifications from "./RealtimeNotifications";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  UserCircle,
  ClipboardList,
  Phone,
  Building2,
  TrendingUp,
  ShoppingCart,
  Briefcase,
  FileSpreadsheet,
  DollarSign,
  CreditCard as CardIcon,
  Truck,
  BarChart,
  Clock,
  Calendar,
  FileCheck,
  UserPlus,
  Wallet,
  Smartphone
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Define the navigation structure
const navigationItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: "/dashboard",
    isActive: (path: string) => path === "/dashboard"
  },
  {
    title: "Sales",
    icon: <DollarSign className="h-5 w-5" />,
    path: "/sales",
    isActive: (path: string) => path.startsWith("/sales"),
    subItems: [
      { title: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, path: "/sales" },
      { title: "Deals", icon: <Briefcase className="h-4 w-4" />, path: "/sales/deals" },
      { title: "Forecasting", icon: <TrendingUp className="h-4 w-4" />, path: "/sales/forecasting" },
      { title: "Analytics", icon: <BarChart className="h-4 w-4" />, path: "/sales/analytics" },
      { title: "Sales Team", icon: <Users className="h-4 w-4" />, path: "/sales/team" },
      { title: "Quotations", icon: <FileText className="h-4 w-4" />, path: "/sales/quotations" }
    ]
  },
  {
    title: "CRM",
    icon: <Users className="h-5 w-5" />,
    path: "/crm",
    isActive: (path: string) => path.startsWith("/crm"),
    subItems: [
      { title: "Contacts", icon: <UserCircle className="h-4 w-4" />, path: "/crm/contacts" },
      { title: "Deals", icon: <TrendingUp className="h-4 w-4" />, path: "/crm/deals" },
      { title: "Activities", icon: <ClipboardList className="h-4 w-4" />, path: "/crm/activities" },
      { title: "Phone Calls", icon: <Phone className="h-4 w-4" />, path: "/crm/calls" },
      { title: "Companies", icon: <Building2 className="h-4 w-4" />, path: "/crm/companies" }
    ]
  },
  {
    title: "Inventory",
    icon: <Package className="h-5 w-5" />,
    path: "/inventory",
    isActive: (path: string) => path.startsWith("/inventory"),
    subItems: [
      { title: "Products", icon: <ShoppingCart className="h-4 w-4" />, path: "/inventory?tab=products" },
      { title: "Warehouses", icon: <Building2 className="h-4 w-4" />, path: "/inventory?tab=warehouses" },
      { title: "Stock Count", icon: <ClipboardList className="h-4 w-4" />, path: "/inventory?tab=stock" },
      { title: "Reorder Levels", icon: <TrendingUp className="h-4 w-4" />, path: "/inventory?tab=reorder" },
      { title: "Purchase Orders", icon: <Truck className="h-4 w-4" />, path: "/inventory?tab=orders" },
      { title: "Inventory Levels", icon: <BarChart className="h-4 w-4" />, path: "/inventory?tab=overview" }
    ]
  },
  {
    title: "HRMS",
    icon: <FileText className="h-5 w-5" />,
    path: "/hrms",
    isActive: (path: string) => path.startsWith("/hrms"),
    subItems: [
      { title: "Employees", icon: <Users className="h-4 w-4" />, path: "/hrms/employees" },
      { title: "Attendance", icon: <Clock className="h-4 w-4" />, path: "/hrms/attendance" },
      { title: "Leave Management", icon: <Calendar className="h-4 w-4" />, path: "/hrms/leave" },
      { title: "Performance", icon: <TrendingUp className="h-4 w-4" />, path: "/hrms/performance" },
      { title: "Recruitment", icon: <UserPlus className="h-4 w-4" />, path: "/hrms/recruitment" },
      { title: "Payroll", icon: <Wallet className="h-4 w-4" />, path: "/hrms/payroll" }
    ]
  },
  {
    title: "Finance",
    icon: <CreditCard className="h-5 w-5" />,
    path: "/finance",
    isActive: (path: string) => path.startsWith("/finance"),
    subItems: [
      { title: "Invoices", icon: <FileCheck className="h-4 w-4" />, path: "/finance/invoices" },
      { title: "Expenses", icon: <DollarSign className="h-4 w-4" />, path: "/finance/expenses" },
      { title: "Accounts", icon: <Briefcase className="h-4 w-4" />, path: "/finance/accounts" },
      { title: "Transactions", icon: <CardIcon className="h-4 w-4" />, path: "/finance/transactions" },
      { title: "Reports", icon: <FileSpreadsheet className="h-4 w-4" />, path: "/finance/reports" }
    ]
  },
  {
    title: "Purchase",
    icon: <ShoppingCart className="h-5 w-5" />,
    path: "/purchase",
    isActive: (path: string) => path.startsWith("/purchase"),
    subItems: [
      { title: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, path: "/purchase" },
      { title: "Suppliers", icon: <Building2 className="h-4 w-4" />, path: "/purchase/suppliers" },
      { title: "Purchase Requests", icon: <FileText className="h-4 w-4" />, path: "/purchase/requests" },
      { title: "Purchase Orders", icon: <ShoppingCart className="h-4 w-4" />, path: "/purchase/orders" },
      { title: "Analytics", icon: <BarChart className="h-4 w-4" />, path: "/purchase/analytics" }
    ]
  },
  {
    title: "Payments",
    icon: <Wallet className="h-5 w-5" />,
    path: "/payments",
    isActive: (path: string) => path.startsWith("/payments"),
    subItems: [
      { title: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, path: "/payments" },
      { title: "Transactions", icon: <CardIcon className="h-4 w-4" />, path: "/payments/transactions" },
      { title: "MPESA", icon: <Smartphone className="h-4 w-4" />, path: "/payments/mpesa" },
      { title: "Stripe", icon: <CreditCard className="h-4 w-4" />, path: "/payments/stripe" },
      { title: "Razorpay", icon: <CreditCard className="h-4 w-4" />, path: "/payments/razorpay" },
      { title: "Settings", icon: <Settings className="h-4 w-4" />, path: "/payments/settings" }
    ]
  },
  {
    title: "Reports",
    icon: <BarChart className="h-5 w-5" />,
    path: "/reports",
    isActive: (path: string) => path.startsWith("/reports"),
    subItems: [
      { title: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, path: "/reports" },
      { title: "Reports", icon: <FileSpreadsheet className="h-4 w-4" />, path: "/reports/reports" },
      { title: "Templates", icon: <ClipboardList className="h-4 w-4" />, path: "/reports/templates" },
      { title: "Scheduled", icon: <Clock className="h-4 w-4" />, path: "/reports/scheduled" },
      { title: "Dashboards", icon: <LayoutDashboard className="h-4 w-4" />, path: "/reports/dashboards" },
      { title: "Analytics", icon: <TrendingUp className="h-4 w-4" />, path: "/reports/analytics" }
    ]
  }
];

// Bottom navigation items
const bottomNavItems = [
  {
    title: "Settings",
    icon: <Settings className="h-5 w-5" />,
    path: "/settings",
    isActive: (path: string) => path.startsWith("/settings")
  },
  {
    title: "Help & Support",
    icon: <HelpCircle className="h-5 w-5" />,
    path: "/support",
    isActive: (path: string) => path.startsWith("/support")
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  activePath: string;
}

export const Sidebar = ({ isCollapsed, toggleSidebar, activePath }: SidebarProps) => {
  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-card border-r transition-all duration-300 fixed left-0 top-0 z-30 overflow-y-auto`}
    >
      <div className="p-4 flex justify-between items-center border-b">
        {!isCollapsed && (
          <Link href="/dashboard" className="text-xl font-bold flex items-center">
            <span className="text-primary mr-1">Cogni</span>Flow
          </Link>
        )}
        <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-accent">
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.path}>
              {item.subItems ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center p-2 rounded-md w-full justify-between
                        ${item.isActive(activePath) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </div>
                      {!isCollapsed && <ChevronDown className="h-4 w-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  {!isCollapsed && (
                    <DropdownMenuContent className="w-56" alignOffset={-40} align="start">
                      <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {item.subItems.map((subItem) => (
                        <DropdownMenuItem key={subItem.path} asChild>
                          <Link href={subItem.path} className="flex items-center cursor-pointer w-full">
                            {subItem.icon}
                            <span className="ml-2">{subItem.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              ) : (
                <Link href={item.path}
                  className={`flex items-center p-2 rounded-md 
                    ${item.isActive(activePath) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="border-t my-4 pt-4">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}
                  className={`flex items-center p-2 rounded-md 
                    ${item.isActive(activePath) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export const TopNavigation = ({ user, handleLogout, isCollapsed }: { 
  user: any, 
  handleLogout: () => void,
  isCollapsed: boolean 
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return (
    <header className="bg-card border-b sticky top-0 z-20 flex justify-between items-center p-4">
      <div className="flex items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 w-full"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <RealtimeNotifications />

        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.firstName} />
                <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="text-sm text-left">
                    <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-muted-foreground">{user?.role}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <a className="flex items-center cursor-pointer w-full">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <a className="flex items-center cursor-pointer w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function ErpNavigation({ children }: PageWrapperProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // If not authenticated, redirect to auth page
          setLocation("/auth");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [setLocation, toast]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
        setLocation("/auth");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} activePath={location} />

      {/* Main content */}
      <div
        className={`${
          isCollapsed ? "ml-16" : "ml-64"
        } transition-all duration-300`}
      >
        <TopNavigation user={user} handleLogout={handleLogout} isCollapsed={isCollapsed} />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}