import { useApolloClient } from "@apollo/client";
import { DashboardModal } from "@dashboard/components/Modal";
import { useOrderListQuery } from "@dashboard/graphql";
import { Box, Button } from "@saleor/macaw-ui-next";
import { Check, Download, Layers, Loader2, Printer, Search, X } from "lucide-react";
import { type ChangeEvent, type FC, useMemo, useState } from "react";

import {
  generateTwoUpDeliverySlipHtml,
  printEasyToPickDeliverySlips,
} from "./printDeliverySlip";
import { deliverySlipOrderQuery } from "./queries";
import { type EasyToPickDeliverySlipData } from "./types";
import { mapOrderToDeliverySlip } from "./utils";

interface BulkDeliverySlipModalProps {
  open: boolean;
  onClose: () => void;
}

export const BulkDeliverySlipModal: FC<BulkDeliverySlipModalProps> = ({ open, onClose }) => {
  const apolloClient = useApolloClient();
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

  const { data: orderListData, loading: listLoading } = useOrderListQuery({
    variables: { first: 50 },
    skip: !open,
  });

  const orders = useMemo(() => {
    const edges = orderListData?.orders?.edges || [];

    return edges.map(edge => edge.node);
  }, [orderListData]);

  const filteredOrders = useMemo(() => {
    const term = filterSearch.trim().toLowerCase();

    if (!term) return orders;

    return orders.filter(o => {
      const numMatch = String(o?.number || "").includes(term);
      const emailMatch = String(o?.userEmail || "").toLowerCase().includes(term);
      const nameMatch = `${o?.billingAddress?.firstName || ""} ${o?.billingAddress?.lastName || ""}`
        .toLowerCase()
        .includes(term);

      return numMatch || emailMatch || nameMatch;
    });
  }, [orders, filterSearch]);

  const handleToggleOrder = (orderId: string): void => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId],
    );
  };

  const handleSelectFirstPair = (): void => {
    const firstTwo = filteredOrders.slice(0, 2).map(o => o.id);

    setSelectedOrderIds(firstTwo);
  };

  const handleSelectAllFiltered = (): void => {
    const allIds = filteredOrders.map(o => o.id);

    setSelectedOrderIds(allIds);
  };

  const handleClearSelection = (): void => {
    setSelectedOrderIds([]);
  };

  const fetchSelectedSlips = async (): Promise<EasyToPickDeliverySlipData[]> => {
    const slips: EasyToPickDeliverySlipData[] = [];

    setIsLoadingOrders(true);

    try {
      for (const id of selectedOrderIds) {
        const res = await apolloClient.query({
          query: deliverySlipOrderQuery,
          variables: { id },
          fetchPolicy: "no-cache",
        });

        if (res?.data?.order) {
          slips.push(mapOrderToDeliverySlip(res.data.order));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingOrders(false);
    }

    return slips;
  };

  const handlePrint = async (): Promise<void> => {
    if (selectedOrderIds.length === 0) return;

    const slips = await fetchSelectedSlips();

    if (slips.length > 0) {
      printEasyToPickDeliverySlips(slips);
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (selectedOrderIds.length === 0) return;

    const slips = await fetchSelectedSlips();

    if (slips.length > 0) {
      const html = generateTwoUpDeliverySlipHtml(slips);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `DeliverySlips_Batch_${slips.length}_orders_A4.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const pagesCount = Math.ceil(selectedOrderIds.length / 2);

  return (
    <DashboardModal onChange={onClose} open={open}>
      <DashboardModal.Content size="md" overflowY="hidden" style={{ maxHeight: "90vh" }}>
        <DashboardModal.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" alignItems="center" gap={2}>
              <Layers size={18} />
              <span>
                Bulk Delivery Slips &nbsp;—&nbsp;
                <strong style={{ color: "#0284c7" }}>2 Slips per A4 Page</strong>
              </span>
            </Box>
          </Box>
        </DashboardModal.Header>

        {/* Toolbar */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          paddingX={6}
          paddingY={3}
          backgroundColor="default2"
          borderBottomWidth={1}
          borderBottomStyle="solid"
          borderColor="default1"
        >
          {/* Search and quick selection */}
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <Search size={14} style={{ color: "#64748b" }} />
              <input
                type="text"
                placeholder="Filter by Order # or Name..."
                value={filterSearch}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterSearch(e.target.value)}
                style={{
                  padding: "5px 8px",
                  borderRadius: "4px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "12.5px",
                  width: "180px",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                }}
              />
            </Box>
            <Button variant="secondary" onClick={handleSelectFirstPair} size="small">
              Select First 2 (1 Sheet)
            </Button>
            <Button variant="secondary" onClick={handleSelectAllFiltered} size="small">
              Select All
            </Button>
            {selectedOrderIds.length > 0 && (
              <Button variant="tertiary" onClick={handleClearSelection} size="small">
                Clear ({selectedOrderIds.length})
              </Button>
            )}
          </Box>

          {/* Action buttons */}
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={selectedOrderIds.length === 0 || isLoadingOrders}
            >
              {isLoadingOrders ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Printer size={15} />
                  <span>
                    Print {selectedOrderIds.length} Slips ({pagesCount} A4 {pagesCount === 1 ? "Page" : "Pages"})
                  </span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={selectedOrderIds.length === 0 || isLoadingOrders}
            >
              <Download size={15} />
              <span>Download HTML</span>
            </Button>
            <Button variant="tertiary" onClick={onClose}>
              <X size={15} />
            </Button>
          </Box>
        </Box>

        {/* Orders list selection */}
        <Box
          padding={4}
          backgroundColor="default1"
          overflowY="auto"
          style={{ maxHeight: "calc(90vh - 170px)" }}
        >
          {listLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" padding={6}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ marginLeft: "8px", fontWeight: 600 }}>Loading orders...</span>
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Box padding={6} textAlign="center" style={{ color: "#64748b" }}>
              No orders found matching your search.
            </Box>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "6px",
              }}
            >
              {filteredOrders.map(node => {
                const isChecked = selectedOrderIds.includes(node.id);
                const customerName = [
                  node?.billingAddress?.firstName,
                  node?.billingAddress?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={node.id}
                    onClick={() => handleToggleOrder(node.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: isChecked ? "2px solid #0284c7" : "1px solid #cbd5e1",
                      backgroundColor: isChecked ? "#f0f9ff" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: isChecked ? "2px solid #0284c7" : "2px solid #94a3b8",
                          backgroundColor: isChecked ? "#0284c7" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                        }}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                          ORDER #{node.number}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {customerName || node.userEmail || "Customer"} &nbsp;•&nbsp;
                          {node.total?.gross?.amount ? ` ₹ ${Number(node.total.gross.amount).toFixed(2)}` : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                      {isChecked ? (
                        <span style={{ color: "#0284c7" }}>Selected</span>
                      ) : (
                        <span>Click to Select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Box>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
