export interface ExtractedAmazonProduct {
  asin: string;
  url: string;
  title: string;
  author: string;
  publisher: string;
  publicationDate: string;
  publicationYear: string;
  itemWeight: string;
  dimensions: string;
  language: string;
  sellingPrice: number | null;
  mrp: number | null;
  description: string;
  specs: Record<string, string>;
  images: string[];
  primaryImage: string | null;
}

export interface EditableAmazonProduct {
  tempId: string;
  asin: string;
  url: string;
  name: string;
  slug?: string;
  sku: string;
  productTypeId: string;
  categoryId: string;
  sellingPrice: string;
  mrp: string;
  author: string;
  publisher: string;
  publicationDate: string;
  publicationYear: string;
  itemWeight: string;
  dimensions: string;
  language: string;
  description: string;
  images: string[];
  selectedImages: string[];
  primaryImage: string;
  status: "idle" | "publishing" | "success" | "error";
  createdProductId?: string;
  errorMessage?: string;
}

export interface ExtractResponse {
  success: boolean;
  products: ExtractedAmazonProduct[];
  errors: Array<{ url: string; error: string }>;
}
