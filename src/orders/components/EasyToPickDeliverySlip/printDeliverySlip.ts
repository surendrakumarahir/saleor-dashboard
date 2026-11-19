import { EASYTOPICK_LOGO_DATA_URI } from "@dashboard/orders/components/EasyToPickInvoice/logoDataUri";

import { generateBarcodeSvg } from "./barcode";
import { type EasyToPickDeliverySlipData } from "./types";
import { formatSlipMoney } from "./utils";

export const generateDeliverySlipCardHtml = (
  data: EasyToPickDeliverySlipData,
  options?: { compact?: boolean },
): string => {
  const isCompact = options?.compact ?? true;
  const isPrepaid = data.paymentStatus === "PREPAID";

  const barcode = generateBarcodeSvg(data.orderNumber, {
    height: isCompact ? 26 : 36,
    barWidth: isCompact ? 1.15 : 1.3,
    showText: false,
  });

  const addressLinesHtml = data.addressLines
    .map(
      line =>
        `<div style="font-size: ${isCompact ? "11px" : "12px"}; color: #1f2937; line-height: 1.35; margin-bottom: 1px;">${line}</div>`,
    )
    .join("");

  const rowsHtml = data.items
    .map(
      item => `
      <tr style="background-color: #ffffff;">
        <td style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; border: 1px solid #e5e7eb; text-align: center; font-weight: 700; width: 32px;">${item.sNo}</td>
        <td style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; line-height: 1.3;">${item.description}</td>
        <td style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; border: 1px solid #e5e7eb; text-align: left; color: #4b5563; width: ${isCompact ? "90px" : "120px"};">${item.sku || "-"}</td>
        <td style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; border: 1px solid #e5e7eb; text-align: center; font-weight: 800; width: 44px;">${item.qty}</td>
      </tr>
    `,
    )
    .join("");

  const paymentBannerHtml = isPrepaid
    ? `
      <div style="background-color: transparent; border: 1.5px solid #111827; border-radius: 3px; padding: ${isCompact ? "4px 8px" : "8px 12px"}; margin-bottom: ${isCompact ? "6px" : "12px"}; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: ${isCompact ? "11.5px" : "13.5px"}; font-weight: 800; color: #111827; letter-spacing: 0.5px;">
          ✓ PREPAID PARCEL — DO NOT COLLECT CASH
        </div>
        <div style="font-size: ${isCompact ? "11.5px" : "13px"}; font-weight: 800; color: #111827;">
          COLLECT: ₹ 0.00
        </div>
      </div>
    `
    : `
      <div style="background-color: transparent; border: 1.5px solid #111827; border-radius: 3px; padding: ${isCompact ? "4px 8px" : "8px 12px"}; margin-bottom: ${isCompact ? "6px" : "12px"}; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: ${isCompact ? "12px" : "14px"}; font-weight: 900; color: #111827; letter-spacing: 0.5px;">
          ⚠ CASH ON DELIVERY (COD)
        </div>
        <div style="font-size: ${isCompact ? "12.5px" : "14.5px"}; font-weight: 900; color: #111827; border: 1.5px solid #111827; padding: 2px 6px; border-radius: 3px; background-color: transparent;">
          COLLECT CASH: INR ${formatSlipMoney(data.amountToCollect)}
        </div>
      </div>
    `;

  const pincodeHtml = data.pincode
    ? `<span style="display: inline-block; border: 1.5px solid #111827; color: #111827; font-size: ${isCompact ? "11px" : "13px"}; font-weight: 900; letter-spacing: 0.8px; padding: 1px 6px; border-radius: 3px; background-color: transparent; margin-right: 6px;">
        PIN: ${data.pincode}
      </span>`
    : "";

  const phoneHtml = data.phone
    ? `<span style="display: inline-flex; align-items: center; gap: 4px; color: #111827; font-size: ${isCompact ? "11px" : "12.5px"}; font-weight: 800; background-color: transparent;">
        📞 Contact: ${data.phone}
      </span>`
    : "";

  const pinAndPhoneHtml =
    pincodeHtml || phoneHtml
      ? `<div style="margin-top: ${isCompact ? "3px" : "6px"}; margin-bottom: ${isCompact ? "2px" : "4px"}; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
        ${pincodeHtml}
        ${phoneHtml}
      </div>`
      : "";

  const customerNoteHtml = data.customerNote
    ? `<div style="margin-top: ${isCompact ? "3px" : "6px"}; padding: 3px 5px; border: 1px dashed #4b5563; font-size: ${isCompact ? "10px" : "11px"}; color: #111827; border-radius: 2px; background-color: transparent;">
        <strong>Delivery Note:</strong> ${data.customerNote}
      </div>`
    : "";

  return `
    <div class="slip-card" style="box-sizing: border-box; width: 100%; border: 1.5px dashed #111827; border-radius: 4px; padding: ${isCompact ? "8px 12px" : "18px 22px"}; background-color: #ffffff; page-break-inside: avoid; break-inside: avoid;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #111827; padding-bottom: ${isCompact ? "6px" : "12px"}; margin-bottom: ${isCompact ? "6px" : "12px"}; gap: 12px;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <img src="${EASYTOPICK_LOGO_DATA_URI}" alt="EasyToPick Bookstore" style="height: ${isCompact ? "32px" : "44px"}; width: auto; object-fit: contain; align-self: flex-start;" />
          <div style="font-size: ${isCompact ? "9px" : "10.5px"}; font-weight: 800; letter-spacing: 0.6px; color: #374151; text-transform: uppercase;">YOUR ONLINE BOOKSTORE</div>
          <div style="font-size: ${isCompact ? "9.5px" : "11px"}; font-weight: 700; color: #111827;">easytopick.in &nbsp;|&nbsp; Kota, Rajasthan</div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px; text-align: right;">
          <div style="border: 1.5px solid #111827; color: #111827; background-color: transparent; font-size: ${isCompact ? "9.5px" : "11.5px"}; font-weight: 800; letter-spacing: 0.8px; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">
            DELIVERY SLIP & DISPATCH LABEL
          </div>
          <div style="font-size: ${isCompact ? "14.5px" : "17px"}; font-weight: 900; color: #111827; letter-spacing: 0.5px;">ORDER #${data.orderNumber}</div>
          <div style="margin-top: 1px;">
            ${barcode.svgString}
          </div>
        </div>
      </div>

      <!-- Payment Status Banner -->
      ${paymentBannerHtml}

      <!-- Addresses Grid -->
      <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: ${isCompact ? "8px" : "14px"}; margin-bottom: ${isCompact ? "6px" : "14px"};">
        <!-- Deliver To Box -->
        <div style="border: 1.5px solid #111827; border-radius: 4px; padding: ${isCompact ? "6px 8px" : "10px 12px"}; background-color: transparent;">
          <div style="font-size: ${isCompact ? "9.5px" : "11px"}; font-weight: 800; letter-spacing: 0.8px; color: #111827; border-bottom: 1px solid #111827; padding-bottom: 2px; margin-bottom: 4px; text-transform: uppercase;">
            DELIVER TO (CONSIGNEE)
          </div>
          <div style="font-size: ${isCompact ? "13px" : "15px"}; font-weight: 800; color: #111827; margin-bottom: 2px; line-height: 1.2;">${data.recipientName}</div>
          ${addressLinesHtml}
          ${pinAndPhoneHtml}
          ${customerNoteHtml}
        </div>

        <!-- Dispatched From Box -->
        <div style="border: 1.5px solid #111827; border-radius: 4px; padding: ${isCompact ? "6px 8px" : "10px 12px"}; background-color: transparent;">
          <div style="font-size: ${isCompact ? "9.5px" : "11px"}; font-weight: 800; letter-spacing: 0.8px; color: #111827; border-bottom: 1px solid #111827; padding-bottom: 2px; margin-bottom: 4px; text-transform: uppercase;">
            DISPATCHED FROM (SENDER)
          </div>
          <div style="font-size: ${isCompact ? "12.5px" : "14px"}; font-weight: 800; color: #111827; margin-bottom: 1px;">${data.senderName}</div>
          <div style="font-size: ${isCompact ? "9px" : "10px"}; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 3px;">${data.senderTagline}</div>
          <div style="font-size: ${isCompact ? "10.5px" : "12px"}; color: #1f2937; line-height: 1.35; margin-bottom: 1px;">${data.senderAddress}</div>
          <div style="font-size: ${isCompact ? "10.5px" : "12px"}; font-weight: 700; color: #111827; margin-bottom: 2px;">
            ${data.senderCity}, ${data.senderState} - ${data.senderPincode}, ${data.senderCountry}
          </div>
          <div style="font-size: ${isCompact ? "10px" : "11.5px"}; color: #1f2937; line-height: 1.35; margin-top: 3px; border-top: 1px dashed #9ca3af; padding-top: 3px;">
            <div style="font-weight: 800; color: #111827;">Contact / Helpline: ${data.senderPhone}</div>
            <div>Website: ${data.senderWebsite}</div>
            <div>Email: ${data.senderEmail}</div>
          </div>
        </div>
      </div>

      <!-- Package Contents Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px; border: 1px solid #cbd5e1; font-size: ${isCompact ? "10.5px" : "12px"};">
        <thead>
          <tr style="background-color: transparent; border-top: 1.5px solid #111827; border-bottom: 1.5px solid #111827; color: #111827;">
            <th style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; font-weight: 800; text-align: center; width: 32px; font-size: ${isCompact ? "9.5px" : "11px"};">#</th>
            <th style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; font-weight: 800; text-align: left; font-size: ${isCompact ? "9.5px" : "11px"}; letter-spacing: 0.5px;">PACKAGE CONTENTS (PRODUCT DESCRIPTION)</th>
            <th style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; font-weight: 800; text-align: left; width: ${isCompact ? "90px" : "120px"}; font-size: ${isCompact ? "9.5px" : "11px"};">SKU</th>
            <th style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; font-weight: 800; text-align: center; width: 44px; font-size: ${isCompact ? "9.5px" : "11px"};">QTY</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color: transparent; font-weight: 800; border-top: 1.5px solid #111827;">
            <td colspan="3" style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; text-align: right; border: 1px solid #e5e7eb; padding-right: 12px; font-size: ${isCompact ? "10px" : "11.5px"};">TOTAL PACKAGE UNITS:</td>
            <td style="padding: ${isCompact ? "3px 6px" : "6px 10px"}; text-align: center; border: 1px solid #e5e7eb; font-size: ${isCompact ? "10px" : "11.5px"};">${data.totalQuantity}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
};

export const generateTwoUpDeliverySlipHtml = (slips: EasyToPickDeliverySlipData[]): string => {
  const pagesHtml: string[] = [];

  for (let i = 0; i < slips.length; i += 2) {
    const slipA = slips[i];
    const slipB = slips[i + 1];

    const cardAHtml = generateDeliverySlipCardHtml(slipA, { compact: true });
    const cutDividerHtml = `
      <div class="cut-divider" style="height: 16px; margin: 4px 0; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 11px; color: #475569; letter-spacing: 2px; overflow: hidden; user-select: none;">
        ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂
      </div>
    `;

    const cardBHtml = slipB
      ? generateDeliverySlipCardHtml(slipB, { compact: true })
      : `
        <div style="box-sizing: border-box; width: 100%; border: 1.5px dashed #cbd5e1; border-radius: 4px; padding: 24px; min-height: 120mm; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; text-align: center;">
          <div style="font-size: 13px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">[ UNUSED HALF SHEET ]</div>
          <div style="font-size: 11px; color: #94a3b8;">Cut along the dashed line to save A5 paper for future dispatches.</div>
        </div>
      `;

    pagesHtml.push(`
      <div class="page-sheet">
        ${cardAHtml}
        ${cutDividerHtml}
        ${cardBHtml}
      </div>
    `);
  }

  const orderNumbers = slips.map(s => `#${s.orderNumber}`).join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delivery Slips (2-on-1 A4) - ${orderNumbers} - EasyToPick</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
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
      padding: 16px;
    }
    .print-actions {
      max-width: 194mm;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-actions-left {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .print-actions-right {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 18px;
      font-size: 13.5px;
      font-weight: 600;
      border-radius: 5px;
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
    .page-sheet {
      width: 100%;
      max-width: 194mm;
      min-height: 240mm;
      max-height: 283mm;
      margin: 0 auto 16px auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      background-color: #ffffff;
      padding: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
    }
    .page-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
      margin-bottom: 0;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
      .page-sheet {
        margin: 0 auto;
        min-height: 240mm;
        max-height: 283mm;
        padding: 0;
        box-shadow: none !important;
        border-radius: 0;
        page-break-after: always;
        break-after: page;
      }
      .page-sheet:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <div class="print-actions-left">
      📄 2 Slips per A4 Sheet (Total Slips: ${slips.length} | Pages: ${Math.ceil(slips.length / 2)})
    </div>
    <div class="print-actions-right">
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
      <button class="btn btn-primary" onclick="window.print()">Print Slips (2-on-1 A4)</button>
    </div>
  </div>

  ${pagesHtml.join("\n")}
</body>
</html>`;
};

export const generateDeliverySlipHtml = (data: EasyToPickDeliverySlipData): string => {
  return generateTwoUpDeliverySlipHtml([data]);
};

export const printEasyToPickDeliverySlips = (slips: EasyToPickDeliverySlipData[]): void => {
  if (!slips || slips.length === 0) return;

  const html = generateTwoUpDeliverySlipHtml(slips);
  const printWindow = window.open(
    "",
    "_blank",
    "width=900,height=960,menubar=no,toolbar=no,location=no,status=no",
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

export const printEasyToPickDeliverySlip = (data: EasyToPickDeliverySlipData): void => {
  printEasyToPickDeliverySlips([data]);
};
