"""

# Banner Management System - API Reference & Examples

Complete API reference with code examples for integrating with the Banner Management System.

## Table of Contents

1. GraphQL API Reference
2. REST API Alternatives (using GraphQL endpoint)
3. React Component Integration
4. Common Use Cases
5. Error Handling
6. Caching Strategies

---

## 1. GraphQL API Reference

### Base Endpoint

```
http://localhost:8000/graphql/
```

### Authentication

All requests require:

- Session cookie (for authenticated requests)
- CSRF token in headers (for mutations)
- User permission: `banner.manage_banners`

### Headers

```
Content-Type: application/json
X-CSRFToken: <csrf_token>
```

---

## 2. Query Operations

### 2.1 Get All Collections

**Operation:** `GET_IMAGE_COLLECTIONS`

**Variables:**

```typescript
{
  first: number;           // Number of items per page (10-100)
  after?: string;          // Cursor for pagination
  filter?: {
    isActive?: boolean;
    channel?: string;      // Channel ID or slug
    search?: string;       // Search by name
  };
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "query GetCollections($first: Int!, $filter: ImageCollectionFilterInput) {
      imageCollections(first: $first, filter: $filter) {
        edges {
          node {
            id
            name
            description
            channel { id name slug }
            isActive
            banners { id }
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }",
    "variables": {
      "first": 10,
      "filter": { "isActive": true }
    }
  }'
```

**Example Response:**

```json
{
  "data": {
    "imageCollections": {
      "edges": [
        {
          "node": {
            "id": "Q29sbGVjdGlvbjox",
            "name": "Summer Sale",
            "description": "Summer promotional banners",
            "channel": {
              "id": "Q2hhbm5lbDox",
              "name": "Default Channel",
              "slug": "default"
            },
            "isActive": true,
            "banners": [{ "id": "QmFubmVyOjE=" }],
            "createdAt": "2024-01-15T10:30:00Z",
            "updatedAt": "2024-01-20T14:45:00Z"
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "YXJyYXlDb25uZWN0aW9uOjk="
      }
    }
  }
}
```

**Usage in React:**

```typescript
import { useQuery } from "@apollo/client";
import { GET_IMAGE_COLLECTIONS } from "@/banners/queries";

export function CollectionList() {
  const { data, loading, error, fetchMore } = useQuery(GET_IMAGE_COLLECTIONS, {
    variables: {
      first: 10,
      filter: { isActive: true },
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const collections = data?.imageCollections?.edges || [];

  return (
    <div>
      {collections.map(({ node }) => (
        <div key={node.id}>{node.name}</div>
      ))}
    </div>
  );
}
```

### 2.2 Get Collection Detail

**Operation:** `GET_IMAGE_COLLECTION_DETAIL`

**Variables:**

```typescript
{
  id: string; // Collection ID (base64 encoded)
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetCollectionDetail($id: ID!) {
      imageCollection(id: $id) {
        id
        name
        description
        channel { id name slug }
        isActive
        banners {
          id
          title
          image
          position
          isActive
        }
        createdAt
        updatedAt
      }
    }",
    "variables": {
      "id": "Q29sbGVjdGlvbjox"
    }
  }'
```

**Example Response:**

```json
{
  "data": {
    "imageCollection": {
      "id": "Q29sbGVjdGlvbjox",
      "name": "Summer Sale",
      "description": "Summer promotional banners",
      "channel": { "id": "Q2hhbm5lbDox", "name": "Default Channel", "slug": "default" },
      "isActive": true,
      "banners": [
        {
          "id": "QmFubmVyOjE=",
          "title": "Summer Deals",
          "image": "/media/banners/summer_deals.jpg",
          "position": 1,
          "isActive": true
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  }
}
```

### 2.3 Get Banner Detail

**Operation:** `GET_BANNER_DETAIL`

**Variables:**

```typescript
{
  id: string; // Banner ID (base64 encoded)
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetBannerDetail($id: ID!) {
      banner(id: $id) {
        id
        title
        description
        image
        altText
        linkUrl
        linkText
        customField1
        customField2
        customField3
        keyValues { key value }
        position
        isActive
        startDate
        startTime
        endDate
        endTime
        collection { id name }
        createdAt
        updatedAt
      }
    }",
    "variables": {
      "id": "QmFubmVyOjE="
    }
  }'
```

### 2.4 Get Channels

**Operation:** `GET_CHANNELS`

Used for populating channel selector in forms.

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetChannels {
      channels {
        id
        name
        slug
        isActive
      }
    }"
  }'
```

**Example Response:**

```json
{
  "data": {
    "channels": [
      {
        "id": "Q2hhbm5lbDox",
        "name": "Default Channel",
        "slug": "default",
        "isActive": true
      },
      {
        "id": "Q2hhbm5lbDoy",
        "name": "Mobile App",
        "slug": "mobile",
        "isActive": true
      }
    ]
  }
}
```

---

## 3. Mutation Operations

### 3.1 Create Collection

**Operation:** `CREATE_IMAGE_COLLECTION`

**Variables:**

```typescript
{
  name: string;              // Required, 1-255 chars
  description?: string;      // Optional
  channelId: string;         // Required, Channel ID
  isActive?: boolean;        // Optional, default: true
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation CreateCollection($input: CreateImageCollectionInput!) {
      createImageCollection(input: $input) {
        collection {
          id
          name
          channel { id }
          isActive
        }
        errors {
          field
          message
          code
        }
      }
    }",
    "variables": {
      "input": {
        "name": "Winter Sale",
        "description": "Winter promotional banners",
        "channelId": "Q2hhbm5lbDox",
        "isActive": true
      }
    }
  }'
```

**Success Response (201):**

```json
{
  "data": {
    "createImageCollection": {
      "collection": {
        "id": "Q29sbGVjdGlvbjox",
        "name": "Winter Sale",
        "channel": { "id": "Q2hhbm5lbDox" },
        "isActive": true
      },
      "errors": []
    }
  }
}
```

**Error Response:**

```json
{
  "data": {
    "createImageCollection": {
      "collection": null,
      "errors": [
        {
          "field": "name",
          "message": "Collection with this name already exists",
          "code": "DUPLICATE_COLLECTION"
        }
      ]
    }
  }
}
```

**Usage in React:**

```typescript
import { useMutation } from "@apollo/client";
import { CREATE_IMAGE_COLLECTION } from "@/banners/queries";

export function CreateCollectionForm() {
  const [createCollection, { loading, error }] = useMutation(CREATE_IMAGE_COLLECTION);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await createCollection({
        variables: {
          input: {
            name: formData.name,
            description: formData.description,
            channelId: formData.channelId,
            isActive: formData.isActive,
          },
        },
      });

      if (data.createImageCollection.errors.length > 0) {
        // Handle field-level errors
        const errors = data.createImageCollection.errors;
        console.error("Validation errors:", errors);
      } else {
        // Success
        console.log("Collection created:", data.createImageCollection.collection);
      }
    } catch (err) {
      console.error("Mutation error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

### 3.2 Update Collection

**Operation:** `UPDATE_IMAGE_COLLECTION`

**Variables:**

```typescript
{
  id: string;                // Required, Collection ID
  name?: string;
  description?: string;
  isActive?: boolean;
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation UpdateCollection($id: ID!, $input: UpdateImageCollectionInput!) {
      updateImageCollection(id: $id, input: $input) {
        collection {
          id
          name
          description
          isActive
        }
        errors { field message code }
      }
    }",
    "variables": {
      "id": "Q29sbGVjdGlvbjox",
      "input": {
        "name": "Winter Sale 2024",
        "isActive": false
      }
    }
  }'
```

### 3.3 Delete Collection

**Operation:** `DELETE_IMAGE_COLLECTION`

**Variables:**

```typescript
{
  id: string; // Collection ID
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation DeleteCollection($id: ID!) {
      deleteImageCollection(id: $id) {
        collection { id }
        errors { field message code }
      }
    }",
    "variables": {
      "id": "Q29sbGVjdGlvbjox"
    }
  }'
```

### 3.4 Create Banner

**Operation:** `CREATE_BANNER`

**Variables:**

```typescript
{
  title: string;              // Required, 1-255 chars
  image: string;              // Required, image URL or file path
  collectionId: string;       // Required, Collection ID
  description?: string;
  altText?: string;
  linkUrl?: string;
  linkText?: string;
  customField1?: string;
  customField2?: string;
  customField3?: string;
  keyValues?: Array<{ key: string; value: string }>;
  position?: number;
  isActive?: boolean;         // default: true
  startDate?: string;         // YYYY-MM-DD
  startTime?: string;         // HH:MM
  endDate?: string;           // YYYY-MM-DD
  endTime?: string;           // HH:MM
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation CreateBanner($input: CreateBannerInput!) {
      createBanner(input: $input) {
        banner {
          id
          title
          position
          isActive
        }
        errors { field message code }
      }
    }",
    "variables": {
      "input": {
        "title": "Winter Special Offer",
        "image": "/media/banners/winter_offer.jpg",
        "collectionId": "Q29sbGVjdGlvbjox",
        "description": "50% off on selected items",
        "altText": "Winter Special Offer Banner",
        "linkUrl": "https://example.com/winter-sale",
        "linkText": "Shop Now",
        "customField1": "Winter 2024",
        "keyValues": [
          { "key": "campaign_id", "value": "winter2024" },
          { "key": "discount_percent", "value": "50" }
        ],
        "position": 1,
        "isActive": true,
        "startDate": "2024-12-01",
        "startTime": "00:00",
        "endDate": "2024-12-31",
        "endTime": "23:59"
      }
    }
  }'
```

### 3.5 Update Banner

**Operation:** `UPDATE_BANNER`

**Variables:** Same as CREATE_BANNER but with `id` field required, others optional

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation UpdateBanner($id: ID!, $input: UpdateBannerInput!) {
      updateBanner(id: $id, input: $input) {
        banner {
          id
          title
          isActive
          startDate
          endDate
        }
        errors { field message code }
      }
    }",
    "variables": {
      "id": "QmFubmVyOjE=",
      "input": {
        "title": "Winter Special Sale - Updated",
        "isActive": false
      }
    }
  }'
```

### 3.6 Delete Banner

**Operation:** `DELETE_BANNER`

**Variables:**

```typescript
{
  id: string; // Banner ID
}
```

### 3.7 Reorder Banners

**Operation:** `REORDER_BANNERS`

**Variables:**

```typescript
{
  collectionId: string;                      // Collection ID
  bannerIds: string[];                       // Array of Banner IDs in new order
}
```

**Example Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation ReorderBanners($input: ReorderBannersInput!) {
      reorderBanners(input: $input) {
        collection {
          id
          banners { id position }
        }
        errors { field message code }
      }
    }",
    "variables": {
      "input": {
        "collectionId": "Q29sbGVjdGlvbjox",
        "bannerIds": [
          "QmFubmVyOjM=",
          "QmFubmVyOjE=",
          "QmFubmVyOjI="
        ]
      }
    }
  }'
```

---

## 4. Error Handling

### Error Codes

| Code                 | Description                    | HTTP Status |
| -------------------- | ------------------------------ | ----------- |
| REQUIRED_FIELD       | Missing required field         | 400         |
| INVALID_INPUT        | Invalid input format           | 400         |
| DUPLICATE_COLLECTION | Collection name already exists | 400         |
| COLLECTION_NOT_FOUND | Collection does not exist      | 404         |
| BANNER_NOT_FOUND     | Banner does not exist          | 404         |
| PERMISSION_DENIED    | User lacks permission          | 403         |
| INVALID_DATE_RANGE   | End date before start date     | 400         |
| IMAGE_UPLOAD_FAILED  | Image upload error             | 500         |
| DATABASE_ERROR       | Database operation failed      | 500         |

### Error Response Format

```json
{
  "data": {
    "mutationName": {
      "collection": null,
      "errors": [
        {
          "field": "name",
          "message": "This field is required",
          "code": "REQUIRED_FIELD"
        },
        {
          "field": "startDate",
          "message": "End date cannot be before start date",
          "code": "INVALID_DATE_RANGE"
        }
      ]
    }
  }
}
```

### Error Handling in React

```typescript
const handleMutation = async () => {
  try {
    const { data } = await createCollection({
      variables: { input: formData },
    });

    // Check for GraphQL errors in response
    if (data.createImageCollection.errors.length > 0) {
      const fieldErrors = {};
      data.createImageCollection.errors.forEach(err => {
        fieldErrors[err.field] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    // Success
    showNotification("Collection created successfully");
  } catch (apolloError) {
    // Network errors
    showNotification(`Error: ${apolloError.message}`, "error");
  }
};
```

---

## 5. Common Use Cases

### 5.1 Create Banner with Image Upload

```typescript
async function createBannerWithImage(formData: FormData, collectionId: string) {
  // Step 1: Upload image to server
  const uploadRes = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const { imageUrl } = await uploadRes.json();

  // Step 2: Create banner with image URL
  const { data } = await createBanner({
    variables: {
      input: {
        title: formData.get("title"),
        image: imageUrl,
        collectionId,
        // ... other fields
      },
    },
  });

  return data.createBanner.banner;
}
```

### 5.2 Batch Update Banners

```typescript
async function updateBannersSchedule(
  bannerIds: string[],
  schedule: { startDate: string; endDate: string },
) {
  const updates = bannerIds.map(id =>
    updateBanner({
      variables: {
        id,
        input: {
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        },
      },
    }),
  );

  const results = await Promise.all(updates);
  return results.filter(r => r.data.updateBanner.errors.length === 0);
}
```

### 5.3 Search Collections

```typescript
async function searchCollections(searchTerm: string) {
  const { data } = await getCollections({
    variables: {
      first: 50,
      filter: {
        search: searchTerm,
      },
    },
  });

  return data.imageCollections.edges.map(({ node }) => node);
}
```

### 5.4 Export Banners to CSV

```typescript
function exportBannersToCSV(banners: Banner[]) {
  const headers = ["ID", "Title", "Position", "Active", "Created"];
  const rows = banners.map(b => [b.id, b.title, b.position, b.isActive, b.createdAt]);

  const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `banners-${new Date().toISOString()}.csv`;
  a.click();
}
```

### 5.5 Schedule Banner Activation/Deactivation

```typescript
async function scheduleBannerChanges(bannerId: string, activeFrom: string, activeTo: string) {
  const { data } = await updateBanner({
    variables: {
      id: bannerId,
      input: {
        startDate: activeFrom,
        endDate: activeTo,
        isActive: true,
      },
    },
  });

  if (data.updateBanner.errors.length === 0) {
    // Schedule background job to auto-deactivate after endDate
    scheduleDeactivation(bannerId, activeTo);
  }

  return data.updateBanner.banner;
}
```

---

## 6. Caching Strategies

### Apollo Client Cache Configuration

```typescript
import { InMemoryCache, makeVar } from "@apollo/client";

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        imageCollections: {
          keyArgs: false,
          merge(existing = [], incoming, { args }) {
            // Merge paginated results
            return incoming;
          },
        },
      },
    },
    ImageCollection: {
      keyFields: ["id"],
      fields: {
        banners: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
  },
});
```

### Cache Update After Mutation

```typescript
const [createBanner] = useMutation(CREATE_BANNER, {
  update(cache, { data: { createBanner } }) {
    if (createBanner.errors.length === 0) {
      const banner = createBanner.banner;
      const collectionId = banner.collection.id;

      // Update collection in cache
      cache.modify({
        fields: {
          imageCollection(existing) {
            return {
              ...existing,
              banners: [...existing.banners, banner],
            };
          },
        },
      });
    }
  },
});
```

### Refetch Strategies

```typescript
// Refetch after mutation
const [createBanner] = useMutation(CREATE_BANNER, {
  refetchQueries: ["GetImageCollections"],
});

// Refetch specific collection
const [updateBanner] = useMutation(UPDATE_BANNER, {
  refetchQueries: [
    {
      query: GET_IMAGE_COLLECTION_DETAIL,
      variables: { id: collectionId },
    },
  ],
});
```

---

## 7. Rate Limiting

Request limits per endpoint:

| Endpoint    | Limit | Window |
| ----------- | ----- | ------ |
| Query       | 1000  | 1 hour |
| Mutation    | 500   | 1 hour |
| File Upload | 100   | 1 hour |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705315200
```

---

## 8. Webhook Events (Optional)

Banner system can trigger webhooks for:

- `banner.collection.created`
- `banner.collection.updated`
- `banner.collection.deleted`
- `banner.created`
- `banner.updated`
- `banner.deleted`

**Webhook Payload Example:**

```json
{
  "event": "banner.created",
  "timestamp": "2024-01-20T15:30:00Z",
  "data": {
    "banner": {
      "id": "QmFubmVyOjE=",
      "title": "Summer Sale",
      "collection": { "id": "Q29sbGVjdGlvbjox" }
    }
  }
}
```

---

## 9. GraphQL Subscriptions (Optional)

Real-time updates using GraphQL subscriptions:

```typescript
const BANNER_UPDATED = gql`
  subscription OnBannerUpdated($collectionId: ID!) {
    bannerUpdated(collectionId: $collectionId) {
      banner {
        id
        title
        isActive
      }
      action # "created", "updated", "deleted"
    }
  }
`;

// Usage
const { data } = useSubscription(BANNER_UPDATED, {
  variables: { collectionId },
});
```

---

## 10. API Rate Limiting & Throttling

```typescript
// Implement exponential backoff for retries
async function apiCallWithRetry(query, variables, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.query({ query, variables });
    } catch (error) {
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

**Complete API Reference Ready for Integration! 🚀**

For additional examples and documentation, see the INTEGRATION_GUIDE.md file.
"""
