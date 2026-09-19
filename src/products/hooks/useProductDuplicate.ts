import { prepareAttributesInput } from "@dashboard/attributes/utils/handlers";
import {
  type BulkAttributeValueInput,
  ErrorPolicyEnum,
  type ProductCreateInput,
  type ProductDetailsQuery,
  type ProductErrorFragment,
  type ProductVariantBulkCreateInput,
  type ProductVariantChannelListingAddInput,
  type StockInput,
  useProductChannelListingUpdateMutation,
  useProductCreateMutation,
  useProductMediaCreateMutation,
  useProductVariantBulkCreateMutation,
  useProductVariantChannelListingUpdateMutation,
  useVariantCreateMutation,
} from "@dashboard/graphql";
import { getAttributeInputFromProduct } from "@dashboard/products/utils/data";
import { useCallback, useState } from "react";

export interface DuplicateProductOptions {
  name: string;
  slug?: string;
  sku?: string;
  copyMedia: boolean;
  copyPricing: boolean;
  copyStocks: boolean;
}

export interface DuplicateProductResult {
  success: boolean;
  productId?: string;
  errors?: ProductErrorFragment[];
  errorMessage?: string;
}

export const useProductDuplicate = () => {
  const [loading, setLoading] = useState(false);

  const [createProduct] = useProductCreateMutation();
  const [updateProductChannels] = useProductChannelListingUpdateMutation();
  const [createVariant] = useVariantCreateMutation();
  const [updateVariantChannels] = useProductVariantChannelListingUpdateMutation();
  const [bulkCreateVariants] = useProductVariantBulkCreateMutation();
  const [createMedia] = useProductMediaCreateMutation();

  const duplicateProduct = useCallback(
    async (
      product: NonNullable<ProductDetailsQuery["product"]>,
      options: DuplicateProductOptions,
    ): Promise<DuplicateProductResult> => {
      setLoading(true);

      try {
        const attributeInputs = getAttributeInputFromProduct(product);
        const preparedAttributes = prepareAttributesInput({
          attributes: attributeInputs,
          prevAttributes: null,
          updatedFileAttributes: [],
        });

        const productInput: ProductCreateInput = {
          name: options.name.trim(),
          slug: options.slug?.trim() || undefined,
          description: product.description,
          productType: product.productType.id,
          category: product.category?.id || null,
          collections: product.collections?.map(c => c.id) || [],
          attributes: preparedAttributes,
          taxClass: product.taxClass?.id || null,
          weight: product.weight?.value ?? null,
          rating: product.rating ?? null,
          seo:
            product.seoTitle || product.seoDescription
              ? {
                  title: product.seoTitle || undefined,
                  description: product.seoDescription || undefined,
                }
              : undefined,
          metadata: product.metadata?.map(m => ({ key: m.key, value: m.value })) || [],
        };

        const createProductResult = await createProduct({
          variables: {
            input: productInput,
          },
        });

        const productErrors = createProductResult.data?.productCreate?.errors || [];

        if (productErrors.length > 0) {
          return {
            success: false,
            errors: productErrors,
          };
        }

        const newProductId = createProductResult.data?.productCreate?.product?.id;

        if (!newProductId) {
          return {
            success: false,
            errorMessage: "Product ID was not returned after creation",
          };
        }

        // 1. Copy Product Channel Listings (Visibility / Availability)
        if (options.copyPricing && product.channelListings && product.channelListings.length > 0) {
          try {
            await updateProductChannels({
              variables: {
                id: newProductId,
                input: {
                  updateChannels: product.channelListings.map(listing => ({
                    channelId: listing.channel.id,
                    isPublished: listing.isPublished,
                    publishedAt: listing.publishedAt,
                    isAvailableForPurchase: listing.isAvailableForPurchase,
                    availableForPurchaseAt: listing.availableForPurchaseAt,
                    visibleInListings: listing.visibleInListings,
                  })),
                },
              },
            });
          } catch (e) {
            console.error("Failed to copy product channels:", e);
          }
        }

        // 2. Create Variants
        const hasVariants = product.productType?.hasVariants;

        if (!hasVariants) {
          // Simple Product: create the single default variant
          const originalVariant = product.variants?.[0];
          const customSku = options.sku?.trim();
          const fallbackSku = originalVariant?.sku ? `${originalVariant.sku}-copy` : undefined;
          const sku = customSku || fallbackSku;

          const stocks: StockInput[] =
            options.copyStocks && originalVariant?.stocks
              ? originalVariant.stocks.map(s => ({
                  warehouse: s.warehouse.id,
                  quantity: s.quantity,
                }))
              : [];

          const variantResult = await createVariant({
            variables: {
              input: {
                product: newProductId,
                sku: sku || undefined,
                stocks,
                trackInventory: originalVariant?.trackInventory ?? true,
                quantityLimitPerCustomer: originalVariant?.quantityLimitPerCustomer ?? undefined,
                preorder: originalVariant?.preorder
                  ? {
                      globalThreshold: originalVariant.preorder.globalThreshold,
                      endDate: originalVariant.preorder.endDate,
                    }
                  : undefined,
                attributes: [],
              },
            },
          });

          const variantId = variantResult.data?.productVariantCreate?.productVariant?.id;

          // Copy variant channel listings (prices)
          if (
            options.copyPricing &&
            variantId &&
            originalVariant?.channelListings &&
            originalVariant.channelListings.length > 0
          ) {
            const channelListingInputs: ProductVariantChannelListingAddInput[] =
              originalVariant.channelListings.map(l => ({
                channelId: l.channel.id,
                price: l.price?.amount ?? 0,
                costPrice: l.costPrice?.amount,
                preorderThreshold: l.preorderThreshold?.quantity,
              }));

            try {
              await updateVariantChannels({
                variables: {
                  id: variantId,
                  input: channelListingInputs,
                },
              });
            } catch (e) {
              console.error("Failed to copy variant channels:", e);
            }
          }
        } else if (product.variants && product.variants.length > 0) {
          // Configurable Product: bulk create all variants
          const inputs: ProductVariantBulkCreateInput[] = product.variants.map((variant, index) => {
            const variantSkuSuffix =
              product.variants && product.variants.length > 1 ? `-${index + 1}` : "";
            const sku = variant.sku ? `${variant.sku}-copy${variantSkuSuffix}` : undefined;

            const stocks: StockInput[] | undefined =
              options.copyStocks && variant.stocks
                ? variant.stocks.map(s => ({
                    warehouse: s.warehouse.id,
                    quantity: s.quantity,
                  }))
                : undefined;

            const channelListings: ProductVariantChannelListingAddInput[] | undefined =
              options.copyPricing && variant.channelListings
                ? variant.channelListings.map(l => ({
                    channelId: l.channel.id,
                    price: l.price?.amount ?? 0,
                    costPrice: l.costPrice?.amount,
                    preorderThreshold: l.preorderThreshold?.quantity,
                  }))
                : undefined;

            const attributes: BulkAttributeValueInput[] = (variant.attributes || []).map(attr => ({
              id: attr.attribute.id,
              values: (attr.values || []).map(v => v.slug ?? v.name ?? "").filter(Boolean),
            }));

            return {
              name: variant.name,
              sku,
              trackInventory: variant.trackInventory,
              quantityLimitPerCustomer: variant.quantityLimitPerCustomer ?? undefined,
              preorder: variant.preorder
                ? {
                    globalThreshold: variant.preorder.globalThreshold,
                    endDate: variant.preorder.endDate,
                  }
                : undefined,
              stocks,
              channelListings,
              attributes,
            };
          });

          try {
            await bulkCreateVariants({
              variables: {
                id: newProductId,
                inputs,
                errorPolicy: ErrorPolicyEnum.REJECT_FAILED_ROWS,
              },
            });
          } catch (e) {
            console.error("Failed to bulk create variants:", e);
          }
        }

        // 3. Copy Media / Images
        if (options.copyMedia && product.media && product.media.length > 0) {
          for (const mediaItem of product.media) {
            if (mediaItem.url) {
              try {
                await createMedia({
                  variables: {
                    product: newProductId,
                    mediaUrl: mediaItem.url,
                    alt: mediaItem.alt || "",
                  },
                });
              } catch (e) {
                console.error("Failed to copy product media item:", e);
              }
            }
          }
        }

        return {
          success: true,
          productId: newProductId,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";

        return {
          success: false,
          errorMessage: message,
        };
      } finally {
        setLoading(false);
      }
    },
    [
      bulkCreateVariants,
      createMedia,
      createProduct,
      createVariant,
      updateProductChannels,
      updateVariantChannels,
    ],
  );

  return {
    duplicateProduct,
    loading,
  };
};
