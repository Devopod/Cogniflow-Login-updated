import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SupplierFormProps {
  supplier?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function SupplierForm({ supplier, onSubmit, isLoading, onCancel }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: supplier?.name || '',
      contactPerson: supplier?.contactPerson || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      address: supplier?.address || '',
      city: supplier?.city || '',
      state: supplier?.state || '',
      postalCode: supplier?.postalCode || '',
      country: supplier?.country || 'US',
      website: supplier?.website || '',
      taxId: supplier?.taxId || '',
      paymentTerms: supplier?.paymentTerms || 'Net 30',
      creditLimit: supplier?.creditLimit || 0,
      currency: supplier?.currency || 'USD',
      status: supplier?.status || 'active',
      notes: supplier?.notes || '',
      isPreferred: supplier?.isPreferred || false,
    }
  });

  const paymentTermsOptions = [
    { value: "Net 15", label: "Net 15 Days" },
    { value: "Net 30", label: "Net 30 Days" },
    { value: "Net 45", label: "Net 45 Days" },
    { value: "Net 60", label: "Net 60 Days" },
    { value: "Due on Receipt", label: "Due on Receipt" },
    { value: "2/10 Net 30", label: "2/10 Net 30" },
    { value: "COD", label: "Cash on Delivery" },
  ];

  const currencies = [
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "CAD", label: "Canadian Dollar (CAD)" },
    { value: "AUD", label: "Australian Dollar (AUD)" },
    { value: "JPY", label: "Japanese Yen (JPY)" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending Approval" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Company name is required' })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <Input
              id="contactPerson"
              {...register('contactPerson', { required: 'Contact person is required' })}
              className={errors.contactPerson ? 'border-red-500' : ''}
            />
            {errors.contactPerson && (
              <p className="text-sm text-red-500 mt-1">{errors.contactPerson.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://"
              {...register('website')}
            />
          </div>

          <div>
            <Label htmlFor="taxId">Tax ID / VAT Number</Label>
            <Input
              id="taxId"
              {...register('taxId')}
            />
          </div>
        </div>

        {/* Address & Business Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Address & Business Details</h3>
          
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Textarea
              id="address"
              rows={2}
              {...register('address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register('state')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select 
                value={watch('country')} 
                onValueChange={(value) => setValue('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Select 
              value={watch('paymentTerms')} 
              onValueChange={(value) => setValue('paymentTerms', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Payment Terms" />
              </SelectTrigger>
              <SelectContent>
                {paymentTermsOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                {...register('creditLimit', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={watch('currency')} 
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
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
          </div>
        </div>
      </div>

      {/* Status and Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Status & Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={watch('status')} 
              onValueChange={(value) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPreferred"
              checked={watch('isPreferred')}
              onCheckedChange={(checked) => setValue('isPreferred', checked)}
            />
            <Label htmlFor="isPreferred">Preferred Supplier</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Additional notes about this supplier..."
            {...register('notes')}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
        </Button>
      </div>
    </form>
  );
}