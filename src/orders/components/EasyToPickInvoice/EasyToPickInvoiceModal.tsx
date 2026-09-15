import { DashboardModal } from "@dashboard/components/Modal";
import { Box, Button } from "@saleor/macaw-ui-next";
import { Download, Printer, X } from "lucide-react";
import React, { useMemo } from "react";

import { EasyToPickInvoice } from "./EasyToPickInvoice";
import { generateInvoiceHtml, printEasyToPickInvoice } from "./printInvoice";
import { mapOrderToEasyToPickInvoice } from "./utils";

interface EasyToPickInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
  selectedInvoiceId?: string;
}

export const EasyToPickInvoiceModal: React.FC<EasyToPickInvoiceModalProps> = ({
  open,
  onClose,
  order,
  selectedInvoiceId,
}) => {
  const invoiceData = useMemo(() => {
    if (!order) return null;
    return mapOrderToEasyToPickInvoice(order, selectedInvoiceId);
  }, [order, selectedInvoiceId]);

  if (!invoiceData) {
    return null;
  }

  const handlePrint = () => {
    printEasyToPickInvoice(invoiceData);
  };

  const handleDownloadHtml = () => {
    const html = generateInvoiceHtml(invoiceData);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${invoiceData.orderNumber || invoiceData.invoiceNumber}.html`;
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
            <span>Invoice #{invoiceData.invoiceNumber} - EasyToPick</span>
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
            <EasyToPickInvoice data={invoiceData} />
          </Box>
        </Box>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
