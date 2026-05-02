"""

# Step-by-Step Guide: Creating Image Collections and Banners

Complete tutorial for creating image collections and managing banners through the Saleor Dashboard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Create Image Collection](#part-1-create-image-collection)
3. [Part 2: Create Banner in Collection](#part-2-create-banner-in-collection)
4. [GraphQL Queries & Mutations](#graphql-queries--mutations)
5. [API Integration Examples](#api-integration-examples)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, ensure you have:

✅ **Backend Requirements:**

- Saleor API running (http://localhost:8000)
- Banner app installed in Django
- Database migrations applied (`python manage.py migrate banner`)
- Admin user with `banner.manage_banners` permission
- At least one Channel created in Saleor

✅ **Frontend Requirements:**

- Saleor Dashboard running (http://localhost:3000)
- Dependencies installed (`npm install react-beautiful-dnd react-datepicker`)
- Banner module imported and routes configured
- Logged in as staff user with banner permissions

✅ **Verification:**

```bash
# Check backend
curl http://localhost:8000/graphql/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ channels { id name } }"}'

# Check frontend
# Navigate to http://localhost:3000/banners in browser
```

---

## Part 1: Create Image Collection

### What is an Image Collection?

An **Image Collection** is a group of promotional banners organized by channel. Each collection contains:

- **Name** - Unique identifier for the collection
- **Description** - Optional details about the collection
- **Channel** - Which sales channel this collection belongs to
- **Status** - Active or Inactive
- **Banners** - Multiple banners within the collection

### Step-by-Step Process

#### Step 1: Navigate to Banner Management

**Via Dashboard UI:**

1. Log in to Saleor Dashboard
2. Click **Banners** in the left navigation menu
3. You'll see the "Image Collections" page

**Expected Screen:**

- Header: "Image Collections"
- Button: "+ Create Collection" (top right)
- Empty state message (if no collections exist)
- Filter bar (Channel, Status, Search)

#### Step 2: Click "Create Collection" Button

```
┌─────────────────────────────────────────┐
│ Image Collections                       │
├─────────────────────────────────────────┤
│  [Search]  [Channel ▼]  [Status ▼]     │
│                    [+ Create Collection] │
├─────────────────────────────────────────┤
│                                         │
│    No collections found                 │
│    Create your first collection          │
│                                         │
│          [+ Create Collection]           │
│                                         │
└─────────────────────────────────────────┘
```

#### Step 3: Fill Collection Form

**Modal Title:** "Create Collection"

**Required Fields:**

1. **Collection Name** _(Required)_
   - Text input field
   - Example: "Summer Sale 2024"
   - Validation: 1-255 characters
   - Tip: Use descriptive names for easy identification

   ```
   [ Summer Sale 2024                                        ]
   ```

2. **Channel** _(Required)_ - Dropdown selector
   - Click dropdown to see available channels
   - Example channels: "Default Channel", "Mobile App"
   - Note: Cannot be changed after creation
   - Select the channel where this collection will be used

   ```
   [ Default Channel ▼ ]
   ```

3. **Description** _(Optional)_
   - Text area for additional notes
   - Example: "Summer promotional banners for homepage"
   - Max 1000 characters

   ```
   [ Summer promotional banners for the homepage              ]
   [ and category pages                                       ]
   ```

4. **Status** _(Optional)_ - Toggle switch
   - Default: ON (Active)
   - Active = collection and banners will be displayed
   - Inactive = collection hidden from frontend

   ```
   Status: [ ⚪ ] Active / [ ⚫ ] Inactive
   ```

#### Step 4: Submit Form

**Buttons at bottom of modal:**

- `Cancel` - Close without saving
- `Create` - Save collection

Click `Create` button.

**Expected Outcome:**

- Modal closes
- New collection appears in the list
- Success notification: "Collection created successfully"
- Collection shows with:
  - Name
  - Channel
  - Status badge (Active/Inactive)
  - Banner count: 0
  - Action buttons: Manage, Edit, Delete

### Example Collection Creation

```
Input:
  Name: "Holiday Specials 2024"
  Channel: "Default Channel"
  Description: "Holiday season promotional banners"
  Status: Active

Expected Result:
┌────────────────────────────────────────┐
│ Holiday Specials 2024                  │
├────────────────────────────────────────┤
│ Channel: Default Channel               │
│ Status: Active                         │
│ Banners: 0                             │
│                                        │
│ [Manage] [Edit] [Delete]               │
└────────────────────────────────────────┘
```

---

## Part 2: Create Banner in Collection

### What is a Banner?

A **Banner** is a promotional image within a collection with:

- **Title** - Display name
- **Image** - Promotional image
- **Description** - Optional text
- **Link** - URL and button text for CTA
- **Custom Fields** - 3 extensible fields for metadata
- **Key-Value Pairs** - Unlimited metadata storage
- **Scheduling** - When to show the banner
- **Position** - Order within collection

### Step-by-Step Process

#### Step 1: Open Collection Details

**From the collections list:**

1. Find the collection you created
2. Click **"Manage"** button on the collection card

**Expected Screen:**

- Modal opens showing collection details
- List of banners (empty if newly created)
- Button: "+ Create Banner" (bottom of modal)

```
┌────────────────────────────────────────┐
│ Holiday Specials 2024                  │
├────────────────────────────────────────┤
│ Banners in this collection:            │
│                                        │
│  (No banners yet)                      │
│                                        │
│                  [+ Create Banner]     │
└────────────────────────────────────────┘
```

#### Step 2: Click "Create Banner"

Click the **"+ Create Banner"** button.

**Expected Screen:**

- New modal opens: "Create Banner"
- Form with 5 sections (tabs or accordion)

#### Step 3: Fill Section 1 - Basic Information

**Tab 1: Basic Information**

1. **Banner Title** _(Required)_
   - Example: "50% Off All Items"
   - Validation: 1-255 characters

   ```
   [ 50% Off All Items                    ]
   ```

2. **Description** _(Optional)_
   - Example: "Limited time offer - this weekend only!"
   - Max 500 characters

   ```
   [ Limited time offer - this weekend only!                 ]
   ```

3. **Upload Image** _(Required)_
   - Click upload area or drag-drop image
   - Accepted formats: JPG, PNG, GIF, WebP
   - Max size: 10 MB (configurable)
   - Recommended dimensions: 1200x400 or 1920x600

   ```
   ┌─────────────────────────────────────┐
   │ Drag image here or click to upload   │
   │                                     │
   │          📁 Browse Files            │
   │                                     │
   │ Supported: JPG, PNG, GIF, WebP      │
   │ Max size: 10 MB                     │
   └─────────────────────────────────────┘
   ```

   After upload:

   ```
   ┌─────────────────────────────────────┐
   │ [Image Preview]                     │
   │ summer_sale.jpg (2.5 MB)            │
   │                         [✕ Remove]  │
   └─────────────────────────────────────┘
   ```

4. **Alt Text** _(Optional)_
   - Accessibility text for image
   - Example: "Summer sale promotion with 50% discount"

   ```
   [ Summer sale promotion with 50% discount                 ]
   ```

#### Step 4: Fill Section 2 - Link Configuration

**Tab 2: Link Configuration**

1. **Link URL** _(Optional)_
   - URL where banner links to
   - Example: "https://example.com/summer-sale"
   - Include protocol (http:// or https://)

   ```
   [ https://example.com/summer-sale                         ]
   ```

2. **Button Text** _(Optional)_
   - Text displayed on CTA button
   - Example: "Shop Now"
   - Default: "Learn More"

   ```
   [ Shop Now                             ]
   ```

**Result Preview:**

```
When both are set, frontend displays:
┌──────────────────────────┐
│  [Banner Image]          │
│                          │
│ [🔗 Shop Now] ← Button   │
└──────────────────────────┘
```

#### Step 5: Fill Section 3 - Custom Fields

**Tab 3: Custom Fields** (3 extensible fields)

These are optional fields for storing custom data:

1. **Custom Field 1** _(Optional)_
   - Example: "summer_2024"

   ```
   [ summer_2024                         ]
   ```

2. **Custom Field 2** _(Optional)_
   - Example: "homepage_featured"

   ```
   [ homepage_featured                   ]
   ```

3. **Custom Field 3** _(Optional)_
   - Example: "tier_1"

   ```
   [ tier_1                              ]
   ```

**Use Cases:**

- Campaign tags
- Priority levels
- Geographic regions
- A/B test variants

#### Step 6: Fill Section 4 - Key-Value Storage

**Tab 4: Key-Value Storage** (Unlimited pairs)

Store unlimited metadata as key-value pairs:

1. **Add First Pair:**
   - Click "+ Add Key-Value Pair"

   ```
   ┌────────────────────────────────────┐
   │ Key         │ Value              │ ✕│
   ├────────────────────────────────────┤
   │ [ ]         │ [ ]                │  │
   └────────────────────────────────────┘

   [+ Add Key-Value Pair]
   ```

2. **Example Pairs to Add:**

   | Key              | Value           |
   | ---------------- | --------------- |
   | campaign_id      | SUMMER_2024     |
   | discount_percent | 50              |
   | target_audience  | premium_members |
   | region           | north_america   |
   | utm_source       | email           |

   ```
   Input pair 1:
   Key:   campaign_id
   Value: SUMMER_2024

   ┌────────────────────────────────────┐
   │ campaign_id | SUMMER_2024         │ ✕│
   └────────────────────────────────────┘

   [+ Add Key-Value Pair]

   Input pair 2:
   Key:   discount_percent
   Value: 50

   ┌────────────────────────────────────┐
   │ campaign_id | SUMMER_2024         │ ✕│
   ├────────────────────────────────────┤
   │ discount_percent | 50              │ ✕│
   └────────────────────────────────────┘

   [+ Add Key-Value Pair]
   ```

3. **Managing Pairs:**
   - Edit: Click on key or value to modify
   - Delete: Click ✕ button to remove pair
   - Add: Click "+ Add Key-Value Pair" for more

#### Step 7: Fill Section 5 - Scheduling

**Tab 5: Scheduling** (When to display)

1. **Start Date** _(Optional)_
   - Date picker calendar
   - Format: YYYY-MM-DD
   - Example: 2024-06-01

   ```
   [ 2024-06-01 ▼ ]  June 1, 2024
   ```

2. **Start Time** _(Optional)_
   - Time picker
   - Format: HH:MM (24-hour)
   - Example: 00:00 (midnight)

   ```
   [ 00:00 ]
   ```

3. **End Date** _(Optional)_
   - Must be after or equal to start date
   - Example: 2024-06-30

   ```
   [ 2024-06-30 ▼ ]  June 30, 2024
   ```

4. **End Time** _(Optional)_
   - Example: 23:59 (end of day)

   ```
   [ 23:59 ]
   ```

5. **Status Toggle** _(Required)_
   - Active/Inactive
   - When active + within schedule: banner displays
   - When inactive: banner hidden

   ```
   Status: [ ⚫ ] Active  or  [ ⚪ ] Inactive
   ```

**Scheduling Examples:**

Example 1: Single Day Flash Sale

```
Start Date: 2024-06-15
Start Time: 09:00
End Date: 2024-06-15
End Time: 23:59
Status: Active
→ Banner shows only on June 15, 9 AM to 11:59 PM
```

Example 2: Week-Long Promotion

```
Start Date: 2024-06-17
Start Time: 00:00
End Date: 2024-06-23
End Time: 23:59
Status: Active
→ Banner shows entire week
```

Example 3: No Scheduling (Always Active)

```
Start Date: (empty)
Start Time: (empty)
End Date: (empty)
End Time: (empty)
Status: Active
→ Banner shows indefinitely until manually deactivated
```

#### Step 8: Review and Submit

**Form Summary:**

```
┌────────────────────────────────────────────┐
│ Banner Summary                             │
├────────────────────────────────────────────┤
│ Title: 50% Off All Items                   │
│ Image: summer_sale.jpg (2.5 MB)            │
│ Link: https://example.com/summer-sale      │
│ Button: Shop Now                           │
│ Custom Fields: 2 filled                    │
│ Key-Value Pairs: 3 pairs                   │
│ Schedule: 2024-06-01 to 2024-06-30         │
│ Status: Active                             │
│ Position: 1 (first in collection)          │
└────────────────────────────────────────────┘
```

**Buttons:**

- `Cancel` - Close without saving
- `Create` - Save banner

Click `Create`.

**Expected Outcome:**

- Modal closes
- Banner appears in collection
- Success notification: "Banner created successfully"
- Banner shows in collection with edit/delete options

#### Step 9: View in Collection

After creation, return to collection view:

```
┌────────────────────────────────────────┐
│ Holiday Specials 2024                  │
├────────────────────────────────────────┤
│ Banners in this collection:            │
│                                        │
│ 1. [Image Thumbnail]                   │
│    50% Off All Items                   │
│    Active | June 1 - June 30           │
│    [Edit] [Delete]                     │
│                                        │
│ [+ Create Banner]                      │
└────────────────────────────────────────┘
```

---

## GraphQL Queries & Mutations

### Required GraphQL Operations

#### 1. Get All Channels (for selector)

**Query Name:** `GET_CHANNELS`

**Purpose:** Fetch available channels for collection creation

**Query:**

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

#### 2. Create Image Collection

**Mutation Name:** `CREATE_IMAGE_COLLECTION`

**Purpose:** Create a new image collection

**Mutation:**

```graphql
mutation CreateImageCollection($input: CreateImageCollectionInput!) {
  createImageCollection(input: $input) {
    collection {
      id
      name
      description
      channel {
        id
        name
        slug
      }
      isActive
      createdAt
      updatedAt
    }
    errors {
      field
      message
      code
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "Summer Sale 2024",
    "description": "Summer promotional banners",
    "channelId": "Q2hhbm5lbDox",
    "isActive": true
  }
}
```

**Success Response:**

```json
{
  "data": {
    "createImageCollection": {
      "collection": {
        "id": "Q29sbGVjdGlvbjox",
        "name": "Summer Sale 2024",
        "description": "Summer promotional banners",
        "channel": {
          "id": "Q2hhbm5lbDox",
          "name": "Default Channel",
          "slug": "default"
        },
        "isActive": true,
        "createdAt": "2024-06-01T10:30:00Z",
        "updatedAt": "2024-06-01T10:30:00Z"
      },
      "errors": []
    }
  }
}
```

**Error Response (duplicate name):**

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

---

#### 3. Get Collections List

**Query Name:** `GET_IMAGE_COLLECTIONS`

**Purpose:** Fetch all collections with filtering

**Query:**

```graphql
query GetImageCollections($first: Int!, $after: String, $filter: ImageCollectionFilterInput) {
  imageCollections(first: $first, after: $after, filter: $filter) {
    edges {
      node {
        id
        name
        description
        channel {
          id
          name
          slug
        }
        isActive
        banners {
          id
          title
        }
        createdAt
        updatedAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Variables:**

```json
{
  "first": 10,
  "filter": {
    "isActive": true
  }
}
```

**Response:**

```json
{
  "data": {
    "imageCollections": {
      "edges": [
        {
          "node": {
            "id": "Q29sbGVjdGlvbjox",
            "name": "Summer Sale 2024",
            "description": "Summer promotional banners",
            "channel": {
              "id": "Q2hhbm5lbDox",
              "name": "Default Channel",
              "slug": "default"
            },
            "isActive": true,
            "banners": [
              {
                "id": "QmFubmVyOjE=",
                "title": "50% Off All Items"
              }
            ],
            "createdAt": "2024-06-01T10:30:00Z",
            "updatedAt": "2024-06-01T10:30:00Z"
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": false,
        "endCursor": "YXJyYXlDb25uZWN0aW9uOjA="
      }
    }
  }
}
```

---

#### 4. Create Banner in Collection

**Mutation Name:** `CREATE_BANNER`

**Purpose:** Create a new banner in a collection

**Mutation:**

```graphql
mutation CreateBanner($input: CreateBannerInput!) {
  createBanner(input: $input) {
    banner {
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
      keyValues
      position
      isActive
      startDate
      endDate
      createdAt
      updatedAt
    }
    errors {
      field
      message
      code
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "title": "50% Off All Items",
    "description": "Limited time summer sale",
    "image": "/media/banners/summer_sale.jpg",
    "altText": "Summer sale promotion with 50% discount",
    "linkUrl": "https://example.com/summer-sale",
    "linkText": "Shop Now",
    "customField1": "summer_2024",
    "customField2": "homepage_featured",
    "customField3": "tier_1",
    "keyValues": [
      {
        "key": "campaign_id",
        "value": "SUMMER_2024"
      },
      {
        "key": "discount_percent",
        "value": "50"
      },
      {
        "key": "target_audience",
        "value": "premium_members"
      }
    ],
    "collectionId": "Q29sbGVjdGlvbjox",
    "position": 1,
    "isActive": true,
    "startDate": "2024-06-01",
    "endDate": "2024-06-30"
  }
}
```

**Success Response:**

```json
{
  "data": {
    "createBanner": {
      "banner": {
        "id": "QmFubmVyOjE=",
        "title": "50% Off All Items",
        "description": "Limited time summer sale",
        "image": "/media/banners/summer_sale.jpg",
        "altText": "Summer sale promotion with 50% discount",
        "linkUrl": "https://example.com/summer-sale",
        "linkText": "Shop Now",
        "customField1": "summer_2024",
        "customField2": "homepage_featured",
        "customField3": "tier_1",
        "keyValues": [
          {
            "key": "campaign_id",
            "value": "SUMMER_2024"
          },
          {
            "key": "discount_percent",
            "value": "50"
          },
          {
            "key": "target_audience",
            "value": "premium_members"
          }
        ],
        "position": 1,
        "isActive": true,
        "startDate": "2024-06-01",
        "endDate": "2024-06-30",
        "createdAt": "2024-06-01T11:00:00Z",
        "updatedAt": "2024-06-01T11:00:00Z"
      },
      "errors": []
    }
  }
}
```

---

## API Integration Examples

### Example 1: Complete Collection + Banner Creation Flow

**Step 1: Fetch channels**

```javascript
const channelsQuery = `
  query GetChannels {
    channels {
      id name slug isActive
    }
  }
`;

const channels = await graphqlRequest(channelsQuery);
// channels.data.channels = [{ id: "...", name: "Default Channel", ... }]
```

**Step 2: Create collection**

```javascript
const createCollectionMutation = `
  mutation CreateImageCollection($input: CreateImageCollectionInput!) {
    createImageCollection(input: $input) {
      collection {
        id
        name
        channel { id name }
      }
      errors { field message }
    }
  }
`;

const variables = {
  input: {
    name: "Summer Sale 2024",
    description: "Summer promotional banners",
    channelId: channels.data.channels[0].id,
    isActive: true,
  },
};

const collection = await graphqlRequest(createCollectionMutation, variables);
const collectionId = collection.data.createImageCollection.collection.id;
// collectionId = "Q29sbGVjdGlvbjox"
```

**Step 3: Create banner in collection**

```javascript
const createBannerMutation = `
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
      banner {
        id
        title
        position
      }
      errors { field message }
    }
  }
`;

const bannerVariables = {
  input: {
    title: "50% Off All Items",
    image: "/media/banners/summer_sale.jpg",
    collectionId: collectionId,
    linkUrl: "https://example.com/summer-sale",
    linkText: "Shop Now",
    position: 1,
    isActive: true,
    startDate: "2024-06-01",
    endDate: "2024-06-30",
    keyValues: [
      { key: "campaign_id", value: "SUMMER_2024" },
      { key: "discount_percent", value: "50" },
    ],
  },
};

const banner = await graphqlRequest(createBannerMutation, bannerVariables);
console.log("Banner created:", banner.data.createBanner.banner.id);
```

### Example 2: React Component Usage

**Using the pre-built components:**

```typescript
import { ImageCollectionsList } from "@/banners";

export function BannerPage() {
  return <ImageCollectionsList />;
}
```

The component handles:

- ✅ Fetching channels automatically
- ✅ Displaying collection list
- ✅ Managing create/edit/delete modals
- ✅ Banner CRUD operations
- ✅ Form validation
- ✅ Error handling

**Or use hooks directly:**

```typescript
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_IMAGE_COLLECTION } from "@/banners/queries";

export function CreateCollectionForm() {
  const [createCollection, { loading }] = useMutation(CREATE_IMAGE_COLLECTION);

  const handleSubmit = async (formData) => {
    const { data } = await createCollection({
      variables: {
        input: {
          name: formData.name,
          description: formData.description,
          channelId: formData.channelId,
          isActive: true
        }
      }
    });

    if (data.createImageCollection.errors.length === 0) {
      console.log("Success!", data.createImageCollection.collection);
    } else {
      console.error("Errors:", data.createImageCollection.errors);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(new FormData(e.target));
    }}>
      {/* form fields */}
    </form>
  );
}
```

---

## Troubleshooting

### Issue 1: "Channel not found"

**Error Message:**

```
{
  "errors": [{
    "field": "channelId",
    "message": "Channel with ID not found",
    "code": "NOT_FOUND"
  }]
}
```

**Solution:**

1. Verify channel exists in Django admin
2. Use correct channel ID (base64 encoded)
3. Check channel is active

```bash
# In Django shell
python manage.py shell
>>> from saleor.channel.models import Channel
>>> channels = Channel.objects.all()
>>> for ch in channels:
>>>     print(f"{ch.name}: {ch.id}")
```

### Issue 2: "Collection with this name already exists"

**Error Message:**

```
{
  "errors": [{
    "field": "name",
    "message": "Collection with this name already exists",
    "code": "DUPLICATE_COLLECTION"
  }]
}
```

**Solution:**

- Use unique collection name
- Check existing collections first:
  ```graphql
  query {
    imageCollections(first: 100) {
      edges {
        node {
          name
        }
      }
    }
  }
  ```
- Add channel name or date to make unique: "Summer Sale 2024 - Default"

### Issue 3: "Permission denied"

**Error Message:**

```
{
  "errors": [{
    "message": "You do not have permission to perform this action"
  }]
}
```

**Solution:**

1. User must be staff
2. User must have `banner.manage_banners` permission
3. Add permission in Django admin:
   ```bash
   python manage.py shell
   >>> from django.contrib.auth import get_user_model
   >>> from django.contrib.auth.models import Permission
   >>> User = get_user_model()
   >>> user = User.objects.get(username="admin")
   >>> perm = Permission.objects.get(codename="manage_banners")
   >>> user.user_permissions.add(perm)
   >>> user.save()
   ```

### Issue 4: Image upload fails

**Error Message:**

```
{
  "errors": [{
    "field": "image",
    "message": "Image upload failed",
    "code": "UPLOAD_FAILED"
  }]
}
```

**Solution:**

1. Check image format (JPG, PNG, GIF, WebP)
2. Check file size < 10 MB
3. Verify upload directory permissions
4. Try uploading directly first, then reference path

### Issue 5: Date validation fails

**Error Message:**

```
{
  "errors": [{
    "field": "endDate",
    "message": "End date must be after start date",
    "code": "INVALID_DATE_RANGE"
  }]
}
```

**Solution:**

- Ensure endDate > startDate
- Use format YYYY-MM-DD
- Example valid range:
  - Start: 2024-06-01
  - End: 2024-06-30

### Issue 6: "Key-value format invalid"

**Error Message:**

```
{
  "errors": [{
    "field": "keyValues",
    "message": "Key-value pairs must be valid JSON",
    "code": "INVALID_FORMAT"
  }]
}
```

**Solution:**

- Ensure each pair has `key` and `value` fields
- Valid format:
  ```json
  [
    { "key": "campaign_id", "value": "SUMMER_2024" },
    { "key": "discount", "value": "50" }
  ]
  ```
- Invalid format:
  ```json
  [
    { "campaign_id": "SUMMER_2024" } // Missing key/value structure
  ]
  ```

---

## Complete Flow Diagram

```
START
  │
  ├─→ Log in to Dashboard
  │     └─→ Verify permission: banner.manage_banners ✓
  │
  ├─→ Navigate to /banners
  │     └─→ Fetch channels from GraphQL
  │
  ├─→ Click "+ Create Collection"
  │     ├─→ Fill form:
  │     │   • Name (required)
  │     │   • Channel (required)
  │     │   • Description (optional)
  │     │   • Status (default: active)
  │     │
  │     └─→ Submit CREATE_IMAGE_COLLECTION mutation
  │           └─→ Collection created ✓
  │
  ├─→ Click "Manage" on collection
  │     └─→ Fetch banners in collection (initially empty)
  │
  ├─→ Click "+ Create Banner"
  │     ├─→ Section 1: Basic Information
  │     │   • Title (required)
  │     │   • Image (required)
  │     │   • Description (optional)
  │     │   • Alt text (optional)
  │     │
  │     ├─→ Section 2: Link Configuration
  │     │   • URL (optional)
  │     │   • Button text (optional)
  │     │
  │     ├─→ Section 3: Custom Fields
  │     │   • Custom field 1 (optional)
  │     │   • Custom field 2 (optional)
  │     │   • Custom field 3 (optional)
  │     │
  │     ├─→ Section 4: Key-Value Storage
  │     │   • Add unlimited key-value pairs
  │     │
  │     ├─→ Section 5: Scheduling
  │     │   • Start date/time (optional)
  │     │   • End date/time (optional)
  │     │   • Status toggle (required)
  │     │
  │     └─→ Submit CREATE_BANNER mutation
  │           └─→ Banner created ✓
  │
  ├─→ View collection with banner
  │     └─→ Can edit/delete banner
  │
  └─→ END
```

---

## Checklist: Creating Collection & Banner

```
Collection Creation:
  ☐ Name field filled (1-255 chars)
  ☐ Channel selected
  ☐ Description added (optional)
  ☐ Status set (Active by default)
  ☐ No duplicate names
  ☐ Click "Create"
  ☐ Collection appears in list
  ☐ Success notification shown

Banner Creation:
  ☐ Section 1: Title and image filled
  ☐ Section 2: Link configuration (optional)
  ☐ Section 3: Custom fields (optional)
  ☐ Section 4: Key-value pairs added (optional)
  ☐ Section 5: Scheduling configured (optional)
  ☐ Status set to Active
  ☐ No validation errors
  ☐ Click "Create"
  ☐ Banner appears in collection
  ☐ Success notification shown
  ☐ Banner visible with all details
```

---

## Summary

**Key Points:**

1. ✅ **Collection** = Container for banners (1 per channel)
2. ✅ **Banner** = Individual promotional item (multiple per collection)
3. ✅ **Required fields:**
   - Collection: name, channel
   - Banner: title, image
4. ✅ **Optional fields:**
   - Description, links, custom fields, scheduling
5. ✅ **Key-value storage:** Unlimited metadata for flexibility
6. ✅ **Scheduling:** Control when banners display
7. ✅ **Drag-drop reordering:** Reorder banners within collection

**Next Steps:**

- [x] Create your first collection
- [x] Create banners in the collection
- [x] Schedule banners for campaigns
- [x] Test in frontend application
- [x] Monitor banner performance

---

**Happy Banner Creation! 🎉**

For more details, see API_REFERENCE.md or SETUP_TROUBLESHOOTING.md
"""
