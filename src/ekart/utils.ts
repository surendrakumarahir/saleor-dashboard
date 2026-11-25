export interface EkartFulfillmentInfo {
  isEkart: boolean;
  isActive: boolean;
  trackingId: string;
  trackingUrl: string;
  status: string;
  paymentMode: string;
  codAmount: string;
  service: string;
  weightGrams: string;
  dimensionsCm: string;
}

interface MetadataItemLike {
  key: string;
  value: string;
}

export const getPrivateMetadataValue = (
  privateMetadata: MetadataItemLike[] | null | undefined,
  key: string,
): string => {
  if (!privateMetadata) {
    return "";
  }

  return privateMetadata.find(item => item.key === key)?.value || "";
};

export const getEkartInfoFromFulfillment = (fulfillment: any): EkartFulfillmentInfo => {
  const pm = fulfillment?.privateMetadata as MetadataItemLike[] | undefined;
  const trackingId =
    getPrivateMetadataValue(pm, "ekart_tracking_id") || fulfillment?.trackingNumber || "";
  const ekartStatus = getPrivateMetadataValue(pm, "ekart_status");
  const isEkart = Boolean(getPrivateMetadataValue(pm, "ekart_tracking_id"));
  const trackingUrl =
    getPrivateMetadataValue(pm, "ekart_tracking_url") ||
    (trackingId ? `https://app.elite.ekartlogistics.in/track/${trackingId}` : "");

  return {
    isEkart,
    isActive: isEkart && ekartStatus !== "CANCELLED",
    trackingId,
    trackingUrl,
    status: ekartStatus,
    paymentMode: getPrivateMetadataValue(pm, "ekart_payment_mode"),
    codAmount: getPrivateMetadataValue(pm, "ekart_cod_amount"),
    service: getPrivateMetadataValue(pm, "ekart_service"),
    weightGrams: getPrivateMetadataValue(pm, "ekart_weight_grams"),
    dimensionsCm: getPrivateMetadataValue(pm, "ekart_dimensions_cm"),
  };
};

export const sanitizePhone10 = (rawPhone?: string | null): string => {
  let digits = (rawPhone || "").replace(/\D/g, "");

  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  return digits;
};

export const sanitizePincode6 = (rawPin?: string | null): string =>
  (rawPin || "").replace(/\D/g, "").slice(0, 6);

const base64ToPdfBlob = (base64: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: "application/pdf" });
};

export const openBase64Pdf = (base64: string, filename: string): void => {
  const blob = base64ToPdfBlob(base64);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");

  if (!win) {
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const downloadBase64Pdf = (base64: string, filename: string): void => {
  const blob = base64ToPdfBlob(base64);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
