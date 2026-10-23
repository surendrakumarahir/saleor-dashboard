export type BlogPostStatus = "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface BlogAuthor {
  id: string;
  displayName: string;
  slug: string;
  bio?: string;
  avatar?: string;
  designation?: string;
  socialLinks?: Record<string, string>;
  createdAt?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent?: BlogCategory;
  children?: BlogCategory[];
  seoTitle?: string;
  seoDescription?: string;
  badgeColor?: string;
  isActive: boolean;
  postCount?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface BlogPostRevision {
  id: string;
  revisionNumber: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  contentHtml?: string;
  createdByName?: string;
  createdAt: string;
}

export interface RecommendedBook {
  title: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  discountBadge?: string;
  href: string;
  image?: string;
  badge?: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface BlogPostFAQ {
  id?: string;
  question: string;
  answer: string;
  sortOrder?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  contentHtml?: string;
  status: BlogPostStatus;
  author?: BlogAuthor;
  primaryCategory?: BlogCategory;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  isFeatured?: boolean;
  readingTimeMinutes?: number;
  allowComments?: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  updatedByName?: string;
  revisionNumber?: number;
  recommendedBooks?: RecommendedBook[];
  tableOfContents?: TableOfContentsItem[];
  faqs?: BlogPostFAQ[];
}
