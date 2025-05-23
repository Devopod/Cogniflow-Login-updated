import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
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
  Calendar,
  ChevronDown,
  Menu,
  X,
  AlertCircle,
  Zap,
  Layers,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// Sample data for charts
const salesData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 2000 },
  { name: "Apr", sales: 2780 },
  { name: "May", sales: 1890 },
  { name: "Jun", sales: 2390 },
];

const pieData = [
  { name: "Completed", value: 540 },
  { name: "In Progress", value: 300 },
  { name: "Pending", value: 200 },
  { name: "Cancelled", value: 120 },
];

const COLORS = ["#4ade80", "#60a5fa", "#f97316", "#f43f5e"];

const recentActivities = [
  {
    id: 1,
    type: "invoice",
    title: "Invoice #INV-2023-001 paid",
    amount: "$5,230.00",
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "inventory",
    title: "Inventory update: 50 new items added",
    amount: null,
    time: "2 hours ago",
  },
  {
    id: 3,
    type: "expense",
    title: "New expense recorded",
    amount: "$750.00",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "employee",
    title: "New employee onboarded",
    amount: null,
    time: "2 days ago",
  },
];

// Sidebar component
const Sidebar = ({ isCollapsed, toggleSidebar }: SidebarProps) => {
  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-card border-r transition-all duration-300 fixed left-0 top-0 z-30`}
    >
      <div className="p-4 flex justify-between items-center border-b">
        {!isCollapsed && (
          <h1 className="text-xl font-bold">CogniFlow ERP</h1>
        )}
        <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-accent">
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="p-2">
        <ul className="space-y-2">
          <li>
            <a
              href="#"
              className="flex items-center p-2 rounded-md text-foreground hover:bg-accent group"
            >
              <LayoutDashboard className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center p-2 rounded-md text-muted-foreground hover:bg-accent group"
            >
              <Users className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">CRM</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center p-2 rounded-md text-muted-foreground hover:bg-accent group"
            >
              <Package className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Inventory</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center p-2 rounded-md text-muted-foreground hover:bg-accent group"
            >
              <FileText className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">HRMS</span>}
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center p-2 rounded-md text-muted-foreground hover:bg-accent group"
            >
              <CreditCard className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Finance</span>}
            </a>
          </li>
        </ul>

        <div className="border-t my-4 pt-4">
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="flex items-center p-2 rounded-md text-muted-foreground hover:bg-accent group"
              >
                <Settings className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Settings</span>}
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center p-2 rounded-md text-muted-foreground hover:bg-accent group"
              >
                <HelpCircle className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Help & Support</span>}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setLocation] = useLocation();
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
          // If not authenticated, redirect to auth page but only for the /home path
          if (window.location.pathname === '/home') {
            setLocation("/auth");
          }
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
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div
        className={`${
          isCollapsed ? "ml-16" : "ml-64"
        } transition-all duration-300`}
      >
        {/* Top navigation */}
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
            <button className="p-2 rounded-full hover:bg-accent relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
            </button>
            
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
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          {/* Stats overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-2">$24,780</h3>
                  <p className="text-sm text-green-500 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +2.5% from last month
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <BarChart2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Customers</p>
                  <h3 className="text-2xl font-bold mt-2">120</h3>
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                    -0.8% from last month
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inventory Items</p>
                  <h3 className="text-2xl font-bold mt-2">1,489</h3>
                  <p className="text-sm text-green-500 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12.3% from last month
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee Count</p>
                  <h3 className="text-2xl font-bold mt-2">64</h3>
                  <p className="text-sm text-green-500 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +3.1% from last month
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-medium mb-4">Monthly Sales</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-medium mb-4">Task Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Recent activity */}
          <div className="bg-card rounded-lg shadow-sm p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="divide-y">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`mr-4 p-2 rounded-full 
                      ${activity.type === "invoice" ? "bg-blue-100" : ""}
                      ${activity.type === "inventory" ? "bg-green-100" : ""}
                      ${activity.type === "expense" ? "bg-red-100" : ""}
                      ${activity.type === "employee" ? "bg-purple-100" : ""}
                    `}>
                      {activity.type === "invoice" && <FileText className={`h-5 w-5 text-blue-500`} />}
                      {activity.type === "inventory" && <Package className={`h-5 w-5 text-green-500`} />}
                      {activity.type === "expense" && <CreditCard className={`h-5 w-5 text-red-500`} />}
                      {activity.type === "employee" && <Users className={`h-5 w-5 text-purple-500`} />}
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  {activity.amount && (
                    <span className="font-medium">{activity.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}