import { useState } from "react";
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
  TableCaption,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Info,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Trophy,
  Users,
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
import { useToast } from "@/hooks/use-toast";

// Sample data for commissions
const salesReps = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Senior Account Executive",
    team: "Enterprise",
    avatar: "/avatars/sarah.jpg",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 123-4567",
    commissionRate: 8.5,
    quota: 250000,
    ytdSales: 287500,
    quotaAttainment: 115,
    commissionEarned: 24437.5,
    pendingCommission: 3825.0,
    paidCommission: 20612.5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Account Executive",
    team: "Mid-Market",
    avatar: "/avatars/michael.jpg",
    email: "michael.chen@example.com",
    phone: "+1 (555) 234-5678",
    commissionRate: 7.0,
    quota: 180000,
    ytdSales: 215400,
    quotaAttainment: 120,
    commissionEarned: 15078.0,
    pendingCommission: 3500.0,
    paidCommission: 11578.0,
  },
  {
    id: 3,
    name: "David Rodriguez",
    role: "Sales Development Rep",
    team: "SMB",
    avatar: "/avatars/david.jpg",
    email: "david.rodriguez@example.com",
    phone: "+1 (555) 345-6789",
    commissionRate: 5.0,
    quota: 150000,
    ytdSales: 178600,
    quotaAttainment: 119,
    commissionEarned: 8930.0,
    pendingCommission: 2175.0,
    paidCommission: 6755.0,
  },
  {
    id: 4,
    name: "Emma Wilson",
    role: "Account Executive",
    team: "Mid-Market",
    avatar: "/avatars/emma.jpg",
    email: "emma.wilson@example.com",
    phone: "+1 (555) 456-7890",
    commissionRate: 7.0,
    quota: 180000,
    ytdSales: 163800,
    quotaAttainment: 91,
    commissionEarned: 11466.0,
    pendingCommission: 1925.0,
    paidCommission: 9541.0,
  },
  {
    id: 5,
    name: "James Taylor",
    role: "Sales Development Rep",
    team: "SMB",
    avatar: "/avatars/james.jpg",
    email: "james.taylor@example.com",
    phone: "+1 (555) 567-8901",
    commissionRate: 5.0,
    quota: 150000,
    ytdSales: 144200,
    quotaAttainment: 96,
    commissionEarned: 7210.0,
    pendingCommission: 1750.0,
    paidCommission: 5460.0,
  },
];

// Individual sales rep commission transactions
const commissionTransactions = [
  {
    id: 1,
    salesRepId: 1,
    date: "2023-04-15",
    type: "Earned",
    amount: 5100.0,
    status: "Paid",
    payDate: "2023-05-15",
    deal: "Acme Corporation - Enterprise Suite License",
    notes: "Q2 commission"
  },
  {
    id: 2,
    salesRepId: 1,
    date: "2023-05-02",
    type: "Adjustment",
    amount: 500.0,
    status: "Paid",
    payDate: "2023-05-15",
    deal: "Acme Corporation - Enterprise Suite License",
    notes: "Spiff bonus for Q2 performance"
  },
  {
    id: 3,
    salesRepId: 1,
    date: "2023-05-20",
    type: "Earned",
    amount: 3825.0,
    status: "Pending",
    payDate: "2023-06-15",
    deal: "TechStart Inc. - Professional Plan (Annual)",
    notes: "Pending payment approval"
  },
  {
    id: 4,
    salesRepId: 1,
    date: "2023-03-10",
    type: "Earned",
    amount: 15012.5,
    status: "Paid",
    payDate: "2023-04-15",
    deal: "Global Services Ltd. - Enterprise Implementation",
    notes: "Q1 commission"
  },
];

// Commission plans
const commissionPlans = [
  { 
    id: 1, 
    name: "Enterprise Tier", 
    description: "For senior sales executives selling to enterprise clients",
    baseRate: 7.0,
    accelerators: [
      { threshold: 100, rate: 8.5 },
      { threshold: 125, rate: 10.0 },
    ],
    bonuses: [
      { name: "New Logo Bonus", amount: "$1,000", description: "One-time bonus for each new client" },
      { name: "Multi-Year Contract", amount: "2% additional", description: "Added percentage for 3+ year contracts" }
    ],
    eligibleRoles: ["Senior Account Executive", "Enterprise Account Manager"]
  },
  { 
    id: 2, 
    name: "Mid-Market Tier", 
    description: "For account executives selling to mid-market businesses",
    baseRate: 6.0,
    accelerators: [
      { threshold: 100, rate: 7.0 },
      { threshold: 125, rate: 8.5 },
    ],
    bonuses: [
      { name: "New Logo Bonus", amount: "$500", description: "One-time bonus for each new client" },
      { name: "Upsell Bonus", amount: "1% additional", description: "Added percentage for upsells to existing clients" }
    ],
    eligibleRoles: ["Account Executive", "Mid-Market Account Manager"]
  },
  { 
    id: 3, 
    name: "SMB Tier", 
    description: "For sales development representatives and SMB account managers",
    baseRate: 4.0,
    accelerators: [
      { threshold: 100, rate: 5.0 },
      { threshold: 125, rate: 6.0 },
    ],
    bonuses: [
      { name: "Volume Bonus", amount: "$250", description: "Bonus for each 5 deals closed per quarter" },
      { name: "Renewal Rate Bonus", amount: "Up to $1,000", description: "Quarterly bonus based on renewal rate" }
    ],
    eligibleRoles: ["Sales Development Rep", "SMB Account Manager"]
  }
];

