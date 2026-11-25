// @ts-strict-ignore
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { ConfirmButton } from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import {
  EKART_CHECK_SERVICEABILITY_QUERY,
  EKART_CREATE_SHIPMENT_MUTATION,
  EKART_DEFAULTS_QUERY,
  EKART_DOWNLOAD_LABEL_MUTATION,
  EKART_ESTIMATE_RATES_QUERY,
  EKART_PICKUP_ADDRESSES_QUERY,
} from "@dashboard/ekart/queries";
import {
  downloadBase64Pdf,
  openBase64Pdf,
  sanitizePhone10,
  sanitizePincode6,
} from "@dashboard/ekart/utils";
import {
  OrderChargeStatusEnum,
  type OrderDetailsFragment,
  PaymentChargeStatusEnum,
} from "@dashboard/graphql";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Download,
  ExternalLink,
  PackageCheck,
  Printer,
  Truck,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface EkartShipmentModalProps {
  open: boolean;
  onClose: () => void;
  order?: OrderDetailsFragment;
  fulfillmentId?: string;
  onSuccess: () => Promise<void> | void;
}

type PaymentModeOption = "PREPAID" | "COD";
type ServiceOption = "SURFACE" | "EXPRESS";

interface CreatedResult {
  trackingId: string;
  trackingUrl: string;
  paymentMode: PaymentModeOption;
  codAmount: string;
  service: ServiceOption;
  weightGrams: number;
}

const getOrderWeightGrams = (order: any, fallback: number): number => {
  const val = Number(order?.weight?.value || 0);
  const unit = String(order?.weight?.unit || "").toUpperCase();

  if (!val || val <= 0) {
    return fallback;
  }

  if (unit === "KG" || unit === "KILOGRAM") {
    return Math.max(1, Math.round(val * 1000));
  }

  if (unit === "G" || unit === "GRAM") {
    return Math.max(1, Math.round(val));
  }

  return fallback;
};

