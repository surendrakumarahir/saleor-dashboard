export type ProductReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  productThumbnail?: string;
  productSlug?: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  title: string;
  content: string;
  status: ProductReviewStatus;
  isVerifiedBuyer: boolean;
  images?: string[];
  helpfulCount?: number;
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

