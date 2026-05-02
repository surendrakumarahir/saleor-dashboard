"""

# Practical Examples: Collection & Banner Creation Workflows

Real-world examples with complete code for common scenarios.

---

## Scenario 1: Simple Flash Sale

**Goal:** Create a one-day flash sale banner

### Step 1: Create Collection

**Dashboard UI:**

1. Click "Banners" → "+ Create Collection"
2. Fill form:
   - Name: `Flash Sale - June 15`
   - Channel: `Default Channel`
   - Description: `One-day mega sale`
   - Status: `Active`
3. Click "Create"

**GraphQL Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: YOUR_CSRF_TOKEN" \
  -d '{
    "query": "
      mutation CreateImageCollection(\$input: CreateImageCollectionInput!) {
        createImageCollection(input: \$input) {
          collection {
            id
            name
            channel { name }
          }
          errors { field message }
        }
      }
    ",
    "variables": {
      "input": {
        "name": "Flash Sale - June 15",
        "channelId": "Q2hhbm5lbDox",
        "description": "One-day mega sale",
        "isActive": true
      }
    }
  }'
```

**Response:**

```json
{
  "data": {
    "createImageCollection": {
      "collection": {
        "id": "Q29sbGVjdGlvbjox",
        "name": "Flash Sale - June 15",
        "channel": { "name": "Default Channel" }
      },
      "errors": []
    }
  }
}
```

### Step 2: Create Flash Sale Banner

**Dashboard UI:**

1. Click "Manage" on the collection
2. Click "+ Create Banner"
3. Fill all sections:
   - **Title:** "70% OFF - Today Only!"
   - **Image:** Upload flash_sale.jpg
   - **Link:** https://example.com/flash-sale
   - **Button:** "Shop Now"
   - **Start Date:** Today (e.g., 2024-06-15)
   - **Start Time:** 09:00 (9 AM)
   - **End Date:** Today (2024-06-15)
   - **End Time:** 23:59 (11:59 PM)
   - **Status:** Active
4. Click "Create"

**GraphQL Request:**

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: YOUR_CSRF_TOKEN" \
  -d '{
    "query": "
      mutation CreateBanner(\$input: CreateBannerInput!) {
        createBanner(input: \$input) {
          banner {
            id
            title
            position
            startDate
            endDate
          }
          errors { field message }
        }
      }
    ",
    "variables": {
      "input": {
        "title": "70% OFF - Today Only!",
        "image": "/media/banners/flash_sale.jpg",
        "altText": "Flash sale promotion 70 percent off",
        "description": "Mega sale ends today at midnight",
        "collectionId": "Q29sbGVjdGlvbjox",
        "linkUrl": "https://example.com/flash-sale",
        "linkText": "Shop Now",
        "position": 1,
        "isActive": true,
        "startDate": "2024-06-15",
        "endDate": "2024-06-15",
        "keyValues": [
          { "key": "campaign_id", "value": "FLASH_SALE_JUNE_15" },
          { "key": "discount_percent", "value": "70" },
          { "key": "duration_hours", "value": "24" }
        ]
      }
    }
  }'
```

**Response:**

```json
{
  "data": {
    "createBanner": {
      "banner": {
        "id": "QmFubmVyOjE=",
        "title": "70% OFF - Today Only!",
        "position": 1,
        "startDate": "2024-06-15",
        "endDate": "2024-06-15"
      },
      "errors": []
    }
  }
}
```

---

## Scenario 2: Multi-Week Campaign with Multiple Banners

**Goal:** Create a summer campaign with 3 different banners rotating weekly

### Step 1: Create Collection

```graphql
mutation {
  createImageCollection(
    input: {
      name: "Summer Campaign 2024"
      channelId: "Q2hhbm5lbDox"
      description: "Three-week summer promotion with rotating banners"
      isActive: true
    }
  ) {
    collection {
      id
      name
    }
    errors {
      field
      message
    }
  }
}
```

**Collection ID:** `Q29sbGVjdGlvbjox` (save this)

### Step 2: Create Banner 1 (Week 1)

```graphql
mutation {
  createBanner(
    input: {
      title: "Summer Fashion - Week 1"
      image: "/media/banners/summer_fashion_w1.jpg"
      altText: "Summer fashion promotion week 1"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/summer-fashion"
      linkText: "Shop Fashion"
      customField1: "fashion"
      customField2: "summer_2024"
      customField3: "week_1"
      keyValues: [
        { key: "week", value: "1" }
        { key: "category", value: "fashion" }
        { key: "discount_code", value: "SUMMER20" }
      ]
      position: 1
      isActive: true
      startDate: "2024-06-01"
      endDate: "2024-06-07"
    }
  ) {
    banner {
      id
      title
      position
    }
    errors {
      field
      message
    }
  }
}
```

### Step 3: Create Banner 2 (Week 2)

```graphql
mutation {
  createBanner(
    input: {
      title: "Summer Electronics - Week 2"
      image: "/media/banners/summer_electronics_w2.jpg"
      altText: "Summer electronics promotion week 2"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/summer-electronics"
      linkText: "Shop Electronics"
      customField1: "electronics"
      customField2: "summer_2024"
      customField3: "week_2"
      keyValues: [
        { key: "week", value: "2" }
        { key: "category", value: "electronics" }
        { key: "discount_code", value: "SUMMER25" }
      ]
      position: 2
      isActive: true
      startDate: "2024-06-08"
      endDate: "2024-06-14"
    }
  ) {
    banner {
      id
      title
      position
    }
    errors {
      field
      message
    }
  }
}
```

### Step 4: Create Banner 3 (Week 3)

```graphql
mutation {
  createBanner(
    input: {
      title: "Summer Home - Week 3"
      image: "/media/banners/summer_home_w3.jpg"
      altText: "Summer home promotion week 3"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/summer-home"
      linkText: "Shop Home"
      customField1: "home"
      customField2: "summer_2024"
      customField3: "week_3"
      keyValues: [
        { key: "week", value: "3" }
        { key: "category", value: "home" }
        { key: "discount_code", value: "SUMMER30" }
      ]
      position: 3
      isActive: true
      startDate: "2024-06-15"
      endDate: "2024-06-21"
    }
  ) {
    banner {
      id
      title
      position
    }
    errors {
      field
      message
    }
  }
}
```

**Result:** 3 banners automatically show/hide based on current date

---

## Scenario 3: Channel-Specific Collections

**Goal:** Create same collection for both Desktop and Mobile channels with different images

### Step 1: Create Desktop Collection

```graphql
mutation {
  createImageCollection(
    input: {
      name: "Seasonal Sale - Desktop"
      channelId: "Q2hhbm5lbDox"
      description: "Desktop optimized banners"
      isActive: true
    }
  ) {
    collection {
      id
      name
    }
  }
}
```

**Desktop Collection ID:** `Q29sbGVjdGlvbjox`

### Step 2: Create Desktop Banner (Wide Format)

```graphql
mutation {
  createBanner(
    input: {
      title: "Seasonal Sale"
      image: "/media/banners/seasonal_sale_desktop.jpg"
      altText: "Seasonal sale promotion for desktop"
      description: "Wide banner optimized for desktop viewing"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/seasonal"
      linkText: "View Sale"
      keyValues: [
        { key: "format", value: "desktop_wide" }
        { key: "resolution", value: "1920x600" }
      ]
      position: 1
      isActive: true
      startDate: "2024-06-01"
      endDate: "2024-06-30"
    }
  ) {
    banner {
      id
      title
    }
  }
}
```

### Step 3: Create Mobile Collection

```graphql
mutation {
  createImageCollection(
    input: {
      name: "Seasonal Sale - Mobile"
      channelId: "Q2hhbm5lbDoy"
      description: "Mobile optimized banners"
      isActive: true
    }
  ) {
    collection {
      id
      name
    }
  }
}
```

**Mobile Collection ID:** `Q29sbGVjdGlvbjoy`

### Step 4: Create Mobile Banner (Portrait Format)

```graphql
mutation {
  createBanner(
    input: {
      title: "Seasonal Sale"
      image: "/media/banners/seasonal_sale_mobile.jpg"
      altText: "Seasonal sale promotion for mobile"
      description: "Vertical banner optimized for mobile viewing"
      collectionId: "Q29sbGVjdGlvbjoy"
      linkUrl: "https://example.com/seasonal"
      linkText: "Shop Sale"
      keyValues: [
        { key: "format", value: "mobile_portrait" }
        { key: "resolution", value: "600x800" }
      ]
      position: 1
      isActive: true
      startDate: "2024-06-01"
      endDate: "2024-06-30"
    }
  ) {
    banner {
      id
      title
    }
  }
}
```

**Result:** Desktop and mobile users see appropriate banner format

---

## Scenario 4: A/B Testing Banners

**Goal:** Test 2 different banner variants in same collection

### Step 1: Create Collection

```graphql
mutation {
  createImageCollection(
    input: {
      name: "A/B Test - CTA Button"
      channelId: "Q2hhbm5lbDox"
      description: "Testing different CTA button texts"
      isActive: true
    }
  ) {
    collection {
      id
    }
  }
}
```

### Step 2: Create Banner Variant A

```graphql
mutation {
  createBanner(
    input: {
      title: "Variant A - 'Shop Now'"
      image: "/media/banners/test_variant_a.jpg"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/test-a"
      linkText: "Shop Now"
      customField1: "variant_a"
      customField2: "control"
      customField3: "button_text_1"
      keyValues: [
        { key: "variant", value: "a" }
        { key: "button_text", value: "Shop Now" }
        { key: "test_id", value: "CTA_TEST_001" }
      ]
      position: 1
      isActive: true
    }
  ) {
    banner {
      id
      customField1
    }
  }
}
```

### Step 3: Create Banner Variant B

```graphql
mutation {
  createBanner(
    input: {
      title: "Variant B - 'Discover Now'"
      image: "/media/banners/test_variant_b.jpg"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/test-b"
      linkText: "Discover Now"
      customField1: "variant_b"
      customField2: "treatment"
      customField3: "button_text_2"
      keyValues: [
        { key: "variant", value: "b" }
        { key: "button_text", value: "Discover Now" }
        { key: "test_id", value: "CTA_TEST_001" }
      ]
      position: 2
      isActive: true
    }
  ) {
    banner {
      id
      customField1
    }
  }
}
```

**Note:** Rotate or show banners in alternating pattern on frontend

---

## Scenario 5: Automated Campaign Management

**Goal:** Create recurring seasonal banners programmatically

### Python Script Example

```python
#!/usr/bin/env python
"""Automated banner creation script"""

import requests
import json
from datetime import datetime, timedelta

GRAPHQL_ENDPOINT = "http://localhost:8000/graphql/"
CSRF_TOKEN = "YOUR_CSRF_TOKEN"

def create_collection(name, channel_id, description):
    """Create a collection"""
    mutation = """
    mutation CreateImageCollection($input: CreateImageCollectionInput!) {
      createImageCollection(input: $input) {
        collection { id name }
        errors { field message }
      }
    }
    """

    variables = {
        "input": {
            "name": name,
            "channelId": channel_id,
            "description": description,
            "isActive": True
        }
    }

    response = requests.post(
        GRAPHQL_ENDPOINT,
        json={"query": mutation, "variables": variables},
        headers={"X-CSRFToken": CSRF_TOKEN}
    )

    return response.json()["data"]["createImageCollection"]["collection"]["id"]

def create_banner(title, image, collection_id, start_date, end_date):
    """Create a banner"""
    mutation = """
    mutation CreateBanner($input: CreateBannerInput!) {
      createBanner(input: $input) {
        banner { id title position }
        errors { field message }
      }
    }
    """

    variables = {
        "input": {
            "title": title,
            "image": image,
            "collectionId": collection_id,
            "position": 1,
            "isActive": True,
            "startDate": start_date,
            "endDate": end_date,
            "keyValues": [
                {"key": "created_by", "value": "automation"},
                {"key": "created_at", "value": datetime.now().isoformat()}
            ]
        }
    }

    response = requests.post(
        GRAPHQL_ENDPOINT,
        json={"query": mutation, "variables": variables},
        headers={"X-CSRFToken": CSRF_TOKEN}
    )

    return response.json()["data"]["createBanner"]["banner"]

def main():
    """Create seasonal campaigns automatically"""

    # Define seasons
    seasons = [
        {
            "name": "Spring 2024",
            "start": "2024-03-21",
            "end": "2024-06-20",
            "image": "/media/banners/spring_2024.jpg"
        },
        {
            "name": "Summer 2024",
            "start": "2024-06-21",
            "end": "2024-09-22",
            "image": "/media/banners/summer_2024.jpg"
        },
        {
            "name": "Fall 2024",
            "start": "2024-09-23",
            "end": "2024-12-20",
            "image": "/media/banners/fall_2024.jpg"
        },
        {
            "name": "Winter 2024",
            "start": "2024-12-21",
            "end": "2025-03-20",
            "image": "/media/banners/winter_2024.jpg"
        }
    ]

    channel_id = "Q2hhbm5lbDox"

    # Create collection and banners for each season
    for season in seasons:
        print(f"Creating {season['name']}...")

        # Create collection
        collection_id = create_collection(
            name=season["name"],
            channel_id=channel_id,
            description=f"{season['name']} seasonal promotion"
        )
        print(f"  Collection created: {collection_id}")

        # Create banner
        banner = create_banner(
            title=season["name"],
            image=season["image"],
            collection_id=collection_id,
            start_date=season["start"],
            end_date=season["end"]
        )
        print(f"  Banner created: {banner['id']}")

    print("✓ All seasonal campaigns created!")

if __name__ == "__main__":
    main()
```

---

## Scenario 6: Dynamic Content with Key-Values

**Goal:** Store campaign analytics and tracking data in banners

### Create Collection with Analytics

```graphql
mutation {
  createImageCollection(
    input: {
      name: "Q2 2024 Analytics"
      channelId: "Q2hhbm5lbDox"
      description: "Q2 campaigns with analytics tracking"
    }
  ) {
    collection {
      id
    }
  }
}
```

### Create Banner with Analytics Key-Values

```graphql
mutation {
  createBanner(
    input: {
      title: "Q2 Revenue Drive"
      image: "/media/banners/q2_revenue.jpg"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/q2-sale"
      linkText: "Learn More"
      # Extensive key-values for analytics
      keyValues: [
        { key: "campaign_id", value: "Q2_2024_REV_001" }
        { key: "campaign_name", value: "Q2 Revenue Drive" }
        { key: "budget_usd", value: "50000" }
        { key: "target_roi", value: "3.5" }
        { key: "expected_impressions", value: "500000" }
        { key: "expected_clicks", value: "15000" }
        { key: "target_ctr", value: "3" }
        { key: "utm_source", value: "banner" }
        { key: "utm_campaign", value: "q2_revenue_2024" }
        { key: "utm_medium", value: "web" }
        { key: "audience_segment", value: "high_value_customers" }
        { key: "geographic_target", value: "us,ca,mx" }
        { key: "device_target", value: "desktop,mobile" }
        { key: "min_order_value", value: "100" }
        { key: "promotion_code", value: "Q2REVENUE20" }
        { key: "discount_percent", value: "20" }
        { key: "manager_email", value: "campaign@example.com" }
        { key: "approval_date", value: "2024-04-01" }
        { key: "approved_by", value: "john.doe@example.com" }
      ]
      position: 1
      isActive: true
      startDate: "2024-04-01"
      endDate: "2024-06-30"
    }
  ) {
    banner {
      id
      keyValues
    }
  }
}
```

**Result:** All campaign data stored with banner for easy access

---

## Scenario 7: Location-Based Campaigns

**Goal:** Different banners for different regions

### Step 1: Create Regional Collection

```graphql
mutation {
  createImageCollection(
    input: {
      name: "Regional Promotions"
      channelId: "Q2hhbm5lbDox"
      description: "Location-specific banners"
    }
  ) {
    collection {
      id
    }
  }
}
```

### Step 2: Create North America Banner

```graphql
mutation {
  createBanner(
    input: {
      title: "North America Special"
      image: "/media/banners/promo_north_america.jpg"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/na-promo"
      linkText: "Shop NA Deals"
      customField1: "north_america"
      customField2: "regional"
      keyValues: [
        { key: "region", value: "north_america" }
        { key: "countries", value: "us,ca,mx" }
        { key: "currency", value: "usd" }
        { key: "discount_local", value: "25%" }
      ]
      position: 1
      isActive: true
    }
  ) {
    banner {
      id
    }
  }
}
```

### Step 3: Create Europe Banner

```graphql
mutation {
  createBanner(
    input: {
      title: "Europe Special"
      image: "/media/banners/promo_europe.jpg"
      collectionId: "Q29sbGVjdGlvbjox"
      linkUrl: "https://example.com/eu-promo"
      linkText: "Shop EU Deals"
      customField1: "europe"
      customField2: "regional"
      keyValues: [
        { key: "region", value: "europe" }
        { key: "countries", value: "uk,de,fr,it" }
        { key: "currency", value: "eur" }
        { key: "discount_local", value: "20€" }
      ]
      position: 2
      isActive: true
    }
  ) {
    banner {
      id
    }
  }
}
```

**Result:** Frontend can display region-specific banner based on user location

---

## Scenario 8: Guest Checkout Banner

**Goal:** Show targeted banner for guest users

```graphql
mutation {
  createImageCollection(
    input: {
      name: "Guest User Promotions"
      channelId: "Q2hhbm5lbDox"
      description: "Targeted banners for guest checkout"
    }
  ) {
    collection {
      id
    }
  }
}
```

```graphql
mutation {
  createBanner(
    input: {
      title: "Create Account & Save"
      image: "/media/banners/guest_to_member.jpg"
      collectionId: "Q29sbGVjdGlvbjox"
      description: "Encourage guest users to create account"
      linkUrl: "https://example.com/register"
      linkText: "Join Now & Get 15% Off"
      customField1: "conversion_optimization"
      customField2: "guest_user"
      keyValues: [
        { key: "target_user_type", value: "guest" }
        { key: "offer", value: "first_purchase_discount" }
        { key: "discount_code", value: "GUEST15" }
        { key: "discount_percent", value: "15" }
        { key: "conversion_goal", value: "account_creation" }
        { key: "secondary_goal", value: "purchase" }
      ]
      position: 1
      isActive: true
    }
  ) {
    banner {
      id
    }
  }
}
```

---

## Summary: Common Patterns

| Pattern            | Use Case             | Scheduling                       |
| ------------------ | -------------------- | -------------------------------- |
| Single Banner      | Product announcement | Manual start/end                 |
| Multiple Banners   | Campaign rotation    | Weekly/Monthly schedules         |
| Channel-Specific   | Different platforms  | Same dates, different content    |
| A/B Testing        | Optimize CTAs        | Same dates, track separately     |
| Regional           | Location targeting   | Always active, filter by region  |
| Seasonal           | Holiday campaigns    | Set yearly recurring dates       |
| Guest Conversion   | User acquisition     | Always active, show by user type |
| Analytics Tracking | Campaign measurement | Dates + UTM params + budget info |

---

## Quick Checklist

When creating collections/banners:

```
Collection Creation:
  ☐ Unique name
  ☐ Correct channel
  ☐ Descriptive description
  ☐ Status set to Active

Banner Creation:
  ☐ Compelling title
  ☐ Optimized image
  ☐ Clear CTA with link
  ☐ Relevant custom fields
  ☐ Key-values for tracking
  ☐ Schedule set (if time-limited)
  ☐ Status set to Active

Verification:
  ☐ Banner appears in collection
  ☐ Link works
  ☐ Image displays correctly
  ☐ Schedule is correct
  ☐ Analytics tracked
```

---

**Happy Campaigning! 🚀**

For detailed documentation, see CREATE_COLLECTION_BANNER_GUIDE.md
"""
