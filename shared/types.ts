
export interface Order {
  id: string;
  customerName: string;
  orderDate: Date;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'expense' | 'income';
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  amount: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'KES' | 'AED' | 'AUD' | 'CAD' | 'JPY' | 'CNY';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}
