/**
 * Routes configuration for Banner Management
 *
 * Add this to your main routing configuration (src/routes.ts or similar)
 */

import { lazy } from "react";

// Lazy load the main component
const ImageCollectionsPage = lazy(() =>
  import("./pages/ImageCollectionsList").then(module => ({
    default: module.ImageCollectionsList,
  })),
);

/**
 * Banner management routes
 * Add these to your router configuration
 */
export const bannerRoutes = [
  {
    path: "/banners",
    name: "Banner Management",
    component: ImageCollectionsPage,
    exact: true,
    breadcrumbs: ["Banners"],
  },
];

/**
 * Navigation menu item for banners
 * Add this to your main navigation menu
 */
export const bannerMenuItem = {
  label: "Banners",
  path: "/banners",
  icon: "images", // Use your icon library
  requiredPermission: "banner.manage_banners",
};

/**
 * Integration example for routing (if using React Router v6):
 *
 * import { ImageCollectionsList } from "./banners";
 *
 * // In your Routes component:
 * <Route path="/banners" element={<ImageCollectionsList />} />
 *
 * For React Router v5:
 * import { ImageCollectionsList } from "./banners";
 *
 * // In your routes array:
 * {
 *   path: "/banners",
 *   component: ImageCollectionsList,
 *   exact: true,
 * }
 */
