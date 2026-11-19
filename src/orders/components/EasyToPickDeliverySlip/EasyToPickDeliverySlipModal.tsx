import { useApolloClient } from "@apollo/client";
import { DashboardModal } from "@dashboard/components/Modal";
import { useOrderListQuery } from "@dashboard/graphql";
import { orderListQuery } from "@dashboard/orders/queries";
import { Box, Button } from "@saleor/macaw-ui-next";
import { Download, Layers, Loader2, Printer, X } from "lucide-react";
import { type ChangeEvent, type FC, useMemo, useState } from "react";

import { DeliverySlipCutLine, EasyToPickDeliverySlip } from "./EasyToPickDeliverySlip";
import {
  generateTwoUpDeliverySlipHtml,
  printEasyToPickDeliverySlips,
} from "./printDeliverySlip";
import { deliverySlipOrderQuery } from "./queries";
import { type EasyToPickDeliverySlipData } from "./types";
import { mapOrderToDeliverySlip } from "./utils";

interface EasyToPickDeliverySlipModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
}

export const EasyToPickDeliverySlipModal: FC<EasyToPickDeliverySlipModalProps> = ({
  open,
  onClose,
  order,
}) => {
  const apolloClient = useApolloClient();
  const [selectedSecondOrderId, setSelectedSecondOrderId] = useState<string>("");
  const [secondSlipData, setSecondSlipData] = useState<EasyToPickDeliverySlipData | null>(null);
  const [isLoadingSecond, setIsLoadingSecond] = useState<boolean>(false);
  const [manualOrderSearch, setManualOrderSearch] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");

  const handleClose = (): void => {
    setSelectedSecondOrderId("");
    setSecondSlipData(null);
    setManualOrderSearch("");
    setLoadError("");
    onClose();
  };

  const primarySlipData = useMemo(() => {
    if (!order) return null;

    return mapOrderToDeliverySlip(order);
  }, [order]);

  // Fetch recent orders for pairing on 2-on-1 A4 sheet
  const { data: orderListData } = useOrderListQuery({
    variables: { first: 50 },
    skip: !open,
  });

  const availableOrders = useMemo(() => {
    const edges = orderListData?.orders?.edges || [];

    return edges
      .map(edge => edge.node)
      .filter(node => String(node?.number) !== String(primarySlipData?.orderNumber));
  }, [orderListData, primarySlipData?.orderNumber]);

  const loadSecondOrderById = async (orderId: string): Promise<boolean> => {
    setLoadError("");
    setIsLoadingSecond(true);

    try {
      const res = await apolloClient.query({
        query: deliverySlipOrderQuery,
        variables: { id: orderId },
        fetchPolicy: "no-cache",
      });

      if (res?.data?.order) {
        setSecondSlipData(mapOrderToDeliverySlip(res.data.order));
        setSelectedSecondOrderId(orderId);

        return true;
      }

      setLoadError("Order details could not be found.");

      return false;
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load order.");

      return false;
    } finally {
      setIsLoadingSecond(false);
    }
  };

  const handleSelectSecondOrder = async (orderId: string): Promise<void> => {
    setSelectedSecondOrderId(orderId);

    if (!orderId) {
      setSecondSlipData(null);
      setLoadError("");

      return;
    }

    await loadSecondOrderById(orderId);
  };

  const handleManualSearch = async (): Promise<void> => {
    const raw = manualOrderSearch.trim();

    if (!raw) return;

    const cleanNum = raw.replace(/^#/, "").trim();

    // 1. Search in availableOrders first by number or ID
    const matched = availableOrders.find(
      o =>
        String(o.number) === cleanNum ||
        String(o.number) === raw ||
        String(o.id) === raw,
    );

    if (matched) {
      await loadSecondOrderById(matched.id);

      return;
    }

    // 2. Query order list by search to resolve number -> ID
    setIsLoadingSecond(true);
    setLoadError("");

    try {
      const listRes = await apolloClient.query({
        query: orderListQuery,
        variables: { search: cleanNum, first: 10 },
        fetchPolicy: "network-only",
      });

      const edges = listRes?.data?.orders?.edges || [];
      const found = edges.find((e: any) => String(e.node?.number) === cleanNum) || edges[0];

      if (found?.node?.id) {
        await loadSecondOrderById(found.node.id);

        return;
      }

      // 3. Fallback: try raw as global ID
      const ok = await loadSecondOrderById(raw);

      if (!ok) {
        setLoadError(`Order #${cleanNum} not found.`);
      }
    } catch (err: any) {
      setLoadError(err?.message || `Could not find order #${cleanNum}`);
    } finally {
      setIsLoadingSecond(false);
    }
  };

  if (!primarySlipData) {
    return null;
  }

  const slipsToPrint: EasyToPickDeliverySlipData[] = secondSlipData
    ? [primarySlipData, secondSlipData]
    : [primarySlipData];

  const handlePrint = (): void => {
    printEasyToPickDeliverySlips(slipsToPrint);
  };

  const handleDownloadHtml = (): void => {
    const html = generateTwoUpDeliverySlipHtml(slipsToPrint);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    const fileName = secondSlipData
      ? `DeliverySlips_#${primarySlipData.orderNumber}_#${secondSlipData.orderNumber}_A4.html`
      : `DeliverySlip_#${primarySlipData.orderNumber}.html`;

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardModal onChange={handleClose} open={open}>
      <DashboardModal.Content size="lg" overflowY="hidden" style={{ maxHeight: "92vh" }}>
        <DashboardModal.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" alignItems="center" gap={2}>
              <Layers size={18} />
              <span>
                Delivery Slip #{primarySlipData.orderNumber} &nbsp;—&nbsp;
                <strong style={{ color: "#0284c7" }}>2 Slips per A4 Page</strong>
              </span>
            </Box>
          </Box>
        </DashboardModal.Header>

        {/* Action bar and 2-on-1 A4 pairing control */}
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          paddingX={6}
          paddingY={3}
          backgroundColor="default2"
          borderBottomWidth={1}
          borderBottomStyle="solid"
          borderColor="default1"
        >
          {/* Pairing Toolbar */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={3}
          >
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                Pair on same A4 sheet:
              </span>
              <select
                value={selectedSecondOrderId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  handleSelectSecondOrder(e.target.value)
                }
                style={{
                  padding: "6px 10px",
                  borderRadius: "5px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  fontWeight: 600,
                  minWidth: "260px",
                  cursor: "pointer",
                }}
              >
                <option value="">-- None (Single Half-Sheet Slip) --</option>
                {availableOrders.map(node => (
                  <option key={node.id} value={node.id}>
                    Order #{node.number}{" "}
                    {node.billingAddress?.firstName
                      ? `(${node.billingAddress.firstName} ${node.billingAddress.lastName || ""})`
                      : node.userEmail
                        ? `(${node.userEmail})`
                        : ""}
                  </option>
                ))}
              </select>

              {/* Manual search input for any order number */}
              <Box display="flex" alignItems="center" gap={1}>
                <input
                  type="text"
                  placeholder="Or enter order #"
                  value={manualOrderSearch}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setManualOrderSearch(e.target.value)
                  }
                  onKeyDown={e => {
                    if (e.key === "Enter") handleManualSearch();
                  }}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "5px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "12.5px",
                    width: "140px",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
                  }}
                />
                <Button variant="secondary" onClick={handleManualSearch} size="small">
                  Load
                </Button>
              </Box>

              {isLoadingSecond && (
                <Box display="flex" alignItems="center" gap={1} style={{ color: "#0284c7" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>Loading 2nd order...</span>
                </Box>
              )}

              {loadError && (
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626" }}>
                  ⚠ {loadError}
                </span>
              )}
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              <Button variant="primary" onClick={handlePrint}>
                <Printer size={16} />
                <span>
                  {secondSlipData
                    ? `Print 2 Slips on 1 A4 Page (#${primarySlipData.orderNumber} & #${secondSlipData.orderNumber})`
                    : `Print Slip on A4 (#${primarySlipData.orderNumber})`}
                </span>
              </Button>
              <Button variant="secondary" onClick={handleDownloadHtml}>
                <Download size={16} />
                <span>Download HTML</span>
              </Button>
              <Button variant="tertiary" onClick={handleClose}>
                <X size={16} />
                <span>Close</span>
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Scrollable A4 Preview Area */}
        <Box
          padding={6}
          backgroundColor="default1"
          overflowY="auto"
          style={{ maxHeight: "calc(92vh - 150px)" }}
        >
          <Box
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1)",
              borderRadius: "6px",
              padding: "24px 36px",
            }}
          >
            {/* Top Slip (Order 1) */}
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#64748b",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ▲ Slip 1 (Top Half of A4 Sheet) — Order #{primarySlipData.orderNumber}
              </div>
              <EasyToPickDeliverySlip data={primarySlipData} compact />
            </div>

            {/* Scissor Cut Line Divider */}
            <DeliverySlipCutLine
              label={
                secondSlipData
                  ? `✂ CUT HERE — ORDER #${primarySlipData.orderNumber} (TOP) & ORDER #${secondSlipData.orderNumber} (BOTTOM) ✂`
                  : "✂ CUT HERE (2 SLIPS PER A4 SHEET) ✂"
              }
            />

            {/* Bottom Slip (Order 2) */}
            {secondSlipData ? (
              <div style={{ marginTop: "8px" }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  style={{ marginBottom: "4px" }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#0284c7",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ▼ Slip 2 (Bottom Half of A4 Sheet) — Order #{secondSlipData.orderNumber}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedSecondOrderId("");
                      setSecondSlipData(null);
                      setManualOrderSearch("");
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#dc2626",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✕ Remove from sheet
                  </button>
                </Box>
                <EasyToPickDeliverySlip data={secondSlipData} compact />
              </div>
            ) : (
              <div
                style={{
                  marginTop: "8px",
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: "4px",
                  padding: "30px 20px",
                  textAlign: "center",
                  color: "#64748b",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                  Second Half of A4 Sheet is Empty
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  Select an order from the dropdown above (e.g. <strong>Order #128</strong>) to
                  print 2 delivery slips on this single A4 sheet.
                </div>
              </div>
            )}
          </Box>
        </Box>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
