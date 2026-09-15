import { EASYTOPICK_LOGO_DATA_URI } from "./logoDataUri";
import { EasyToPickInvoiceData } from "./types";
import { formatMoneyValue } from "./utils";

export const generateInvoiceHtml = (data: EasyToPickInvoiceData): string => {
  const isPaid = data.paymentStatus === "FULLY PAID";

  const rowsHtml = data.items
    .map((item, index) => {
      const rowBg = index % 2 === 0 ? "#ffffff" : "#f7f9fa";
      return `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${item.qty}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: left; line-height: 1.35;">${item.description}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; white-space: nowrap;">${formatMoneyValue(item.mrp)}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; white-space: nowrap;">${formatMoneyValue(item.sellingPrice)}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #1d6f42;">${item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}</td>
        <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; white-space: nowrap;">${formatMoneyValue(item.amount)}</td>
      </tr>
    `;
    })
    .join("");

  const addressLinesHtml = data.addressLines
    .map(line => `<div style="font-size: 12px; color: #374151; line-height: 1.4;">${line}</div>`)
    .join("");

  // const phoneHtml = data.phone
  //   ? `<div style="font-size: 12px; color: #374151; line-height: 1.4;">Phone: ${data.phone}</div>`
  //   : "";

  const discountRowHtml =
    data.productDiscount > 0
      ? `
      <tr style="background-color: #f1f8f4;">
        <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: left; color: #1d6f42; font-weight: 700;">Product Discount</td>
        <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: right; color: #1d6f42; font-weight: 700;">- INR ${formatMoneyValue(data.productDiscount)}</td>
      </tr>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${data.invoiceNumber} - EasyToPick</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .print-actions {
      max-width: 820px;
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
      background-color: #4e7180;
      color: #ffffff;
    }
    .btn-primary:hover {
      background-color: #3f5d69;
    }
    .btn-secondary {
      background-color: #e5e7eb;
      color: #374151;
    }
    .btn-secondary:hover {
      background-color: #d1d5db;
    }
    .invoice-card {
      background-color: #ffffff;
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      padding: 34px 38px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 8px;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
      .invoice-card {
        box-shadow: none;
        padding: 0;
        border-radius: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px;">
      <div>
        <img src="${EASYTOPICK_LOGO_DATA_URI}" alt="EasyToPick Bookstore" style="height: 52px; width: auto; object-fit: contain; margin-bottom: 6px; display: block;" />
        <div style="font-size: 11.5px; font-weight: 700; letter-spacing: 1.5px; color: #4e7180; margin-bottom: 3px; text-transform: uppercase;">YOUR ONLINE BOOKSTORE</div>
        <div style="font-size: 11.5px; color: #64748b;">Website: easytopick.in &nbsp;|&nbsp; Email: easytopickin@gmail.com</div>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 32px; font-weight: 800; letter-spacing: 2px; color: #4e7180; margin: 0 0 8px 0; text-transform: uppercase; line-height: 1;">INVOICE</h1>
        <div style="display: inline-block; background-color: ${isPaid ? "#e7f6ed" : "#fff7ed"}; color: ${isPaid ? "#1d6f42" : "#c2410c"}; border: 1.5px solid ${isPaid ? "#1d6f42" : "#c2410c"}; font-weight: 700; font-size: 12.5px; letter-spacing: 1.2px; padding: 3px 18px; border-radius: 9999px; text-transform: uppercase;">
          ${isPaid ? "PAID" : data.paymentStatus}
        </div>
      </div>
    </div>

    <!-- Meta Bar -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #cbd5e1;">
      <tbody>
        <tr>
          <td style="background-color: #476675; color: #ffffff; font-weight: 700; font-size: 11.5px; letter-spacing: 1px; padding: 7px 12px; text-align: center; width: 18%; border: 1px solid #cbd5e1; text-transform: uppercase;">INVOICE #</td>
          <td style="background-color: #f4f7f9; color: #11233f; font-weight: 700; font-size: 12.5px; padding: 7px 12px; text-align: center; width: 32%; border: 1px solid #cbd5e1;">${data.invoiceNumber}</td>
          <td style="background-color: #476675; color: #ffffff; font-weight: 700; font-size: 11.5px; letter-spacing: 1px; padding: 7px 12px; text-align: center; width: 18%; border: 1px solid #cbd5e1; text-transform: uppercase;">DATE</td>
          <td style="background-color: #f4f7f9; color: #11233f; font-weight: 700; font-size: 12.5px; padding: 7px 12px; text-align: center; width: 32%; border: 1px solid #cbd5e1;">${data.date}</td>
        </tr>
      </tbody>
    </table>

    <!-- Customer & Payment Info -->
    <div style="display: flex; justify-content: space-between; gap: 14px; margin-bottom: 20px;">
      <div style="flex: 1; background-color: #fbfcfd; border: 1px solid #e2e8f0; border-radius: 4px; padding: 11px 13px;">
        <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px; color: #4e7180; margin-bottom: 5px; text-transform: uppercase;">BILL TO</div>
        <div style="font-size: 13.5px; font-weight: 700; color: #11233f; margin-bottom: 3px;">${data.customerName}</div>
        ${addressLinesHtml}
      </div>

      <div style="flex: 1; background-color: #e7f6ed; border: 1px solid #c6e7d2; border-radius: 4px; padding: 11px 13px;">
        <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px; color: #4e7180; margin-bottom: 5px; text-transform: uppercase;">PAYMENT STATUS</div>
        <div style="font-size: 14px; font-weight: 800; color: #1d6f42; margin-bottom: 3px; letter-spacing: 0.5px;">${data.paymentStatus}</div>
        <div style="font-size: 12.5px; font-weight: 600; color: #1d6f42;">Amount due: INR ${formatMoneyValue(data.amountDue)}</div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; border: 1px solid #cbd5e1;">
      <thead>
        <tr>
          <th style="background-color: #4e7180; color: #ffffff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; width: 7%; text-transform: uppercase;">QTY</th>
          <th style="background-color: #4e7180; color: #ffffff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; width: 45%; text-transform: uppercase;">PRODUCT DESCRIPTION</th>
          <th style="background-color: #4e7180; color: #ffffff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; width: 12%; text-transform: uppercase;">MRP (INR)</th>
          <th style="background-color: #4e7180; color: #ffffff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; width: 13%; text-transform: uppercase;">SELLING PRICE (INR)</th>
          <th style="background-color: #4e7180; color: #ffffff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; width: 10%; text-transform: uppercase;">DISCOUNT</th>
          <th style="background-color: #4e7180; color: #ffffff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.8px; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; width: 13%; text-transform: uppercase;">AMOUNT (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <p style="font-size: 10px; color: #64748b; margin: 0 0 16px 0; font-style: italic;">
      MRP = Maximum Retail Price. Selling Price = price charged per unit. Amount = Qty x Selling Price.
    </p>

    <!-- Totals Section -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
      <table style="width: 320px; border-collapse: collapse; border: 1px solid #cbd5e1;">
        <tbody>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: left; color: #374151; font-weight: 500; width: 55%;">Total MRP</td>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: right; color: #11233f; font-weight: 600; width: 45%;">INR ${formatMoneyValue(data.totalMrp)}</td>
          </tr>
          ${discountRowHtml}
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: left; color: #374151; font-weight: 500;">Product Subtotal</td>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: right; color: #11233f; font-weight: 600;">INR ${formatMoneyValue(data.productSubtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: left; color: #374151; font-weight: 500;">Shipping</td>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: right; color: #11233f; font-weight: 600;">INR ${formatMoneyValue(data.shipping)}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: left; color: #374151; font-weight: 500;">Tax</td>
            <td style="padding: 7px 12px; border: 1px solid #e2e8f0; text-align: right; color: #11233f; font-weight: 600;">INR ${formatMoneyValue(data.tax)}</td>
          </tr>
          <tr style="background-color: #4e7180;">
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; color: #ffffff; font-weight: 800; font-size: 13.5px;">GRAND TOTAL</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; color: #ffffff; font-weight: 800; font-size: 13.5px;">INR ${formatMoneyValue(data.grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center;">
      <div style="font-size: 12.5px; font-weight: 800; letter-spacing: 1px; color: #4e7180; margin-bottom: 4px; text-transform: uppercase;">
        EASYTOPICK WISHES YOU THE BEST OF LUCK
      </div>
      <div style="font-size: 11.5px; color: #1f2937; margin-bottom: 3px;">
        Thank you for shopping with EasyToPick. ${isPaid ? "This invoice has been fully paid." : ""}
      </div>
      <div style="font-size: 10.5px; color: #64748b;">
        For invoice-related queries: easytopickin@gmail.com &nbsp;|&nbsp; This is a computer-generated invoice.
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const printEasyToPickInvoice = (data: EasyToPickInvoiceData): void => {
  const html = generateInvoiceHtml(data);
  const printWindow = window.open(
    "",
    "_blank",
    "width=900,height=1000,menubar=no,toolbar=no,location=no,status=no",
  );

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Wait for content and images to settle before opening print dialog
    setTimeout(() => {
      printWindow.print();
    }, 450);
  }
};
