// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { getEkartInfoFromFulfillment } from "@dashboard/ekart/utils";
import { FulfillmentStatus, type OrderDetailsFragment } from "@dashboard/graphql";
import { orderHasTransactions } from "@dashboard/orders/types";
import { mergeRepeatedOrderLines } from "@dashboard/orders/utils/data";
import { Box, Button, Dropdown, List, Text, useTheme } from "@saleor/macaw-ui-next";
import { Code, EllipsisVertical, ExternalLink } from "lucide-react";

import { OrderCardTitle } from "../OrderCardTitle/OrderCardTitle";
import { OrderDetailsDatagrid } from "../OrderDetailsDatagrid/OrderDetailsDatagrid";
import { ActionButtons } from "./ActionButtons";

interface OrderFulfillmentCardProps {
  fulfillment: OrderDetailsFragment["fulfillments"][0];
  fulfillmentAllowUnpaid: boolean;
  order?: OrderDetailsFragment;
  onOrderFulfillmentApprove: () => void;
  onOrderFulfillmentCancel: () => void;
  onTrackingCodeAdd: () => void;
  dataTestId?: string;
  onOrderLineShowMetadata: (id: string) => void;
  onFulfillmentShowMetadata?: () => void;
  onCreateEkartParcel?: () => void;
  onPrintEkartLabel?: (trackingId: string) => void;
  onCancelEkartParcel?: (trackingId: string) => void;
  ekartLabelLoading?: boolean;
}

const statusesToMergeLines = [
  FulfillmentStatus.REFUNDED,
  FulfillmentStatus.REFUNDED_AND_RETURNED,
  FulfillmentStatus.RETURNED,
  FulfillmentStatus.REPLACED,
];
const cancelableStatuses = [FulfillmentStatus.FULFILLED, FulfillmentStatus.WAITING_FOR_APPROVAL];
const fulfillmentLineToLine = ({
  quantity,
  orderLine,
}: OrderDetailsFragment["fulfillments"][0]["lines"][0]) => ({
  ...orderLine,
  // 'quantity' has the correct number of returned items
  // 'orderLine.quantity' has the total number of items in the order
  quantity,
});

