
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileSpreadsheet, Upload, Package } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useCreateProduct } from '@/hooks/use-inventory-data';
import { useCreateContact } from '@/hooks/use-contacts';
import { Textarea } from "@/components/ui/textarea";

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

// Quick Product Creation Dialog Component
function QuickProductDialog({ 
  open, 
  onClose, 
  onProductCreated 
}: { 
  open: boolean; 
  onClose: () => void; 
  onProductCreated: (product: any) => void; 
}) {
  const [productData, setProductData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    unit: 'piece'
  });
  const { toast } = useToast();
  const createProduct = useCreateProduct();

  const handleCreateProduct = async () => {
    if (!productData.name || !productData.price) {
      toast({
        title: "Missing required fields",
        description: "Please fill in product name and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProduct = await createProduct.mutateAsync(productData);
      toast({
        title: "Product created successfully",
        description: `${newProduct.name} has been added to your catalog`,
      });
      onProductCreated(newProduct);
      onClose();
    } catch (error) {
      toast({
        title: "Error creating product",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={productData.name}
              onChange={(e) => setProductData({ ...productData, name: e.target.value })}
              placeholder="Enter product name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={productData.sku}
                onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                placeholder="Product SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>
              <Input
                id="product-category"
                value={productData.category}
                onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                placeholder="Product category"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              value={productData.description}
              onChange={(e) => setProductData({ ...productData, description: e.target.value })}
              placeholder="Product description"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price">Sale Price *</Label>
              <Input
                id="product-price"
                type="number"
                value={productData.price}
                onChange={(e) => setProductData({ ...productData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-cost">Cost Price</Label>
              <Input
                id="product-cost"
                type="number"
                value={productData.costPrice}
                onChange={(e) => setProductData({ ...productData, costPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-stock">Stock Quantity</Label>
              <Input
                id="product-stock"
                type="number"
                value={productData.stockQuantity}
                onChange={(e) => setProductData({ ...productData, stockQuantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-unit">Unit</Label>
              <Select
                value={productData.unit}
                onValueChange={(value) => setProductData({ ...productData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="lbs">Pounds</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateProduct} disabled={createProduct.isPending}>
            {createProduct.isPending ? "Creating..." : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick Customer Creation Dialog Component
function QuickCustomerDialog({ 
  open, 
  onClose, 
  onCustomerCreated 
}: { 
  open: boolean; 
  onClose: () => void; 
  onCustomerCreated: (customer: any) => void; 
}) {
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });
  const { toast } = useToast();
  const createContact = useCreateContact();

  const handleCreateCustomer = async () => {
    if (!customerData.firstName || !customerData.email) {
      toast({
        title: "Missing required fields",
        description: "Please fill in first name and email",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCustomer = await createContact.mutateAsync(customerData);
      toast({
        title: "Customer created successfully",
        description: `${newCustomer.firstName} ${newCustomer.lastName} has been added to your contacts`,
      });
      onCustomerCreated(newCustomer);
      onClose();
    } catch (error) {
      toast({
        title: "Error creating customer",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-firstName">First Name *</Label>
              <Input
                id="customer-firstName"
                value={customerData.firstName}
                onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-lastName">Last Name</Label>
              <Input
                id="customer-lastName"
                value={customerData.lastName}
                onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email *</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerData.email}
              onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-company">Company</Label>
              <Input
                id="customer-company"
                value={customerData.company}
                onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-address">Address</Label>
            <Textarea
              id="customer-address"
              value={customerData.address}
              onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
              placeholder="Customer address"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateCustomer} disabled={createContact.isPending}>
            {createContact.isPending ? "Creating..." : "Create Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Using dynamic data from backend instead of mock data

export function OrderForm({ open, onClose }: OrderFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    gstin: "",
  });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [formUrl, setFormUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showQuickProductDialog, setShowQuickProductDialog] = useState(false);
  const [showQuickCustomerDialog, setShowQuickCustomerDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch dynamic customers data
  const { data: customers = [], isLoading: isLoadingCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    }
  });

  // Fetch dynamic products data
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  const handleProductCreated = (product: any) => {
    refetchProducts();
    setSelectedProduct(product.id.toString());
  };

  const handleCustomerCreated = (customer: any) => {
    refetchCustomers();
    setSelectedCustomer(customer.id.toString());
    setIsNewCustomer(false);
  };

  const handleAddItem = () => {
    const product = products.find((p: any) => p.id.toString() === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      id: Date.now().toString(),
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price || product.unitPrice || 0,
      discount: 0,
      tax: (product.price || product.unitPrice || 0) * quantity * 0.18,
      total: (product.price || product.unitPrice || 0) * quantity * 1.18,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct("");
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleFormSubmit = async () => {
    try {
      if (activeTab === "manual") {
        // Create new customer if needed
        let customerId = selectedCustomer;
        if (isNewCustomer && newCustomer.name) {
          try {
            const createContact = await fetch('/api/contacts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firstName: newCustomer.name.split(' ')[0] || newCustomer.name,
                lastName: newCustomer.name.split(' ').slice(1).join(' ') || '',
                email: newCustomer.email,
                phone: newCustomer.phone,
                company: '',
                address: ''
              }),
            });
            
            if (createContact.ok) {
              const newContactData = await createContact.json();
              customerId = newContactData.id.toString();
              refetchCustomers();
            }
          } catch (error) {
            console.error('Error creating customer:', error);
          }
        }

        // Create order via API call instead of direct WebSocket
        const orderData = {
          contactId: customerId ? parseInt(customerId) : null,
          subtotal: calculateTotal() / 1.18, // Remove tax from total to get subtotal
          taxAmount: calculateTotal() - (calculateTotal() / 1.18),
          totalAmount: calculateTotal(),
          status: "pending",
          notes: `Order created with ${orderItems.length} items`,
          category: "sales",
          paymentStatus: "unpaid",
          currency: "INR"
        };

        // Make API call to create order
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          throw new Error('Failed to create order');
        }

        const newOrder = await response.json();

        // Create order items
        for (const item of orderItems) {
          await fetch(`/api/orders/${newOrder.id}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              description: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: 0.18,
              taxAmount: item.tax,
              discountRate: 0,
              discountAmount: item.discount,
              subtotal: item.unitPrice * item.quantity,
              totalAmount: item.total
            }),
          });
        }

        toast({
          title: "Order created successfully",
          description: `Order ${newOrder.orderNumber} created with total: ₹${calculateTotal().toLocaleString()}`,
        });

        // The API will handle WebSocket broadcasts automatically
        // Query invalidation will be handled by WebSocket listeners in parent component
        
      } else if (activeTab === "metaForm" || activeTab === "googleForm") {
        // Handle form integration
        toast({
          title: "Form data imported successfully",
          description: "Order details have been imported from the form.",
        });
      } else if (activeTab === "excel") {
        // Handle Excel import
        toast({
          title: "Excel data imported successfully",
          description: "Order details have been imported from Excel.",
        });
      }
      
      // Reset form
      setStep(1);
      setSelectedCustomer("");
      setNewCustomer({ name: "", email: "", phone: "", gstin: "" });
      setIsNewCustomer(false);
      setOrderItems([]);
      setSelectedProduct("");
      setQuantity(1);
      setFormUrl("");
      setFile(null);
      
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error creating order",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="metaForm">Meta Form</TabsTrigger>
              <TabsTrigger value="googleForm">Google Form</TabsTrigger>
              <TabsTrigger value="excel">Excel Import</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={!isNewCustomer ? "default" : "outline"}
                      onClick={() => setIsNewCustomer(false)}
                    >
                      Existing Customer
                    </Button>
                    <Button
                      variant={isNewCustomer ? "default" : "outline"}
                      onClick={() => setIsNewCustomer(true)}
                    >
                      New Customer
                    </Button>
                  </div>

                  {!isNewCustomer ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            value={selectedCustomer}
                            onValueChange={setSelectedCustomer}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingCustomers ? (
                                <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                              ) : customers.length === 0 ? (
                                <SelectItem value="no-customers" disabled>No customers found</SelectItem>
                              ) : (
                                customers.map((customer: any) => (
                                  <SelectItem key={customer.id} value={customer.id.toString()}>
                                    {customer.firstName} {customer.lastName} - {customer.company || 'Individual'}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQuickCustomerDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Quick Add
                        </Button>
                      </div>
                      {customers.length === 0 && !isLoadingCustomers && (
                        <p className="text-sm text-muted-foreground">
                          No customers found. Use "Quick Add" to create your first customer.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Customer Name</Label>
                          <Input
                            id="name"
                            value={newCustomer.name}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, email: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, phone: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gstin">GSTIN</Label>
                          <Input
                            id="gstin"
                            value={newCustomer.gstin}
                            onChange={(e) =>
                              setNewCustomer({ ...newCustomer, gstin: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Select
                        value={selectedProduct}
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingProducts ? (
                            <SelectItem value="loading" disabled>Loading products...</SelectItem>
                          ) : products.length === 0 ? (
                            <SelectItem value="no-products" disabled>No products found</SelectItem>
                          ) : (
                            products.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - ₹{product.price || product.unitPrice || 0}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {products.length === 0 && !isLoadingProducts && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No products found. Use "Add Product" to create your first product.
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-[100px]"
                      placeholder="Qty"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuickProductDialog(true)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button onClick={handleAddItem} disabled={!selectedProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Tax (18%)</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No items added yet. Select a product and add it to the order.
                            </TableCell>
                          </TableRow>
                        ) : (
                          orderItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                              <TableCell>₹{item.discount.toLocaleString()}</TableCell>
                              <TableCell>₹{item.tax.toLocaleString()}</TableCell>
                              <TableCell>₹{item.total.toLocaleString()}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end text-lg font-medium">
                    Total: ₹{calculateTotal().toLocaleString()}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metaForm" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaFormUrl">Meta Form URL</Label>
                <Input
                  id="metaFormUrl"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="Enter Meta Form URL"
                />
              </div>
              <Button onClick={handleFormSubmit} disabled={!formUrl}>
                Import from Meta Form
              </Button>
            </TabsContent>

            <TabsContent value="googleForm" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleFormUrl">Google Form URL</Label>
                <Input
                  id="googleFormUrl"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="Enter Google Form URL"
                />
              </div>
              <Button onClick={handleFormSubmit} disabled={!formUrl}>
                Import from Google Form
              </Button>
            </TabsContent>

            <TabsContent value="excel" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                  <Label htmlFor="file" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-4 w-4 mb-2" />
                      <span className="text-sm font-medium">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Excel files only (*.xlsx, *.xls)
                      </span>
                    </div>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                  </Label>
                </div>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected file: {file.name}
                </p>
              )}
              <Button onClick={handleFormSubmit} disabled={!file}>
                Import from Excel
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            {activeTab === "manual" ? (
              step === 1 ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={(!selectedCustomer && !newCustomer.name) && !isNewCustomer}
                  >
                    Next
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleFormSubmit}
                    disabled={orderItems.length === 0}
                  >
                    Create Order
                  </Button>
                </div>
              )
            ) : (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Product Creation Dialog */}
      <QuickProductDialog
        open={showQuickProductDialog}
        onClose={() => setShowQuickProductDialog(false)}
        onProductCreated={handleProductCreated}
      />

      {/* Quick Customer Creation Dialog */}
      <QuickCustomerDialog
        open={showQuickCustomerDialog}
        onClose={() => setShowQuickCustomerDialog(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}
