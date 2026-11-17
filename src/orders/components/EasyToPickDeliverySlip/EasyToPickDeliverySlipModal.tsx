import { DashboardModal } from "@dashboard/components/Modal";
import { Box, Button } from "@saleor/macaw-ui-next";
import { Download, Printer, X } from "lucide-react";
import { type FC, useMemo } from "react";

import { EasyToPickDeliverySlip } from "./EasyToPickDeliverySlip";
import {
  generateDeliverySlipHtml,
  printEasyToPickDeliverySlip,
} from "./printDeliverySlip";
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
  const slipData = useMemo(() => {
    if (!order) return null;

    return mapOrderToDeliverySlip(order);
  }, [order]);

  if (!slipData) {
    return null;
  }

  const handlePrint = (): void => {
    printEasyToPickDeliverySlip(slipData);
  };

  const handleDownloadHtml = (): void => {
    const html = generateDeliverySlipHtml(slipData);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `DeliverySlip_${slipData.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardModal onChange={onClose} open={open}>
      <DashboardModal.Content size="md" overflowY="hidden" style={{ maxHeight: "90vh" }}>
        <DashboardModal.Header>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <span>Delivery Slip #{slipData.orderNumber} - EasyToPick</span>
          </Box>
        </DashboardModal.Header>

        {/* Action bar */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          paddingX={6}
          paddingY={3}
          backgroundColor="default2"
          borderBottomWidth={1}
          borderBottomStyle="solid"
          borderColor="default1"
        >
          <Box display="flex" gap={2}>
            <Button variant="primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print / Save as PDF</span>
            </Button>
            <Button variant="secondary" onClick={handleDownloadHtml}>
              <Download size={16} />
              <span>Download HTML</span>
            </Button>
          </Box>
          <Button variant="tertiary" onClick={onClose}>
            <X size={16} />
            <span>Close</span>
          </Button>
        </Box>

        {/* Scrollable Preview Area */}
        <Box
          padding={6}
          backgroundColor="default1"
          overflowY="auto"
          style={{ maxHeight: "calc(90vh - 160px)" }}
        >
          <Box
            style={{
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <EasyToPickDeliverySlip data={slipData} />
          </Box>
        </Box>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
