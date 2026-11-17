import { EASYTOPICK_LOGO_DATA_URI } from "@dashboard/orders/components/EasyToPickInvoice/logoDataUri";
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";
import { type CSSProperties, type FC, type RefObject } from "react";

import { encodeCode128B } from "./barcode";
import styles from "./EasyToPickDeliverySlip.module.css";
import { type EasyToPickDeliverySlipData } from "./types";
import { formatSlipMoney } from "./utils";

interface BarcodeComponentProps {
  value: string;
  height?: number;
  barWidth?: number;
  showText?: boolean;
  className?: string;
  style?: CSSProperties;
}

const DeliverySlipBarcode: FC<BarcodeComponentProps> = ({
  value,
  height = 42,
  barWidth = 1.4,
  showText = true,
  className,
  style,
}) => {
  const quietZone = 8;
  const modules = encodeCode128B(value);
  const totalModuleWidth = modules.reduce((max, m) => Math.max(max, m.x + m.width), 0);
  const totalWidth = totalModuleWidth * barWidth + quietZone * 2;
  const textHeight = showText ? 14 : 0;
  const totalHeight = height + textHeight + 4;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={className}
      style={{
        display: "block",
        shapeRendering: "crispEdges",
        maxWidth: "100%",
        height: "auto",
        ...style,
      }}
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      {modules.map((m, idx) => (
        <rect
          key={idx}
          x={quietZone + m.x * barWidth}
          y={0}
          width={m.width * barWidth}
          height={height}
          fill="#000000"
        />
      ))}
      {showText && (
        <text
          x={totalWidth / 2}
          y={height + 12}
          fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace"
          fontSize={11}
          fontWeight={600}
          textAnchor="middle"
          fill="#111827"
          letterSpacing="1.5"
        >
          * {value} *
        </text>
      )}
    </svg>
  );
};

interface EasyToPickDeliverySlipProps {
  data: EasyToPickDeliverySlipData;
  className?: string;
  containerRef?: RefObject<HTMLDivElement>;
}

export const EasyToPickDeliverySlip: FC<EasyToPickDeliverySlipProps> = ({
  data,
  className,
  containerRef,
}) => {
  const isPrepaid = data.paymentStatus === "PREPAID";

  return (
    <div
      ref={containerRef}
      className={`${styles.slipWrapper} ${className || ""}`}
      id="easytopick-delivery-slip-root"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brandCol}>
          <img src={EASYTOPICK_LOGO_DATA_URI} alt="EasyToPick Bookstore" className={styles.logo} />
          <div className={styles.brandSubtitle}>YOUR ONLINE BOOKSTORE</div>
          <div className={styles.brandWeb}>easytopick.in &nbsp;|&nbsp; Kota, Rajasthan</div>
        </div>

        <div className={styles.slipTitleCol}>
          <div className={styles.slipTitleBadge}>DELIVERY SLIP & DISPATCH LABEL</div>
          <div className={styles.orderNumText}>ORDER #{data.orderNumber}</div>
          <div className={styles.barcodeContainer}>
            <DeliverySlipBarcode
              value={data.orderNumber}
              height={34}
              barWidth={1.3}
              showText={false}
            />
          </div>
        </div>
      </div>

      {/* Payment / Cash Collection Banner */}
      {isPrepaid ? (
        <div className={styles.paymentBannerPrepaid}>
          <div className={styles.paymentBadgePrepaid}>
            <CheckCircle2 size={18} color="#111827" />
            <span>PREPAID PARCEL — DO NOT COLLECT CASH</span>
          </div>
          <div className={styles.paymentCollectTextPrepaid}>COLLECT: ₹ 0.00</div>
        </div>
      ) : (
        <div className={styles.paymentBannerCod}>
          <div className={styles.paymentBadgeCod}>
            <AlertCircle size={18} color="#111827" />
            <span>CASH ON DELIVERY (COD)</span>
          </div>
          <div className={styles.paymentCollectTextCod}>
            COLLECT CASH: INR {formatSlipMoney(data.amountToCollect)}
          </div>
        </div>
      )}

      {/* Addresses Grid */}
      <div className={styles.addressGrid}>
        {/* Deliver To Box */}
        <div className={styles.deliverToBox}>
          <div className={styles.boxHeaderDeliver}>DELIVER TO (CONSIGNEE)</div>
          <div className={styles.recipientName}>{data.recipientName}</div>

          {data.addressLines.map((line, idx) => (
            <div key={idx} className={styles.addressText}>
              {line}
            </div>
          ))}

          {data.pincode && (
            <div>
              <span className={styles.pincodeBadge}>PIN: {data.pincode}</span>
            </div>
          )}

          {data.phone && (
            <div>
              <span className={styles.phonePill}>
                <Phone size={13} color="#111827" />
                <span>Contact: {data.phone}</span>
              </span>
            </div>
          )}

          {data.customerNote && (
            <div className={styles.customerNoteBox}>
              <strong>Delivery Note:</strong> {data.customerNote}
            </div>
          )}
        </div>

        {/* Dispatched From Box */}
        <div className={styles.dispatchedFromBox}>
          <div className={styles.boxHeaderFrom}>DISPATCHED FROM (SENDER)</div>
          <div className={styles.senderName}>{data.senderName}</div>
          <div className={styles.senderTagline}>{data.senderTagline}</div>
          <div className={styles.senderAddress}>{data.senderAddress}</div>
          <div className={styles.senderCityStatePin}>
            {data.senderCity}, {data.senderState} - {data.senderPincode}, {data.senderCountry}
          </div>

          <div className={styles.senderContact}>
            <div className={styles.senderContactPhone}>
              Contact / Helpline: {data.senderPhone}
            </div>
            <div>Website: {data.senderWebsite}</div>
            <div>Email: {data.senderEmail}</div>
          </div>
        </div>
      </div>

      {/* Package Items Table */}
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th className={styles.colSno}>#</th>
            <th className={styles.colDesc}>PACKAGE CONTENTS (PRODUCT DESCRIPTION)</th>
            <th className={styles.colSku}>SKU</th>
            <th className={styles.colQty}>QTY</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td className={styles.colSno}>{item.sNo}</td>
              <td className={styles.colDesc}>{item.description}</td>
              <td className={styles.colSku}>{item.sku || "-"}</td>
              <td className={styles.colQty}>{item.qty}</td>
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td colSpan={3} style={{ textAlign: "right", paddingRight: "14px" }}>
              TOTAL PACKAGE UNITS:
            </td>
            <td className={styles.colQty}>{data.totalQuantity}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