// Weekly commission forecasts
const commissionForecast = [
  { week: "Week 1", projected: 18500 },
  { week: "Week 2", projected: 22000 },
  { week: "Week 3", projected: 19500 },
  { week: "Week 4", projected: 25000 },
];

// Team performance data
const teamPerformance = [
  { team: "Enterprise", avgAttainment: 112, totalCommission: 56000 },
  { team: "Mid-Market", avgAttainment: 105, totalCommission: 42500 },
  { team: "SMB", avgAttainment: 98, totalCommission: 31200 },
];

// Monthly commission payout data
const monthlyPayouts = [
  { month: "Jan", amount: 42500 },
  { month: "Feb", amount: 38900 },
  { month: "Mar", amount: 45200 },
  { month: "Apr", amount: 51000 },
  { month: "May", amount: 61500 },
  { month: "Jun", amount: 58200 },
];

const COLORS = ["#4f46e5", "#60a5fa", "#22c55e", "#f59e0b"];

const CommissionTracker = () => {
  const { toast } = useToast();
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCommissionRules, setShowCommissionRules] = useState(false);
  const [showRepDetails, setShowRepDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter sales reps based on search term
  const filteredReps = salesReps.filter((rep) =>
    rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle exporting commissions data
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Export successful",
        description: "Commission data has been exported to CSV",
      });
    }, 1500);
  };

  // Handle viewing rep details
  const handleViewRep = (rep: any) => {
    setSelectedRep(rep);
    setShowRepDetails(true);
  };

  // Calculate total pending and paid commissions
  const totalPendingCommission = salesReps.reduce((total, rep) => total + rep.pendingCommission, 0);
  const totalPaidCommission = salesReps.reduce((total, rep) => total + rep.paidCommission, 0);
  const totalCommission = totalPendingCommission + totalPaidCommission;

  // Get commission transactions for selected rep
  const getRepTransactions = (repId: number) => {
    return commissionTransactions.filter(transaction => transaction.salesRepId === repId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commission Tracker</h2>
          <p className="text-muted-foreground">
            Track and manage sales commissions across your team
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sales reps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px] md:w-[250px]"
            />
          </div>
          <Select
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
          >
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
          <Dialog open={showCommissionRules} onOpenChange={setShowCommissionRules}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Plans & Rules
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Commission Plans & Rules</DialogTitle>
                <DialogDescription>
                  Configure commission structures, rates, and bonus rules
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="plans" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="plans">Commission Plans</TabsTrigger>
                  <TabsTrigger value="accelerators">Accelerators</TabsTrigger>
                  <TabsTrigger value="bonuses">Bonuses & SPIFFs</TabsTrigger>
                </TabsList>
                <TabsContent value="plans" className="pt-4">
                  <div className="space-y-4">
                    {commissionPlans.map(plan => (
                      <Card key={plan.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription>{plan.description}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="font-medium">Base Commission Rate:</span>
                              <span>{plan.baseRate}%</span>
                            </div>
                            
                            <div>
                              <div className="font-medium mb-2">Accelerators:</div>
                              <div className="space-y-2">
                                {plan.accelerators.map((accelerator, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>{accelerator.threshold}% quota attainment</span>
                                    <span>{accelerator.rate}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="font-medium mb-2">Eligible Roles:</div>
                              <div className="flex flex-wrap gap-2">
                                {plan.eligibleRoles.map((role, index) => (
                                  <Badge key={index} variant="secondary">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="flex justify-end">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Plan
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="accelerators" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Accelerator Rules</CardTitle>
                      <CardDescription>
                        Configure tiered commission rates based on quota attainment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-4">Enterprise Tier Accelerators</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span>0-100% of quota</span>
                                <div className="flex items-center gap-2">
                                  <Input className="w-16 text-right" defaultValue="7.0" />
                                  <span>%</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>100-125% of quota</span>
                                <div className="flex items-center gap-2">
                                  <Input className="w-16 text-right" defaultValue="8.5" />
                                  <span>%</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>125%+ of quota</span>
                                <div className="flex items-center gap-2">
                                  <Input className="w-16 text-right" defaultValue="10.0" />
                                  <span>%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-4">Mid-Market Tier Accelerators</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span>0-100% of quota</span>
                                <div className="flex items-center gap-2">
                                  <Input className="w-16 text-right" defaultValue="6.0" />
                                  <span>%</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>100-125% of quota</span>
                                <div className="flex items-center gap-2">
                                  <Input className="w-16 text-right" defaultValue="7.0" />
                                  <span>%</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>125%+ of quota</span>
                                <div className="flex items-center gap-2">
                                  <Input className="w-16 text-right" defaultValue="8.5" />
                                  <span>%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-4">Accelerator Settings</h4>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="retroactive"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                defaultChecked
                              />
                              <Label htmlFor="retroactive">
                                Apply accelerated rates retroactively to all sales
                              </Label>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="monthly-reset"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor="monthly-reset">
                                Reset accelerator tiers monthly
                              </Label>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button>Save Changes</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bonuses" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bonus & SPIFF Rules</CardTitle>
                      <CardDescription>
                        Configure additional incentives and special bonuses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid gap-4">
                          <div className="rounded-md border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Bonus Type</TableHead>
                                  <TableHead>Criteria</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Plan</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>New Logo Bonus</TableCell>
                                  <TableCell>New customer acquisition</TableCell>
                                  <TableCell>$500 - $1,000</TableCell>
                                  <TableCell>All plans</TableCell>
                                  <TableCell>
                                    <Badge>Active</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Multi-Year Contracts</TableCell>
                                  <TableCell>3+ year commitment</TableCell>
                                  <TableCell>+2% commission</TableCell>
                                  <TableCell>Enterprise</TableCell>
                                  <TableCell>
                                    <Badge>Active</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Upsell Bonus</TableCell>
                                  <TableCell>Expanding existing accounts</TableCell>
                                  <TableCell>+1% commission</TableCell>
                                  <TableCell>Mid-Market</TableCell>
                                  <TableCell>
                                    <Badge>Active</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Q2 Product SPIFF</TableCell>
                                  <TableCell>New enterprise module sales</TableCell>
                                  <TableCell>$1,500 per deal</TableCell>
                                  <TableCell>All plans</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">Scheduled</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Bonus
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commissions (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toLocaleString()}</div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <div className="flex justify-between w-full">
                  <span>Paid</span>
                  <span className="font-medium">${totalPaidCommission.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <div className="flex justify-between w-full">
                  <span>Pending</span>
                  <span className="font-medium">${totalPendingCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Forecasted Commissions (Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$85,000</div>
            <div className="h-10 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commissionForecast}>
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-right">
              Projected: +12.5% vs. last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Quota Attainment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">107%</div>
            <div className="mt-4 space-y-3">
              {teamPerformance.map((team) => (
                <div key={team.team} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{team.team}</span>
                    <span className="font-medium">{team.avgAttainment}%</span>
                  </div>
                  <Progress
                    value={team.avgAttainment}
                    className={`h-2 ${
                      team.avgAttainment >= 100 ? "bg-green-500/20" : "bg-yellow-500/20"
                    }`}
                    style={{
                      "--progress-background": team.avgAttainment >= 100 ? "rgb(34, 197, 94)" : "rgb(234, 179, 8)",
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Reps List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Sales Team Commissions</CardTitle>
          <CardDescription>
            Track individual performance and commission earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Quota</TableHead>
                  <TableHead className="text-right">Attainment</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Rate</TableHead>
                  <TableHead className="text-right">Earned (YTD)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReps.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <div className="font-medium">{rep.name}</div>
                    </TableCell>
                    <TableCell>{rep.role}</TableCell>
                    <TableCell className="hidden md:table-cell">{rep.team}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      ${rep.quota.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress 
                          value={Math.min(rep.quotaAttainment, 150)} 
                          className={`w-12 h-2 ${
                            rep.quotaAttainment >= 100 ? "bg-green-500/20" : "bg-yellow-500/20"
                          }`}
                          style={{
                            "--progress-background": rep.quotaAttainment >= 100 ? "rgb(34, 197, 94)" : "rgb(234, 179, 8)",
                          } as React.CSSProperties}
                        />
                        <span>{rep.quotaAttainment}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {rep.commissionRate}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${rep.commissionEarned.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" onClick={() => handleViewRep(rep)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Commission Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Commission Payments</CardTitle>
            <CardDescription>
              Historical commission payments by month
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyPayouts}
                margin={{
                  top: 5,
                  right: 20,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Distribution</CardTitle>
            <CardDescription>
              Breakdown by team and commission type
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full flex flex-col justify-center">
              <div className="h-4/5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamPerformance.map(team => ({
                        name: team.team,
                        value: team.totalCommission
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {teamPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {teamPerformance.map((team, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm">{team.team}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Sales reps with the highest performance this quarter
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Leaderboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesReps
              .sort((a, b) => b.quotaAttainment - a.quotaAttainment)
              .slice(0, 3)
              .map((rep, index) => (
                <div key={rep.id} className="flex flex-col items-center p-6 border rounded-lg">
                  <div className="relative mb-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {rep.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 p-1 rounded-full">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-center">{rep.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{rep.team} Team</p>
                  <div className="text-center mb-2">
                    <div className="text-xl font-bold">{rep.quotaAttainment}%</div>
                    <p className="text-sm text-muted-foreground">Quota Attainment</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">${rep.commissionEarned.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Commission Earned</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Rep Details Dialog */}
      {selectedRep && (
        <Dialog open={showRepDetails} onOpenChange={setShowRepDetails}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Sales Rep Details: {selectedRep.name}</DialogTitle>
              <DialogDescription>
                {selectedRep.role} • {selectedRep.team} Team
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Commission Transactions</TabsTrigger>
                <TabsTrigger value="settings">Commission Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          YTD Sales
                        </div>
                        <div className="text-2xl font-bold">
                          ${selectedRep.ytdSales.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Quota
                        </div>
                        <div className="text-2xl font-bold">
                          ${selectedRep.quota.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Attainment
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedRep.quotaAttainment}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Commission
                        </div>
                        <div className="text-2xl font-bold">
                          ${selectedRep.commissionEarned.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Commission Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                          <span>Base Commission Rate</span>
                          <span>{selectedRep.commissionRate}%</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedRep.quotaAttainment >= 100 ? (
                            <span className="text-green-500">
                              Rep is earning accelerated commission rates
                            </span>
                          ) : (
                            <span>
                              Standard rate applied based on {selectedRep.team} commission plan
                            </span>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>YTD Commission Earned</span>
                          <span className="font-medium">
                            ${selectedRep.commissionEarned.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commission Paid</span>
                          <span className="font-medium">
                            ${selectedRep.paidCommission.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commission Pending</span>
                          <span className="font-medium">
                            ${selectedRep.pendingCommission.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Performance Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: "Jan", attainment: 94 },
                          { month: "Feb", attainment: 102 },
                          { month: "Mar", attainment: 98 },
                          { month: "Apr", attainment: 105 },
                          { month: "May", attainment: 115 },
                        ]}
                        margin={{
                          top: 5,
                          right: 20,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, "Attainment"]} />
                        <Line
                          type="monotone"
                          dataKey="attainment"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#a5b4fc"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transactions" className="pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Commission Transactions</CardTitle>
                    <CardDescription>
                      Detailed history of all commission entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Deal/Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Payment Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getRepTransactions(selectedRep.id).map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{tx.date}</TableCell>
                              <TableCell>
                                <Badge variant={tx.type === "Adjustment" ? "secondary" : "outline"}>
                                  {tx.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {tx.deal}
                                {tx.notes && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {tx.notes}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${tx.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={tx.status === "Paid" ? "default" : "secondary"}>
                                  {tx.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {tx.payDate || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Transaction
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Rep Commission Settings</CardTitle>
                    <CardDescription>
                      Configure individual commission rates and targets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="commission-plan">Commission Plan</Label>
                          <Select defaultValue={selectedRep.team === "Enterprise" ? "1" : selectedRep.team === "Mid-Market" ? "2" : "3"}>
                            <SelectTrigger id="commission-plan">
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Enterprise Tier</SelectItem>
                              <SelectItem value="2">Mid-Market Tier</SelectItem>
                              <SelectItem value="3">SMB Tier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="base-rate">Base Commission Rate (%)</Label>
                          <Input
                            id="base-rate"
                            type="number"
                            step="0.1"
                            defaultValue={selectedRep.commissionRate}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="annual-quota">Annual Quota ($)</Label>
                          <Input
                            id="annual-quota"
                            type="number"
                            step="10000"
                            defaultValue={selectedRep.quota}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="quota-period">Quota Period</Label>
                          <Select defaultValue="annual">
                            <SelectTrigger id="quota-period">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label>Accelerator Eligibility</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="accelerator-eligible"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              defaultChecked
                            />
                            <Label htmlFor="accelerator-eligible" className="text-sm">
                              Apply plan accelerators when exceeding quota
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Special Incentives</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="new-logo-eligible"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              defaultChecked
                            />
                            <Label htmlFor="new-logo-eligible" className="text-sm">
                              Eligible for new logo bonuses
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="spiff-eligible"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              defaultChecked
                            />
                            <Label htmlFor="spiff-eligible" className="text-sm">
                              Eligible for SPIFFs and special promotions
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="retention-eligible"
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              defaultChecked
                            />
                            <Label htmlFor="retention-eligible" className="text-sm">
                              Eligible for renewal/retention bonuses
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button>Save Settings</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CommissionTracker;