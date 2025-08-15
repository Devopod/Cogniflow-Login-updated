import { useState } from "react";
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-inventory-data';
import { Product } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

// Simplified product categories
const productCategories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Office Supplies" },
  { id: 3, name: "Furniture" },
  { id: 4, name: "Machinery" },
  { id: 5, name: "Raw Materials" },
  { id: 6, name: "IT Equipment" },
  { id: 7, name: "Safety Gear" },
  { id: 8, name: "Tools" },
  { id: 9, name: "Parts & Components" },
  { id: 10, name: "Other" },
];

const SimpleProductForm: React.FC<SimpleProductFormProps> = ({
  open,
  onOpenChange,
  product,
  mode
}) => {
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  
  // Only 6 main fields for the simplified form
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    quantity: product?.quantity || 0,
    unitPrice: product?.unitPrice || 0,
    description: product?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    if (formData.unitPrice <= 0) {
      newErrors.unitPrice = 'Unit price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        description: formData.description.trim(),
        // Set reasonable defaults for other fields
        status: 'active' as const,
        reorderLevel: Math.max(5, Math.floor(Number(formData.quantity) * 0.2)), // 20% of initial stock
        location: 'Main Warehouse', // Default location
        createdAt: mode === 'create' ? new Date() : product?.createdAt,
        updatedAt: new Date(),
      };

      if (mode === 'create') {
        await createProduct.mutateAsync(productData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      } else if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...productData });
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      unitPrice: 0,
      description: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    if (mode === 'create') {
      resetForm();
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Enter the essential product details to add to your inventory.'
              : 'Update the product information.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Product Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* SKU */}
          <div className="grid gap-2">
            <Label htmlFor="sku">
              SKU <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sku"
              placeholder="Enter stock keeping unit"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className={errors.sku ? 'border-red-500' : ''}
            />
            {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger id="category" className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {productCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Quantity */}
          <div className="grid gap-2">
            <Label htmlFor="quantity">
              Initial Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
          </div>

          {/* Unit Price */}
          <div className="grid gap-2">
            <Label htmlFor="unitPrice">
              Unit Price ($) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-gray-500">$</span>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`pl-7 ${errors.unitPrice ? 'border-red-500' : ''}`}
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
            {errors.unitPrice && <p className="text-sm text-red-500">{errors.unitPrice}</p>}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter product description (optional)"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Add Product' : 'Update Product'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleProductForm;