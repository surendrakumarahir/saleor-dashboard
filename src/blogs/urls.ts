export const blogSection = "/blogs";

export const blogListPath = blogSection;
export const blogCreatePath = `${blogSection}/new`;
export const blogEditPath = (id: string): string => `${blogSection}/${id}`;
export const blogCategoriesPath = `${blogSection}/categories`;
export const blogAuthorsPath = `${blogSection}/authors`;
export const blogTagsPath = `${blogSection}/tags`;
