import { formatInvoiceDate, formatMoneyValue, mapOrderToEasyToPickInvoice } from "./utils";

describe("EasyToPick Invoice utils", () => {
  it("formats date correctly", () => {
    const formatted = formatInvoiceDate("2026-09-14T10:00:00.000Z");
    expect(formatted).toContain("September");
    expect(formatted).toContain("2026");
  });

  it("formats money value with 2 decimal places and Indian commas", () => {
    expect(formatMoneyValue(2766)).toBe("2,766.00");
    expect(formatMoneyValue(797.2)).toBe("797.20");
    expect(formatMoneyValue(0)).toBe("0.00");
  });

  it("maps order accurately to EasyToPick invoice data", () => {
    const mockOrder = {
      id: "order-123",
      number: "8876",
      created: "2026-09-14T08:00:00.000Z",
      isPaid: true,
      paymentStatus: "FULLY_PAID",
      chargeStatus: "FULL",
      billingAddress: {
        firstName: "Chahat",
        lastName: "Sharma",
        streetAddress1: "Near Government Middle School Salalpur",
        streetAddress2: "Main Road Salalpur",
        city: "Kathua",
        countryArea: "Jammu & Kashmir",
        postalCode: "184151",
        country: {
          country: "India",
        },
      },
      subtotal: {
        gross: {
          amount: 1968.8,
          currency: "INR",
        },
      },
      shippingPrice: {
        gross: {
          amount: 500.0,
          currency: "INR",
        },
      },
      total: {
        gross: {
          amount: 2468.8,
          currency: "INR",
        },
        tax: {
          amount: 0.0,
          currency: "INR",
        },
      },
      lines: [
        {
          productName:
            "Skills in Mathematics JEE Main & Advanced Algebra | Dr. S. K. Goyal | Revised Edition 2026",
          productSku: "B011",
          quantity: 1,
          undiscountedUnitPrice: {
            gross: {
              amount: 795.0,
              currency: "INR",
            },
          },
          unitPrice: {
            gross: {
              amount: 477.0,
              currency: "INR",
            },
          },
          totalPrice: {
            gross: {
              amount: 477.0,
              currency: "INR",
            },
          },
        },
        {
          productName:
            "Skills in Mathematics Trigonometry for JEE Main & Advanced | Amit M. Agarwal | Revised Edition 2026",
          productSku: "B017",
          quantity: 1,
          undiscountedUnitPrice: {
            gross: {
              amount: 425.0,
              currency: "INR",
            },
          },
          unitPrice: {
            gross: {
              amount: 255.0,
              currency: "INR",
            },
          },
          totalPrice: {
            gross: {
              amount: 255.0,
              currency: "INR",
            },
          },
        },
      ],
      invoices: [],
    };

    const invoice = mapOrderToEasyToPickInvoice(mockOrder);

    expect(invoice.invoiceNumber).toBe("8876");
    expect(invoice.customerName).toBe("Chahat Sharma");
    expect(invoice.paymentStatus).toBe("FULLY PAID");
    expect(invoice.amountDue).toBe(0);
    expect(invoice.items.length).toBe(2);

    // Line 1 calculations
    expect(invoice.items[0].mrp).toBe(795);
    expect(invoice.items[0].sellingPrice).toBe(477);
    expect(invoice.items[0].discountPercent).toBe(40);
    expect(invoice.items[0].amount).toBe(477);

    // Line 2 calculations
    expect(invoice.items[1].mrp).toBe(425);
    expect(invoice.items[1].sellingPrice).toBe(255);
    expect(invoice.items[1].discountPercent).toBe(40);
    expect(invoice.items[1].amount).toBe(255);

    // Totals
    expect(invoice.totalMrp).toBe(1220);
    expect(invoice.productSubtotal).toBe(1968.8);
    expect(invoice.shipping).toBe(500);
    expect(invoice.grandTotal).toBe(2468.8);
  });
});
