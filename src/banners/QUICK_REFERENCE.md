"""

# Quick Reference: Creating Collection & Banner

One-page quick reference for the complete creation workflow.

---

## 🎯 Quick Steps

### Create Collection (2 minutes)

| Step | Action                      | Details                                                |
| ---- | --------------------------- | ------------------------------------------------------ |
| 1    | Navigate to Banners         | Click "Banners" in left menu                           |
| 2    | Click "+ Create Collection" | Opens collection form modal                            |
| 3    | Enter Name                  | Text (1-255 chars), example: "Summer Sale 2024"        |
| 4    | Select Channel              | Dropdown, choose channel, e.g., "Default Channel"      |
| 5    | Add Description             | Text (optional), example: "Summer promotional banners" |
| 6    | Set Status                  | Toggle "Active" (default: on)                          |
| 7    | Click "Create"              | Saves collection, closes modal                         |

### Create Banner in Collection (3 minutes)

| Section           | Field       | Type   | Required | Example                                          |
| ----------------- | ----------- | ------ | -------- | ------------------------------------------------ |
| **Basic Info**    | Title       | Text   | ✅       | "50% Off All Items"                              |
|                   | Image       | File   | ✅       | summer_sale.jpg                                  |
|                   | Description | Text   | ❌       | "Limited time offer"                             |
|                   | Alt Text    | Text   | ❌       | "Summer sale banner"                             |
| **Links**         | URL         | URL    | ❌       | https://example.com/sale                         |
|                   | Button Text | Text   | ❌       | "Shop Now"                                       |
| **Custom Fields** | Field 1     | Text   | ❌       | "summer_2024"                                    |
|                   | Field 2     | Text   | ❌       | "featured"                                       |
|                   | Field 3     | Text   | ❌       | "tier_1"                                         |
| **Key-Values**    | Pairs       | JSON   | ❌       | `{"key": "campaign_id", "value": "SUMMER_2024"}` |
| **Scheduling**    | Start Date  | Date   | ❌       | 2024-06-01                                       |
|                   | Start Time  | Time   | ❌       | 00:00                                            |
|                   | End Date    | Date   | ❌       | 2024-06-30                                       |
|                   | End Time    | Time   | ❌       | 23:59                                            |
|                   | Status      | Toggle | ✅       | Active                                           |

---

## 📝 Essential GraphQL Queries

### 1. Get Channels (Before Creating Collection)

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

### 2. Create Collection

```graphql
mutation CreateImageCollection($input: CreateImageCollectionInput!) {
  createImageCollection(input: $input) {
    collection {
      id
      name
      channel { id name }
      isActive
    }
    errors { field message code }
  }
}

# Variables:
{
  "input": {
    "name": "Summer Sale 2024",
    "description": "Summer promotional banners",
    "channelId": "Q2hhbm5lbDox",
    "isActive": true
  }
}
```

### 3. Get Collections

```graphql
query GetImageCollections($first: Int!) {
  imageCollections(first: $first) {
    edges {
      node {
        id
        name
        channel { name }
        isActive
        banners { id title }
      }
    }
  }
}

# Variables:
{ "first": 10 }
```

### 4. Create Banner

```graphql
mutation CreateBanner($input: CreateBannerInput!) {
  createBanner(input: $input) {
    banner {
      id
      title
      position
      isActive
    }
    errors { field message code }
  }
}

# Variables:
{
  "input": {
    "title": "50% Off All Items",
    "image": "/media/banners/summer_sale.jpg",
    "collectionId": "Q29sbGVjdGlvbjox",
    "linkUrl": "https://example.com/summer-sale",
    "linkText": "Shop Now",
    "customField1": "summer_2024",
    "customField2": "featured",
    "customField3": "tier_1",
    "keyValues": [
      { "key": "campaign_id", "value": "SUMMER_2024" },
      { "key": "discount", "value": "50" }
    ],
    "position": 1,
    "isActive": true,
    "startDate": "2024-06-01",
    "endDate": "2024-06-30"
  }
}
```

---

## ⚡ cURL Commands

### Fetch Channels

```bash
curl http://localhost:8000/graphql/ -X POST \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "query { channels { id name slug } }"
  }'
```

### Create Collection

```bash
curl http://localhost:8000/graphql/ -X POST \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation CreateImageCollection(\$input: CreateImageCollectionInput!) { createImageCollection(input: \$input) { collection { id name } errors { field message } } }",
    "variables": {
      "input": {
        "name": "Summer Sale 2024",
        "channelId": "Q2hhbm5lbDox",
        "isActive": true
      }
    }
  }'
```

### Create Banner

```bash
curl http://localhost:8000/graphql/ -X POST \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $csrf_token" \
  -d '{
    "query": "mutation CreateBanner(\$input: CreateBannerInput!) { createBanner(input: \$input) { banner { id title } errors { field message } } }",
    "variables": {
      "input": {
        "title": "50% Off All Items",
        "image": "/media/banners/summer_sale.jpg",
        "collectionId": "Q29sbGVjdGlvbjox",
        "position": 1,
        "isActive": true
      }
    }
  }'
```

---

## 🔍 Common Values

### Image Requirements

- **Format:** JPG, PNG, GIF, WebP
- **Max Size:** 10 MB
- **Recommended:** 1200x400 or 1920x600 pixels

### Date/Time Format

- **Date:** YYYY-MM-DD (e.g., 2024-06-01)
- **Time:** HH:MM 24-hour (e.g., 14:30 for 2:30 PM)

### Status Values

- **Active:** `true` - Banner displays when scheduled
- **Inactive:** `false` - Banner hidden

### Position

- **Auto:** Leave empty or set to last position
- **Manual:** Set to specific position (1, 2, 3, etc.)

---

## ✅ Validation Rules

| Field           | Min | Max  | Pattern                   |
| --------------- | --- | ---- | ------------------------- |
| Collection Name | 1   | 255  | Any text                  |
| Banner Title    | 1   | 255  | Any text                  |
| Description     | 0   | 1000 | Any text                  |
| Custom Fields   | 0   | 255  | Any text                  |
| Key (in K-V)    | 1   | 100  | Alphanumeric + underscore |
| Value (in K-V)  | 0   | 1000 | Any text                  |
| URL             | 0   | 2048 | Valid URL format          |
| Button Text     | 0   | 50   | Any text                  |

---

## 🚨 Common Errors

| Error                | Cause                       | Fix                      |
| -------------------- | --------------------------- | ------------------------ |
| DUPLICATE_COLLECTION | Name already exists         | Use unique name          |
| CHANNEL_NOT_FOUND    | Invalid channel ID          | Verify channel exists    |
| REQUIRED_FIELD       | Missing required field      | Fill all required fields |
| INVALID_DATE_RANGE   | End date before start       | End date ≥ Start date    |
| PERMISSION_DENIED    | No banner permission        | Add permission to user   |
| IMAGE_UPLOAD_FAILED  | Invalid image format        | Use JPG/PNG/GIF/WebP     |
| NOT_FOUND            | Collection/Banner not found | Verify ID exists         |

---

## 📱 UI Navigation

```
Dashboard Home
  └─ Banners (Menu Item)
      ├─ Collections List Page
      │  ├─ Search & Filter Bar
      │  ├─ Collection Cards (Grid)
      │  │  ├─ Collection Name
      │  │  ├─ Channel & Status
      │  │  ├─ Banner Count
      │  │  └─ Actions: [Manage] [Edit] [Delete]
      │  └─ [+ Create Collection] Button
      │
      ├─ Collection Manager Modal
      │  ├─ Collection Details
      │  ├─ Banners List
      │  │  └─ [+ Create Banner] Button
      │  ├─ Drag-Drop Reordering
      │  └─ Banner Actions: [Edit] [Delete]
      │
      ├─ Collection Form Modal
      │  ├─ Name Input
      │  ├─ Channel Selector
      │  ├─ Description
      │  ├─ Status Toggle
      │  └─ [Cancel] [Create] Buttons
      │
      └─ Banner Form Modal
         ├─ Tab 1: Basic Information
         ├─ Tab 2: Link Configuration
         ├─ Tab 3: Custom Fields
         ├─ Tab 4: Key-Value Storage
         ├─ Tab 5: Scheduling
         └─ [Cancel] [Create] Buttons
```

---

## 💡 Pro Tips

1. **Naming Convention:**
   - Use pattern: `[Season] [Year]` e.g., "Summer 2024"
   - Or: `[Campaign] [Channel]` e.g., "BlackFriday Default"

2. **Scheduling Best Practices:**
   - Flash sales: Single day, specific hours
   - Promotions: 1-2 weeks duration
   - Seasonal: Month-long campaigns
   - Always-on: Leave schedule empty

3. **Key-Value Usage:**
   - `campaign_id` - Track campaigns
   - `utm_source` - Analytics tracking
   - `discount_percent` - Promotion details
   - `target_audience` - Segmentation
   - `region` - Geographic targeting

4. **Custom Fields Usage:**
   - Field 1: Campaign tag
   - Field 2: Priority/Tier
   - Field 3: Region/Segment

5. **Image Tips:**
   - Use consistent dimensions
   - Optimize for web (compression)
   - Include alt text for accessibility
   - Test on mobile & desktop

---

## 📊 Example Collections

### Collection 1: Flash Sale

```
Name: Flash Sale - Today Only
Channel: Default Channel
Description: Limited time deals - 24 hours only
Status: Active

Banner:
  Title: 70% Off Clearance
  Start: Today 00:00
  End: Today 23:59
  Link: /sales/clearance
  Button: Grab Deal
```

### Collection 2: Seasonal

```
Name: Holiday Special 2024
Channel: Default Channel
Description: Holiday season promotions
Status: Active

Banner 1:
  Title: Cyber Monday Sale
  Start: 2024-11-25
  End: 2024-11-27
  Link: /sales/cyber-monday

Banner 2:
  Title: Black Friday Deals
  Start: 2024-11-29
  End: 2024-12-02
  Link: /sales/black-friday
```

### Collection 3: Always-On

```
Name: New Arrivals
Channel: Default Channel
Description: Showcase new products continuously
Status: Active

Banner:
  Title: Shop New Arrivals
  Schedule: None (Always show)
  Link: /products/new
  Button: Explore Now
```

---

## 🔗 Related Documentation

- [Full Guide](./CREATE_COLLECTION_BANNER_GUIDE.md) - Detailed step-by-step
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Troubleshooting](./SETUP_TROUBLESHOOTING.md) - Common issues & fixes
- [README](./README.md) - Features & overview

---

**Print this page for quick reference! 📋**

Last Updated: 2024-04-07
"""
