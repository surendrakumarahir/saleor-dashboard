"""

# Saleor Dashboard - Banner Management Integration Guide

Complete setup guide for integrating the Banner Management System into Saleor Dashboard.

## Prerequisites

- Saleor Dashboard v3.x installed
- Node.js 14+
- npm or yarn package manager
- Saleor GraphQL API with banner system deployed

## Installation Steps

### 1. Install Required Dependencies

```bash
cd saleor-dashboard
npm install react-beautiful-dnd react-datepicker
npm install --save-dev @types/react-beautiful-dnd
```

For yarn:

```bash
yarn add react-beautiful-dnd react-datepicker
yarn add --dev @types/react-beautiful-dnd
```

### 2. Copy Banner Management Files

All banner files have been created at:

```
src/banners/
├── components/
│   ├── KeyValueEditor.tsx
│   ├── BannerSortableList.tsx
│   ├── BannerModal.tsx
│   └── ImageCollectionModal.tsx
├── pages/
│   └── ImageCollectionsList.tsx
├── queries.ts
├── types.ts
├── index.ts
└── routes.ts
```

### 3. Add Routes to Your Router

In your main routing file (e.g., `src/routes.ts` or `src/App.tsx`):

```typescript
import { ImageCollectionsList } from "./banners";

// For React Router v6:
<Routes>
  {/* Other routes */}
  <Route path="/banners" element={<ImageCollectionsList />} />
</Routes>

// For React Router v5:
<Route path="/banners" component={ImageCollectionsList} exact />
```

### 4. Add Navigation Menu Item

In your navigation component (e.g., `src/components/Navigation.tsx`):

```typescript
import { bannerMenuItem } from "./banners/routes";

// In your menu items array:
const menuItems = [
  // ... other items
  {
    label: bannerMenuItem.label,
    icon: "image", // Use your icon component
    path: bannerMenuItem.path,
    requiredPermission: bannerMenuItem.requiredPermission,
  },
];
```

### 5. Configure Apollo Client

Ensure your Apollo Client is properly configured for the banner GraphQL operations.
If you need to customize the graphql-tag imports, update the imports in `queries.ts`.

Example Apollo Client setup:

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:8000/graphql/",
    credentials: "include",
  }),
  cache: new InMemoryCache(),
});
```

### 6. Update Tailwind CSS Configuration (if needed)

If your project uses Tailwind CSS and has a custom config, ensure these classes are included:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/banners/**/*.{js,ts,jsx,tsx}", // Add this
  ],
  // ... rest of config
};
```

## File Structure Overview

### queries.ts

- GraphQL fragments: BANNER_COLLECTION_FRAGMENT, BANNER_FRAGMENT
- Query operations: GET_IMAGE_COLLECTIONS, GET_IMAGE_COLLECTION_DETAIL, GET_BANNER_DETAIL, GET_CHANNELS
- Mutation operations: CREATE/UPDATE/DELETE for Collections and Banners

### types.ts

- TypeScript interfaces for all data models
- Form data types with proper field definitions
- Response types for GraphQL operations
- Complete type safety for the banner system

### components/

#### KeyValueEditor.tsx

- Dynamic key-value pair management
- Add/remove/edit key-value pairs
- Keyboard shortcuts (Enter to add)
- Fully typed and accessible

#### BannerSortableList.tsx

- Drag-and-drop reordering using react-beautiful-dnd
- Show banner preview with image
- Edit/delete actions for each banner
- Position numbering
- Status indicators (active/inactive)
- Scheduling information display

#### BannerModal.tsx

- Form sections:
  1. Basic Information (title, description, image, alt text)
  2. Link Configuration (URL, button text)
  3. Custom Fields (3 extensible fields)
  4. Key-Value Storage (KeyValueEditor integration)
  5. Scheduling (date/time pickers)
  6. Status (active/inactive toggle)
- Image preview with remove option
- Validation with field-level error display
- GraphQL mutation integration (CREATE_BANNER, UPDATE_BANNER)
- Loading states during submission

#### ImageCollectionModal.tsx

- Collection creation/editing
- Name and description fields
- Channel selector (disabled for existing collections)
- Active/inactive status toggle
- Form validation
- Error handling with field-level display
- GraphQL mutation integration

### pages/

#### ImageCollectionsList.tsx

- Main page component
- Collection card display with:
  - Collection name and channel
  - Active/inactive status badge
  - Banner count
  - Manage/Edit/Delete actions
- Filtering capabilities:
  - Search by name
  - Filter by channel
  - Filter by status (active/inactive)
- Modal management for create/edit/delete operations
- Banner management sub-modal for managing banners within collections
- Empty state UI
- Loading and error states
- Apollo Client integration for data fetching and mutations

## Component Props Reference

### ImageCollectionsList

No props required - standalone page component.

```typescript
<ImageCollectionsList />
```

### ImageCollectionModal

```typescript
interface ImageCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: ImageCollection) => void;
  collection?: ImageCollection; // Omit for create mode
}
```

### BannerModal

```typescript
interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: Banner) => void;
  banner?: Banner; // Omit for create mode
  collectionId: string;
  defaultPosition?: number;
}
```

### BannerSortableList

```typescript
interface BannerSortableListProps {
  banners: Banner[];
  onReorder: (banners: Banner[]) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (bannerId: string) => void;
  disabled?: boolean;
}
```

### KeyValueEditor

```typescript
interface KeyValueEditorProps {
  keyValues: KeyValuePair[];
  onChange: (keyValues: KeyValuePair[]) => void;
  disabled?: boolean;
}
```

## GraphQL Operations Reference

### Queries

#### GET_IMAGE_COLLECTIONS

Lists all image collections with optional filtering and pagination.

```graphql
query GetImageCollections($first: Int!, $after: String, $filter: ImageCollectionFilterInput) {
  imageCollections(first: $first, after: $after, filter: $filter) {
    edges {
      node {
        ...BannerCollection
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### GET_IMAGE_COLLECTION_DETAIL

Gets a single collection with all banners.

```graphql
query GetImageCollectionDetail($id: ID!) {
  imageCollection(id: $id) {
    ...BannerCollection
  }
}
```

#### GET_BANNER_DETAIL

Gets a single banner details.

```graphql
query GetBannerDetail($id: ID!) {
  banner(id: $id) {
    ...Banner
  }
}
```

#### GET_CHANNELS

Gets all available channels for selector.

```graphql
query GetChannels {
  channels {
    id
    name
    slug
    isActive
  }
}
```

### Mutations

#### CREATE_IMAGE_COLLECTION

Creates a new image collection.

**Variables:**

- name (String, required)
- description (String, optional)
- channelId (ID, required)
- isActive (Boolean, optional, default: true)

#### UPDATE_IMAGE_COLLECTION

Updates an existing collection.

**Variables:**

- id (ID, required)
- name (String, optional)
- description (String, optional)
- isActive (Boolean, optional)

#### DELETE_IMAGE_COLLECTION

Deletes a collection.

**Variables:**

- id (ID, required)

#### CREATE_BANNER

Creates a new banner.

**Variables:**

- title (String, required)
- image (String, required)
- collectionId (ID, required)
- description, altText, linkUrl, linkText, customField1-3, keyValues, position, isActive, startDate, endDate (all optional)

#### UPDATE_BANNER

Updates an existing banner.

**Variables:**

- id (ID, required)
- All other fields optional

#### DELETE_BANNER

Deletes a banner.

**Variables:**

- id (ID, required)

## Features Overview

### Image Collections Management

- Create, read, update, delete collections
- Channel-specific collections
- Search and filtering
- Bulk actions (planned)
- Status management

### Banner Management

- Full CRUD operations
- Advanced scheduling with date/time pickers
- Image management with preview
- Link configuration for CTAs
- Custom field extensibility (3 fields)
- Unlimited key-value metadata storage
- Drag-and-drop reordering
- Position tracking

### User Experience

- Modals for forms (no page navigation needed)
- Real-time validation with error display
- Loading states and spinners
- Confirmation dialogs for destructive actions
- Empty states and helpful messaging
- Responsive design (mobile-friendly)
- Accessibility support

### Data Management

- Apollo Client caching
- Optimistic updates (can be implemented)
- Error handling with user feedback
- Form state management
- Mutation error handling with field-level errors

## Styling & Customization

### Tailwind CSS Classes Used

- Flexbox layouts (flex, gap, justify-_, items-_)
- Grid layouts (grid, grid-cols-\*)
- Spacing utilities (p-_, m-_, mb-_, gap-_)
- Colors (bg-_, text-_, border-\*)
- Borders and shadows (border, rounded, shadow-\*)
- Responsive modifiers (md:, lg:)
- States (hover:, focus:, disabled:)

### Customization Points

1. **Colors**: Update Tailwind color classes (bg-blue-600 → bg-custom-color)
2. **Icons**: Replace icon SVGs with your icon library
3. **Font**: Adjust font sizes and weights as needed
4. **Spacing**: Modify gap, padding, and margin values
5. **Animations**: Add or modify transition and animation classes
6. **Theming**: Apply your dashboard's color scheme

Example theme update:

```typescript
// Change all blue-600 to your brand color
// Search and replace: bg-blue-600 → bg-brand-600
// Also: text-blue-600 → text-brand-600, border-blue-300 → border-brand-300
```

## Performance Optimization

### Implemented Optimizations

- Lazy loading of the main page component
- Apollo Client caching
- Memoization of callbacks with useCallback
- Efficient re-renders

### Recommended Additional Optimizations

1. Implement pagination loading (lazy load more collections)
2. Add image optimization/compression
3. Implement request debouncing for search
4. Use React.memo for collection cards
5. Add virtual scrolling for large banner lists

## Testing

### Component Testing Example

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ImageCollectionsList } from "./pages/ImageCollectionsList";

describe("ImageCollectionsList", () => {
  it("renders the component", () => {
    render(
      <MockedProvider mocks={[]}>
        <ImageCollectionsList />
      </MockedProvider>
    );
    expect(screen.getByText("Image Collections")).toBeInTheDocument();
  });
});
```

## Common Issues & Troubleshooting

### Issue: Import errors

**Solution:** Ensure all files are in correct locations and imports use correct paths.

### Issue: GraphQL queries fail

**Solution:**

- Verify backend API is running
- Check Apollo Client configuration
- Verify backend has MANAGE_BANNERS permission created
- Check network tab in browser DevTools

### Issue: Drag-and-drop not working

**Solution:**

- Ensure react-beautiful-dnd is installed
- Verify DragDropContext wraps Droppable components
- Check for CSS conflicts (list should not have overflow:hidden on scroll container)

### Issue: Tailwind styles not applied

**Solution:**

- Rebuild Tailwind CSS
- Clear browser cache
- Verify content paths in tailwind.config.js include banners folder

### Issue: Date picker not showing

**Solution:**

- Ensure react-datepicker CSS is imported
- Check CSS file is in correct location
- Verify no CSS conflicts

## Permissions

### Required Permission

The dashboard needs `banner.manage_banners` permission to access banner management.

Assign in Django admin or via Saleor API:

```python
from django.contrib.auth.models import Permission, Group
perm = Permission.objects.get(codename='manage_banners')
staff_group = Group.objects.get(name='Staff')
staff_group.permissions.add(perm)
```

## API Integration Checklist

- [ ] Saleor backend has banner app installed and migrated
- [ ] MANAGE_BANNERS permission created
- [ ] GraphQL schema includes banner types and operations
- [ ] Dashboard has react-beautiful-dnd and react-datepicker installed
- [ ] Apollo Client configured for GraphQL endpoint
- [ ] Routes configured in main router
- [ ] Navigation menu updated with banner link
- [ ] User has MANAGE_BANNERS permission assigned
- [ ] Tailwind CSS includes banners folder in content
- [ ] All TypeScript types resolve without errors
- [ ] App builds without errors
- [ ] Navigation to /banners works
- [ ] Collection list loads data from API

## Next Steps

1. **Test the Integration**

   ```bash
   npm run dev
   # Navigate to /banners in browser
   ```

2. **Verify Functionality**
   - Create a collection
   - Create a banner
   - Edit and delete operations
   - Drag-drop reordering
   - Search and filtering

3. **Customize Styling**
   - Update colors to match your theme
   - Adjust spacing and sizing
   - Add your icon library

4. **Add Additional Features** (optional)
   - Batch operations
   - Banner templates
   - Advanced analytics
   - A/B testing interface
   - Banner versioning

## Support & Documentation

- **Components Guide**: See component PropTypes above
- **GraphQL Queries**: See queries.ts for all operations
- **Types Reference**: See types.ts for all interfaces
- **Styling**: Tailwind CSS documentation

## Version Information

- React: 16.8+
- TypeScript: 4.0+
- Saleor Dashboard: 3.x
- react-beautiful-dnd: 13.1.0+
- react-datepicker: 4.0+
- Tailwind CSS: 2.0+

---

**Integration Complete! 🎉**

You now have a fully-featured banner management interface in your Saleor Dashboard.
For issues or customization needs, refer to component documentation or GraphQL queries.
"""
