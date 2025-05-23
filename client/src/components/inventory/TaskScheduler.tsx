import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowDownUp,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Format time string
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Sample task data
const sampleTasks = [
  {
    id: 1,
    title: "Monthly Inventory Count",
    description: "Perform physical inventory count for all warehouses",
    status: "Scheduled",
    priority: "High",
    frequency: "Monthly",
    assignedTo: [
      { id: 1, name: "Michael Brown", role: "Inventory Manager", avatar: "/avatars/01.png" },
      { id: 2, name: "Sarah Johnson", role: "Warehouse Supervisor", avatar: "/avatars/02.png" }
    ],
    nextRunDate: "2023-05-31T09:00:00Z",
    lastRunDate: "2023-04-30T09:15:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    createdAt: "2023-01-15T13:30:00Z",
    category: "Inventory",
    module: "Inventory",
    requiredRole: "Manager",
    reminderSent: true,
    notes: "Make sure to reconcile any discrepancies with the system inventory records immediately.",
    attachments: [],
    subtasks: [
      { id: 101, title: "Count Warehouse A", completed: false },
      { id: 102, title: "Count Warehouse B", completed: false },
      { id: 103, title: "Update inventory system", completed: false },
      { id: 104, title: "Generate variance report", completed: false }
    ]
  },
  {
    id: 2,
    title: "Generate Low Stock Report",
    description: "Create and distribute low stock report to purchasing department",
    status: "Active",
    priority: "Medium",
    frequency: "Weekly",
    assignedTo: [
      { id: 4, name: "Emily Wilson", role: "Inventory Analyst", avatar: "/avatars/04.png" }
    ],
    nextRunDate: "2023-05-08T08:00:00Z",
    lastRunDate: "2023-05-01T08:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    createdAt: "2023-02-10T10:15:00Z",
    category: "Reports",
    module: "Inventory",
    requiredRole: "Admin",
    reminderSent: false,
    notes: "Report should include items that are below their reorder levels.",
    attachments: [],
    subtasks: [
      { id: 201, title: "Pull inventory data", completed: false },
      { id: 202, title: "Filter low stock items", completed: false },
      { id: 203, title: "Format report", completed: false },
      { id: 204, title: "Email to purchasing team", completed: false }
    ]
  },
  {
    id: 3,
    title: "Purchase Order Follow-up",
    description: "Follow up on open purchase orders due this week",
    status: "Scheduled",
    priority: "High",
    frequency: "Weekly",
    assignedTo: [
      { id: 5, name: "James Martinez", role: "Purchasing Manager", avatar: "/avatars/05.png" }
    ],
    nextRunDate: "2023-05-10T14:00:00Z",
    lastRunDate: "2023-05-03T14:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 5, name: "James Martinez", role: "Purchasing Manager", avatar: "/avatars/05.png" },
    createdAt: "2023-03-01T09:30:00Z",
    category: "Purchasing",
    module: "Inventory",
    requiredRole: "Manager",
    reminderSent: false,
    notes: "Contact suppliers for any POs that have not been confirmed or are past their expected delivery date.",
    attachments: [],
    subtasks: [
      { id: 301, title: "Review open POs", completed: false },
      { id: 302, title: "Contact suppliers", completed: false },
      { id: 303, title: "Update PO status", completed: false },
      { id: 304, title: "Report delays to management", completed: false }
    ]
  },
  {
    id: 4,
    title: "Audit Shipping Costs",
    description: "Review and audit shipping costs against carrier invoices",
    status: "Scheduled",
    priority: "Medium",
    frequency: "Monthly",
    assignedTo: [
      { id: 6, name: "David Lee", role: "Finance Analyst", avatar: "/avatars/06.png" }
    ],
    nextRunDate: "2023-05-20T10:00:00Z",
    lastRunDate: "2023-04-20T10:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    createdAt: "2023-02-25T15:45:00Z",
    category: "Finance",
    module: "Finance",
    requiredRole: "Admin",
    reminderSent: false,
    notes: "Compare actual shipping costs with invoice amounts and identify any discrepancies.",
    attachments: [],
    subtasks: [
      { id: 401, title: "Gather shipping manifests", completed: false },
      { id: 402, title: "Compare with carrier invoices", completed: false },
      { id: 403, title: "Document discrepancies", completed: false },
      { id: 404, title: "Submit report to Finance", completed: false }
    ]
  },
  {
    id: 5,
    title: "Clean Expired Inventory Data",
    description: "Archive and clean up inventory records for discontinued products",
    status: "Scheduled",
    priority: "Low",
    frequency: "Quarterly",
    assignedTo: [
      { id: 7, name: "Lisa Chen", role: "Database Administrator", avatar: "/avatars/07.png" }
    ],
    nextRunDate: "2023-06-30T00:00:00Z",
    lastRunDate: "2023-03-31T00:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    createdAt: "2023-01-05T11:20:00Z",
    category: "Maintenance",
    module: "System",
    requiredRole: "Super Admin",
    reminderSent: false,
    notes: "Ensure data integrity and backup all records before deleting anything.",
    attachments: [],
    subtasks: [
      { id: 501, title: "Identify discontinued products", completed: false },
      { id: 502, title: "Export data for archive", completed: false },
      { id: 503, title: "Backup database", completed: false },
      { id: 504, title: "Remove expired records", completed: false }
    ]
  },
  {
    id: 6,
    title: "Update Product Pricing",
    description: "Update product pricing based on recent supplier changes",
    status: "In Progress",
    priority: "Critical",
    frequency: "As needed",
    assignedTo: [
      { id: 2, name: "Sarah Johnson", role: "Warehouse Supervisor", avatar: "/avatars/02.png" },
      { id: 8, name: "Robert Taylor", role: "Product Manager", avatar: "/avatars/08.png" }
    ],
    nextRunDate: "2023-05-03T14:00:00Z",
    lastRunDate: null,
    lastRunStatus: null,
    createdBy: { id: 8, name: "Robert Taylor", role: "Product Manager", avatar: "/avatars/08.png" },
    createdAt: "2023-05-02T09:30:00Z",
    category: "Pricing",
    module: "Sales",
    requiredRole: "Manager",
    reminderSent: true,
    notes: "Price changes affect the Sales and Finance modules. Coordinate with both departments.",
    attachments: [
      { id: 1, name: "updated-price-list.xlsx", type: "spreadsheet", size: "245 KB" }
    ],
    subtasks: [
      { id: 601, title: "Review supplier price changes", completed: true },
      { id: 602, title: "Calculate new retail prices", completed: true },
      { id: 603, title: "Update inventory system", completed: false },
      { id: 604, title: "Notify sales team", completed: false }
    ]
  },
  {
    id: 7,
    title: "Daily Sales Report",
    description: "Generate and distribute daily sales summary report",
    status: "Active",
    priority: "Medium",
    frequency: "Daily",
    assignedTo: [
      { id: 9, name: "Jennifer Adams", role: "Sales Analyst", avatar: "/avatars/09.png" }
    ],
    nextRunDate: "2023-05-03T17:00:00Z",
    lastRunDate: "2023-05-02T17:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 10, name: "Thomas Wilson", role: "Sales Manager", avatar: "/avatars/10.png" },
    createdAt: "2023-01-10T08:45:00Z",
    category: "Reports",
    module: "Sales",
    requiredRole: "Manager",
    reminderSent: false,
    notes: "Report should include sales by region, product category, and salesperson.",
    attachments: [],
    subtasks: [
      { id: 701, title: "Extract sales data", completed: false },
      { id: 702, title: "Generate summary report", completed: false },
      { id: 703, title: "Email to management team", completed: false }
    ]
  },
  {
    id: 8,
    title: "Supplier Performance Review",
    description: "Quarterly review of supplier performance metrics",
    status: "Scheduled",
    priority: "High",
    frequency: "Quarterly",
    assignedTo: [
      { id: 5, name: "James Martinez", role: "Purchasing Manager", avatar: "/avatars/05.png" },
      { id: 11, name: "Catherine Park", role: "Quality Control Manager", avatar: "/avatars/11.png" }
    ],
    nextRunDate: "2023-06-15T13:00:00Z",
    lastRunDate: "2023-03-15T13:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    createdAt: "2023-01-20T16:30:00Z",
    category: "Supplier Management",
    module: "Purchasing",
    requiredRole: "Admin",
    reminderSent: false,
    notes: "Evaluate suppliers based on delivery time, product quality, and pricing competitiveness.",
    attachments: [],
    subtasks: [
      { id: 801, title: "Collect supplier data", completed: false },
      { id: 802, title: "Analyze performance metrics", completed: false },
      { id: 803, title: "Prepare evaluation report", completed: false },
      { id: 804, title: "Schedule supplier meetings", completed: false }
    ]
  },
  {
    id: 9,
    title: "Employee Training Session",
    description: "Conduct training on new inventory features",
    status: "Scheduled",
    priority: "Medium",
    frequency: "As needed",
    assignedTo: [
      { id: 1, name: "Michael Brown", role: "Inventory Manager", avatar: "/avatars/01.png" },
      { id: 12, name: "Olivia Garcia", role: "Training Coordinator", avatar: "/avatars/12.png" }
    ],
    nextRunDate: "2023-05-12T10:00:00Z",
    lastRunDate: null,
    lastRunStatus: null,
    createdBy: { id: 12, name: "Olivia Garcia", role: "Training Coordinator", avatar: "/avatars/12.png" },
    createdAt: "2023-04-28T11:45:00Z",
    category: "Training",
    module: "HR",
    requiredRole: "Manager",
    reminderSent: true,
    notes: "Prepare training materials and schedule session in the conference room.",
    attachments: [
      { id: 2, name: "training-slides.pptx", type: "presentation", size: "3.2 MB" }
    ],
    subtasks: [
      { id: 901, title: "Prepare training materials", completed: true },
      { id: 902, title: "Book conference room", completed: true },
      { id: 903, title: "Send calendar invites", completed: true },
      { id: 904, title: "Conduct training session", completed: false }
    ]
  },
  {
    id: 10,
    title: "System Backup",
    description: "Perform full system backup of all ERP data",
    status: "Active",
    priority: "Critical",
    frequency: "Weekly",
    assignedTo: [
      { id: 7, name: "Lisa Chen", role: "Database Administrator", avatar: "/avatars/07.png" }
    ],
    nextRunDate: "2023-05-07T01:00:00Z",
    lastRunDate: "2023-04-30T01:00:00Z",
    lastRunStatus: "Completed",
    createdBy: { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    createdAt: "2023-01-02T08:00:00Z",
    category: "Maintenance",
    module: "System",
    requiredRole: "Super Admin",
    reminderSent: false,
    notes: "Ensure all backup verification procedures are completed after the backup.",
    attachments: [],
    subtasks: [
      { id: 1001, title: "Verify database integrity", completed: false },
      { id: 1002, title: "Perform full backup", completed: false },
      { id: 1003, title: "Verify backup completeness", completed: false },
      { id: 1004, title: "Store backup offsite", completed: false }
    ]
  }
];

// Sample frequencies for the dropdown
const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "as-needed", label: "As Needed" }
];

