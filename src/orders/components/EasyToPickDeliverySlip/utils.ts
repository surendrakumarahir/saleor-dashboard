import { type EasyToPickDeliverySlipData, type EasyToPickDeliverySlipItem } from "./types";

export const formatSlipDate = (dateString?: string | null): string => {
  if (!dateString) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  try {
    const d = new Date(dateString);

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatSlipMoney = (val: number): string => {
  return Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const mapOrderToDeliverySlip = (order: any): EasyToPickDeliverySlipData => {
  const address = order?.shippingAddress || order?.billingAddress;

  const recipientName =
    [address?.firstName, address?.lastName].filter(Boolean).join(" ").trim() ||
    order?.userEmail ||
    "Valued Customer";

  const recipientCompany = address?.companyName ? String(address.companyName).trim() : undefined;

  const streetPart1 = address?.streetAddress1 ? String(address.streetAddress1).trim() : "";
  const streetPart2 = address?.streetAddress2 ? String(address.streetAddress2).trim() : "";

  const city = address?.city ? String(address.city).trim() : "";
  const state = address?.countryArea ? String(address.countryArea).trim() : "";
  const pincode = address?.postalCode ? String(address.postalCode).trim() : "";
  const country = address?.country?.country ? String(address.country.country).trim() : "India";

  const addressLines: string[] = [];

  if (recipientCompany) {
    addressLines.push(recipientCompany);
  }

  if (streetPart1) {
    addressLines.push(streetPart1);
  }

  if (streetPart2) {
    addressLines.push(streetPart2);
  }

  const cityStatePin = [
    city,
    state ? (pincode ? `${state} - ${pincode}` : state) : pincode,
    country,
  ]
    .filter(Boolean)
    .join(", ");

  if (cityStatePin) {
    addressLines.push(cityStatePin);
  }

  const isPaid =
    Boolean(order?.isPaid) ||
    order?.chargeStatus === "FULL" ||
    order?.paymentStatus === "FULLY_CHARGED" ||
    order?.paymentStatus === "FULLY_PAID";

  const totalAmount = Number(order?.total?.gross?.amount || 0);
  const totalCaptured = Number(
    order?.totalCaptured?.amount ?? order?.totalCharged?.amount ?? (isPaid ? totalAmount : 0),
  );
  const amountToCollect = isPaid ? 0 : Math.max(0, totalAmount - totalCaptured);
  const paymentStatus: "PREPAID" | "COD" = isPaid || amountToCollect <= 0 ? "PREPAID" : "COD";

  const items: EasyToPickDeliverySlipItem[] = (order?.lines || []).map(
    (line: any, index: number) => {
      const qty = Number(line?.quantity || 1);
      let description = line?.productName || "Product";
      const variantName = line?.variant?.name;
      const sku = line?.productSku;

      if (variantName && variantName !== description && !description.includes(variantName)) {
        description = `${description} (${variantName})`;
      }

      return {
        sNo: index + 1,
        description,
        sku: sku || undefined,
        qty,
      };
    },
  );

  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);

  return {
    orderNumber: `${order?.number || ""}`,
    orderId: order?.id,
    date: formatSlipDate(order?.created),

    // Recipient
    recipientName,
    recipientCompany,
    addressLines,
    city,
    state,
    pincode,
    country,
    phone: address?.phone ? String(address.phone).trim() : undefined,
    email: order?.userEmail ? String(order.userEmail).trim() : undefined,
    customerNote: order?.customerNote ? String(order.customerNote).trim() : undefined,

    // Sender
    senderName: "EasyToPick",
    senderTagline: "Your Online Bookstore",
    senderAddress: "Kota, Rajasthan, India",
    senderCity: "Kota",
    senderState: "Rajasthan",
    senderPincode: "324005",
    senderCountry: "India",
    senderPhone: "+91 7976776446",
    senderEmail: "easytopickin@gmail.com",
    senderWebsite: "easytopick.in",

    // Payment
    paymentStatus,
    isPaid: paymentStatus === "PREPAID",
    totalAmount,
    amountToCollect,
    currency: order?.total?.gross?.currency || "INR",

    // Package & Items
    items,
    totalQuantity,
    shippingMethodName: order?.shippingMethodName || "Standard Express Courier",
  };
};