export const OrderFulfillmentCard = (props: OrderFulfillmentCardProps) => {
  const {
    fulfillment,
    fulfillmentAllowUnpaid,
    order,
    onOrderFulfillmentApprove,
    onOrderFulfillmentCancel,
    onTrackingCodeAdd,
    onOrderLineShowMetadata,
    onFulfillmentShowMetadata,
    onCreateEkartParcel,
    onPrintEkartLabel,
    onCancelEkartParcel,
    ekartLabelLoading,
    dataTestId,
  } = props;
  const { themeValues } = useTheme();

  if (!fulfillment) {
    return null;
  }

  const ekartInfo = getEkartInfoFromFulfillment(fulfillment);

  const getLines = () => {
    if (statusesToMergeLines.includes(fulfillment?.status)) {
      return mergeRepeatedOrderLines(fulfillment.lines).map(fulfillmentLineToLine);
    }

    return fulfillment?.lines.map(fulfillmentLineToLine) || [];
  };

  return (
    <Box data-test-id={dataTestId} backgroundColor={"default2"}>
      <OrderCardTitle
        withStatus
        status={fulfillment?.status}
        warehouseName={fulfillment?.warehouse?.name}
        backgroundColor={"default2"}
        createdDate={fulfillment?.created}
        trackingNumber={fulfillment.trackingNumber}
        warehouseId={fulfillment?.warehouse?.id}
        toolbar={
          <Box display="flex" alignItems="center" gap={3}>
            {onFulfillmentShowMetadata && (
              <Button
                variant="secondary"
                onClick={onFulfillmentShowMetadata}
                data-test-id="show-fulfillment-metadata"
                icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
                title="Edit fulfillment group metadata"
              />
            )}
            <ActionButtons
              orderId={order?.id}
              status={fulfillment?.status}
              trackingNumber={fulfillment?.trackingNumber}
              orderIsPaid={order?.isPaid}
              fulfillmentAllowUnpaid={fulfillmentAllowUnpaid}
              onTrackingCodeAdd={onTrackingCodeAdd}
              onApprove={onOrderFulfillmentApprove}
              hasTransactions={orderHasTransactions(order)}
              isEkartActive={ekartInfo.isActive}
              ekartLabelLoading={ekartLabelLoading}
              onCreateEkartParcel={onCreateEkartParcel}
              onPrintEkartLabel={
                ekartInfo.isActive && onPrintEkartLabel
                  ? () => onPrintEkartLabel(ekartInfo.trackingId)
                  : undefined
              }
            />
            {cancelableStatuses.includes(fulfillment?.status) && (
              <Dropdown>
                <Dropdown.Trigger>
                  <Button
                    variant="tertiary"
                    icon={<EllipsisVertical />}
                    data-test-id="fulfillment-menu-button"
                    // optical alignment
                    __marginRight={"-16px"}
                    title="Show more"
                  />
                </Dropdown.Trigger>
                <Dropdown.Content align="end">
                  <List
                    padding={2}
                    borderRadius={4}
                    boxShadow="defaultOverlay"
                    backgroundColor="default1"
                  >
                    {ekartInfo.isActive && (
                      <>
                        <Dropdown.Item>
                          <List.Item
                            borderRadius={4}
                            paddingX={1.5}
                            paddingY={2}
                            onClick={() => window.open(ekartInfo.trackingUrl, "_blank", "noopener")}
                            data-test-id="track-ekart-parcel"
                          >
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <ExternalLink size={14} />
                              <Text>Track on Ekart</Text>
                            </Box>
                          </List.Item>
                        </Dropdown.Item>
                        {onCancelEkartParcel && (
                          <Dropdown.Item>
                            <List.Item
                              borderRadius={4}
                              paddingX={1.5}
                              paddingY={2}
                              onClick={() => onCancelEkartParcel(ekartInfo.trackingId)}
                              data-test-id="cancel-ekart-parcel"
                            >
                              <Text color="critical1">Cancel Ekart Parcel</Text>
                            </List.Item>
                          </Dropdown.Item>
                        )}
                      </>
                    )}
                    <Dropdown.Item>
                      <List.Item
                        borderRadius={4}
                        paddingX={1.5}
                        paddingY={2}
                        onClick={onOrderFulfillmentCancel}
                        data-test-id="cancel-fulfillment"
                      >
                        <Text>Cancel fulfillment</Text>
                      </List.Item>
                    </Dropdown.Item>
                  </List>
                </Dropdown.Content>
              </Dropdown>
            )}
          </Box>
        }
      />
      {ekartInfo.isEkart && (
        <Box
          paddingX={6}
          paddingY={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          backgroundColor="default1"
          borderTopWidth={1}
          borderTopStyle="solid"
          borderColor="default1"
        >
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Text size={2} fontWeight="bold">
              Ekart ({ekartInfo.status === "CANCELLED" ? "Cancelled" : "Active"})
            </Text>
            <Text size={2} color="default2">
              AWB: {ekartInfo.trackingId}
              {ekartInfo.paymentMode
                ? ` • ${ekartInfo.paymentMode}${ekartInfo.paymentMode === "COD" && ekartInfo.codAmount ? ` (₹${ekartInfo.codAmount})` : ""}`
                : ""}
              {ekartInfo.service ? ` • ${ekartInfo.service}` : ""}
              {ekartInfo.weightGrams ? ` • ${ekartInfo.weightGrams}g` : ""}
              {ekartInfo.dimensionsCm ? ` • ${ekartInfo.dimensionsCm} cm` : ""}
            </Text>
          </Box>
          {ekartInfo.trackingUrl && (
            <a
              href={ekartInfo.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span>Track Shipment</span>
              <ExternalLink size={12} />
            </a>
          )}
        </Box>
      )}
      <DashboardCard.Content paddingX={0}>
        <OrderDetailsDatagrid
          lines={getLines()}
          loading={false}
          onOrderLineShowMetadata={onOrderLineShowMetadata}
          datagridCustomTheme={{
            bgHeader: themeValues.colors.background.default2,
          }}
        />
        <Box
          backgroundColor={"default1"}
          width="100%"
          height={6}
          borderBottomStyle={"solid"}
          borderBottomWidth={1}
          borderColor={"default1"}
        />
      </DashboardCard.Content>
    </Box>
  );
};
