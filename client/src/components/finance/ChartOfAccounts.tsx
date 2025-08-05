import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  CreditCard,
  Banknote
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, useAccountGroups, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import AccountForm from "./AccountForm";

export default function ChartOfAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: accountGroups } = useAccountGroups();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const accountTypes = [
    { value: "asset", label: "Assets", icon: Building, color: "blue" },
    { value: "liability", label: "Liabilities", icon: CreditCard, color: "red" },
    { value: "equity", label: "Equity", icon: TrendingUp, color: "green" },
    { value: "income", label: "Income", icon: DollarSign, color: "emerald" },
    { value: "expense", label: "Expenses", icon: Banknote, color: "orange" },
  ];

  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || account.accountType === selectedType;
    return matchesSearch && matchesType;
  });

  const groupedAccounts = accountTypes.reduce((acc, type) => {
    acc[type.value] = filteredAccounts?.filter(account => account.accountType === type.value) || [];
    return acc;
  }, {} as Record<string, any[]>);

  const toggleGroup = (groupType: string) => {
    const groupIndex = expandedGroups.indexOf(groupType as any);
    if (groupIndex === -1) {
      setExpandedGroups([...expandedGroups, groupType as any]);
    } else {
      setExpandedGroups(expandedGroups.filter(g => g !== groupType));
    }
  };

  const handleCreateAccount = async (accountData: any) => {
    try {
      await createAccount.mutateAsync(accountData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleUpdateAccount = async (accountData: any) => {
    try {
      await updateAccount.mutateAsync({ id: selectedAccount.id, ...accountData });
      setShowEditDialog(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await deleteAccount.mutateAsync(accountId);
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const getAccountTypeIcon = (type: string) => {
    const typeConfig = accountTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || DollarSign;
    return <Icon className="h-4 w-4" />;
  };

  const getAccountTypeColor = (type: string) => {
    const typeConfig = accountTypes.find(t => t.value === type);
    return typeConfig?.color || "gray";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search accounts..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Account Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Types</SelectItem>
              {accountTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new account to your chart of accounts.
              </DialogDescription>
            </DialogHeader>
            <AccountForm
              onSubmit={handleCreateAccount}
              isLoading={createAccount.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {accountTypes.map((type) => {
          const typeAccounts = groupedAccounts[type.value] || [];
          const totalBalance = typeAccounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);
          const Icon = type.icon;
          
          return (
            <Card key={type.value} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedType(selectedType === type.value ? "" : type.value)}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{type.label}</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(totalBalance)}</h3>
                  </div>
                  <div className={`p-2 rounded-full bg-${type.color}-100`}>
                    <Icon className={`h-5 w-5 text-${type.color}-600`} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">
                    {typeAccounts.length} accounts
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>
            Manage your organization's accounting structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="text-center py-8">Loading accounts...</div>
          ) : !accounts?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No accounts found</p>
              <p className="text-sm">Create your first account to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accountTypes.map((type) => {
                const typeAccounts = groupedAccounts[type.value] || [];
                const isExpanded = expandedGroups.includes(type.value as any);
                const Icon = type.icon;
                
                if (typeAccounts.length === 0 && selectedType && selectedType !== type.value) {
                  return null;
                }

                return (
                  <div key={type.value} className="border rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div
                      className="flex items-center justify-between p-4 bg-accent/50 cursor-pointer hover:bg-accent"
                      onClick={() => toggleGroup(type.value)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold">{type.label}</h3>
                        <Badge variant="secondary">{typeAccounts.length}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(typeAccounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0))}
                        </p>
                      </div>
                    </div>

                    {/* Accounts List */}
                    {isExpanded && (
                      <div className="divide-y">
                        {typeAccounts.map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-4 hover:bg-accent/25">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-8 bg-${getAccountTypeColor(account.accountType)}-500 rounded-full`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{account.name}</h4>
                                    {!account.isActive && (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Code: {account.accountNumber || 'N/A'}</span>
                                    <span>Type: {account.accountType}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(account.currentBalance || 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Opening: {formatCurrency(account.openingBalance || 0)}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // View account details
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setShowEditDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAccount(account.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Account Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update account information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <AccountForm
              account={selectedAccount}
              onSubmit={handleUpdateAccount}
              isLoading={updateAccount.isPending}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedAccount(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}