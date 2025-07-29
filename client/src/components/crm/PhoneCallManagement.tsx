import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  Pause,
  Pencil,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Plus,
  Search,
  Square,
  Tags,
  Timer,
  Trash,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  BarChart3,
  Target
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

// Sample phone call data
const sampleCalls = [
  {
    id: "CALL-2023-001",
    contactName: "John Smith",
    contactId: "CT-2023-001",
    companyName: "Acme Corporation",
    companyId: "CO-2023-001",
    phoneNumber: "+1 (555) 123-4567",
    type: "Outgoing",
    status: "Completed",
    outcome: "Successful",
    duration: 1245, // in seconds
    scheduledAt: "2023-12-02T10:00:00Z",
    startedAt: "2023-12-02T10:02:15Z",
    endedAt: "2023-12-02T10:23:00Z",
    assignedTo: "Sarah Johnson",
    purpose: "Follow-up on proposal",
    notes: "Discussed implementation timeline. Client is very interested and wants to schedule a demo next week. Need to send technical specifications by Friday.",
    priority: "High",
    tags: ["Proposal", "Demo", "High Priority"],
    followUpRequired: true,
    followUpDate: "2023-12-09T10:00:00Z",
    recordingUrl: "/recordings/call-001.mp3",
    createdAt: "2023-12-02T09:45:00Z"
  },
  {
    id: "CALL-2023-002",
    contactName: "Sarah Johnson",
    contactId: "CT-2023-002",
    companyName: "TechStart Inc.",
    companyId: "CO-2023-002",
    phoneNumber: "+1 (555) 234-5678",
    type: "Incoming",
    status: "Completed",
    outcome: "Successful",
    duration: 892,
    scheduledAt: null,
    startedAt: "2023-12-01T14:30:22Z",
    endedAt: "2023-12-01T14:45:14Z",
    assignedTo: "Michael Chen",
    purpose: "Support inquiry",
    notes: "Customer called about integration issues. Walked through troubleshooting steps. Issue resolved. Customer satisfied with support.",
    priority: "Medium",
    tags: ["Support", "Integration", "Resolved"],
    followUpRequired: false,
    followUpDate: null,
    recordingUrl: "/recordings/call-002.mp3",
    createdAt: "2023-12-01T14:30:00Z"
  },
  {
    id: "CALL-2023-003",
    contactName: "Michael Chen",
    contactId: "CT-2023-003",
    companyName: "Global Services Ltd.",
    companyId: "CO-2023-003",
    phoneNumber: "+44 20 7123 4567",
    type: "Outgoing",
    status: "Missed",
    outcome: "No Answer",
    duration: 0,
    scheduledAt: "2023-11-30T16:00:00Z",
    startedAt: "2023-11-30T16:00:00Z",
    endedAt: null,
    assignedTo: "Emma Wilson",
    purpose: "Contract renewal discussion",
    notes: "Called to discuss contract renewal. No answer. Left voicemail requesting callback.",
    priority: "High",
    tags: ["Contract", "Renewal", "Callback Required"],
    followUpRequired: true,
    followUpDate: "2023-12-04T10:00:00Z",
    recordingUrl: null,
    createdAt: "2023-11-30T15:45:00Z"
  },
  {
    id: "CALL-2023-004",
    contactName: "Emma Wilson",
    contactId: "CT-2023-004",
    companyName: "Innovative Solutions",
    companyId: "CO-2023-004",
    phoneNumber: "+1 (555) 345-6789",
    type: "Scheduled",
    status: "Scheduled",
    outcome: "Pending",
    duration: 0,
    scheduledAt: "2023-12-05T11:00:00Z",
    startedAt: null,
    endedAt: null,
    assignedTo: "David Rodriguez",
    purpose: "Product demonstration",
    notes: "Scheduled demo call for new product features. Prepare demo environment and presentation materials.",
    priority: "High",
    tags: ["Demo", "Product", "Scheduled"],
    followUpRequired: false,
    followUpDate: null,
    recordingUrl: null,
    createdAt: "2023-12-01T09:20:00Z"
  },
  {
    id: "CALL-2023-005",
    contactName: "James Taylor",
    contactId: "CT-2023-005",
    companyName: "Digital Dynamics",
    companyId: "CO-2023-005",
    phoneNumber: "+1 (555) 456-7890",
    type: "Incoming",
    status: "In Progress",
    outcome: "Pending",
    duration: 0,
    scheduledAt: null,
    startedAt: "2023-12-02T15:30:00Z",
    endedAt: null,
    assignedTo: "Sarah Johnson",
    purpose: "Partnership discussion",
    notes: "Ongoing call about potential strategic partnership. Discussing terms and conditions.",
    priority: "High",
    tags: ["Partnership", "Strategic", "Ongoing"],
    followUpRequired: false,
    followUpDate: null,
    recordingUrl: null,
    createdAt: "2023-12-02T15:30:00Z"
  },
  {
    id: "CALL-2023-006",
    contactName: "Lisa Martinez",
    contactId: "CT-2023-006",
    companyName: "NextGen Technologies",
    companyId: "CO-2023-006",
    phoneNumber: "+1 (555) 567-8901",
    type: "Outgoing",
    status: "Completed",
    outcome: "Unsuccessful",
    duration: 324,
    scheduledAt: "2023-11-29T13:30:00Z",
    startedAt: "2023-11-29T13:32:10Z",
    endedAt: "2023-11-29T13:37:34Z",
    assignedTo: "Michael Chen",
    purpose: "Cold call - lead qualification",
    notes: "Cold call to qualify lead. Contact not interested at this time. Budget constraints mentioned. Added to nurture campaign.",
    priority: "Low",
    tags: ["Cold Call", "Not Interested", "Nurture"],
    followUpRequired: true,
    followUpDate: "2024-03-01T10:00:00Z",
    recordingUrl: "/recordings/call-006.mp3",
    createdAt: "2023-11-29T13:15:00Z"
  }
];

