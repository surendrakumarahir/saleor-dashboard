import { encodeCode128B, generateBarcodeSvg } from "./barcode";
import { formatSlipDate, formatSlipMoney, mapOrderToDeliverySlip } from "./utils";

describe("EasyToPick Delivery Slip utils & barcode", () => {
  it("formats slip date accurately", () => {
    const formatted = formatSlipDate("2026-09-14T10:00:00.000Z");

    expect(formatted).toContain("September");
    expect(formatted).toContain("2026");
  });

  it("formats money values for Indian currency", () => {
    expect(formatSlipMoney(1500)).toBe("1,500.00");
    expect(formatSlipMoney(499.5)).toBe("499.50");
    expect(formatSlipMoney(0)).toBe("0.00");
  });

  it("maps order accurately to delivery slip data", () => {
    const mockOrder = {
      id: "order-999",
      number: "8876",
      created: "2026-09-14T08:00:00.000Z",
      isPaid: true,
      paymentStatus: "FULLY_PAID",
      chargeStatus: "FULL",
      shippingAddress: {
        firstName: "Chahat",
        lastName: "Sharma",
        streetAddress1: "Near Government Middle School Salalpur",
        streetAddress2: "Main Road Salalpur",
        city: "Kathua",
        countryArea: "Jammu & Kashmir",
        postalCode: "184151",
        phone: "+91 98765 43210",
        country: {
          country: "India",
        },
      },
      customerNote: "Please deliver before 5 PM",
      total: {
        gross: {
          amount: 2468.8,
          currency: "INR",
        },
      },
      lines: [
        {
          productName: "JEE Main & Advanced Mathematics",
          productSku: "B011",
          quantity: 2,
        },
        {
          productName: "NEET Physics Guide",
          productSku: "B019",
          quantity: 1,
        },
      ],
    };

    const slip = mapOrderToDeliverySlip(mockOrder);

    expect(slip.orderNumber).toBe("8876");
    expect(slip.recipientName).toBe("Chahat Sharma");
    expect(slip.pincode).toBe("184151");
    expect(slip.phone).toBe("+91 98765 43210");
    expect(slip.customerNote).toBe("Please deliver before 5 PM");
    expect(slip.senderCity).toBe("Kota");
    expect(slip.senderState).toBe("Rajasthan");
    expect(slip.senderPincode).toBe("324005");
    expect(slip.senderPhone).toBe("+91 7976776446");
    expect(slip.senderWebsite).toBe("easytopick.in");
    expect(slip.paymentStatus).toBe("PREPAID");
    expect(slip.amountToCollect).toBe(0);
    expect(slip.items).toHaveLength(2);
    expect(slip.totalQuantity).toBe(3);
  });

  it("handles COD unpaid orders correctly", () => {
    const mockOrder = {
      id: "order-cod-1",
      number: "8877",
      isPaid: false,
      paymentStatus: "NOT_CHARGED",
      billingAddress: {
        firstName: "Rahul",
        lastName: "Verma",
        city: "Jaipur",
        countryArea: "Rajasthan",
        postalCode: "302001",
        phone: "9123456789",
      },
      total: {
        gross: {
          amount: 1250,
          currency: "INR",
        },
      },
      lines: [
        {
          productName: "NCERT Class 12 Chemistry",
          quantity: 1,
        },
      ],
    };

    const slip = mapOrderToDeliverySlip(mockOrder);

    expect(slip.paymentStatus).toBe("COD");
    expect(slip.amountToCollect).toBe(1250);
  });

  it("encodes Code 128 barcode modules and generates valid SVG", () => {
    const modules = encodeCode128B("8876");

    expect(modules.length).toBeGreaterThan(0);

    const svgResult = generateBarcodeSvg("8876");

    expect(svgResult.svgString).toContain("<svg");
    expect(svgResult.svgString).toContain("8876");
    expect(svgResult.totalWidth).toBeGreaterThan(0);
    expect(svgResult.totalHeight).toBeGreaterThan(0);
  });
});
