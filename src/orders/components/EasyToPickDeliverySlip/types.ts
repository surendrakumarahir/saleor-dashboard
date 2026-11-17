export interface EasyToPickDeliverySlipItem {
  sNo: number;
  description: string;
  sku?: string;
  qty: number;
}

export interface EasyToPickDeliverySlipData {
  orderNumber: string;
  orderId?: string;
  date: string;

  // Recipient (Deliver To)
  recipientName: string;
  recipientCompany?: string;
  addressLines: string[];
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
  email?: string;
  customerNote?: string;

  // Sender (From)
  senderName: string;
  senderTagline: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderPincode: string;
  senderCountry: string;
  senderPhone: string;
  senderEmail: string;
  senderWebsite: string;
  returnInstructions?: string;

  // Payment
  paymentStatus: "PREPAID" | "COD";
  isPaid: boolean;
  totalAmount: number;
  amountToCollect: number;
  currency: string;

  // Package & Items
  items: EasyToPickDeliverySlipItem[];
  totalQuantity: number;
  shippingMethodName?: string;
}