// Call types
const callTypes = ["Incoming", "Outgoing", "Scheduled"];

// Call statuses
const callStatuses = [
  { value: "Scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  { value: "In Progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "Completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "Missed", label: "Missed", color: "bg-red-100 text-red-800" },
  { value: "Cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800" }
];

// Call outcomes
const callOutcomes = [
  { value: "Successful", label: "Successful", color: "bg-green-100 text-green-800" },
  { value: "Unsuccessful", label: "Unsuccessful", color: "bg-red-100 text-red-800" },
  { value: "No Answer", label: "No Answer", color: "bg-yellow-100 text-yellow-800" },
  { value: "Busy", label: "Busy", color: "bg-orange-100 text-orange-800" },
  { value: "Voicemail", label: "Voicemail", color: "bg-purple-100 text-purple-800" },
  { value: "Pending", label: "Pending", color: "bg-gray-100 text-gray-800" }
];

// Call priorities
const callPriorities = ["Low", "Medium", "High", "Urgent"];

// Call purposes
const callPurposes = [
  "Sales Call", "Follow-up", "Support", "Demo", "Meeting", "Cold Call",
  "Contract Discussion", "Partnership", "Complaint", "Feedback", "Other"
];

// Format duration
const formatDuration = (seconds: number) => {
  if (seconds === 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format date/time
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Get call type icon
const getCallTypeIcon = (type: string) => {
  switch (type) {
    case "Incoming":
      return <PhoneIncoming className="h-4 w-4 text-green-500" />;
    case "Outgoing":
      return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
    case "Scheduled":
      return <Calendar className="h-4 w-4 text-purple-500" />;
    default:
      return <Phone className="h-4 w-4 text-gray-500" />;
  }
};

// Get status badge
const getStatusBadge = (status: string) => {
  const statusOption = callStatuses.find(option => option.value === status);
  if (!statusOption) return null;
  
  return (
    <Badge className={statusOption.color}>
      {statusOption.label}
    </Badge>
  );
};

// Get outcome badge
const getOutcomeBadge = (outcome: string) => {
  const outcomeOption = callOutcomes.find(option => option.value === outcome);
  if (!outcomeOption) return null;
  
  return (
    <Badge className={outcomeOption.color}>
      {outcomeOption.label}
    </Badge>
  );
};

// Get priority badge
const getPriorityBadge = (priority: string) => {
  const colors = {
    Low: "bg-gray-100 text-gray-800",
    Medium: "bg-blue-100 text-blue-800",
    High: "bg-orange-100 text-orange-800",
    Urgent: "bg-red-100 text-red-800"
  };
  
  return (
    <Badge className={colors[priority as keyof typeof colors] || colors.Medium}>
      {priority}
    </Badge>
  );
};

const PhoneCallManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showScheduleCall, setShowScheduleCall] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Query for calls data
  const { data: callsData, isLoading, isError } = useQuery({
    queryKey: ["/api/crm/calls"],
    queryFn: () => {
      // For demo, using the sample data
      return Promise.resolve(sampleCalls);
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Mutation for creating/updating calls
  const callMutation = useMutation({
    mutationFn: (callData: any) => {
      // Simulate API call
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/calls"] });
      toast({
        title: "Success",
        description: "Call has been saved successfully",
      });
    },
  });

  // Filter and sort calls
  const filteredCalls = callsData?.filter(call => {
    const matchesSearch = call.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          call.phoneNumber.includes(searchTerm) ||
                          call.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || call.type === typeFilter;
    const matchesStatus = statusFilter === "all" || call.status === statusFilter;
    const matchesOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter;
    const matchesPriority = priorityFilter === "all" || call.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesOutcome && matchesPriority;
  }).sort((a, b) => {
    if (sortField === "contactName") {
      return sortDirection === "asc" 
        ? a.contactName.localeCompare(b.contactName) 
        : b.contactName.localeCompare(a.contactName);
    } else if (sortField === "duration") {
      return sortDirection === "asc" 
        ? a.duration - b.duration 
        : b.duration - a.duration;
    } else if (sortField === "createdAt") {
      return sortDirection === "asc" 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle viewing call details
  const handleViewCall = (call: any) => {
    setSelectedCall(call);
    setShowCallDetails(true);
  };

  // Handle starting a call
  const handleStartCall = (call: any) => {
    setActiveCall(call);
    setCallTimer(0);
    setIsRecording(true);
    setIsMuted(false);
    toast({
      title: "Call started",
      description: `Call with ${call.contactName} has been initiated`,
    });
  };

  // Handle ending a call
  const handleEndCall = () => {
    if (activeCall) {
      toast({
        title: "Call ended",
        description: `Call with ${activeCall.contactName} has been completed`,
      });
      setActiveCall(null);
      setCallTimer(0);
      setIsRecording(false);
      setIsMuted(false);
    }
  };

  // Handle call logging
  const handleLogCall = () => {
    setShowLogCall(false);
    toast({
      title: "Call logged",
      description: "The call has been logged successfully",
    });
  };

  // Handle call scheduling
  const handleScheduleCall = () => {
    setShowScheduleCall(false);
    toast({
      title: "Call scheduled",
      description: "The call has been scheduled successfully",
    });
  };

  // Calculate metrics
  const totalCalls = callsData?.length || 0;
  const completedCalls = callsData?.filter(c => c.status === "Completed").length || 0;
  const totalDuration = callsData?.reduce((sum, c) => sum + c.duration, 0) || 0;
  const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;
  const successfulCalls = callsData?.filter(c => c.outcome === "Successful").length || 0;
  const successRate = completedCalls > 0 ? Math.round((successfulCalls / completedCalls) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error Loading Calls</h3>
          <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Call Widget */}
      {activeCall && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-800">Call in Progress</span>
                </div>
                <div className="text-lg font-semibold">
                  {activeCall.contactName} - {activeCall.companyName}
                </div>
                <div className="text-muted-foreground">
                  {formatDuration(callTimer)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleEndCall}>
                  <Phone className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Calls</p>
                <h2 className="text-2xl font-bold">{totalCalls}</h2>
              </div>
              <div className="bg-blue-500 p-2 rounded-full text-white">
                <PhoneCall className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+15%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed Calls</p>
                <h2 className="text-2xl font-bold">{completedCalls}</h2>
              </div>
              <div className="bg-green-500 p-2 rounded-full text-white">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+8%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg Call Duration</p>
                <h2 className="text-2xl font-bold">{formatDuration(avgDuration)}</h2>
              </div>
              <div className="bg-purple-500 p-2 rounded-full text-white">
                <Timer className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Success Rate</p>
                <h2 className="text-2xl font-bold">{successRate}%</h2>
              </div>
              <div className="bg-orange-500 p-2 rounded-full text-white">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+5%</span>
              <span className="text-muted-foreground ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Phone Call Management</h2>
          <p className="text-muted-foreground">
            Track, schedule, and manage all your phone communications
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px] md:w-[240px]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {callStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <Tags className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {callTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Dialog open={showLogCall} onOpenChange={setShowLogCall}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Phone Call</DialogTitle>
                  <DialogDescription>
                    Record details of a completed phone call.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logContactName">Contact Name <span className="text-red-500">*</span></Label>
                      <Input id="logContactName" placeholder="Enter contact name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logCompanyName">Company</Label>
                      <Input id="logCompanyName" placeholder="Enter company name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logPhoneNumber">Phone Number <span className="text-red-500">*</span></Label>
                      <Input id="logPhoneNumber" placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logType">Call Type</Label>
                      <Select>
                        <SelectTrigger id="logType">
                          <SelectValue placeholder="Select call type" />
                        </SelectTrigger>
                        <SelectContent>
                          {callTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logOutcome">Outcome</Label>
                      <Select>
                        <SelectTrigger id="logOutcome">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          {callOutcomes.filter(o => o.value !== "Pending").map(outcome => (
                            <SelectItem key={outcome.value} value={outcome.value}>{outcome.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logDuration">Duration (minutes)</Label>
                      <Input id="logDuration" type="number" placeholder="15" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logPurpose">Purpose</Label>
                      <Select>
                        <SelectTrigger id="logPurpose">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {callPurposes.map(purpose => (
                            <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logPriority">Priority</Label>
                      <Select>
                        <SelectTrigger id="logPriority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {callPriorities.map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logNotes">Call Notes</Label>
                    <Textarea id="logNotes" placeholder="Enter detailed notes about the call..." rows={4} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logTags">Tags</Label>
                    <Input id="logTags" placeholder="Enter tags separated by commas" />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowLogCall(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleLogCall}>
                    Log Call
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showScheduleCall} onOpenChange={setShowScheduleCall}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule Phone Call</DialogTitle>
                  <DialogDescription>
                    Schedule a future phone call with a contact.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedContactName">Contact Name <span className="text-red-500">*</span></Label>
                      <Input id="schedContactName" placeholder="Enter contact name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedCompanyName">Company</Label>
                      <Input id="schedCompanyName" placeholder="Enter company name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedPhoneNumber">Phone Number <span className="text-red-500">*</span></Label>
                      <Input id="schedPhoneNumber" placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedAssignedTo">Assigned To</Label>
                      <Select>
                        <SelectTrigger id="schedAssignedTo">
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sarah">Sarah Johnson</SelectItem>
                          <SelectItem value="michael">Michael Chen</SelectItem>
                          <SelectItem value="emma">Emma Wilson</SelectItem>
                          <SelectItem value="david">David Rodriguez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedDate">Scheduled Date <span className="text-red-500">*</span></Label>
                      <Input id="schedDate" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedTime">Scheduled Time <span className="text-red-500">*</span></Label>
                      <Input id="schedTime" type="time" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedPurpose">Purpose</Label>
                      <Select>
                        <SelectTrigger id="schedPurpose">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {callPurposes.map(purpose => (
                            <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedPriority">Priority</Label>
                      <Select>
                        <SelectTrigger id="schedPriority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {callPriorities.map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedNotes">Preparation Notes</Label>
                    <Textarea id="schedNotes" placeholder="Enter notes to prepare for the call..." rows={3} />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowScheduleCall(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleScheduleCall}>
                    Schedule Call
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Calls ({filteredCalls?.length || 0})</CardTitle>
          <CardDescription>
            Complete history of all phone communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("contactName")}
                >
                  <div className="flex items-center">
                    Contact
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("duration")}
                >
                  <div className="flex items-center">
                    Duration
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls?.map((call) => (
                <TableRow key={call.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{call.contactName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-muted-foreground">{call.companyName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{call.phoneNumber}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getCallTypeIcon(call.type)}
                      <span className="text-sm">{call.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDuration(call.duration)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{call.purpose}</Badge>
                  </TableCell>
                  <TableCell>{getPriorityBadge(call.priority)}</TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDateTime(call.scheduledAt)}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCall(call)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {call.status === "Scheduled" && (
                          <DropdownMenuItem onClick={() => handleStartCall(call)}>
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Start Call
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Call
                        </DropdownMenuItem>
                        {call.recordingUrl && (
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Play Recording
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Again
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Follow-up
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Call
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Call Details Dialog */}
      <Dialog open={showCallDetails} onOpenChange={setShowCallDetails}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {selectedCall && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCallTypeIcon(selectedCall.type)}
                    <div>
                      <DialogTitle className="text-xl">{selectedCall.contactName}</DialogTitle>
                      <DialogDescription className="flex items-center space-x-2 mt-1">
                        <span>{selectedCall.companyName}</span>
                        <span>•</span>
                        <span>{selectedCall.phoneNumber}</span>
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedCall.status)}
                    {getOutcomeBadge(selectedCall.outcome)}
                    {getPriorityBadge(selectedCall.priority)}
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Timer className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{formatDuration(selectedCall.duration)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Scheduled</p>
                        <p className="font-semibold text-xs">{formatDateTime(selectedCall.scheduledAt)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <UserCheck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Assigned To</p>
                        <p className="font-semibold text-xs">{selectedCall.assignedTo}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Purpose</p>
                        <p className="font-semibold text-xs">{selectedCall.purpose}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Call Notes</Label>
                    <p className="text-muted-foreground mt-2">{selectedCall.notes}</p>
                  </div>

                  {selectedCall.tags && selectedCall.tags.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedCall.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCall.followUpRequired && (
                    <div>
                      <Label className="text-base font-semibold">Follow-up Required</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">
                          Follow-up scheduled for {formatDateTime(selectedCall.followUpDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedCall.recordingUrl && (
                    <div>
                      <Label className="text-base font-semibold">Call Recording</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Play Recording
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhoneCallManagement;