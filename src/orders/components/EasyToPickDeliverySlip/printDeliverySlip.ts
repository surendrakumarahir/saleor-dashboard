import { EASYTOPICK_LOGO_DATA_URI } from "@dashboard/orders/components/EasyToPickInvoice/logoDataUri";

import { generateBarcodeSvg } from "./barcode";
import { type EasyToPickDeliverySlipData } from "./types";
import { formatSlipMoney } from "./utils";

export const generateDeliverySlipHtml = (data: EasyToPickDeliverySlipData): string => {
  const isPrepaid = data.paymentStatus === "PREPAID";
  const barcode = generateBarcodeSvg(data.orderNumber, {
    height: 36,
    barWidth: 1.3,
    showText: false,
  });

  const addressLinesHtml = data.addressLines
    .map(
      line =>
        `<div style="font-size: 12px; color: #1f2937; line-height: 1.45; margin-bottom: 2px;">${line}</div>`,
    )
    .join("");

  const rowsHtml = data.items
    .map(
      item => `
      <tr style="background-color: #ffffff;">
        <td style="padding: 6px 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; width: 38px;">${item.sNo}</td>
        <td style="padding: 6px 10px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; line-height: 1.35;">${item.description}</td>
        <td style="padding: 6px 10px; border: 1px solid #e5e7eb; text-align: left; color: #4b5563; width: 120px;">${item.sku || "-"}</td>
        <td style="padding: 6px 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: 800; width: 50px;">${item.qty}</td>
      </tr>
    `,
    )
    .join("");

  const paymentBannerHtml = isPrepaid
    ? `
      <div style="background-color: transparent; border: 1.5px solid #111827; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 13.5px; font-weight: 800; color: #111827; letter-spacing: 0.5px;">
          ✓ PREPAID PARCEL — DO NOT COLLECT CASH
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #111827;">
          COLLECT: ₹ 0.00
        </div>
      </div>
    `
    : `
      <div style="background-color: transparent; border: 2px solid #111827; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 14px; font-weight: 900; color: #111827; letter-spacing: 0.5px;">
          ⚠ CASH ON DELIVERY (COD)
        </div>
        <div style="font-size: 14.5px; font-weight: 900; color: #111827; border: 1.5px solid #111827; padding: 3px 8px; border-radius: 3px; background-color: transparent;">
          COLLECT CASH: INR ${formatSlipMoney(data.amountToCollect)}
        </div>
      </div>
    `;

  const pincodeHtml = data.pincode
    ? `<div style="margin-top: 6px; margin-bottom: 4px;">
        <span style="display: inline-block; border: 1.5px solid #111827; color: #111827; font-size: 13px; font-weight: 900; letter-spacing: 1px; padding: 2px 8px; border-radius: 3px; background-color: transparent;">
          PIN: ${data.pincode}
        </span>
      </div>`
    : "";

  const phoneHtml = data.phone
    ? `<div style="margin-top: 4px;">
        <span style="display: inline-flex; align-items: center; gap: 5px; color: #111827; font-size: 12.5px; font-weight: 800; background-color: transparent;">
          📞 Contact: ${data.phone}
        </span>
      </div>`
    : "";

  const customerNoteHtml = data.customerNote
    ? `<div style="margin-top: 6px; padding: 4px 6px; border: 1px dashed #4b5563; font-size: 11px; color: #111827; border-radius: 2px; background-color: transparent;">
        <strong>Delivery Note:</strong> ${data.customerNote}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delivery Slip - Order #${data.orderNumber} - EasyToPick</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background-color: #f1f5f9;
      margin: 0;
      padding: 20px;
    }
    .print-actions {
      max-width: 780px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background-color: #1e293b;
      color: #ffffff;
    }
    .btn-primary:hover {
      background-color: #0f172a;
    }
    .btn-secondary {
      background-color: #e2e8f0;
      color: #334155;
    }
    .btn-secondary:hover {
      background-color: #cbd5e1;
    }
    .slip-card {
      background-color: #ffffff;
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      padding: 18px 22px;
      border: 1.5px dashed #111827;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
      .slip-card {
        border: 1.5px dashed #000000;
        box-shadow: none !important;
        padding: 16px 20px;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
    <button class="btn btn-primary" onclick="window.print()">Print Delivery Slip</button>
  </div>

  <div class="slip-card">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #111827; padding-bottom: 12px; margin-bottom: 12px; gap: 16px;">
      <div style="display: flex; flex-direction: column; gap: 3px;">
        <img src="${EASYTOPICK_LOGO_DATA_URI}" alt="EasyToPick Bookstore" style="height: 44px; width: auto; object-fit: contain; align-self: flex-start;" />
        <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.8px; color: #374151; text-transform: uppercase;">YOUR ONLINE BOOKSTORE</div>
        <div style="font-size: 11px; font-weight: 700; color: #111827;">easytopick.in &nbsp;|&nbsp; Kota, Rajasthan</div>
      </div>

      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; text-align: right;">
        <div style="border: 1.5px solid #111827; color: #111827; background-color: transparent; font-size: 11.5px; font-weight: 800; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 3px; text-transform: uppercase;">
          DELIVERY SLIP & DISPATCH LABEL
        </div>
        <div style="font-size: 17px; font-weight: 900; color: #111827; letter-spacing: 0.5px;">ORDER #${data.orderNumber}</div>
        <div style="margin-top: 2px;">
          ${barcode.svgString}
        </div>
      </div>
    </div>

    <!-- Payment Status Banner -->
    ${paymentBannerHtml}

    <!-- Addresses Grid -->
    <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; margin-bottom: 14px;">
      <!-- Deliver To Box -->
      <div style="border: 1.5px solid #111827; border-radius: 4px; padding: 10px 12px; background-color: transparent;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; border-bottom: 1px solid #111827; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase;">
          DELIVER TO (CONSIGNEE)
        </div>
        <div style="font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 4px; line-height: 1.3;">${data.recipientName}</div>
        ${addressLinesHtml}
        ${pincodeHtml}
        ${phoneHtml}
        ${customerNoteHtml}
      </div>

      <!-- Dispatched From Box -->
      <div style="border: 1.5px solid #111827; border-radius: 4px; padding: 10px 12px; background-color: transparent;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.8px; color: #111827; border-bottom: 1px solid #111827; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase;">
          DISPATCHED FROM (SENDER)
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 2px;">${data.senderName}</div>
        <div style="font-size: 10px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 5px;">${data.senderTagline}</div>
        <div style="font-size: 12px; color: #1f2937; line-height: 1.4; margin-bottom: 2px;">${data.senderAddress}</div>
        <div style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px;">
          ${data.senderCity}, ${data.senderState} - ${data.senderPincode}, ${data.senderCountry}
        </div>
        <div style="font-size: 11.5px; color: #1f2937; line-height: 1.45; margin-top: 5px; border-top: 1px dashed #9ca3af; padding-top: 5px;">
          <div style="font-weight: 800; color: #111827;">Contact / Helpline: ${data.senderPhone}</div>
          <div>Website: ${data.senderWebsite}</div>
          <div>Email: ${data.senderEmail}</div>
        </div>
      </div>
    </div>

    <!-- Package Contents Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #cbd5e1; font-size: 12px;">
      <thead>
        <tr style="background-color: transparent; border-top: 1.5px solid #111827; border-bottom: 1.5px solid #111827; color: #111827;">
          <th style="padding: 6px 10px; font-weight: 800; text-align: center; width: 38px; font-size: 11px;">#</th>
          <th style="padding: 6px 10px; font-weight: 800; text-align: left; font-size: 11px; letter-spacing: 0.5px;">PACKAGE CONTENTS (PRODUCT DESCRIPTION)</th>
          <th style="padding: 6px 10px; font-weight: 800; text-align: left; width: 120px; font-size: 11px;">SKU</th>
          <th style="padding: 6px 10px; font-weight: 800; text-align: center; width: 50px; font-size: 11px;">QTY</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="background-color: transparent; font-weight: 800; border-top: 1.5px solid #111827;">
          <td colspan="3" style="padding: 6px 10px; text-align: right; border: 1px solid #e5e7eb; padding-right: 14px;">TOTAL PACKAGE UNITS:</td>
          <td style="padding: 6px 10px; text-align: center; border: 1px solid #e5e7eb;">${data.totalQuantity}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;
};

export const printEasyToPickDeliverySlip = (data: EasyToPickDeliverySlipData): void => {
  const html = generateDeliverySlipHtml(data);
  const printWindow = window.open(
    "",
    "_blank",
    "width=880,height=960,menubar=no,toolbar=no,location=no,status=no",
  );

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  }
};