// Sample roles for the dropdown
const roles = [
  { value: "user", label: "User" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "super-admin", label: "Super Admin" }
];

// Sample categories for the dropdown
const categories = [
  { value: "inventory", label: "Inventory" },
  { value: "reports", label: "Reports" },
  { value: "purchasing", label: "Purchasing" },
  { value: "finance", label: "Finance" },
  { value: "maintenance", label: "Maintenance" },
  { value: "pricing", label: "Pricing" },
  { value: "supplier-management", label: "Supplier Management" },
  { value: "training", label: "Training" }
];

// Sample modules for the dropdown
const modules = [
  { value: "inventory", label: "Inventory" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "purchasing", label: "Purchasing" },
  { value: "hr", label: "HR" },
  { value: "system", label: "System" }
];

// Sample priorities for the dropdown
const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

// Badge variant based on priority
const getPriorityBadge = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "low":
      return <Badge className="bg-gray-500">Low</Badge>;
    case "medium":
      return <Badge className="bg-blue-500">Medium</Badge>;
    case "high":
      return <Badge className="bg-amber-500">High</Badge>;
    case "critical":
      return <Badge className="bg-red-500">Critical</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
};

// Badge variant based on status
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "scheduled":
      return <Badge className="bg-blue-500">Scheduled</Badge>;
    case "active":
      return <Badge className="bg-green-500">Active</Badge>;
    case "in progress":
      return <Badge className="bg-amber-500">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-purple-500">Completed</Badge>;
    case "paused":
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Paused</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const TaskScheduler = () => {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // New task state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    frequency: "weekly",
    nextRunDate: "",
    module: "inventory",
    category: "inventory",
    requiredRole: "manager",
    notes: "",
    assignedToIds: [] as number[]
  });

  // Get current user data (in a real app, this would come from auth context)
  // This is simulated here
  const currentUser = {
    id: 3,
    name: "Admin User",
    role: "Super Admin",
    avatar: "/avatars/03.png",
    isAdmin: true,
    isSuperAdmin: true,
    isManager: true
  };

  // Sample users for assignment
  const users = [
    { id: 1, name: "Michael Brown", role: "Inventory Manager", avatar: "/avatars/01.png" },
    { id: 2, name: "Sarah Johnson", role: "Warehouse Supervisor", avatar: "/avatars/02.png" },
    { id: 3, name: "Admin User", role: "Super Admin", avatar: "/avatars/03.png" },
    { id: 4, name: "Emily Wilson", role: "Inventory Analyst", avatar: "/avatars/04.png" },
    { id: 5, name: "James Martinez", role: "Purchasing Manager", avatar: "/avatars/05.png" },
    { id: 6, name: "David Lee", role: "Finance Analyst", avatar: "/avatars/06.png" },
    { id: 7, name: "Lisa Chen", role: "Database Administrator", avatar: "/avatars/07.png" },
    { id: 8, name: "Robert Taylor", role: "Product Manager", avatar: "/avatars/08.png" },
    { id: 9, name: "Jennifer Adams", role: "Sales Analyst", avatar: "/avatars/09.png" },
    { id: 10, name: "Thomas Wilson", role: "Sales Manager", avatar: "/avatars/10.png" },
  ];

  // Query for tasks data
  const { data: tasksData, isLoading, isError } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleTasks);
    },
  });

  // Filter tasks based on current tab, search term, and filters
  const filteredTasks = tasksData ? tasksData.filter((task: any) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || task.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || task.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesModule = moduleFilter === "all" || task.module.toLowerCase() === moduleFilter.toLowerCase();
    
    // Filter based on the current tab
    const today = new Date();
    const nextRunDate = new Date(task.nextRunDate);
    
    if (currentTab === "upcoming") {
      return matchesSearch && matchesCategory && matchesPriority && matchesModule && 
        (task.status === "Scheduled" || task.status === "Active") && 
        nextRunDate >= today;
    }
    
    if (currentTab === "completed") {
      return matchesSearch && matchesCategory && matchesPriority && matchesModule && 
        task.lastRunStatus === "Completed";
    }
    
    if (currentTab === "all") {
      return matchesSearch && matchesCategory && matchesPriority && matchesModule;
    }
    
    return matchesSearch && matchesCategory && matchesPriority && matchesModule;
  }) : [];

  // Check if user has access to a task based on their role
  const hasAccessToTask = (task: any) => {
    // In a real app, you'd check the user's role against the task's requiredRole
    // This is a simplified example
    if (currentUser.isSuperAdmin) return true;
    if (currentUser.isAdmin && task.requiredRole !== "Super Admin") return true;
    if (currentUser.isManager && task.requiredRole === "Manager") return true;
    return false;
  };

  // Open task dialog
  const openTaskDialog = (task: any = null) => {
    if (task) {
      setSelectedTask(task);
      setNewTask({
        title: task.title,
        description: task.description,
        priority: task.priority.toLowerCase(),
        frequency: task.frequency.toLowerCase(),
        nextRunDate: new Date(task.nextRunDate).toISOString().split('T')[0],
        module: task.module.toLowerCase(),
        category: task.category.toLowerCase(),
        requiredRole: task.requiredRole.toLowerCase().replace(' ', '-'),
        notes: task.notes,
        assignedToIds: task.assignedTo.map((user: any) => user.id)
      });
    } else {
      setSelectedTask(null);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        frequency: "weekly",
        nextRunDate: new Date().toISOString().split('T')[0],
        module: "inventory",
        category: "inventory",
        requiredRole: "manager",
        notes: "",
        assignedToIds: []
      });
    }
    setShowTaskDialog(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (task: any) => {
    setSelectedTask(task);
    setShowDeleteDialog(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change for assignees
  const handleAssigneeChange = (userId: number, checked: boolean) => {
    if (checked) {
      setNewTask(prev => ({
        ...prev,
        assignedToIds: [...prev.assignedToIds, userId]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        assignedToIds: prev.assignedToIds.filter(id => id !== userId)
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title) {
      toast({
        title: "Title Required",
        description: "Please enter a title for this task.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newTask.nextRunDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for this task.",
        variant: "destructive",
      });
      return;
    }
    
    if (newTask.assignedToIds.length === 0) {
      toast({
        title: "Assignee Required",
        description: "Please assign this task to at least one user.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, you'd call an API to save the task
    toast({
      title: selectedTask ? "Task Updated" : "Task Created",
      description: selectedTask 
        ? `Task "${newTask.title}" has been updated.` 
        : `Task "${newTask.title}" has been created.`,
    });
    
    setShowTaskDialog(false);
  };

  // Handle task deletion
  const handleDelete = () => {
    if (!selectedTask) return;
    
    // In a real app, you'd call an API to delete the task
    toast({
      title: "Task Deleted",
      description: `Task "${selectedTask.title}" has been deleted.`,
    });
    
    setShowDeleteDialog(false);
  };

  // Run a task now
  const runTaskNow = (task: any) => {
    // In a real app, you'd call an API to trigger the task
    toast({
      title: "Task Initiated",
      description: `Task "${task.title}" has been started.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule and manage recurring tasks with role-based access
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex border rounded-md p-1">
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="sm" 
              className="px-2" 
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="sm" 
              className="px-2" 
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => openTaskDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            All Tasks
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={moduleFilter}
                    onValueChange={setModuleFilter}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {modules.map(module => (
                        <SelectItem key={module.value} value={module.value}>
                          {module.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-10 text-center">
                <div className="space-y-3">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="text-lg font-medium">Error Loading Tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    There was a problem loading the scheduled tasks.
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-center">
                <div className="space-y-3">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No Tasks Found</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no tasks matching your criteria.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setPriorityFilter("all");
                    setModuleFilter("all");
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            ) : viewMode === "list" ? (
              // List View
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Task Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task: any) => (
                      <TableRow key={task.id} className={!hasAccessToTask(task) ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                              {task.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(task.nextRunDate)}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(task.nextRunDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{task.frequency}</TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {task.assignedTo.slice(0, 3).map((user: any) => (
                              <div 
                                key={user.id} 
                                className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                                title={user.name}
                              >
                                {user.name.charAt(0)}
                              </div>
                            ))}
                            {task.assignedTo.length > 3 && (
                              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                +{task.assignedTo.length - 3}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {hasAccessToTask(task) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4 mr-2" />
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Manage Task</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openTaskDialog(task)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => runTaskNow(task)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Now
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDeleteDialog(task)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No Access
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task: any) => (
                  <Card key={task.id} className={!hasAccessToTask(task) ? "opacity-60" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {task.description}
                          </CardDescription>
                        </div>
                        {hasAccessToTask(task) ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Manage Task</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openTaskDialog(task)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => runTaskNow(task)}>
                                <Play className="h-4 w-4 mr-2" />
                                Run Now
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDeleteDialog(task)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No Access
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        <Badge variant="outline">{task.module}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
                          <span>{formatDate(task.nextRunDate)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {task.frequency}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {task.subtasks?.length} subtasks
                        </div>
                        <div className="flex -space-x-2">
                          {task.assignedTo.slice(0, 3).map((user: any) => (
                            <div 
                              key={user.id} 
                              className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                              title={user.name}
                            >
                              {user.name.charAt(0)}
                            </div>
                          ))}
                          {task.assignedTo.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                              +{task.assignedTo.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {task.requiredRole && (
                        <div className="text-xs text-muted-foreground">
                          Required role: {task.requiredRole}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t p-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredTasks.length} tasks shown
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm">High Priority</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Critical</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </Tabs>

      {/* Task Create/Edit Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {selectedTask ? "Update the scheduled task details" : "Create a new scheduled task with notifications"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={newTask.title} 
                    onChange={handleInputChange} 
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={newTask.description} 
                    onChange={handleInputChange} 
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newTask.frequency}
                      onValueChange={(value) => setNewTask(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map(frequency => (
                          <SelectItem key={frequency.value} value={frequency.value}>
                            {frequency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nextRunDate">Next Run Date</Label>
                  <Input 
                    id="nextRunDate" 
                    name="nextRunDate" 
                    type="date" 
                    value={newTask.nextRunDate} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="module">Module</Label>
                    <Select
                      value={newTask.module}
                      onValueChange={(value) => setNewTask(prev => ({ ...prev, module: value }))}
                    >
                      <SelectTrigger id="module">
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map(module => (
                          <SelectItem key={module.value} value={module.value}>
                            {module.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newTask.category}
                      onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requiredRole">Required Role (Minimum)</Label>
                  <Select
                    value={newTask.requiredRole}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, requiredRole: value }))}
                  >
                    <SelectTrigger id="requiredRole">
                      <SelectValue placeholder="Select required role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only users with this role or higher can view and manage this task
                  </p>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                    <div className="space-y-2">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`user-${user.id}`} 
                            checked={newTask.assignedToIds.includes(user.id)}
                            onCheckedChange={(checked) => handleAssigneeChange(user.id, checked as boolean)}
                          />
                          <Label 
                            htmlFor={`user-${user.id}`} 
                            className="flex items-center cursor-pointer text-sm font-normal"
                          >
                            <div 
                              className="h-6 w-6 rounded-full bg-primary/10 border border-muted-foreground/20 flex items-center justify-center text-xs font-medium mr-2"
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div>{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.role}</div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes & Instructions</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    value={newTask.notes} 
                    onChange={handleInputChange} 
                    placeholder="Enter additional notes or instructions"
                    rows={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Options</Label>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="send-reminders" className="flex items-center space-x-2 cursor-pointer">
                        <span>Send reminders</span>
                      </Label>
                      <Switch id="send-reminders" defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-completion" className="flex items-center space-x-2 cursor-pointer">
                        <span>Notify on completion</span>
                      </Label>
                      <Switch id="notify-completion" defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skip-weekends" className="flex items-center space-x-2 cursor-pointer">
                        <span>Skip weekends</span>
                      </Label>
                      <Switch id="skip-weekends" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDialog(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">
                {selectedTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 p-3 rounded-md mb-4">
              <h4 className="font-medium">{selectedTask?.title}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedTask?.description}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Deleting this task will remove all scheduled occurrences and history.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskScheduler;