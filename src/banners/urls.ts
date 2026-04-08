export const bannerListPath = "/banners";

export const bannerCollectionPath = (id: string): string => `${bannerListPath}/${id}`;

export const bannerPath = (collectionId: string, bannerId: string): string =>
  `${bannerCollectionPath(collectionId)}/${bannerId}`;
