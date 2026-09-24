import { type ChannelData } from "@dashboard/channels/utils";
import {
  type AttributeValueInput,
  type ProductCreateInput,
  type ProductErrorFragment,
  type ProductVariantChannelListingAddInput,
  useProductChannelListingUpdateMutation,
  useProductCreateMutation,
  useProductMediaCreateMutation,
  useProductVariantChannelListingUpdateMutation,
  useVariantCreateMutation,
} from "@dashboard/graphql";
import { type EditableAmazonProduct } from "@dashboard/products/components/AmazonImportDialog/types";
import { useCallback, useState } from "react";
import slugify from "slugify";

export interface PublishResult {
  success: boolean;
  productId?: string;
  errors?: ProductErrorFragment[];
  errorMessage?: string;
}

// Known Books Product Type and Attribute IDs for easy pick
const BOOKS_PRODUCT_TYPE_ID = "UHJvZHVjdFR5cGU6MjU=";
const BOOKS_CATEGORY_ID = "Q2F0ZWdvcnk6NDU=";
const AUTHOR_ATTRIBUTE_ID = "QXR0cmlidXRlOjQ1";
const PUBLISHER_ATTRIBUTE_ID = "QXR0cmlidXRlOjQz";
const PUBLICATION_YEAR_ATTRIBUTE_ID = "QXR0cmlidXRlOjQ3";
const KOTA_WAREHOUSE_ID = "V2FyZWhvdXNlOjI2ZmQ5NzdiLTMyMmUtNDQ5OS1hYWJhLTI2MjMwNTU3OWM2ZQ==";
const CHANNEL_INR_ID = "Q2hhbm5lbDoz";

