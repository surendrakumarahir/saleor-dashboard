import { renderHook } from "@testing-library/react-hooks";

import { useProductDuplicate } from "./useProductDuplicate";

const mockCreateProduct = jest.fn();
const mockUpdateProductChannels = jest.fn();
const mockCreateVariant = jest.fn();
const mockUpdateVariantChannels = jest.fn();
const mockBulkCreateVariants = jest.fn();
const mockCreateMedia = jest.fn();

jest.mock("@dashboard/graphql", () => ({
  ...(jest.requireActual("@dashboard/graphql") as Record<string, unknown>),
  useProductCreateMutation: () => [mockCreateProduct],
  useProductChannelListingUpdateMutation: () => [mockUpdateProductChannels],
  useVariantCreateMutation: () => [mockCreateVariant],
  useProductVariantChannelListingUpdateMutation: () => [mockUpdateVariantChannels],
  useProductVariantBulkCreateMutation: () => [mockBulkCreateVariants],
  useProductMediaCreateMutation: () => [mockCreateMedia],
  ErrorPolicyEnum: {
    REJECT_FAILED_ROWS: "REJECT_FAILED_ROWS",
  },
}));

jest.mock("@dashboard/products/utils/data", () => ({
  getAttributeInputFromProduct: jest.fn(() => []),
}));

jest.mock("@dashboard/attributes/utils/handlers", () => ({
  prepareAttributesInput: jest.fn(() => []),
}));

describe("useProductDuplicate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("duplicates a simple product successfully", async () => {
    // Arrange
    const originalProduct = {
      id: "prod-1",
      name: "Original Simple Product",
      description: "Original Description",
      productType: {
        id: "pt-1",
        hasVariants: false,
      },
      category: {
        id: "cat-1",
        name: "Books",
      },
      collections: [{ id: "col-1", name: "Featured" }],
      attributes: [],
      taxClass: { id: "tax-1", name: "Standard" },
      weight: { value: 1.5 },
      rating: 4.5,
      seoTitle: "SEO Title",
      seoDescription: "SEO Description",
      metadata: [{ key: "source", value: "test" }],
      channelListings: [
        {
          channel: { id: "chan-1" },
          isPublished: true,
          publishedAt: "2026-01-01",
          isAvailableForPurchase: true,
          availableForPurchaseAt: "2026-01-01",
          visibleInListings: true,
        },
      ],
      variants: [
        {
          id: "var-1",
          name: "Default Variant",
          sku: "ORIG-SKU",
          trackInventory: true,
          quantityLimitPerCustomer: 5,
          weight: { value: 1.5 },
          preorder: null,
          stocks: [{ warehouse: { id: "wh-1" }, quantity: 10 }],
          channelListings: [
            {
              channel: { id: "chan-1" },
              price: { amount: 199 },
              costPrice: { amount: 100 },
              preorderThreshold: null,
            },
          ],
        },
      ],
      media: [{ url: "https://example.com/img.jpg", alt: "Book cover" }],
    };

    mockCreateProduct.mockResolvedValue({
      data: {
        productCreate: {
          product: { id: "new-prod-123" },
          errors: [],
        },
      },
    });

    mockCreateVariant.mockResolvedValue({
      data: {
        productVariantCreate: {
          productVariant: { id: "new-var-456" },
          errors: [],
        },
      },
    });

    const { result } = renderHook(() => useProductDuplicate());

    // Act
    const duplicateResult = await result.current.duplicateProduct(originalProduct as any, {
      name: "Disha Errorless 39 Years NEET Chemistry",
      slug: "disha-errorless-39-years-neet-chemistry",
      sku: "DISHA-CHEM-01",
      copyMedia: true,
      copyPricing: true,
      copyStocks: true,
    });

    // Assert
    expect(duplicateResult.success).toBe(true);
    expect(duplicateResult.productId).toBe("new-prod-123");
    expect(mockCreateProduct).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          name: "Disha Errorless 39 Years NEET Chemistry",
          slug: "disha-errorless-39-years-neet-chemistry",
          productType: "pt-1",
          category: "cat-1",
        }),
      },
    });
    expect(mockUpdateProductChannels).toHaveBeenCalledWith({
      variables: {
        id: "new-prod-123",
        input: {
          updateChannels: [
            expect.objectContaining({
              channelId: "chan-1",
              isPublished: true,
            }),
          ],
        },
      },
    });
    expect(mockCreateVariant).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          product: "new-prod-123",
          sku: "DISHA-CHEM-01",
          stocks: [{ warehouse: "wh-1", quantity: 10 }],
        }),
      },
    });
    expect(mockUpdateVariantChannels).toHaveBeenCalledWith({
      variables: {
        id: "new-var-456",
        input: [
          expect.objectContaining({
            channelId: "chan-1",
            price: 199,
          }),
        ],
      },
    });
    expect(mockCreateMedia).toHaveBeenCalledWith({
      variables: {
        product: "new-prod-123",
        mediaUrl: "https://example.com/img.jpg",
        alt: "Book cover",
      },
    });
  });

  it("handles productCreate errors gracefully", async () => {
    // Arrange
    const originalProduct = {
      id: "prod-1",
      name: "Original Product",
      productType: { id: "pt-1", hasVariants: false },
      attributes: [],
      collections: [],
      variants: [],
      media: [],
    };

    mockCreateProduct.mockResolvedValue({
      data: {
        productCreate: {
          product: null,
          errors: [{ field: "name", message: "Already exists", code: "ALREADY_EXISTS" }],
        },
      },
    });

    const { result } = renderHook(() => useProductDuplicate());

    // Act
    const duplicateResult = await result.current.duplicateProduct(originalProduct as any, {
      name: "Existing Product Name",
      copyMedia: false,
      copyPricing: false,
      copyStocks: false,
    });

    // Assert
    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.errors).toHaveLength(1);
    expect(mockCreateVariant).not.toHaveBeenCalled();
  });
});
