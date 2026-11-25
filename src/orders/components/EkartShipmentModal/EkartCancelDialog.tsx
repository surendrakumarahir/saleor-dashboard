import { ConfirmButton } from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import type React from "react";
import { useState } from "react";

interface EkartCancelDialogProps {
  open: boolean;
  trackingId: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (cancelSaleorFulfillment: boolean) => void;
}

export const EkartCancelDialog: React.FC<EkartCancelDialogProps> = ({
  open,
  trackingId,
  loading,
  error,
  onClose,
  onConfirm,
}) => {
  const [cancelSaleorFulfillment, setCancelSaleorFulfillment] = useState(true);

  return (
    <DashboardModal onChange={onClose} open={open}>
      <DashboardModal.Content size="xs">
        <DashboardModal.Grid>
          <DashboardModal.Header>Cancel Ekart Parcel</DashboardModal.Header>

          <Box display="flex" flexDirection="column" gap={3}>
            <Text size={3}>
              Are you sure you want to cancel Ekart shipment <strong>{trackingId}</strong>?
            </Text>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={cancelSaleorFulfillment}
                onChange={e => setCancelSaleorFulfillment(e.target.checked)}
              />
              <Text size={2}>Also cancel this fulfillment in Saleor and restock items</Text>
            </label>

            {error && (
              <Text size={2} color="critical1">
                {error}
              </Text>
            )}
          </Box>

          <DashboardModal.Actions>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Keep Parcel
            </Button>
            <ConfirmButton
              variant="error"
              transitionState={loading ? "loading" : "default"}
              disabled={loading}
              onClick={() => onConfirm(cancelSaleorFulfillment)}
            >
              Cancel Ekart Parcel
            </ConfirmButton>
          </DashboardModal.Actions>
        </DashboardModal.Grid>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