export const EkartShipmentModal: React.FC<EkartShipmentModalProps> = ({
  open,
  onClose,
  order,
  fulfillmentId,
  onSuccess,
}) => {
  const notify = useNotifier();
  const apolloClient = useApolloClient();

  const { data: defaultsData } = useQuery(EKART_DEFAULTS_QUERY, {
    skip: !open,
    fetchPolicy: "cache-and-network",
  });
  const { data: addressesData } = useQuery(EKART_PICKUP_ADDRESSES_QUERY, {
    skip: !open,
    fetchPolicy: "network-only",
  });

  const defaults = defaultsData?.ekartDefaults;
  const pickupAddresses: any[] = addressesData?.ekartPickupAddresses || [];

  const shippingAddress = order?.shippingAddress;
  const sanitizedPhone = sanitizePhone10(shippingAddress?.phone || order?.billingAddress?.phone);
  const sanitizedPin = sanitizePincode6(shippingAddress?.postalCode);

  const { data: serviceabilityData, loading: serviceabilityLoading } = useQuery(
    EKART_CHECK_SERVICEABILITY_QUERY,
    {
      variables: { pincode: sanitizedPin },
      skip: !open || sanitizedPin.length !== 6 || !defaults?.configured,
      fetchPolicy: "network-only",
    },
  );

  const [createShipment, { loading: creating }] = useMutation(EKART_CREATE_SHIPMENT_MUTATION);
  const [downloadLabel, { loading: downloadingLabel }] = useMutation(EKART_DOWNLOAD_LABEL_MUTATION);

  const isOrderPaid = Boolean(
    order?.isPaid ||
      order?.chargeStatus === OrderChargeStatusEnum.FULL ||
      order?.paymentStatus === PaymentChargeStatusEnum.FULLY_CHARGED,
  );
  const totalGross = Number(order?.total?.gross?.amount || 0);
  const totalCaptured = Number(
    (order as any)?.totalCaptured?.amount ?? (isOrderPaid ? totalGross : 0),
  );
  const defaultCodAmount =
    Math.max(0, Number((totalGross - totalCaptured).toFixed(2))) || totalGross;

  const [weightGrams, setWeightGrams] = useState<string>("500");
  const [lengthCm, setLengthCm] = useState<string>("24");
  const [widthCm, setWidthCm] = useState<string>("18");
  const [heightCm, setHeightCm] = useState<string>("5");
  const [paymentMode, setPaymentMode] = useState<PaymentModeOption>("PREPAID");
  const [codAmount, setCodAmount] = useState<string>("0");
  const [service, setService] = useState<ServiceOption>("SURFACE");
  const [pickupAlias, setPickupAlias] = useState<string>("");
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>("");
  const [estimatingRates, setEstimatingRates] = useState<boolean>(false);
  const [rateResult, setRateResult] = useState<any>(null);
  const [rateError, setRateError] = useState<string>("");
  const [createdResult, setCreatedResult] = useState<CreatedResult | null>(null);
  const lastInitKeyRef = useRef<string>("");

  const clearRatePreview = () => {
    setRateResult(null);
    setRateError("");
  };

  useEffect(() => {
    if (!open || !order) {
      lastInitKeyRef.current = "";

      return;
    }

    const initKey = `${order.id}:${fulfillmentId || ""}`;

    if (lastInitKeyRef.current === initKey) {
      return;
    }

    lastInitKeyRef.current = initKey;

    setFormError("");
    clearRatePreview();
    setCreatedResult(null);

    const defWeight = defaults?.defaultWeightGrams || 500;

    setWeightGrams(String(getOrderWeightGrams(order, defWeight)));
    setLengthCm(String(defaults?.defaultLengthCm || 24));
    setWidthCm(String(defaults?.defaultWidthCm || 18));
    setHeightCm(String(defaults?.defaultHeightCm || 5));

    const initialMode: PaymentModeOption = isOrderPaid ? "PREPAID" : "COD";

    setPaymentMode(initialMode);
    setCodAmount(initialMode === "COD" ? String(defaultCodAmount) : "0");
    setService("SURFACE");
    setNotifyCustomer(true);
  }, [
    open,
    order?.id,
    fulfillmentId,
    defaults?.defaultWeightGrams,
    defaults?.defaultLengthCm,
    defaults?.defaultWidthCm,
    defaults?.defaultHeightCm,
    isOrderPaid,
    defaultCodAmount,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (pickupAddresses.length > 0 && !pickupAlias) {
      setPickupAlias(pickupAddresses[0].alias);
    } else if (defaults?.pickupAlias && !pickupAlias) {
      setPickupAlias(defaults.pickupAlias);
    }
  }, [open, pickupAddresses, defaults?.pickupAlias, pickupAlias]);

  const itemSummary = useMemo(() => {
    const lines = (order?.lines || []).filter(line =>
      fulfillmentId ? true : line.quantityToFulfill > 0,
    );

    if (!lines.length) {
      return "Order items";
    }

    return lines
      .map(
        line => `${line.productName} × ${fulfillmentId ? line.quantity : line.quantityToFulfill}`,
      )
      .join(", ");
  }, [order?.lines, fulfillmentId]);

  if (!order) {
    return null;
  }

  const customerName =
    [shippingAddress?.firstName, shippingAddress?.lastName].filter(Boolean).join(" ").trim() ||
    shippingAddress?.companyName ||
    order.userEmail ||
    `Customer #${order.number}`;

  const addressMissingError = !shippingAddress
    ? "Order has no shipping address."
    : sanitizedPin.length !== 6
      ? "Shipping pincode must be a valid 6-digit Indian pincode."
      : sanitizedPhone.length !== 10
        ? "Customer shipping phone must be a valid 10-digit mobile number."
        : "";

  const handlePaymentModeChange = (mode: PaymentModeOption) => {
    setPaymentMode(mode);
    clearRatePreview();

    if (mode === "COD" && (Number(codAmount) <= 0 || !codAmount)) {
      setCodAmount(String(defaultCodAmount || totalGross));
    }
  };

  const handleCheckRates = async () => {
    setFormError("");
    setRateError("");
    setRateResult(null);

    if (addressMissingError) {
      setFormError(addressMissingError);

      return;
    }

    const weightVal = parseInt(weightGrams, 10);
    const lengthVal = parseInt(lengthCm, 10);
    const widthVal = parseInt(widthCm, 10);
    const heightVal = parseInt(heightCm, 10);
    const codVal = paymentMode === "COD" ? parseFloat(codAmount) : 0;

    if (!weightVal || weightVal < 1 || !lengthVal || !widthVal || !heightVal) {
      setFormError("Enter valid weight (g) and box dimensions (L×W×H cm) to check charges.");

      return;
    }

    if (paymentMode === "COD" && (!codVal || codVal <= 0 || codVal > 49999)) {
      setFormError("COD amount must be between ₹1 and ₹49,999.");

      return;
    }

    setEstimatingRates(true);

    try {
      const response = await apolloClient.query({
        query: EKART_ESTIMATE_RATES_QUERY,
        variables: {
          orderId: order.id,
          weightGrams: weightVal,
          lengthCm: lengthVal,
          widthCm: widthVal,
          heightCm: heightVal,
          paymentMode,
          codAmount: paymentMode === "COD" ? codVal : 0,
          pickupAlias: pickupAlias || undefined,
        },
        fetchPolicy: "network-only",
      });

      const payload = response?.data?.ekartEstimateRates;

      if (!payload) {
        setRateError(
          response?.errors?.[0]?.message ||
            "No rate data returned from backend. Make sure Saleor API server was restarted.",
        );
      } else {
        setRateResult(payload);

        if (payload.error) {
          setRateError(payload.error);
        }
      }
    } catch (err: any) {
      setRateError(err?.message || "Failed to fetch Ekart shipping rates.");
    } finally {
      setEstimatingRates(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setFormError("");

    if (addressMissingError) {
      setFormError(addressMissingError);

      return;
    }

    const weightVal = parseInt(weightGrams, 10);
    const lengthVal = parseInt(lengthCm, 10);
    const widthVal = parseInt(widthCm, 10);
    const heightVal = parseInt(heightCm, 10);
    const codVal = paymentMode === "COD" ? parseFloat(codAmount) : 0;

    if (!weightVal || weightVal < 1) {
      setFormError("Please enter parcel weight in grams (at least 1g).");

      return;
    }

    if (!lengthVal || lengthVal < 1 || !widthVal || widthVal < 1 || !heightVal || heightVal < 1) {
      setFormError("Length, width, and height must each be at least 1 cm.");

      return;
    }

    if (paymentMode === "COD" && (!codVal || codVal <= 0 || codVal > 49999)) {
      setFormError("COD amount must be between ₹1 and ₹49,999.");

      return;
    }

    try {
      const { data } = await createShipment({
        variables: {
          orderId: order.id,
          input: {
            weightGrams: weightVal,
            lengthCm: lengthVal,
            widthCm: widthVal,
            heightCm: heightVal,
            paymentMode,
            codAmount: paymentMode === "COD" ? codVal : 0,
            service,
            pickupAlias: pickupAlias || undefined,
            fulfillmentId: fulfillmentId || undefined,
            notifyCustomer,
          },
        },
      });

      const res = data?.ekartCreateShipment;

      if (res?.errors?.length) {
        setFormError(res.errors.map((err: any) => err.message).join(" "));

        return;
      }

      if (!res?.trackingId) {
        setFormError("Ekart did not return a tracking ID.");

        return;
      }

      notify({
        status: "success",
        text: `Ekart parcel created! AWB: ${res.trackingId}`,
      });

      setCreatedResult({
        trackingId: res.trackingId,
        trackingUrl:
          res.trackingUrl || `https://app.elite.ekartlogistics.in/track/${res.trackingId}`,
        paymentMode,
        codAmount: String(codVal),
        service,
        weightGrams: weightVal,
      });

      await onSuccess();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create Ekart parcel.");
    }
  };

  const handleLabelAction = async (mode: "print" | "download") => {
    if (!createdResult?.trackingId) {
      return;
    }

    try {
      const { data } = await downloadLabel({
        variables: { trackingId: createdResult.trackingId },
      });
      const res = data?.ekartDownloadLabel;

      if (res?.errors?.length) {
        notify({
          status: "error",
          text: res.errors.map((e: any) => e.message).join(" "),
        });

        return;
      }

      if (res?.label?.pdfBase64) {
        if (mode === "print") {
          openBase64Pdf(res.label.pdfBase64, res.label.filename);
        } else {
          downloadBase64Pdf(res.label.pdfBase64, res.label.filename);
        }
      }
    } catch (err: any) {
      notify({
        status: "error",
        text: err?.message || "Failed to download Ekart label.",
      });
    }
  };

  const serviceability = serviceabilityData?.ekartCheckServiceability;

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    lineHeight: "20px",
    borderRadius: "6px",
    border: "1px solid #c7ccd1",
    backgroundColor: "transparent",
    color: "inherit",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <DashboardModal onChange={onClose} open={open}>
      <DashboardModal.Content size="sm" overflowY="auto" style={{ maxHeight: "92vh" }}>
        <DashboardModal.Header>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Box display="flex" alignItems="center" gap={2}>
              <Truck size={20} />
              <span>Create Ekart Parcel — Order #{order.number}</span>
            </Box>
            <Button variant="tertiary" size="small" icon={<X size={16} />} onClick={onClose} />
          </Box>
        </DashboardModal.Header>

        {createdResult ? (
          <DashboardModal.Grid>
            <Box
              padding={5}
              borderRadius={4}
              borderWidth={1}
              borderStyle="solid"
              borderColor="default1"
              backgroundColor="default2"
              display="flex"
              flexDirection="column"
              gap={3}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <PackageCheck size={22} color="#16a34a" />
                <Text size={5} fontWeight="bold">
                  Ekart Parcel Created Successfully
                </Text>
              </Box>
              <Box display="flex" flexDirection="column" gap={1}>
                <Text size={3}>
                  <strong>AWB / Tracking ID:</strong> {createdResult.trackingId}
                </Text>
                <Text size={3} color="default2">
                  Mode: <strong>{createdResult.paymentMode}</strong>
                  {createdResult.paymentMode === "COD"
                    ? ` (₹${createdResult.codAmount})`
                    : ""} • Service: <strong>{createdResult.service}</strong> • Weight:{" "}
                  <strong>{createdResult.weightGrams}g</strong>
                </Text>
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap" marginTop={2}>
                <Button
                  variant="primary"
                  onClick={() => handleLabelAction("print")}
                  disabled={downloadingLabel}
                >
                  <Printer size={16} />
                  <span>{downloadingLabel ? "Loading Label..." : "Print Ekart Label"}</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleLabelAction("download")}
                  disabled={downloadingLabel}
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => window.open(createdResult.trackingUrl, "_blank", "noopener")}
                >
                  <ExternalLink size={16} />
                  <span>Track on Ekart</span>
                </Button>
              </Box>
            </Box>

            <DashboardModal.Actions>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </DashboardModal.Actions>
          </DashboardModal.Grid>
        ) : (
          <form onSubmit={handleSubmit}>
            <DashboardModal.Grid>
              {defaults && !defaults.configured && (
                <Box
                  padding={3}
                  borderRadius={3}
                  style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b" }}
                  display="flex"
                  alignItems="flex-start"
                  gap={2}
                >
                  <AlertCircle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text size={2} style={{ color: "#92400e" }}>
                    Ekart API credentials (<code>EKART_CLIENT_ID</code>, <code>EKART_USERNAME</code>
                    , <code>EKART_PASSWORD</code>) are not yet set in the backend <code>.env</code>.
                  </Text>
                </Box>
              )}

              {/* Delivery Preview */}
              <Box
                padding={3}
                borderRadius={3}
                backgroundColor="default2"
                borderWidth={1}
                borderStyle="solid"
                borderColor="default1"
                display="flex"
                flexDirection="column"
                gap={1}
              >
                <Text size={2} fontWeight="bold">
                  Delivery Address &amp; Order Summary
                </Text>
                <Text size={2}>
                  {customerName} • {sanitizedPhone || "Missing phone"}
                </Text>
                <Text size={2} color="default2">
                  {[
                    shippingAddress?.streetAddress1,
                    shippingAddress?.streetAddress2,
                    shippingAddress?.city,
                    shippingAddress?.countryArea,
                    sanitizedPin,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                <Text size={2} color="default2">
                  Items: {itemSummary} • Order Total: ₹{totalGross.toFixed(2)}
                </Text>

                {sanitizedPin.length === 6 && defaults?.configured && (
                  <Box display="flex" alignItems="center" gap={1.5} marginTop={1}>
                    {serviceabilityLoading ? (
                      <Text size={2} color="default2">
                        Checking Ekart pincode serviceability...
                      </Text>
                    ) : serviceability?.status ? (
                      <>
                        <CheckCircle2 size={15} color="#16a34a" />
                        <Text size={2} style={{ color: "#15803d" }}>
                          Pincode {sanitizedPin} serviceable • Prepaid:{" "}
                          {serviceability.forwardDrop ? "Yes" : "Check"} • COD:{" "}
                          {serviceability.cod
                            ? `Yes (max ₹${serviceability.maxCodAmount ?? "49,999"})`
                            : "No"}
                        </Text>
                      </>
                    ) : serviceability ? (
                      <>
                        <AlertCircle size={15} color="#dc2626" />
                        <Text size={2} color="critical1">
                          {serviceability.error ||
                            serviceability.remark ||
                            `Pincode ${sanitizedPin} may not be serviceable.`}
                        </Text>
                      </>
                    ) : null}
                  </Box>
                )}
              </Box>

              {addressMissingError && (
                <Text size={2} color="critical1">
                  {addressMissingError}
                </Text>
              )}

              {/* Weight & Dimensions */}
              <Box display="flex" flexDirection="column" gap={3}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <label htmlFor="ekart-weight-grams">
                    <Text size={2} fontWeight="bold">
                      Parcel Weight (grams) *
                    </Text>
                  </label>
                  <input
                    id="ekart-weight-grams"
                    type="number"
                    min={1}
                    step={1}
                    value={weightGrams}
                    onChange={e => {
                      setWeightGrams(e.target.value);
                      clearRatePreview();
                    }}
                    placeholder="e.g. 500"
                    autoFocus
                    required
                    style={fieldStyle}
                  />
                  <Text size={1} color="default2">
                    Enter actual packed parcel weight in grams (e.g. 450, 800, 1200)
                  </Text>
                </Box>

                <Box display="grid" __gridTemplateColumns="repeat(3, 1fr)" gap={2}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <label htmlFor="ekart-length-cm">
                      <Text size={2} fontWeight="bold">
                        Length (cm) *
                      </Text>
                    </label>
                    <input
                      id="ekart-length-cm"
                      type="number"
                      min={1}
                      step={1}
                      value={lengthCm}
                      onChange={e => {
                        setLengthCm(e.target.value);
                        clearRatePreview();
                      }}
                      required
                      style={fieldStyle}
                    />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <label htmlFor="ekart-width-cm">
                      <Text size={2} fontWeight="bold">
                        Width (cm) *
                      </Text>
                    </label>
                    <input
                      id="ekart-width-cm"
                      type="number"
                      min={1}
                      step={1}
                      value={widthCm}
                      onChange={e => {
                        setWidthCm(e.target.value);
                        clearRatePreview();
                      }}
                      required
                      style={fieldStyle}
                    />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <label htmlFor="ekart-height-cm">
                      <Text size={2} fontWeight="bold">
                        Height (cm) *
                      </Text>
                    </label>
                    <input
                      id="ekart-height-cm"
                      type="number"
                      min={1}
                      step={1}
                      value={heightCm}
                      onChange={e => {
                        setHeightCm(e.target.value);
                        clearRatePreview();
                      }}
                      required
                      style={fieldStyle}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Payment Mode: COD vs Prepaid */}
              <Box display="flex" flexDirection="column" gap={2}>
                <Text size={2} fontWeight="bold">
                  Payment Mode *
                </Text>
                <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={2}>
                  <Button
                    type="button"
                    variant={paymentMode === "PREPAID" ? "primary" : "secondary"}
                    onClick={() => handlePaymentModeChange("PREPAID")}
                  >
                    Prepaid (Already Paid)
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMode === "COD" ? "primary" : "secondary"}
                    onClick={() => handlePaymentModeChange("COD")}
                  >
                    COD (Cash on Delivery)
                  </Button>
                </Box>

                {paymentMode === "COD" && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <label htmlFor="ekart-cod-amount">
                      <Text size={2} fontWeight="bold">
                        COD Amount to Collect (INR) *
                      </Text>
                    </label>
                    <input
                      id="ekart-cod-amount"
                      type="number"
                      min={1}
                      max={49999}
                      step="0.01"
                      value={codAmount}
                      onChange={e => {
                        setCodAmount(e.target.value);
                        clearRatePreview();
                      }}
                      required
                      style={fieldStyle}
                    />
                    <Text size={1} color="default2">
                      Max ₹49,999 allowed by Ekart for COD shipments
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Service & Pickup Location */}
              <Box
                display="grid"
                __gridTemplateColumns={pickupAddresses.length > 0 ? "1fr 1fr" : "1fr"}
                gap={2}
              >
                <Box display="flex" flexDirection="column" gap={1}>
                  <label htmlFor="ekart-service-type">
                    <Text size={2} fontWeight="bold">
                      Service Type
                    </Text>
                  </label>
                  <select
                    id="ekart-service-type"
                    value={service}
                    onChange={e => setService(e.target.value as ServiceOption)}
                    style={fieldStyle}
                  >
                    <option value="SURFACE">SURFACE (Standard)</option>
                    <option value="EXPRESS">EXPRESS (Air / Fast)</option>
                  </select>
                </Box>

                {pickupAddresses.length > 0 && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <label htmlFor="ekart-pickup-alias">
                      <Text size={2} fontWeight="bold">
                        Pickup Warehouse
                      </Text>
                    </label>
                    <select
                      id="ekart-pickup-alias"
                      value={pickupAlias}
                      onChange={e => {
                        setPickupAlias(e.target.value);
                        clearRatePreview();
                      }}
                      style={fieldStyle}
                    >
                      {pickupAddresses.map((addr: any) => (
                        <option key={addr.alias} value={addr.alias}>
                          {addr.alias} ({addr.pincode})
                        </option>
                      ))}
                    </select>
                  </Box>
                )}
              </Box>

              {/* Check Charges Before Booking */}
              <Box
                padding={3}
                borderRadius={3}
                backgroundColor="default2"
                borderWidth={1}
                borderStyle="solid"
                borderColor="default1"
                display="flex"
                flexDirection="column"
                gap={2}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                  <Box>
                    <Text size={2} fontWeight="bold" display="block">
                      Shipping Rate Estimate (Before Booking)
                    </Text>
                    <Text size={1} color="default2">
                      Check Ekart charges &amp; delivery time before creating the real parcel.
                    </Text>
                  </Box>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={handleCheckRates}
                    disabled={estimatingRates || Boolean(addressMissingError)}
                  >
                    <Calculator size={14} />
                    <span>{estimatingRates ? "Checking..." : "Check Price"}</span>
                  </Button>
                </Box>

                {!estimatingRates && (rateError || rateResult?.quotes?.length > 0) && (
                  <>
                    {rateError && (
                      <Text size={2} color="critical1">
                        {rateError}
                      </Text>
                    )}

                    {rateResult?.quotes?.length > 0 && (
                      <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={2}>
                        {rateResult.quotes.map((quote: any) => {
                          const isSelected = service === quote.service;
                          const actualW = parseInt(weightGrams, 10) || 0;
                          const volW = quote.volumetricWeightGrams || 0;

                          return (
                            <Box
                              key={quote.service}
                              padding={2.5}
                              borderRadius={3}
                              backgroundColor="default1"
                              style={{
                                cursor: quote.available ? "pointer" : "not-allowed",
                                border: isSelected ? "2px solid #2563eb" : "1px solid #d1d5db",
                                opacity: quote.available ? 1 : 0.7,
                              }}
                              onClick={() => {
                                if (quote.available) {
                                  setService(quote.service as ServiceOption);
                                }
                              }}
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Text size={2} fontWeight="bold">
                                  {quote.service}
                                </Text>
                                {quote.available && quote.totalEstimate && (
                                  <Text size={3} fontWeight="bold" style={{ color: "#15803d" }}>
                                    ₹{quote.totalEstimate}
                                  </Text>
                                )}
                              </Box>

                              {quote.available ? (
                                <Box display="flex" flexDirection="column" gap={0.5} marginTop={1}>
                                  {(quote.tatMin || quote.tatMax) && (
                                    <Text size={1} color="default2">
                                      Est. Delivery: {quote.tatMin ?? "?"}–{quote.tatMax ?? "?"}{" "}
                                      days
                                      {quote.zone ? ` • Zone ${quote.zone}` : ""}
                                    </Text>
                                  )}
                                  <Text size={1} color="default2">
                                    Freight: ₹{quote.forwardFreight || "0"} • Fuel: ₹
                                    {quote.fuelSurcharge || "0"}
                                    {paymentMode === "COD"
                                      ? ` • COD: ₹${quote.codCharges || "0"}`
                                      : ""}
                                    {quote.taxes ? ` • Tax: ₹${quote.taxes}` : ""}
                                  </Text>
                                  {quote.rtoEstimate && (
                                    <Text size={1} color="default2">
                                      RTO Estimate: ₹{quote.rtoEstimate}
                                    </Text>
                                  )}
                                  {volW > actualW && (
                                    <Text size={1} style={{ color: "#b45309" }}>
                                      Volumetric: {volW}g (billed on{" "}
                                      {quote.billingWeightGrams || volW}g)
                                    </Text>
                                  )}
                                </Box>
                              ) : (
                                <Text size={1} color="critical1">
                                  {quote.error || "Not available for this route"}
                                </Text>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </>
                )}
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifyCustomer}
                    onChange={e => setNotifyCustomer(e.target.checked)}
                    color="primary"
                  />
                }
                label="Send fulfillment tracking notification email to customer"
              />

              {formError && (
                <Box
                  padding={3}
                  borderRadius={3}
                  style={{ backgroundColor: "#fef2f2", border: "1px solid #ef4444" }}
                >
                  <Text size={2} color="critical1">
                    {formError}
                  </Text>
                </Box>
              )}

              <DashboardModal.Actions>
                <Button type="button" variant="secondary" onClick={onClose} disabled={creating}>
                  Cancel
                </Button>
                <ConfirmButton
                  type="submit"
                  transitionState={creating ? "loading" : "default"}
                  disabled={creating || Boolean(addressMissingError)}
                >
                  Create Ekart Parcel
                </ConfirmButton>
              </DashboardModal.Actions>
            </DashboardModal.Grid>
          </form>
        )}
      </DashboardModal.Content>
    </DashboardModal>
  );
};