function parseWeightToKg(weightStr: string): number | null {
  if (!weightStr) return null;

  const clean = weightStr.toLowerCase().trim();
  const numMatch = clean.match(/([\d.]+)/);

  if (!numMatch) return null;

  const num = parseFloat(numMatch[1]);

  if (isNaN(num)) return null;

  if (clean.includes("g") && !clean.includes("kg")) {
    return parseFloat((num / 1000).toFixed(3));
  }

  return num;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

async function remoteUrlToFile(url: string, filename: string): Promise<File> {
  const scraperBase =
    (typeof process !== "undefined" && process.env?.AMAZON_SCRAPER_API_URL) ||
    (typeof window !== "undefined" && (window as any).__AMAZON_SCRAPER_API_URL__) ||
    "";
  const proxyBase = scraperBase
    ? `${scraperBase.replace(/\/+$/, "")}/api/amazon-image-proxy`
    : "/api/amazon-image-proxy";
  const proxyUrl = `${proxyBase}?url=${encodeURIComponent(url)}`;
  let res: Response | null = null;

  try {
    const proxyRes = await fetch(proxyUrl);

    if (proxyRes.ok) {
      res = proxyRes;
    }
  } catch {
    // ignore
  }

  if (!res || !res.ok) {
    try {
      const directRes = await fetch(url);

      if (directRes.ok) {
        res = directRes;
      }
    } catch {
      // ignore
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Failed to download image from ${url}`);
  }

  const blob = await res.blob();

  if (blob.size < 500) {
    throw new Error(`Downloaded image is invalid or empty (${blob.size} bytes)`);
  }

  const mimeType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";

  return new File([blob], filename, { type: mimeType });
}

export const useAmazonPublish = () => {
  const [publishing, setPublishing] = useState(false);

  const [createProduct] = useProductCreateMutation();
  const [updateProductChannels] = useProductChannelListingUpdateMutation();
  const [createVariant] = useVariantCreateMutation();
  const [updateVariantChannels] = useProductVariantChannelListingUpdateMutation();
  const [createMedia] = useProductMediaCreateMutation();

  const publishProduct = useCallback(
    async (
      product: EditableAmazonProduct,
      channels: ChannelData[],
      defaultWarehouseId?: string
    ): Promise<PublishResult> => {
      try {
        const cleanName = product.name.trim();
        const baseSlug = slugify(cleanName, { lower: true, strict: true, trim: true });
        const finalSlug = product.slug?.trim() || `${baseSlug}-${Date.now().toString().slice(-4)}`;

        // Build rich description formatted as EditorJS JSON blocks
        const blocks: Array<{ type: string; data: Record<string, unknown> }> = [];

        if (product.description) {
          const paragraphs = product.description.split("\n\n").filter(Boolean);

          paragraphs.forEach((p) => {
            blocks.push({
              type: "paragraph",
              data: {
                text: p.replace(/\n/g, "<br>"),
              },
            });
          });
        }

        // Add Specifications block
        const specsList: string[] = [];

        if (product.author) specsList.push(`<b>Author:</b> ${product.author}`);

        if (product.publisher) specsList.push(`<b>Publisher:</b> ${product.publisher}`);

        if (product.publicationDate || product.publicationYear) {
          specsList.push(
            `<b>Publication Year:</b> ${product.publicationYear || product.publicationDate}`
          );
        }

        if (product.language) specsList.push(`<b>Language:</b> ${product.language}`);

        if (product.dimensions) specsList.push(`<b>Dimensions:</b> ${product.dimensions}`);

        if (product.itemWeight) specsList.push(`<b>Item Weight:</b> ${product.itemWeight}`);

        if (product.mrp) specsList.push(`<b>MRP:</b> ₹${product.mrp}`);

        if (product.asin) specsList.push(`<b>Amazon ASIN:</b> ${product.asin}`);

        if (specsList.length > 0) {
          blocks.push({
            type: "header",
            data: {
              text: "Product Specifications",
              level: 3,
            },
          });
          blocks.push({
            type: "list",
            data: {
              style: "unordered",
              items: specsList,
            },
          });
        }

        const editorJsJson = JSON.stringify({
          time: Date.now(),
          blocks,
          version: "2.29.0",
        });

        // 1. Prepare Attributes (Author, Publisher, Publication year)
        const attributes: AttributeValueInput[] = [];

        if (product.author?.trim()) {
          attributes.push({
            id: AUTHOR_ATTRIBUTE_ID,
            plainText: product.author.trim(),
          });
        }

        if (product.publisher?.trim()) {
          attributes.push({
            id: PUBLISHER_ATTRIBUTE_ID,
            values: [product.publisher.trim()],
          });
        }

        const pubYear = (product.publicationYear || product.publicationDate || "").trim();

        if (pubYear) {
          attributes.push({
            id: PUBLICATION_YEAR_ATTRIBUTE_ID,
            plainText: pubYear,
          });
        }

        // Metadata list
        const metadata = [
          { key: "Publisher", value: product.publisher || "" },
          { key: "Publication Year", value: product.publicationYear || "" },
          { key: "Publication Date", value: product.publicationDate || "" },
          { key: "Author", value: product.author || "" },
          { key: "Dimensions", value: product.dimensions || "" },
          { key: "Item Weight", value: product.itemWeight || "" },
          { key: "Language", value: product.language || "" },
          { key: "MRP", value: product.mrp || "" },
          { key: "Amazon ASIN", value: product.asin || "" },
          { key: "Amazon URL", value: product.url || "" },
          { key: "Source", value: "Amazon Import" },
        ].filter((m) => Boolean(m.value));

        const parsedWeight = parseWeightToKg(product.itemWeight);

        // Product Type: Default to Books (UHJvZHVjdFR5cGU6MjU=)
        const productTypeId = product.productTypeId || BOOKS_PRODUCT_TYPE_ID;
        // Category: Default to Books (Q2F0ZWdvcnk6NDU=) to allow immediate publishing
        const categoryId = product.categoryId || BOOKS_CATEGORY_ID;

        const input: ProductCreateInput = {
          name: cleanName,
          slug: finalSlug,
          description: editorJsJson,
          productType: productTypeId,
          category: categoryId,
          weight: parsedWeight,
          attributes,
          metadata,
        };

        const createProductResult = await createProduct({
          variables: { input },
        });

        const productErrors = createProductResult.data?.productCreate?.errors || [];

        if (productErrors.length > 0) {
          return {
            success: false,
            errors: productErrors,
            errorMessage: productErrors.map((e) => e.message).join(", "),
          };
        }

        const newProductId = createProductResult.data?.productCreate?.product?.id;

        if (!newProductId) {
          return {
            success: false,
            errorMessage: "Product ID was not returned after creation",
          };
        }

        // 2. Availability = Channel-INR ONLY
        // Find Channel-INR or use known CHANNEL_INR_ID
        const inrChannel =
          channels?.find(
            (c) =>
              c.id === CHANNEL_INR_ID ||
              c.name?.toLowerCase().includes("inr") ||
              c.currency?.toLowerCase() === "inr"
          ) || { id: CHANNEL_INR_ID };

        const otherChannelIds = (channels || [])
          .filter((c) => c.id !== inrChannel.id)
          .map((c) => c.id);

        try {
          await updateProductChannels({
            variables: {
              id: newProductId,
              input: {
                updateChannels: [
                  {
                    channelId: inrChannel.id,
                    isPublished: true,
                    isAvailableForPurchase: true,
                    visibleInListings: true,
                    availableForPurchaseAt: null,
                    publishedAt: null,
                  },
                ],
                removeChannels: otherChannelIds.length > 0 ? otherChannelIds : undefined,
              },
            },
          });
        } catch (e) {
          console.error("Failed to update product channels:", e);
        }

        // 3. Create Variant with Stock: Warehouse Name = Kota India, Quantity = 100
        const variantSku =
          product.sku?.trim() || `AMZ-${product.asin || Date.now().toString().slice(-6)}`;

        const warehouseId = defaultWarehouseId || KOTA_WAREHOUSE_ID;
        const stocks = [
          {
            warehouse: warehouseId,
            quantity: 100, // Stock Quantity = 100
          },
        ];

        const variantResult = await createVariant({
          variables: {
            input: {
              product: newProductId,
              sku: variantSku,
              stocks,
              trackInventory: true,
              attributes: [],
            },
          },
        });

        const variantId = variantResult.data?.productVariantCreate?.productVariant?.id;

        // 4. Set Variant Channel Pricing on Channel-INR ONLY
        if (variantId && inrChannel) {
          const sellingPriceNum = parseFloat(product.sellingPrice) || 0;
          const mrpNum = parseFloat(product.mrp) || sellingPriceNum;

          const variantChannelsInput: ProductVariantChannelListingAddInput[] = [
            {
              channelId: inrChannel.id,
              price: sellingPriceNum,
              costPrice: mrpNum,
            },
          ];

          try {
            await updateVariantChannels({
              variables: {
                id: variantId,
                input: variantChannelsInput,
              },
            });
          } catch (e) {
            console.error("Failed to update variant channels pricing:", e);
          }
        }

        // 5. Upload Selected Images (one or more) as real binary files
        const selectedList =
          product.selectedImages && product.selectedImages.length > 0
            ? product.selectedImages
            : product.primaryImage
              ? [product.primaryImage]
              : product.images.slice(0, 1);

        // Put primary / cover image first
        const primaryImg = product.primaryImage || selectedList[0];
        const remainingImgs = selectedList.filter((img) => img !== primaryImg);
        const imagesToUpload = primaryImg ? [primaryImg, ...remainingImgs] : remainingImgs;

        for (let i = 0; i < imagesToUpload.length; i++) {
          const imgUrl = imagesToUpload[i];
          const isCover = i === 0;
          const filename = `${baseSlug}-${isCover ? "cover" : i + 1}.jpg`;
          const altText = isCover
            ? `${cleanName} - Cover Image`
            : `${cleanName} - Image ${i + 1}`;

          try {
            let file: File;

            if (imgUrl.startsWith("data:")) {
              file = dataUrlToFile(imgUrl, filename);
            } else {
              file = await remoteUrlToFile(imgUrl, filename);
            }

            const mediaResult = await createMedia({
              variables: {
                product: newProductId,
                image: file,
                alt: altText,
              },
            });

            const mediaErrors = mediaResult.data?.productMediaCreate?.errors || [];

            if (mediaErrors.length > 0) {
              console.warn(`Media upload warning for image ${i + 1}:`, mediaErrors);
            }
          } catch (imgErr) {
            console.error(`Failed to upload image ${i + 1}:`, imgErr);
          }
        }

        return {
          success: true,
          productId: newProductId,
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred during import";

        return {
          success: false,
          errorMessage: message,
        };
      }
    },
    [createMedia, createProduct, createVariant, updateProductChannels, updateVariantChannels]
  );

  return {
    publishProduct,
    publishing,
    setPublishing,
  };
};
