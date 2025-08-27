import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AccountFormProps {
  account?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function AccountForm({ account, onSubmit, isLoading, onCancel }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: account?.name || '',
      accountNumber: account?.accountNumber || '',
      accountType: account?.accountType || '',
      currency: account?.currency || 'USD',
      openingBalance: account?.openingBalance || 0,
      description: account?.description || '',
      isActive: account?.isActive ?? true,
    }
  });

  const accountTypes = [
    { value: "asset", label: "Asset" },
    { value: "liability", label: "Liability" },
    { value: "equity", label: "Equity" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expense" },
  ];

  const currencies = [
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "CAD", label: "Canadian Dollar (CAD)" },
    { value: "AUD", label: "Australian Dollar (AUD)" },
    { value: "JPY", label: "Japanese Yen (JPY)" },
    { value: "CHF", label: "Swiss Franc (CHF)" },
    { value: "CNY", label: "Chinese Yuan (CNY)" },
  ];

  const handleFormSubmit = (data: any) => {
    const formData = {
      ...data,
      openingBalance: parseFloat(data.openingBalance) || 0,
      currentBalance: account ? account.currentBalance : parseFloat(data.openingBalance) || 0,
    };
    
    onSubmit(formData);
  };

  const generateAccountNumber = () => {
    const type = watch('accountType');
    if (!type) return;

    // Generate account number based on type
    const typePrefix = {
      asset: '1',
      liability: '2',
      equity: '3',
      income: '4',
      expense: '5',
    };

    const prefix = typePrefix[type as keyof typeof typePrefix];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const accountNumber = `${prefix}${randomSuffix}`;
    
    setValue('accountNumber', accountNumber);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            {...register('name', { required: 'Account name is required' })}
            placeholder="Enter account name"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name?.message as string}</p>
          )}
        </div>

        {/* Account Number */}
        <div>
          <Label htmlFor="accountNumber">Account Number</Label>
          <div className="flex gap-2">
            <Input
              id="accountNumber"
              {...register('accountNumber')}
              placeholder="Auto-generated"
            />
            <Button
              type="button"
              variant="outline"
              onClick={generateAccountNumber}
              disabled={!watch('accountType')}
            >
              Generate
            </Button>
          </div>
        </div>

        {/* Account Type */}
        <div>
          <Label htmlFor="accountType">Account Type *</Label>
          <Select onValueChange={(value) => setValue('accountType', value)} defaultValue={account?.accountType}>
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountType && (
            <p className="text-sm text-red-600 mt-1">Account type is required</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select onValueChange={(value) => setValue('currency', value)} defaultValue={account?.currency || 'USD'}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Opening Balance */}
        <div>
          <Label htmlFor="openingBalance">Opening Balance</Label>
          <Input
            id="openingBalance"
            type="number"
            step="0.01"
            {...register('openingBalance')}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Optional description for this account"
          rows={3}
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={watch('isActive')}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
        <Label htmlFor="isActive">Account is active</Label>
      </div>

      {/* Account Type Info */}
      {watch('accountType') && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Account Type Information</h4>
          <div className="text-sm text-muted-foreground">
            {watch('accountType') === 'asset' && (
              <p>Assets represent resources owned by your business that have economic value. Examples: Cash, Bank accounts, Inventory, Equipment.</p>
            )}
            {watch('accountType') === 'liability' && (
              <p>Liabilities represent debts or obligations your business owes to others. Examples: Accounts payable, Loans, Credit cards.</p>
            )}
            {watch('accountType') === 'equity' && (
              <p>Equity represents the owner's interest in the business. Examples: Owner's equity, Retained earnings, Common stock.</p>
            )}
            {watch('accountType') === 'income' && (
              <p>Income accounts track money coming into your business. Examples: Sales revenue, Service income, Interest income.</p>
            )}
            {watch('accountType') === 'expense' && (
              <p>Expense accounts track money going out of your business. Examples: Office supplies, Rent, Utilities, Marketing.</p>
            )}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
}