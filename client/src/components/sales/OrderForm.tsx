
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
import { Plus, Trash2, FileSpreadsheet, Upload } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';

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

const MOCK_CUSTOMERS = [
  { id: "1", name: "ABC Corporation", email: "contact@abc.com", gstin: "29ABCDE1234F1Z5" },
  { id: "2", name: "XYZ Ltd", email: "info@xyz.com", gstin: "27PQRST5678G1Z3" },
];

const MOCK_PRODUCTS = [
  { id: "1", name: "Laptop", price: 50000 },
  { id: "2", name: "Desktop", price: 45000 },
];

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
  const queryClient = useQueryClient();

  const handleAddItem = () => {
    const product = MOCK_PRODUCTS.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      id: Date.now().toString(),
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price,
      discount: 0,
      tax: product.price * quantity * 0.18,
      total: product.price * quantity * 1.18,
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
        const orderData = {
          id: `ORD-${Date.now()}`,
          customer: isNewCustomer ? newCustomer.name : MOCK_CUSTOMERS.find(c => c.id === selectedCustomer)?.name,
          items: orderItems,
          total: calculateTotal(),
          status: "Pending",
          date: new Date().toISOString()
        };

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
        const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws`);
        
        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({
            type: 'new_order',
            data: orderData
          }));
          setTimeout(() => ws.close(), 1000);
        });

        toast({
          title: "Order created successfully",
          description: `Order total: ₹${calculateTotal().toLocaleString()}`,
        });
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['salesMetrics']);
        queryClient.invalidateQueries(['salesData']);
        queryClient.invalidateQueries(['recentOrders']);
        queryClient.invalidateQueries(['topCustomers']);
        queryClient.invalidateQueries(['salesByCategory']);
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
      onClose();
    } catch (error) {
      toast({
        title: "Error creating order",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
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
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CUSTOMERS.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.gstin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_PRODUCTS.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ₹{product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-[100px]"
                  />
                  <Button onClick={handleAddItem}>
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
                      {orderItems.map((item) => (
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
                      ))}
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
                  disabled={!selectedCustomer && !newCustomer.name}
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
  );
}
