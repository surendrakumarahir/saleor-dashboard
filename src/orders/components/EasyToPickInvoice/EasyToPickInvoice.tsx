import React from "react";

import styles from "./EasyToPickInvoice.module.css";
import { EASYTOPICK_LOGO_DATA_URI } from "./logoDataUri";
import { EasyToPickInvoiceData } from "./types";
import { formatMoneyValue } from "./utils";

interface EasyToPickInvoiceProps {
  data: EasyToPickInvoiceData;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const EasyToPickInvoice: React.FC<EasyToPickInvoiceProps> = ({
  data,
  className,
  containerRef,
}) => {
  const isPaid = data.paymentStatus === "FULLY PAID";

  return (
    <div
      ref={containerRef}
      className={`${styles.invoiceWrapper} ${className || ""}`}
      id="easytopick-invoice-root"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brandCol}>
          <img src={EASYTOPICK_LOGO_DATA_URI} alt="EasyToPick Bookstore" className={styles.logo} />
          <div className={styles.storeTagline}>YOUR ONLINE BOOKSTORE</div>
          <div className={styles.storeContact}>
            Website: easytopick.in &nbsp;|&nbsp; Email: easytopickin@gmail.com
          </div>
        </div>

        <div className={styles.invoiceCol}>
          <h1 className={styles.invoiceTitle}>INVOICE</h1>
          <div className={isPaid ? styles.statusBadgePaid : styles.statusBadgePending}>
            {isPaid ? "PAID" : data.paymentStatus}
          </div>
        </div>
      </div>

      {/* Meta Bar */}
      <table className={styles.metaBar}>
        <tbody>
          <tr>
            <td className={styles.metaHeader}>INVOICE #</td>
            <td className={styles.metaValue}>{data.invoiceNumber}</td>
            <td className={styles.metaHeader}>DATE</td>
            <td className={styles.metaValue}>{data.date}</td>
          </tr>
        </tbody>
      </table>

      {/* Customer & Payment Info */}
      <div className={styles.infoGrid}>
        <div className={styles.infoBoxBillTo}>
          <div className={styles.boxHeader}>BILL TO</div>
          <div className={styles.customerName}>{data.customerName}</div>
          {data.addressLines.map((line, idx) => (
            <div key={idx} className={styles.addressLine}>
              {line}
            </div>
          ))}
          {/* {data.phone && <div className={styles.addressLine}>Phone: {data.phone}</div>} */}
        </div>

        <div className={styles.infoBoxPayment}>
          <div className={styles.boxHeader}>PAYMENT STATUS</div>
          <div className={styles.paymentStatusText}>{data.paymentStatus}</div>
          <div className={styles.amountDueText}>
            Amount due: INR {formatMoneyValue(data.amountDue)}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th className={styles.colQty}>QTY</th>
            <th className={styles.colDesc}>PRODUCT DESCRIPTION</th>
            <th className={styles.colMrp}>MRP (INR)</th>
            <th className={styles.colPrice}>SELLING PRICE (INR)</th>
            <th className={styles.colDiscount}>DISCOUNT</th>
            <th className={styles.colAmount}>AMOUNT (INR)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td className={styles.colQty}>{item.qty}</td>
              <td className={styles.colDesc}>{item.description}</td>
              <td className={styles.colMrp}>{formatMoneyValue(item.mrp)}</td>
              <td className={styles.colPrice}>{formatMoneyValue(item.sellingPrice)}</td>
              <td className={styles.colDiscount}>
                {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
              </td>
              <td className={styles.colAmount}>{formatMoneyValue(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={styles.tableNote}>
        MRP = Maximum Retail Price. Selling Price = price charged per unit. Amount = Qty x Selling
        Price.
      </p>

      {/* Totals Section */}
      <div className={styles.totalsSection}>
        <table className={styles.totalsTable}>
          <tbody>
            <tr>
              <td className={styles.totalLabel}>Total MRP</td>
              <td className={styles.totalValue}>INR {formatMoneyValue(data.totalMrp)}</td>
            </tr>
            {data.productDiscount > 0 && (
              <tr className={styles.discountRow}>
                <td className={styles.totalLabel}>Product Discount</td>
                <td className={styles.totalValue}>
                  - INR {formatMoneyValue(data.productDiscount)}
                </td>
              </tr>
            )}
            <tr>
              <td className={styles.totalLabel}>Product Subtotal</td>
              <td className={styles.totalValue}>INR {formatMoneyValue(data.productSubtotal)}</td>
            </tr>
            <tr>
              <td className={styles.totalLabel}>Shipping</td>
              <td className={styles.totalValue}>INR {formatMoneyValue(data.shipping)}</td>
            </tr>
            <tr>
              <td className={styles.totalLabel}>Tax</td>
              <td className={styles.totalValue}>INR {formatMoneyValue(data.tax)}</td>
            </tr>
            <tr className={styles.grandTotalRow}>
              <td className={styles.totalLabel}>GRAND TOTAL</td>
              <td className={styles.totalValue}>INR {formatMoneyValue(data.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerWish}>EASYTOPICK WISHES YOU THE BEST OF LUCK</div>
        <div className={styles.footerThankYou}>
          Thank you for shopping with EasyToPick.{" "}
          {isPaid ? "This invoice has been fully paid." : ""}
        </div>
        <div className={styles.footerQueries}>
          For invoice-related queries: easytopickin@gmail.com &nbsp;|&nbsp; This is a
          computer-generated invoice.
        </div>
      </div>
    </div>
  );
};
