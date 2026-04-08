"""

# Banner Management System

Complete banner management interface for Saleor Dashboard with rich UI components, GraphQL integration, and enterprise-grade features.

## 📋 Overview

The Banner Management System provides a professional interface for managing promotional banners in your Saleor e-commerce platform. Built with React, TypeScript, and GraphQL, it offers comprehensive features for creating, editing, scheduling, and organizing banners.

## ✨ Features

### Collection Management

- ✅ Create, read, update, delete image collections
- ✅ Channel-specific collections
- ✅ Search and advanced filtering
- ✅ Status management (active/inactive)
- ✅ Collection analytics (banner count, status)
- ✅ Bulk operations (planned)

### Banner Management

- ✅ Complete CRUD operations
- ✅ Rich image management with preview
- ✅ Advanced scheduling (date/time picker)
- ✅ Link configuration for call-to-action buttons
- ✅ Custom fields (3 extensible fields)
- ✅ Unlimited key-value metadata storage
- ✅ Drag-and-drop reordering
- ✅ Position tracking and management
- ✅ Status indicators and badges

### User Experience

- ✅ Responsive design (mobile-optimized)
- ✅ Modal-based workflows (no page reloads)
- ✅ Real-time form validation
- ✅ Field-level error reporting
- ✅ Loading states and progress indicators
- ✅ Empty states and helpful messaging
- ✅ Keyboard shortcuts (Enter to add key-value pairs)
- ✅ Accessibility support (ARIA labels, semantic HTML)

### Technical Excellence

- ✅ Full TypeScript type safety
- ✅ Apollo Client GraphQL integration
- ✅ React hooks for state management
- ✅ Performance optimizations (memoization, lazy loading)
- ✅ Error handling with user feedback
- ✅ Comprehensive component documentation
- ✅ Production-ready code quality

## 🏗️ Architecture

### File Structure

```
banners/
├── components/                    # Reusable UI components
│   ├── BannerModal.tsx           # Banner create/edit form (5 sections)
│   ├── BannerSortableList.tsx    # Drag-drop banner list with react-beautiful-dnd
│   ├── ImageCollectionModal.tsx   # Collection create/edit form
│   └── KeyValueEditor.tsx         # Dynamic key-value pair manager
├── pages/
│   └── ImageCollectionsList.tsx   # Main collection list page with filters
├── queries.ts                     # GraphQL operations (queries, mutations, fragments)
├── types.ts                       # TypeScript interfaces and types
├── routes.ts                      # Routing configuration and menu item
├── index.ts                       # Component and type exports
├── INTEGRATION_GUIDE.md           # Setup and integration instructions
├── SETUP_TROUBLESHOOTING.md       # Detailed troubleshooting guide
└── README.md                      # This file
```

### Component Hierarchy

```
App
└── ImageCollectionsList (Page)
    ├── Filter Bar
    │   ├── Search Input
    │   ├── Channel Dropdown
    │   └── Status Dropdown
    ├── Collection Cards (Grid)
    │   ├── CollectionCard
    │   │   ├── Name & Channel
    │   │   ├── Status Badge
    │   │   ├── Banner Count
    │   │   └── Actions (Manage, Edit, Delete)
    │   └── Create Button
    ├── ImageCollectionModal
    │   └── Form
    │       ├── Name Input
    │       ├── Description
    │       ├── Channel Selector
    │       └── Status Toggle
    ├── BannerManagementModal (Nested)
    │   ├── Banner List
    │   │   └── BannerSortableList
    │   │       ├── DragDropContext (react-beautiful-dnd)
    │   │       └── Draggable Items
    │   │           ├── Banner Preview
    │   │           ├── Status Badge
    │   │           └── Actions (Edit, Delete)
    │   └── Create Banner Button
    └── BannerModal (Nested)
        └── Form (5 Sections)
            ├── Basic Information
            │   ├── Title Input
            │   ├── Description
            │   ├── Image Upload
            │   └── Alt Text
            ├── Link Configuration
            │   ├── Link URL
            │   └── Button Text
            ├── Custom Fields
            │   ├── Custom Field 1
            │   ├── Custom Field 2
            │   └── Custom Field 3
            ├── Key-Value Storage
            │   └── KeyValueEditor
            │       └── Key-Value Pairs
            └── Scheduling
                ├── Start Date
                ├── Start Time
                ├── End Date
                └── End Time
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+
- Saleor Dashboard v3.x
- Saleor Backend with banner app installed

### Installation

1. **Copy banner files to dashboard:**

   ```bash
   cp -r src/banners /path/to/saleor-dashboard/src/
   ```

2. **Install dependencies:**

   ```bash
   npm install react-beautiful-dnd react-datepicker
   ```

3. **Add route to router:**

   ```typescript
   import { ImageCollectionsList } from "@/banners";
   <Route path="/banners" component={ImageCollectionsList} />
   ```

4. **Add navigation menu item:**

   ```typescript
   import { bannerMenuItem } from "@/banners/routes";
   // Add to navigation config
   ```

5. **Restart dashboard:**
   ```bash
   npm start
   ```

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed setup instructions.

## 📚 Component Documentation

### ImageCollectionsList (Page)

Main page component for managing collections.

**Features:**

- List all image collections
- Search by name
- Filter by channel and status
- Create new collection (modal)
- Edit collection (modal)
- Delete collection (with confirmation)
- Manage banners in collection (nested modal)
- Pagination support

**Props:** None (standalone page)

**Example:**

```typescript
import { ImageCollectionsList } from "@/banners";

export default function BannersPage() {
  return <ImageCollectionsList />;
}
```

### ImageCollectionModal

Modal for creating or editing collections.

**Features:**

- Form validation
- Channel selector (disabled for existing collections)
- Status toggle
- Error handling
- Loading state during submission

**Props:**

```typescript
interface ImageCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: ImageCollection) => void;
  collection?: ImageCollection; // Omit for create mode
}
```

**Example:**

```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedCollection, setSelectedCollection] = useState(null);

<ImageCollectionModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={(collection) => {
    // Save collection
    setIsOpen(false);
  }}
  collection={selectedCollection}
/>
```

### BannerModal

Comprehensive modal for creating or editing banners with 5 form sections.

**Features:**

- Basic information (title, description, image)
- Link configuration (URL, button text)
- Custom fields (3 extensible fields)
- Key-value storage (unlimited pairs)
- Scheduling (date/time pickers)
- Full validation and error handling
- Image preview with remove option
- Loading state during submission

**Props:**

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

**Form Sections:**

1. **Basic Information** - Title, description, image, alt text
2. **Link Configuration** - URL, button label
3. **Custom Fields** - 3 extensible text fields
4. **Key-Value Storage** - Unlimited key-value pairs
5. **Scheduling** - Start/end dates and times

**Example:**

```typescript
const [isOpen, setIsOpen] = useState(false);

<BannerModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={(banner) => {
    // Save banner
    refetch();
    setIsOpen(false);
  }}
  collectionId="collection-123"
  defaultPosition={1}
/>
```

### BannerSortableList

Drag-and-drop list component using react-beautiful-dnd.

**Features:**

- Drag-and-drop reordering
- Visual feedback during drag
- Edit button for each banner
- Delete button with confirmation
- Status badge (active/inactive)
- Banner preview image
- Position numbering
- Disabled state support

**Props:**

```typescript
interface BannerSortableListProps {
  banners: Banner[];
  onReorder: (banners: Banner[]) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (bannerId: string) => void;
  disabled?: boolean;
}
```

**Example:**

```typescript
const [banners, setBanners] = useState<Banner[]>([]);

<BannerSortableList
  banners={banners}
  onReorder={(reorderedBanners) => {
    setBanners(reorderedBanners);
    // Optionally save to backend
  }}
  onEdit={(banner) => {
    setEditingBanner(banner);
    setIsModalOpen(true);
  }}
  onDelete={(bannerId) => {
    // Delete banner
  }}
/>
```

### KeyValueEditor

Component for managing unlimited key-value pairs.

**Features:**

- Add new key-value pairs
- Edit existing pairs
- Remove pairs
- Keyboard shortcut (Enter to add)
- Full validation
- Accessible form inputs

**Props:**

```typescript
interface KeyValueEditorProps {
  keyValues: KeyValuePair[];
  onChange: (keyValues: KeyValuePair[]) => void;
  disabled?: boolean;
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}
```

**Example:**

```typescript
const [keyValues, setKeyValues] = useState<KeyValuePair[]>([]);

<KeyValueEditor
  keyValues={keyValues}
  onChange={(pairs) => {
    setKeyValues(pairs);
  }}
/>
```

## 🔍 GraphQL Operations

### Queries

#### GET_IMAGE_COLLECTIONS

Fetch all collections with filtering and pagination.

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

Fetch a specific collection with all banners.

```graphql
query GetImageCollectionDetail($id: ID!) {
  imageCollection(id: $id) {
    ...BannerCollection
  }
}
```

#### GET_BANNER_DETAIL

Fetch a specific banner.

```graphql
query GetBannerDetail($id: ID!) {
  banner(id: $id) {
    ...Banner
  }
}
```

#### GET_CHANNELS

Fetch all available channels.

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

Create a new collection.

```graphql
mutation CreateImageCollection($input: CreateImageCollectionInput!) {
  createImageCollection(input: $input) {
    collection {
      ...BannerCollection
    }
    errors {
      field
      message
      code
    }
  }
}
```

#### UPDATE_IMAGE_COLLECTION

Update an existing collection.

```graphql
mutation UpdateImageCollection($id: ID!, $input: UpdateImageCollectionInput!) {
  updateImageCollection(id: $id, input: $input) {
    collection {
      ...BannerCollection
    }
    errors {
      field
      message
      code
    }
  }
}
```

#### DELETE_IMAGE_COLLECTION

Delete a collection.

```graphql
mutation DeleteImageCollection($id: ID!) {
  deleteImageCollection(id: $id) {
    collection {
      id
    }
    errors {
      field
      message
      code
    }
  }
}
```

#### CREATE_BANNER

Create a new banner.

```graphql
mutation CreateBanner($input: CreateBannerInput!) {
  createBanner(input: $input) {
    banner {
      ...Banner
    }
    errors {
      field
      message
      code
    }
  }
}
```

#### UPDATE_BANNER

Update an existing banner.

```graphql
mutation UpdateBanner($id: ID!, $input: UpdateBannerInput!) {
  updateBanner(id: $id, input: $input) {
    banner {
      ...Banner
    }
    errors {
      field
      message
      code
    }
  }
}
```

#### DELETE_BANNER

Delete a banner.

```graphql
mutation DeleteBanner($id: ID!) {
  deleteBanner(id: $id) {
    banner {
      id
    }
    errors {
      field
      message
      code
    }
  }
}
```

#### REORDER_BANNERS

Reorder banners within a collection.

```graphql
mutation ReorderBanners($input: ReorderBannersInput!) {
  reorderBanners(input: $input) {
    collection {
      ...BannerCollection
    }
    errors {
      field
      message
      code
    }
  }
}
```

See [queries.ts](./queries.ts) for complete GraphQL implementations.

## 🎨 Styling

All components use **Tailwind CSS** utility classes for styling. To customize:

1. **Color scheme:**

   ```bash
   # Replace all instances of blue-600 with your color
   sed -i 's/bg-blue-600/bg-brand-600/g' components/*.tsx
   sed -i 's/text-blue-600/text-brand-600/g' components/*.tsx
   ```

2. **Spacing:**
   - Change `gap-4` to `gap-6` for larger spacing
   - Change `p-4` to `p-8` for more padding

3. **Typography:**
   - Modify `text-sm`, `text-base`, `text-lg` for size changes
   - Adjust `font-medium`, `font-bold` for weight changes

4. **Responsive breakpoints:**
   - Use `md:`, `lg:`, `xl:` prefixes for responsive design
   - Current: mobile-first (mobile base, then `md:` for tablets, `lg:` for desktop)

## 🔐 Security

### Permission System

- Requires `banner.manage_banners` permission
- Enforced on both backend and frontend
- User permission check on route load

### Data Validation

- Field-level validation before submission
- Backend validation for all mutations
- Input sanitization for text fields

### Image Security

- Image type validation (.jpg, .png, .gif, .webp)
- File size limits (configurable)
- Image preview before upload

### API Security

- HTTPS in production
- CSRF token handling (Apollo Client)
- Authenticated GraphQL endpoint

## ⚡ Performance

### Optimizations Implemented

- React hooks for efficient state management
- Apollo Client caching
- Component memoization with useCallback
- Lazy image loading
- Pagination for large datasets

### Recommended Optimizations

- Implement code splitting for components
- Add service worker for offline support
- Optimize image compression
- Implement request debouncing for search
- Use React.memo for collection cards

## 🧪 Testing

### Unit Test Example

```typescript
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ImageCollectionsList } from "./pages/ImageCollectionsList";

describe("ImageCollectionsList", () => {
  it("renders collection list", () => {
    render(
      <MockedProvider mocks={[]}>
        <ImageCollectionsList />
      </MockedProvider>
    );
    expect(screen.getByText(/Collections/i)).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm test
```

## 📖 TypeScript Types

All components are fully typed with comprehensive TypeScript interfaces.

**Key types:**

```typescript
interface ImageCollection {
  id: string;
  name: string;
  description?: string;
  channel: Channel;
  isActive: boolean;
  banners: Banner[];
  createdAt: string;
  updatedAt: string;
}

interface Banner {
  id: string;
  title: string;
  image: string;
  altText?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  keyValues: KeyValuePair[];
  position: number;
  isActive: boolean;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  collection: ImageCollection;
  createdAt: string;
  updatedAt: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}
```

See [types.ts](./types.ts) for complete type definitions.

## 🐛 Troubleshooting

Common issues and solutions:

### Module not found errors

See [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md#issue-1-module-not-found)

### GraphQL endpoint errors

See [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md#issue-3-graphql-endpoint-returns-401403)

### Drag-drop not working

See [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md#issue-4-drag-drop-not-working)

### Tailwind styles not applying

See [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md#issue-6-tailwind-styles-not-applying)

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## 📦 Dependencies

- `react`: 16.8+ or 17+ or 18+
- `react-dom`: Matching React version
- `react-beautiful-dnd`: 13.1.0+
- `react-datepicker`: 4.0+
- `@apollo/client`: 3.5+
- `graphql`: 15.0+
- `typescript`: 4.0+
- `tailwindcss`: 2.0+

## 🔄 Version History

### v1.0.0 (Current)

- Initial release
- All features complete
- Full TypeScript support
- Apollo Client integration
- React Beautiful DND integration
- Comprehensive documentation

## 🤝 Contributing

To contribute:

1. Create a feature branch
2. Make your changes
3. Add tests for new features
4. Update documentation
5. Submit a pull request

## 📄 License

Part of the Saleor platform. See LICENSE file in root directory.

## 🆘 Support

### Documentation

- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Setup and integration
- [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md) - Troubleshooting
- Component prop documentation above

### External Resources

- [Saleor Documentation](https://docs.saleor.io)
- [React Documentation](https://react.dev)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 🎉 Getting Started Next Steps

1. ✅ Read this README
2. ✅ Follow [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. ✅ Add banner routes to your dashboard
4. ✅ Test GraphQL connection
5. ✅ Customize styling as needed
6. ✅ Add permission to your users
7. ✅ Start managing banners!

---

**Happy Banner Management! 🚀**

For questions or issues, check the documentation or create an issue in your repository.
"""
