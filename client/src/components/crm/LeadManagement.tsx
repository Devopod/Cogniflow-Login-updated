import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  useLeads, 
  useCreateLead, 
  useUpdateLead, 
  useDeleteLead, 
  useConvertLead,
  useSendLeadEmail,
  useImportLeads,
  useExportLeads,
  useCrmRealTime,
  type Lead 
} from '@/hooks/use-crm-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ChevronDown,
  Download,
  FileText,
  Filter,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Upload,
  UserCheck,
  Users,
  X,
  Eye,
  Settings,
  BarChart3,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const LEAD_SOURCES = [
  'Website', 'Facebook Ad', 'Google Form', 'LinkedIn', 'Referral', 'Trade Show', 'Cold Call', 'Email Campaign'
];

const LEAD_STATUSES = [
  'new', 'contacted', 'qualified', 'unqualified', 'converted'
];

const LEAD_PRIORITIES = [
  'low', 'medium', 'high'
];

export default function LeadManagement() {
  const [currentTab, setCurrentTab] = useState('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<Lead>>({});
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [csvData, setCsvData] = useState('');

  // Enable real-time updates
  useCrmRealTime();

  // Fetch leads with filters
  const { data: leadsResponse, isLoading, error, refetch } = useLeads({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    status: statusFilter,
    source: sourceFilter,
    priority: priorityFilter,
  });

  // Mutations
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();
  const sendEmail = useSendLeadEmail();
  const importLeads = useImportLeads();
  const exportLeads = useExportLeads();

  const leads = leadsResponse?.leads || [];
  const pagination = leadsResponse?.pagination;

  // Form handlers
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead.mutateAsync(editingLead);
      setShowCreateDialog(false);
      setEditingLead({});
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;
    
    try {
      await updateLead.mutateAsync({ id: selectedLeadId, data: editingLead });
      setShowEditDialog(false);
      setEditingLead({});
      setSelectedLeadId(null);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLeadId) return;
    
    try {
      await deleteLead.mutateAsync(selectedLeadId);
      setShowDeleteDialog(false);
      setSelectedLeadId(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleConvertLead = async (leadId: number) => {
    try {
      await convertLead.mutateAsync(leadId);
      toast.success('Lead converted to contact successfully!');
    } catch (error) {
      console.error('Error converting lead:', error);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;
    
    try {
      await sendEmail.mutateAsync({ id: selectedLeadId, data: emailData });
      setShowEmailDialog(false);
      setEmailData({ subject: '', message: '' });
      setSelectedLeadId(null);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleImportLeads = async () => {
    if (!csvData.trim()) {
      toast.error('Please paste CSV data');
      return;
    }
    
    try {
      await importLeads.mutateAsync(csvData);
      setShowImportDialog(false);
      setCsvData('');
    } catch (error) {
      console.error('Error importing leads:', error);
    }
  };

  const handleExportLeads = async () => {
    try {
      await exportLeads.mutateAsync();
    } catch (error) {
      console.error('Error exporting leads:', error);
    }
  };

  // CSV file drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setSelectedLeadId(lead.id);
    setShowEditDialog(true);
  };

  const openEmailDialog = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setEmailData({
      subject: `Follow-up: ${lead.firstName} ${lead.lastName}`,
      message: `Hello ${lead.firstName},\n\nI wanted to follow up on your inquiry. Please let me know if you have any questions.\n\nBest regards,\nYour Sales Team`
    });
    setShowEmailDialog(true);
  };

  const openDeleteDialog = (leadId: number) => {
    setSelectedLeadId(leadId);
    setShowDeleteDialog(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'unqualified': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">Error Loading Leads</h3>
            <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Management</h2>
          <p className="text-muted-foreground">
            Manage your sales leads and track conversions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportLeads} disabled={exportLeads.isPending}>
            <Download className="h-4 w-4 mr-2" />
            {exportLeads.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {LEAD_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All sources</SelectItem>
                      {LEAD_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      {LEAD_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setSourceFilter('');
                      setPriorityFilter('');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leads ({pagination?.total || 0})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No leads found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter || sourceFilter || priorityFilter
                      ? "Try adjusting your filters"
                      : "Get started by adding your first lead"
                    }
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </div>
                          </TableCell>
                          <TableCell>{lead.company || '-'}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="text-sm text-muted-foreground">
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="text-sm text-muted-foreground">
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lead.source || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(lead.priority)}
                              <span className="text-sm">{lead.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.estimatedValue ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                {lead.estimatedValue.toLocaleString()}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View/Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEmailDialog(lead)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                {lead.status !== 'converted' && (
                                  <DropdownMenuItem onClick={() => handleConvertLead(lead.id)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Convert to Contact
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(lead.id)}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} results
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                          disabled={currentPage === pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Lead Analytics
              </CardTitle>
              <CardDescription>
                Insights into your lead performance and conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Analytics features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Lead Settings
              </CardTitle>
              <CardDescription>
                Configure lead assignment rules and automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Settings features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Lead Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setEditingLead({});
          setSelectedLeadId(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showCreateDialog ? 'Create New Lead' : 'Edit Lead'}
            </DialogTitle>
            <DialogDescription>
              {showCreateDialog 
                ? 'Enter the lead information below'
                : 'Update the lead information'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={showCreateDialog ? handleCreateLead : handleUpdateLead}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={editingLead.firstName || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={editingLead.lastName || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editingLead.company || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={editingLead.source || ''}
                  onValueChange={(value) => setEditingLead({ ...editingLead, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingLead.status || 'new'}
                  onValueChange={(value) => setEditingLead({ ...editingLead, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editingLead.priority || 'medium'}
                  onValueChange={(value) => setEditingLead({ ...editingLead, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  value={editingLead.estimatedValue || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, estimatedValue: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
                {(createLead.isPending || updateLead.isPending) ? 'Saving...' : 'Save Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send a follow-up email to the lead
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendEmail}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  rows={6}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={sendEmail.isPending}>
                {sendEmail.isPending ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogDescription>
              Import leads from a CSV file or paste CSV data directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the CSV file here...'
                  : 'Drag & drop a CSV file here, or click to select'}
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">or</div>
            <div className="space-y-2">
              <Label htmlFor="csvData">Paste CSV Data</Label>
              <Textarea
                id="csvData"
                placeholder="First Name,Last Name,Email,Phone,Company,Source&#10;John,Doe,john@example.com,123-456-7890,Acme Inc,Website"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={8}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Expected CSV format:</p>
              <p>First Name, Last Name, Email, Phone, Company, Source</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleImportLeads} 
              disabled={!csvData.trim() || importLeads.isPending}
            >
              {importLeads.isPending ? 'Importing...' : 'Import Leads'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLead}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}