import { type Rule } from "@dashboard/discounts/models";
import { type Option } from "@saleor/macaw-ui-next";
import { Box, Button, Input, Text } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useController } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

import { ProductThumbnail } from "../ProductThumbnail";
import styles from "./RuleConditionSelectedProducts.module.css";

interface RuleConditionSelectedProductsProps {
  conditionIndex: number;
  disabled?: boolean;
}

export const RuleConditionSelectedProducts = ({
  conditionIndex,
  disabled = false,
}: RuleConditionSelectedProductsProps): JSX.Element | null => {
  const intl = useIntl();
  const [filterQuery, setFilterQuery] = useState("");
  const ruleConditionValuesFieldName = `conditions.${conditionIndex}.value` as const;
  const { field: valuesField } = useController<Rule, typeof ruleConditionValuesFieldName>({
    name: ruleConditionValuesFieldName,
  });

  const selectedProducts = useMemo(
    () => (valuesField.value as Array<Option & { thumbnail?: string | null }>) || [],
    [valuesField.value],
  );

  const filteredProducts = useMemo(() => {
    if (!filterQuery.trim()) {
      return selectedProducts;
    }
    const query = filterQuery.toLowerCase();

    return selectedProducts.filter(item => (item.label || "").toLowerCase().includes(query));
  }, [selectedProducts, filterQuery]);

  const handleRemove = useCallback(
    (productId: string) => {
      const updated = selectedProducts.filter(item => item.value !== productId);

      valuesField.onChange(updated);
    },
    [selectedProducts, valuesField],
  );

  const handleClearAll = useCallback(() => {
    valuesField.onChange([]);
    setFilterQuery("");
  }, [valuesField]);

  if (!selectedProducts || selectedProducts.length === 0) {
    return null;
  }

  return (
    <Box className={styles.container}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Text size={3} fontWeight="bold">
            <FormattedMessage
              defaultMessage="Selected products ({count})"
              id="HLhisZ"
              values={{ count: selectedProducts.length }}
            />
          </Text>
          {filterQuery && (
            <Text size={2} color="default2">
              (showing {filteredProducts.length})
            </Text>
          )}
        </Box>
        {!disabled && selectedProducts.length > 1 && (
          <Button
            variant="tertiary"
            size="small"
            onClick={handleClearAll}
            icon={<Trash2 size={14} />}
            className={styles.clearAllBtn}
          >
            <FormattedMessage defaultMessage="Clear all" id="QW+Q5N" />
          </Button>
        )}
      </Box>

      {selectedProducts.length > 4 && (
        <Box marginBottom={3}>
          <Input
            size="small"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder={intl.formatMessage({
              defaultMessage: "Filter in selected products...",
              id: "filterSelectedProducts",
            })}
          />
        </Box>
      )}

      <Box className={styles.productsList}>
        {filteredProducts.map((product, idx) => (
          <Box key={product.value} className={styles.productCard}>
            <Box display="flex" alignItems="center" gap={3} overflow="hidden" flexGrow="1">
              <Text size={1} color="default2" className={styles.itemIndex}>
                #{idx + 1}
              </Text>
              <ProductThumbnail
                url={product.thumbnail}
                alt={product.label}
                width={56}
                height={72}
              />
              <Box display="flex" flexDirection="column" gap={1} overflow="hidden" flexGrow="1">
                <Text
                  size={3}
                  fontWeight="medium"
                  title={product.label}
                  className={styles.productTitle}
                >
                  {product.label}
                </Text>
              </Box>
            </Box>
            {!disabled && (
              <Button
                variant="tertiary"
                size="small"
                onClick={() => handleRemove(product.value)}
                icon={<Trash2 size={16} />}
                title="Remove product"
                data-test-id={`remove-product-${product.value}`}
                className={styles.removeBtn}
              />
            )}
          </Box>
        ))}
        {filteredProducts.length === 0 && (
          <Box padding={4} textAlign="center">
            <Text color="default2" size={2}>
              No products match "{filterQuery}"
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

