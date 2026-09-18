import { EasyToPickInvoiceData, EasyToPickInvoiceItem } from "./types";

export const formatInvoiceDate = (dateString?: string | null): string => {
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

export const formatMoneyValue = (val: number): string => {
  return Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const mapOrderToEasyToPickInvoice = (
  order: any,
  selectedInvoiceId?: string,
): EasyToPickInvoiceData => {
  const matchingInvoice = selectedInvoiceId
    ? order?.invoices?.find((inv: any) => inv.id === selectedInvoiceId)
    : order?.invoices?.[0];

  const invoiceNumber = matchingInvoice?.number || order?.number ? `${order?.number}` : "INV";

  const invoiceDate = formatInvoiceDate(matchingInvoice?.createdAt || order?.created);

  const address = order?.billingAddress || order?.shippingAddress;
  const customerName =
    [address?.firstName, address?.lastName].filter(Boolean).join(" ").trim() ||
    order?.userEmail ||
    "Valued Customer";

  const streetPart = [address?.streetAddress1, address?.streetAddress2].filter(Boolean).join(", ");

  const cityStateZipPart = [
    address?.city,
    address?.countryArea
      ? `${address.countryArea} - ${address.postalCode || ""}`
      : address?.postalCode,
    address?.country?.country || "India",
  ]
    .filter(Boolean)
    .join(", ");

  const addressLines = [streetPart, cityStateZipPart].filter(Boolean);

  const isPaid =
    order?.isPaid ||
    order?.chargeStatus === "FULL" ||
    order?.paymentStatus === "FULLY_CHARGED" ||
    order?.paymentStatus === "FULLY_PAID";

  const totalAmount = Number(order?.total?.gross?.amount || 0);
  const totalCaptured = Number(
    order?.totalCaptured?.amount ?? order?.totalCharged?.amount ?? (isPaid ? totalAmount : 0),
  );
  const amountDue = isPaid ? 0 : Math.max(0, totalAmount - totalCaptured);

  const items: EasyToPickInvoiceItem[] = (order?.lines || []).map((line: any) => {
    const qty = Number(line?.quantity || 1);
    const sellingPrice = Number(line?.unitPrice?.gross?.amount || 0);
    const rawMrp = Number(line?.undiscountedUnitPrice?.gross?.amount || 0);
    const mrp = rawMrp > 0 ? Math.max(rawMrp, sellingPrice) : sellingPrice;
    const discountPercent =
      mrp > sellingPrice && mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
    const amount = Number(line?.totalPrice?.gross?.amount ?? qty * sellingPrice);

    let description = line?.productName || "Product";
    const variantName = line?.variant?.name;
    const sku = line?.productSku;

    if (variantName && variantName !== description && !description.includes(variantName)) {
      description = `${description} (${variantName})`;
    } else if (sku && !description.includes(sku)) {
      description = `${description} (${sku})`;
    }

    return {
      qty,
      description,
      sku: sku || undefined,
      mrp,
      sellingPrice,
      discountPercent,
      amount,
    };
  });

  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.qty, 0);
  const productSubtotal = Number(
    order?.subtotal?.gross?.amount ?? items.reduce((sum, item) => sum + item.amount, 0),
  );
  const productDiscount = Math.max(0, totalMrp - productSubtotal);
  const shipping = Number(order?.shippingPrice?.gross?.amount || 0);
  const tax = Number(order?.total?.tax?.amount || 0);
  const grandTotal = totalAmount > 0 ? totalAmount : productSubtotal + shipping + tax;

  return {
    invoiceNumber,
    orderNumber: `${order?.number || ""}`,
    date: invoiceDate,
    customerName,
    addressLines,
    phone: address?.phone || undefined,
    email: order?.userEmail || undefined,
    paymentStatus: isPaid ? "FULLY PAID" : amountDue > 0 ? "PARTIALLY PAID" : "UNPAID",
    amountDue,
    items,
    totalMrp,
    productDiscount,
    productSubtotal,
    shipping,
    tax,
    grandTotal,
    currency: order?.total?.gross?.currency || "INR",
  };
};
