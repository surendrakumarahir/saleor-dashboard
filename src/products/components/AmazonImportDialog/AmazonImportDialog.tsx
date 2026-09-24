import { type ChannelData } from "@dashboard/channels/utils";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crop,
  Download,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import slugify from "slugify";

import { useAmazonPublish } from "../../hooks/useAmazonPublish";
import styles from "./AmazonImportDialog.module.css";
import { ImageEditorModal } from "./ImageEditorModal";
import {
  type EditableAmazonProduct,
  type ExtractedAmazonProduct,
  type ExtractResponse,
} from "./types";

export interface NamedNode {
  id: string;
  name: string;
}

interface AmazonImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess?: (productId: string) => void;
  channels: ChannelData[];
  defaultWarehouseId?: string;
  productTypes?: NamedNode[];
  categories?: NamedNode[];
}

const BOOKS_PRODUCT_TYPE_ID = "UHJvZHVjdFR5cGU6MjU=";
const BOOKS_CATEGORY_ID = "Q2F0ZWdvcnk6NDU=";
const KOTA_WAREHOUSE_ID = "V2FyZWhvdXNlOjI2ZmQ5NzdiLTMyMmUtNDQ5OS1hYWJhLTI2MjMwNTU3OWM2ZQ==";

export const AmazonImportDialog = ({
  open,
  onClose,
  onImportSuccess,
  channels,
  defaultWarehouseId,
  productTypes = [],
  categories = [],
}: AmazonImportDialogProps) => {
  const [urlInput, setUrlInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [products, setProducts] = useState<EditableAmazonProduct[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Image Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [editingImageIndex, setEditingImageIndex] = useState(-1);

  const { publishProduct, publishing } = useAmazonPublish();

  // Reset state when opened/closed
  useEffect(() => {
    if (!open) {
      setUrlInput("");
      setExtracting(false);
      setExtractError(null);
      setProducts([]);
      setActiveTabIndex(0);
      setEditorOpen(false);
    }
  }, [open]);

  // Handle URL / ASIN Extraction
  const handleExtract = async () => {
    const rawUrls = urlInput
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (rawUrls.length === 0) {
      setExtractError("Please enter at least one Amazon URL or ASIN");

      return;
    }

    setExtracting(true);
    setExtractError(null);

    try {
      const scraperBase =
        (typeof process !== "undefined" && process.env?.AMAZON_SCRAPER_API_URL) ||
        (typeof window !== "undefined" && (window as any).__AMAZON_SCRAPER_API_URL__) ||
        "";

      const extractEndpoint = scraperBase
        ? `${scraperBase.replace(/\/+$/, "")}/api/amazon-extract`
        : "/api/amazon-extract";

      let response: Response;

      try {
        response = await fetch(extractEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: rawUrls }),
        });
      } catch (netErr: unknown) {
        const netMsg = netErr instanceof Error ? netErr.message : "Network error";

        setExtractError(
          `Cannot connect to Amazon scraper service (${extractEndpoint}). Please ensure the scraper server is running: ${netMsg}`
        );
        setExtracting(false);

        return;
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        const snippet = text.slice(0, 100).replace(/<[^>]+>/g, "").trim();

        setExtractError(
          `Scraper service endpoint returned non-JSON response (HTTP ${response.status}: ${snippet || "Endpoint not found"}). In production, please configure the Amazon Scraper backend server (AMAZON_SCRAPER_API_URL).`
        );
        setExtracting(false);

        return;
      }

      const data: ExtractResponse = await response.json();

      if (!data.success || !data.products || data.products.length === 0) {
        const errorMsg =
          data.errors?.[0]?.error || "Could not extract product details. Please check the URL/ASIN.";

        setExtractError(errorMsg);
        setExtracting(false);

        return;
      }

      // Default Product Type = Books
      const booksProductType =
        productTypes.find((pt) => pt.name.toLowerCase() === "books") ||
        productTypes.find((pt) => pt.id === BOOKS_PRODUCT_TYPE_ID) ||
        productTypes[0];
      const selectedProductTypeId = booksProductType?.id || BOOKS_PRODUCT_TYPE_ID;

      // Default Category = Books
      const booksCategory =
        categories.find((c) => c.name.toLowerCase() === "books") ||
        categories.find((c) => c.id === BOOKS_CATEGORY_ID) ||
        categories[0];
      const selectedCategoryId = booksCategory?.id || BOOKS_CATEGORY_ID;

      // Convert Extracted to Editable products
      const editableList: EditableAmazonProduct[] = data.products.map(
        (p: ExtractedAmazonProduct, idx: number) => {
          const sellingPriceStr = p.sellingPrice != null ? p.sellingPrice.toString() : "";
          const mrpStr = p.mrp != null ? p.mrp.toString() : sellingPriceStr;
          const cleanName = p.title || `Imported Amazon Product ${idx + 1}`;
          const generatedSlug = slugify(cleanName, { lower: true, strict: true, trim: true });

          // Select extracted images (primary image first)
          const primaryImg = p.primaryImage || p.images[0] || "";
          const initialSelected =
            p.images.length > 0 ? [...p.images] : primaryImg ? [primaryImg] : [];

          return {
            tempId: `${Date.now()}-${idx}`,
            asin: p.asin || "",
            url: p.url,
            name: cleanName,
            slug: generatedSlug,
            sku: p.asin ? `AMZ-${p.asin}` : `AMZ-${Date.now().toString().slice(-6)}`,
            productTypeId: selectedProductTypeId,
            categoryId: selectedCategoryId,
            sellingPrice: sellingPriceStr,
            mrp: mrpStr,
            author: p.author || "",
            publisher: p.publisher || "",
            publicationDate: p.publicationDate || "",
            publicationYear: p.publicationYear || "",
            itemWeight: p.itemWeight || "",
            dimensions: p.dimensions || "",
            language: p.language || "",
            description: p.description || "",
            images: [...p.images],
            selectedImages: initialSelected,
            primaryImage: primaryImg,
            status: "idle",
          };
        }
      );

      setProducts(editableList);
      setActiveTabIndex(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to extract product from Amazon";

      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  };

  const activeProduct = products[activeTabIndex] || null;

  // Update field of the active product
  const updateActiveProduct = (field: keyof EditableAmazonProduct, value: unknown) => {
    if (!activeProduct) return;

    setProducts((prev) => {
      const copy = [...prev];

      copy[activeTabIndex] = {
        ...copy[activeTabIndex],
        [field]: value,
      };

      return copy;
    });
  };

  // Toggle selection of an image (user can select one or more images)
  const toggleImageSelection = (imgUrl: string) => {
    if (!activeProduct) return;

    const current = activeProduct.selectedImages || [];
    const isSelected = current.includes(imgUrl);
    let updated: string[];
    let newPrimary = activeProduct.primaryImage;

    if (isSelected) {
      updated = current.filter((u) => u !== imgUrl);

      if (newPrimary === imgUrl) {
        newPrimary = updated[0] || "";
      }
    } else {
      updated = [...current, imgUrl];

      if (!newPrimary) {
        newPrimary = imgUrl;
      }
    }

    updateActiveProduct("selectedImages", updated);
    updateActiveProduct("primaryImage", newPrimary);
  };

  // Designate an image as the main Cover image
  const setCoverImage = (imgUrl: string) => {
    if (!activeProduct) return;

    const current = activeProduct.selectedImages || [];
    const updated = current.includes(imgUrl) ? current : [imgUrl, ...current];

    updateActiveProduct("selectedImages", updated);
    updateActiveProduct("primaryImage", imgUrl);
  };

  const selectAllImages = () => {
    if (!activeProduct) return;

    updateActiveProduct("selectedImages", [...activeProduct.images]);

    if (!activeProduct.primaryImage && activeProduct.images.length > 0) {
      updateActiveProduct("primaryImage", activeProduct.images[0]);
    }
  };

  const deselectAllImages = () => {
    if (!activeProduct) return;

    updateActiveProduct("selectedImages", []);
    updateActiveProduct("primaryImage", "");
  };

  const openImageEditor = (imgUrl: string, idx: number) => {
    setEditingImageUrl(imgUrl);
    setEditingImageIndex(idx);
    setEditorOpen(true);
  };

  const handleSaveEditedImage = (editedDataUrl: string) => {
    if (!activeProduct || editingImageIndex === -1) return;

    const originalUrl = activeProduct.images[editingImageIndex];

    const updatedImages = [...activeProduct.images];
    updatedImages[editingImageIndex] = editedDataUrl;

    const updatedSelected = (activeProduct.selectedImages || []).map((u) =>
      u === originalUrl ? editedDataUrl : u
    );
    if (!updatedSelected.includes(editedDataUrl)) {
      updatedSelected.push(editedDataUrl);
    }

    const isPrimary = activeProduct.primaryImage === originalUrl;

    setProducts((prev) => {
      const copy = [...prev];

      copy[activeTabIndex] = {
        ...copy[activeTabIndex],
        images: updatedImages,
        selectedImages: updatedSelected,
        primaryImage: isPrimary ? editedDataUrl : copy[activeTabIndex].primaryImage,
      };

      return copy;
    });
  };

  // Publish Active Product
  const handlePublishActive = async () => {
    if (!activeProduct) return;

    updateActiveProduct("status", "publishing");
    updateActiveProduct("errorMessage", undefined);

    const warehouseId = defaultWarehouseId || KOTA_WAREHOUSE_ID;
    const result = await publishProduct(activeProduct, channels, warehouseId);

    if (result.success && result.productId) {
      updateActiveProduct("status", "success");
      updateActiveProduct("createdProductId", result.productId);

      if (onImportSuccess) {
        onImportSuccess(result.productId);
      }
    } else {
      updateActiveProduct("status", "error");
      updateActiveProduct("errorMessage", result.errorMessage || "Failed to publish product");
    }
  };

  // Publish All Products Sequentially
  const [publishingAll, setPublishingAll] = useState(false);

  const updateProductById = (tempId: string, updates: Partial<EditableAmazonProduct>) => {
    setProducts((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, ...updates } : p))
    );
  };

  const handlePublishAll = async () => {
    if (publishing || publishingAll || products.length === 0) return;

    setPublishingAll(true);

    const warehouseId = defaultWarehouseId || KOTA_WAREHOUSE_ID;

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];

      if (prod.status === "success") continue;

      setActiveTabIndex(i);
      updateProductById(prod.tempId, { status: "publishing", errorMessage: undefined });

      const result = await publishProduct(prod, channels, warehouseId);

      if (result.success && result.productId) {
        updateProductById(prod.tempId, {
          status: "success",
          createdProductId: result.productId,
        });

        if (onImportSuccess) {
          onImportSuccess(result.productId);
        }
      } else {
        updateProductById(prod.tempId, {
          status: "error",
          errorMessage: result.errorMessage || "Failed to publish product",
        });
      }
    }

    setPublishingAll(false);
  };

  // Discount calculation
  const discountPercent = useMemo(() => {
    if (!activeProduct) return 0;

    const sp = parseFloat(activeProduct.sellingPrice);
    const mrp = parseFloat(activeProduct.mrp);

    if (!isNaN(sp) && !isNaN(mrp) && mrp > sp && mrp > 0) {
      return Math.round(((mrp - sp) / mrp) * 100);
    }

    return 0;
  }, [activeProduct]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.amazonIconWrapper}>
              <Sparkles size={20} />
            </div>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Text size={5} fontWeight="bold">
                Amazon 1-Click Product Importer
              </Text>
              <Text size={2} color="default2">
                Auto-fills Books Product Type, Attributes (Author, Publisher, Year), Channel-INR & Kota India Stock (100)
              </Text>
            </Box>
          </div>
          <Button variant="tertiary" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* Sub-header for Multiple Products Navigation (Fixed outside scrollable body to prevent overlap) */}
        {products.length > 1 && (
          <div className={styles.productTabsContainer}>
            <div className={styles.productTabsList}>
              {products.map((prod, idx) => {
                const isActive = idx === activeTabIndex;

                return (
                  <div
                    key={prod.tempId}
                    className={`${styles.productTab} ${
                      isActive ? styles.productTabActive : ""
                    }`}
                    onClick={() => setActiveTabIndex(idx)}
                    title={prod.name}
                  >
                    <span className={styles.productTabPill}>{idx + 1}</span>
                    <span className={styles.productTabTitle}>
                      {prod.name || `Product ${idx + 1}`}
                    </span>
                    {prod.status === "success" && (
                      <CheckCircle2 size={13} color="#166534" />
                    )}
                    {prod.status === "error" && (
                      <AlertCircle size={13} color="#991b1b" />
                    )}
                    {prod.status === "publishing" && (
                      <div
                        className={styles.loadingSpinner}
                        style={{ width: 12, height: 12, borderWidth: 2 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.tabNavActions}>
              <button
                type="button"
                className={styles.tabNavBtn}
                onClick={() => setActiveTabIndex((i) => Math.max(0, i - 1))}
                disabled={activeTabIndex === 0}
                title="Previous Product"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                {activeTabIndex + 1} / {products.length}
              </span>
              <button
                type="button"
                className={styles.tabNavBtn}
                onClick={() =>
                  setActiveTabIndex((i) => Math.min(products.length - 1, i + 1))
                }
                disabled={activeTabIndex === products.length - 1}
                title="Next Product"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Step 1: Input URL / ASIN when no products extracted yet */}
          {products.length === 0 ? (
            <div className={styles.sectionCard}>
              <div className={styles.infoBox}>
                <div className={styles.infoBoxHeader}>
                  <BookOpen size={16} />
                  <span>How to Import Products from Amazon</span>
                </div>
                <Text size={2} color="default2">
                  Paste Amazon product page links (e.g. <code>https://www.amazon.in/dp/B08SKDMSXZ</code>)
                  or 10-character ASINs. The product will be created with:
                  <b> Product Type = Books</b>, <b>Attributes = Author, Publisher, Publication year</b>,
                  <b> Availability = Channel-INR</b>, <b>Warehouse = Kota India (Qty: 100)</b>, and
                  <b> 1 Cover Image</b>.
                </Text>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Amazon URLs or ASINs (One per line)</label>
                <textarea
                  className={styles.urlTextarea}
                  placeholder={`https://www.amazon.in/dp/B08SKDMSXZ\nB08SKDMSXZ`}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={extracting}
                  rows={5}
                />
              </div>

              <div className={styles.quickActionRow}>
                <div className={styles.sampleChips}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Quick sample:</span>
                  <button
                    type="button"
                    className={styles.chipButton}
                    onClick={() => setUrlInput("https://www.amazon.in/dp/B08SKDMSXZ")}
                  >
                    Psychology Book (B08SKDMSXZ)
                  </button>
                  <button
                    type="button"
                    className={styles.chipButton}
                    onClick={() => setUrlInput("B08SKDMSXZ")}
                  >
                    ASIN Only
                  </button>
                </div>

                <Button
                  variant="primary"
                  onClick={handleExtract}
                  disabled={extracting || !urlInput.trim()}
                >
                  {extracting ? (
                    <>
                      <div className={styles.loadingSpinner} />
                      Scraping Amazon...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Fetch Product Data
                    </>
                  )}
                </Button>
              </div>

              {extractError && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#991b1b",
                    fontSize: 13,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{extractError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Product Details, Attributes & Multi-Image Select */
            <>
              {/* Status Banner */}
              {activeProduct?.status === "success" && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 10,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 size={20} color="#166534" />
                    <div>
                      <Text size={3} fontWeight="bold" color="default1">
                        Product successfully imported into Saleor!
                      </Text>
                      <Text size={2} color="default2">
                        SKU: {activeProduct.sku} | ID: {activeProduct.createdProductId}
                      </Text>
                    </div>
                  </div>
                  {activeProduct.createdProductId && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.open(`/products/${activeProduct.createdProductId}`, "_blank");
                      }}
                    >
                      <ExternalLink size={14} /> View Product
                    </Button>
                  )}
                </div>
              )}

              {activeProduct?.status === "error" && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 10,
                    padding: "12px 16px",
                    color: "#991b1b",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{activeProduct.errorMessage || "Failed to publish product"}</span>
                </div>
              )}

              {/* Configuration Summary Badge Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 16px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              >
                <span className={styles.badge}>Product Type: Books</span>
                <span className={styles.badge}>Channel: Channel-INR</span>
                <span className={styles.badge}>Stock: Kota India (Qty: 100)</span>
                <span className={styles.badge}>
                  Images: {activeProduct?.selectedImages?.length || 0} Selected
                </span>
              </div>

              {/* 1. Basic Product Information Card */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <Text size={3} fontWeight="bold">
                    1. Basic Product Information
                  </Text>
                  {activeProduct?.asin && (
                    <span className={styles.badge}>ASIN: {activeProduct.asin}</span>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Product Title / Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={activeProduct?.name || ""}
                    onChange={(e) => updateActiveProduct("name", e.target.value)}
                  />
                </div>

                <div className={styles.grid3}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>URL Slug</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.slug || ""}
                      onChange={(e) => updateActiveProduct("slug", e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>SKU</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.sku || ""}
                      onChange={(e) => updateActiveProduct("sku", e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Product Type</label>
                    <select
                      className={styles.selectField}
                      value={activeProduct?.productTypeId || BOOKS_PRODUCT_TYPE_ID}
                      onChange={(e) => updateActiveProduct("productTypeId", e.target.value)}
                    >
                      <option value={BOOKS_PRODUCT_TYPE_ID}>Books</option>
                      {productTypes
                        .filter((pt) => pt.id !== BOOKS_PRODUCT_TYPE_ID)
                        .map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Category</label>
                  <select
                    className={styles.selectField}
                    value={activeProduct?.categoryId || BOOKS_CATEGORY_ID}
                    onChange={(e) => updateActiveProduct("categoryId", e.target.value)}
                  >
                    <option value={BOOKS_CATEGORY_ID}>Books</option>
                    {categories
                      .filter((c) => c.id !== BOOKS_CATEGORY_ID)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 2. Attributes (Author, Publisher, Publication year) Card */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Text size={3} fontWeight="bold">
                      2. Product Attributes (3 Attributes)
                    </Text>
                    <Info size={14} color="#64748b" />
                  </Box>
                  <Text size={2} color="default2">
                    Auto-mapped to Saleor Book Attributes
                  </Text>
                </div>

                <div className={styles.grid3}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Author</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.author || ""}
                      onChange={(e) => updateActiveProduct("author", e.target.value)}
                      placeholder="e.g. P.D Pathak"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Publisher</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.publisher || ""}
                      onChange={(e) => updateActiveProduct("publisher", e.target.value)}
                      placeholder="e.g. Shri Vinod Pustak Mandir"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Publication year</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.publicationYear || activeProduct?.publicationDate || ""}
                      onChange={(e) => {
                        updateActiveProduct("publicationYear", e.target.value);
                        updateActiveProduct("publicationDate", e.target.value);
                      }}
                      placeholder="e.g. 2021"
                    />
                  </div>
                </div>

                <div className={styles.grid3}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Language</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.language || ""}
                      onChange={(e) => updateActiveProduct("language", e.target.value)}
                      placeholder="e.g. Hindi, English"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Weight</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.itemWeight || ""}
                      onChange={(e) => updateActiveProduct("itemWeight", e.target.value)}
                      placeholder="e.g. 460 g"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Dimensions</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={activeProduct?.dimensions || ""}
                      onChange={(e) => updateActiveProduct("dimensions", e.target.value)}
                      placeholder="e.g. 20.7 x 2.6 x 13.5 cm"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Pricing Card */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <Text size={3} fontWeight="bold">
                    3. Pricing & Discounts (Channel-INR)
                  </Text>
                  {discountPercent > 0 && (
                    <span className={styles.discountBadge}>{discountPercent}% OFF</span>
                  )}
                </div>

                <div className={styles.grid2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.inputField}
                      value={activeProduct?.sellingPrice || ""}
                      onChange={(e) => updateActiveProduct("sellingPrice", e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>MRP / Original Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.inputField}
                      value={activeProduct?.mrp || ""}
                      onChange={(e) => updateActiveProduct("mrp", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Description Card */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <Text size={3} fontWeight="bold">
                    4. Product Description
                  </Text>
                </div>

                <div className={styles.fieldGroup}>
                  <textarea
                    className={styles.inputField}
                    rows={5}
                    value={activeProduct?.description || ""}
                    onChange={(e) => updateActiveProduct("description", e.target.value)}
                    placeholder="Product description and key bullet points..."
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
              </div>

              {/* 5. Product Images (Select one or more images) */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Text size={3} fontWeight="bold">
                      5. Product Images ({activeProduct?.selectedImages?.length || 0} of{" "}
                      {activeProduct?.images?.length || 0} Selected)
                    </Text>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={selectAllImages}
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={deselectAllImages}
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                    >
                      Deselect All
                    </button>
                  </Box>
                </div>
                <Text size={2} color="default2">
                  Select one or more images to import. The <b>Cover</b> image will be the main display image on the website.
                </Text>

                <div className={styles.imageGrid}>
                  {activeProduct?.images.map((imgUrl, idx) => {
                    const isSelected = activeProduct.selectedImages?.includes(imgUrl) ?? false;
                    const isCover = activeProduct.primaryImage === imgUrl;

                    return (
                      <div
                        key={idx}
                        className={`${styles.imageCard} ${
                          isCover
                            ? styles.imageCardCover
                            : isSelected
                            ? styles.imageCardSelected
                            : ""
                        }`}
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() => toggleImageSelection(imgUrl)}
                      >
                        {isCover && <span className={styles.coverBadge}>Cover</span>}

                        <input
                          type="checkbox"
                          className={styles.selectCheckbox}
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleImageSelection(imgUrl);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title={isSelected ? "Deselect image" : "Select image"}
                        />

                        <div className={styles.imageThumbnailWrapper}>
                          <img
                            src={imgUrl}
                            alt={`Product image ${idx + 1}`}
                            className={styles.imageThumbnail}
                            loading="lazy"
                          />
                        </div>

                        <div
                          className={styles.imageActions}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => openImageEditor(imgUrl, idx)}
                            title="Crop & Edit Image"
                          >
                            <Crop size={12} /> Edit
                          </button>

                          {!isCover && (
                            <button
                              type="button"
                              className={styles.coverButton}
                              onClick={() => setCoverImage(imgUrl)}
                              title="Set as main cover image"
                            >
                              <Star size={11} /> Set Cover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {products.length === 0 ? (
            <>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExtract}
                disabled={extracting || !urlInput.trim()}
              >
                <Download size={16} />
                Fetch Product Data
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setProducts([]);
                  setUrlInput("");
                }}
                disabled={publishing}
              >
                Import Another Product
              </Button>

              <Box display="flex" gap={2}>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={publishing || publishingAll}
                >
                  Close
                </Button>

                {products.length > 1 && (
                  <Button
                    variant="secondary"
                    onClick={handlePublishAll}
                    disabled={
                      publishing ||
                      publishingAll ||
                      products.every((p) => p.status === "success")
                    }
                  >
                    {publishingAll ? (
                      <>
                        <div className={styles.loadingSpinner} />
                        Publishing All...
                      </>
                    ) : (
                      <>
                        <Layers size={15} />
                        Publish All (
                        {products.filter((p) => p.status !== "success").length})
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={handlePublishActive}
                  disabled={
                    publishing || publishingAll || activeProduct?.status === "publishing"
                  }
                >
                  {publishing ||
                  publishingAll ||
                  activeProduct?.status === "publishing" ? (
                    <>
                      <div className={styles.loadingSpinner} />
                      Publishing to Store...
                    </>
                  ) : activeProduct?.status === "success" ? (
                    <>
                      <CheckCircle2 size={16} />
                      Imported ({activeTabIndex + 1}/{products.length})
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Import & Publish Product{" "}
                      {products.length > 1
                        ? `(${activeTabIndex + 1}/${products.length})`
                        : ""}
                    </>
                  )}
                </Button>
              </Box>
            </>
          )}
        </div>
      </div>

      {/* Image Editor Modal for cropping & adjustments */}
      <ImageEditorModal
        open={editorOpen}
        imageUrl={editingImageUrl}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveEditedImage}
      />
    </div>
  );
};
