export interface EasyToPickInvoiceItem {
  qty: number;
  description: string;
  sku?: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  amount: number;
}

export interface EasyToPickInvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  customerName: string;
  addressLines: string[];
  phone?: string;
  email?: string;
  paymentStatus: "FULLY PAID" | "PARTIALLY PAID" | "UNPAID";
  amountDue: number;
  items: EasyToPickInvoiceItem[];
  totalMrp: number;
  productDiscount: number;
  productSubtotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
}
