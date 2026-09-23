import BackButton from "@dashboard/components/BackButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { type ProductDetailsQuery } from "@dashboard/graphql";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import { useProductDuplicate } from "@dashboard/products/hooks/useProductDuplicate";
import { getProductErrorMessage } from "@dashboard/utils/errors";
import { Box, Button, Checkbox, Input, Skeleton, Text } from "@saleor/macaw-ui-next";
import { Copy } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import slugify from "slugify";

import { duplicateDialogMessages as messages } from "./messages";
import styles from "./ProductDuplicateDialog.module.css";

export interface ProductDuplicateDialogProps {
  open: boolean;
  product: NonNullable<ProductDetailsQuery["product"]> | null;
  loadingProduct?: boolean;
  onClose: () => void;
  onSuccess: (newProductId: string) => void;
}

export const ProductDuplicateDialog = ({
  open,
  product,
  loadingProduct = false,
  onClose,
  onSuccess,
}: ProductDuplicateDialogProps) => {
  const intl = useIntl();
  const notify = useNotifier();
  const { duplicateProduct, loading: isDuplicating } = useProductDuplicate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [sku, setSku] = useState("");
  const [copyMedia, setCopyMedia] = useState(true);
  const [copyPricing, setCopyPricing] = useState(true);
  const [copyStocks, setCopyStocks] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset state when product changes or dialog opens
  useEffect(() => {
    if (product && open) {
      const initialName = `Copy of ${product.name}`;

      setName(initialName);

      const generatedSlug = product.slug
        ? `${product.slug}-copy`
        : slugify(initialName, { lower: true, strict: true, trim: true });

      setSlug(generatedSlug);
      setIsSlugCustomized(false);

      const defaultVariantSku = product.variants?.[0]?.sku;

      setSku(defaultVariantSku ? `${defaultVariantSku}-copy` : "");
      setCopyMedia(true);
      setCopyPricing(true);
      setCopyStocks(true);
      setFormError(null);
    }
  }, [product, open]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;

    setName(newName);

    if (!isSlugCustomized) {
      setSlug(slugify(newName, { lower: true, strict: true, trim: true }));
    }

    if (formError) {
      setFormError(null);
    }
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsSlugCustomized(true);
    setSlug(e.target.value);
  };

  const handleSubmit = async (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!product) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError("Product name cannot be empty");

      return;
    }

    setFormError(null);

    const result = await duplicateProduct(product, {
      name: trimmedName,
      slug: slug.trim() || undefined,
      sku: sku.trim() || undefined,
      copyMedia,
      copyPricing,
      copyStocks,
    });

    if (result.success && result.productId) {
      notify({
        status: "success",
        text: intl.formatMessage(messages.successMessage),
      });
      onSuccess(result.productId);
      onClose();
    } else if (result.errors && result.errors.length > 0) {
      const errorText = getProductErrorMessage(result.errors[0], intl) || "Failed to duplicate product";

      setFormError(errorText);
      notify({
        status: "error",
        text: errorText,
      });
    } else {
      const errorText = result.errorMessage || "An unexpected error occurred while duplicating";

      setFormError(errorText);
      notify({
        status: "error",
        text: errorText,
      });
    }
  };

  const isSimpleProduct = !product?.productType?.hasVariants;

  return (
    <DashboardModal onChange={onClose} open={open}>
      <DashboardModal.Content size="sm">
        <DashboardModal.Grid>
          <DashboardModal.Header>
            <Box display="flex" alignItems="center" gap={2}>
              <Copy size={20} />
              <Text size={5} fontWeight="bold">
                <FormattedMessage {...messages.title} />
              </Text>
            </Box>
          </DashboardModal.Header>

          {loadingProduct || !product ? (
            <Box className={styles.formContent}>
              <Skeleton height={8} />
              <Skeleton height={8} />
              <Skeleton height={8} />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box className={styles.formContent}>
                <Text size={2} color="default2">
                  <FormattedMessage {...messages.description} />
                </Text>

                <Input
                  autoFocus
                  required
                  label={intl.formatMessage(messages.nameLabel)}
                  value={name}
                  onChange={handleNameChange}
                  error={!!formError}
                  helperText={formError ?? undefined}
                  data-test-id="duplicate-product-name-input"
                />

                <Input
                  label={intl.formatMessage(messages.slugLabel)}
                  value={slug}
                  onChange={handleSlugChange}
                  helperText={intl.formatMessage(messages.slugHelperText)}
                  data-test-id="duplicate-product-slug-input"
                />

                {isSimpleProduct && (
                  <Input
                    label={intl.formatMessage(messages.skuLabel)}
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    helperText={intl.formatMessage(messages.skuHelperText)}
                    data-test-id="duplicate-product-sku-input"
                  />
                )}

                <Box className={styles.checkboxGroup}>
                  <Checkbox
                    checked={copyMedia}
                    onCheckedChange={checked => setCopyMedia(!!checked)}
                    data-test-id="duplicate-copy-media-checkbox"
                  >
                    <Text size={2}>
                      <FormattedMessage {...messages.copyMediaLabel} />
                    </Text>
                  </Checkbox>

                  <Checkbox
                    checked={copyPricing}
                    onCheckedChange={checked => setCopyPricing(!!checked)}
                    data-test-id="duplicate-copy-pricing-checkbox"
                  >
                    <Text size={2}>
                      <FormattedMessage {...messages.copyPricingLabel} />
                    </Text>
                  </Checkbox>

                  <Checkbox
                    checked={copyStocks}
                    onCheckedChange={checked => setCopyStocks(!!checked)}
                    data-test-id="duplicate-copy-stocks-checkbox"
                  >
                    <Text size={2}>
                      <FormattedMessage {...messages.copyStocksLabel} />
                    </Text>
                  </Checkbox>
                </Box>
              </Box>

              <DashboardModal.Actions>
                <BackButton onClick={onClose} disabled={isDuplicating} />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isDuplicating || !name.trim()}
                  data-test-id="confirm-duplicate-product-button"
                >
                  {isDuplicating ? (
                    <FormattedMessage {...messages.duplicatingButton} />
                  ) : (
                    <FormattedMessage {...messages.duplicateButton} />
                  )}
                </Button>
              </DashboardModal.Actions>
            </form>
          )}
        </DashboardModal.Grid>
      </DashboardModal.Content>
    </DashboardModal>
  );
};
