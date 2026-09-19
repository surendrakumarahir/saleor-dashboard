import { defineMessages } from "react-intl";

export const duplicateDialogMessages = defineMessages({
  title: {
    id: 'WfD8dH',
    defaultMessage: "Duplicate Product",
    description: "dialog title",
  },
  description: {
    id: '7oUsK6',
    defaultMessage:
      "Create a copy of this product with its attributes, categories, and channel availability.",
    description: "dialog description",
  },
  nameLabel: {
    id: '9S6W8F',
    defaultMessage: "New Product Name",
    description: "input label",
  },
  slugLabel: {
    id: '7vK2rX',
    defaultMessage: "Product Slug / URL",
    description: "input label",
  },
  slugHelperText: {
    id: 'bX9q1M',
    defaultMessage: "Unique URL handle for the product (e.g. disha-neet-chemistry)",
    description: "input helper text",
  },
  skuLabel: {
    id: '2EWEVg',
    defaultMessage: "SKU",
    description: "input label",
  },
  skuHelperText: {
    id: 'fJkbqX',
    defaultMessage: "Leave empty or customize to ensure uniqueness",
    description: "input helper text",
  },
  copyMediaLabel: {
    id: 'OujOpO',
    defaultMessage: "Copy images and media",
    description: "checkbox label",
  },
  copyPricingLabel: {
    id: 'Zm1+Pb',
    defaultMessage: "Copy channels and prices",
    description: "checkbox label",
  },
  copyStocksLabel: {
    id: '0oHoM1',
    defaultMessage: "Copy inventory / stock quantities",
    description: "checkbox label",
  },
  duplicateButton: {
    id: '5tXcfM',
    defaultMessage: "Duplicate Product",
    description: "button label",
  },
  duplicatingButton: {
    id: 'gGfQ6T',
    defaultMessage: "Duplicating...",
    description: "button label during duplicate",
  },
  successMessage: {
    id: 'adfzhs',
    defaultMessage: "Product duplicated successfully",
    description: "notification text",
  },
  errorMessage: {
    id: 'hKD3eM',
    defaultMessage: "Failed to duplicate product: {error}",
    description: "notification text",
  },
  cancelButton: {
    id: 'sR5mWJ',
    defaultMessage: "Cancel",
    description: "cancel button",
  },
});
