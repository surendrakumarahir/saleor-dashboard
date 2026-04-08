/**
 * Types and interfaces for Banner Management System
 */

export interface Channel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image: string;
  altText?: string;
  linkUrl?: string;
  linkText?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  imageCollection?: ImageCollection;
}

export interface ImageCollection {
  id: string;
  name: string;
  description?: string;
  channelId: string;
  channel?: Channel;
  isActive: boolean;
  banners?: Banner[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerError {
  code: string;
  message: string;
  field?: string;
}

export interface CreateImageCollectionInput {
  name: string;
  description?: string;
  channelId: string;
  isActive?: boolean;
}

export interface UpdateImageCollectionInput {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateBannerInput {
  title: string;
  description?: string;
  image: string;
  altText?: string;
  linkUrl?: string;
  linkText?: string;
  collectionId: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  position?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UpdateBannerInput {
  id: string;
  title?: string;
  description?: string;
  altText?: string;
  linkUrl?: string;
  linkText?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  position?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ImageCollectionListResponse {
  imageCollections: {
    edges: Array<{
      node: ImageCollection;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string;
    };
  };
}

export interface CreateImageCollectionResponse {
  createImageCollection: {
    imageCollection?: ImageCollection;
    errors: BannerError[];
  };
}

export interface UpdateImageCollectionResponse {
  updateImageCollection: {
    imageCollection?: ImageCollection;
    errors: BannerError[];
  };
}

export interface DeleteImageCollectionResponse {
  deleteImageCollection: {
    success: boolean;
    errors: BannerError[];
  };
}

export interface CreateBannerResponse {
  createBanner: {
    banner?: Banner;
    errors: BannerError[];
  };
}

export interface UpdateBannerResponse {
  updateBanner: {
    banner?: Banner;
    errors: BannerError[];
  };
}

export interface DeleteBannerResponse {
  deleteBanner: {
    success: boolean;
    errors: BannerError[];
  };
}

export interface GetChannelsResponse {
  channels: Channel[];
}

export interface BannerFormData {
  title: string;
  description: string;
  altText: string;
  linkUrl: string;
  linkText: string;
  customField1: string;
  customField2: string;
  customField3: string;
  position: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  image?: File | null;
  imageUrl?: string;
}

export interface CollectionFormData {
  name: string;
  description: string;
  channelId: string;
  isActive: boolean;
}
