import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Filter,
  Play,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGenerateFinancialReport, useFinancialReports } from "@/hooks/use-finance-comprehensive";
import { formatCurrency } from "@/lib/utils";

export default function FinancialReports() {
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [reportFormat, setReportFormat] = useState<string>("pdf");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const { data: savedReports } = useFinancialReports();
  const generateReport = useGenerateFinancialReport();

  const reportTypes = [
    {
      id: "profit_loss",
      name: "Profit & Loss Statement",
      description: "Shows your company's revenues and expenses over a specific period",
      icon: TrendingUp,
      color: "green",
    },
    {
      id: "balance_sheet",
      name: "Balance Sheet", 
      description: "Provides a snapshot of your company's financial position at a specific point in time",
      icon: BarChart3,
      color: "blue",
    },
    {
      id: "cash_flow",
      name: "Cash Flow Statement",
      description: "Tracks the flow of cash in and out of your business",
      icon: DollarSign,
      color: "purple",
    },
    {
      id: "trial_balance",
      name: "Trial Balance",
      description: "Lists all general ledger account balances at a specific date",
      icon: PieChart,
      color: "orange",
    },
    {
      id: "general_ledger",
      name: "General Ledger",
      description: "Detailed record of all financial transactions",
      icon: FileText,
      color: "gray",
    },
  ];

  const quickDateRanges = [
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" },
    { label: "This Quarter", value: "this_quarter" },
    { label: "Last Quarter", value: "last_quarter" },
    { label: "This Year", value: "this_year" },
    { label: "Last Year", value: "last_year" },
  ];

  const setQuickDateRange = (range: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    switch (range) {
      case "this_month":
        setDateFrom(new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]);
        setDateTo(new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]);
        break;
      case "last_month":
        setDateFrom(new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]);
        setDateTo(new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]);
        break;
      case "this_quarter":
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        setDateFrom(new Date(currentYear, quarterStart, 1).toISOString().split('T')[0]);
        setDateTo(new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]);
        break;
      case "this_year":
        setDateFrom(new Date(currentYear, 0, 1).toISOString().split('T')[0]);
        setDateTo(new Date(currentYear, 11, 31).toISOString().split('T')[0]);
        break;
      case "last_year":
        setDateFrom(new Date(currentYear - 1, 0, 1).toISOString().split('T')[0]);
        setDateTo(new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]);
        break;
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType || !dateFrom || !dateTo) return;

    try {
      await generateReport.mutateAsync({
        reportType: selectedReportType as any,
        dateFrom,
        dateTo,
        format: reportFormat as any,
      });
      setShowGenerateDialog(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary', icon: Clock },
      generating: { label: 'Generating', variant: 'default', icon: Play },
      completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive financial reports and analysis</p>
        </div>
        
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Financial Report</DialogTitle>
              <DialogDescription>
                Select the report type and date range to generate your financial report.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <Label>Report Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedReportType === type.id 
                            ? `border-${type.color}-500 bg-${type.color}-50` 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        onClick={() => setSelectedReportType(type.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 text-${type.color}-600 mt-0.5`} />
                          <div>
                            <h4 className="font-medium text-sm">{type.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Date Ranges */}
              <div>
                <Label>Quick Select</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickDateRanges.map((range) => (
                    <Button
                      key={range.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickDateRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <Label htmlFor="format">Report Format</Label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={!selectedReportType || !dateFrom || !dateTo || generateReport.isPending}
                >
                  {generateReport.isPending ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="quick-reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-reports">Quick Reports</TabsTrigger>
          <TabsTrigger value="saved-reports">Saved Reports</TabsTrigger>
          <TabsTrigger value="scheduled-reports">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-reports" className="space-y-6">
          {/* Quick Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedReportType(type.id);
                        setShowGenerateDialog(true);
                      }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-${type.color}-100`}>
                        <Icon className={`h-5 w-5 text-${type.color}-600`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{type.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{type.description}</CardDescription>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Generate Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="saved-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Your previously generated financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              {savedReports?.length ? (
                <div className="space-y-4">
                  {savedReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted p-2 rounded-full">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{report.name}</h3>
                            {getStatusBadge(report.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Type: {report.reportType.replace('_', ' ')}</span>
                            <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {report.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No saved reports</p>
                  <p className="text-sm">Generate your first report to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automate report generation with scheduled reporting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Scheduled reports coming soon</p>
                <p className="text-sm">Set up automatic report generation on a schedule</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}