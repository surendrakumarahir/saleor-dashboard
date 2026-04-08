"""

# Banner Management System - Developer Checklist & Implementation Guide

## ✅ Pre-Implementation Checklist

### Backend Requirements (Saleor API)

- [ ] Saleor 3.x+ installed
- [ ] Python 3.8+ environment
- [ ] PostgreSQL database
- [ ] Django project configured
- [ ] Virtual environment activated

### Backend Files Verification

- [ ] `saleor/banner/models.py` - Contains ImageCollection and Banner models
- [ ] `saleor/banner/admin.py` - Django admin integration
- [ ] `saleor/banner/permissions.py` - MANAGE_BANNERS permission
- [ ] `saleor/banner/utils.py` - Utility functions
- [ ] `saleor/graphql/banner_queries.py` - GraphQL queries
- [ ] `saleor/graphql/banner_mutations.py` - GraphQL mutations
- [ ] `saleor/banner/migrations/0001_initial.py` - Migration file
- [ ] `saleor/banner/tests.py` - Test suite

### Frontend Requirements (Saleor Dashboard)

- [ ] Saleor Dashboard 3.x+ installed
- [ ] Node.js 14+ installed
- [ ] npm or yarn available
- [ ] React 16.8+ available
- [ ] TypeScript configured
- [ ] Apollo Client configured
- [ ] Tailwind CSS configured

### Frontend Files Verification

- [ ] `src/banners/types.ts` - TypeScript interfaces
- [ ] `src/banners/queries.ts` - GraphQL operations
- [ ] `src/banners/components/KeyValueEditor.tsx`
- [ ] `src/banners/components/BannerSortableList.tsx`
- [ ] `src/banners/components/BannerModal.tsx`
- [ ] `src/banners/components/ImageCollectionModal.tsx`
- [ ] `src/banners/pages/ImageCollectionsList.tsx`
- [ ] `src/banners/index.ts` - Exports
- [ ] `src/banners/routes.ts` - Routing

---

## 🔧 Backend Setup Steps

### Step 1: Configure Django Settings

**File: `saleor/settings.py`**

```python
INSTALLED_APPS = [
    # ... existing apps
    "saleor.banner",  # ADD THIS LINE
    # ... other apps
]
```

✅ Verify with:

```bash
python manage.py showmigrations banner
```

### Step 2: Update GraphQL API

**File: `saleor/graphql/api.py`**

```python
# Add at the top of the file
from saleor.banner.graphql import BannerQueries, BannerMutations

# In the Query class
class Query(
    BannerQueries,  # ADD THIS
    AccountQueries,
    AppQueries,
    # ... other queries
):
    pass

# In the Mutation class
class Mutation(
    BannerMutations,  # ADD THIS
    AccountMutations,
    AppMutations,
    # ... other mutations
):
    pass
```

✅ Verify with:

```bash
python manage.py shell
>>> from saleor.graphql.api import schema
>>> print(schema)  # Should include banner types
```

### Step 3: Run Database Migrations

```bash
python manage.py migrate banner
```

✅ Verify:

```bash
python manage.py dbshell
\dt  # In PostgreSQL shell, should show banner tables
```

### Step 4: Create Admin User Permission

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import Permission, Group
from django.contrib.auth import get_user_model

User = get_user_model()

# Get or create permission
perm, created = Permission.objects.get_or_create(
    codename="manage_banners",
    name="Can manage banners",
    content_type__app_label="banner"
)

# Add to your staff user
user = User.objects.get(username="your_admin_user")
user.user_permissions.add(perm)
user.save()

print("Permission assigned to user")
```

### Step 5: Start Django Server

```bash
python manage.py runserver
```

✅ Verify:

```bash
curl http://localhost:8000/graphql/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ imageCollections(first: 10) { edges { node { id name } } } }"}'

# Should return GraphQL response (possibly empty data but no errors)
```

### Step 6: Run Tests (Optional but Recommended)

```bash
python manage.py test saleor.banner
# or with pytest
pytest saleor/banner/tests.py -v
```

✅ All tests should pass

---

## 🎨 Frontend Setup Steps

### Step 1: Install Dependencies

```bash
npm install react-beautiful-dnd react-datepicker
npm install --save-dev @types/react-beautiful-dnd
```

✅ Verify:

```bash
npm list react-beautiful-dnd react-datepicker
```

### Step 2: Verify Files Exist

```bash
ls -la src/banners/
ls -la src/banners/components/
ls -la src/banners/pages/
```

✅ Should see:

```
index.ts
routes.ts
types.ts
queries.ts
components/
  BannerModal.tsx
  BannerSortableList.tsx
  ImageCollectionModal.tsx
  KeyValueEditor.tsx
pages/
  ImageCollectionsList.tsx
```

### Step 3: Configure Tailwind (if needed)

**File: `tailwind.config.js`**

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/banners/**/*.{js,ts,jsx,tsx}", // ADD THIS LINE
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

✅ Rebuild Tailwind:

```bash
npm run build:css
```

### Step 4: Add Routes

**File: `src/routes.ts` or `src/App.tsx`**

For React Router v6:

```typescript
import { ImageCollectionsList } from "@/banners";

const routes = [
  // ... other routes
  {
    path: "/banners",
    element: <ImageCollectionsList />,
    name: "Banners",
  },
  // ... other routes
];
```

For React Router v5:

```typescript
import { ImageCollectionsList } from "@/banners";

<Route path="/banners" component={ImageCollectionsList} exact />
```

✅ Verify in browser: Navigate to http://localhost:3000/banners

### Step 5: Add Navigation Menu Item

**File: `src/components/Navigation.tsx` (or your menu file)**

```typescript
import { bannerMenuItem } from "@/banners/routes";

const menuItems = [
  // ... other items
  {
    label: "Banners",
    icon: "image", // Use your icon component
    path: bannerMenuItem.path,
    requiredPermission: bannerMenuItem.requiredPermission,
  },
];
```

✅ Verify: Should see "Banners" in navigation menu

### Step 6: Configure Apollo Client (Verify)

**File: `src/apollo.ts` or similar**

Ensure endpoint is correct:

```typescript
const httpLink = new HttpLink({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:8000/graphql/",
  credentials: "include",
});
```

✅ Verify connection:

```bash
# In browser console
fetch('http://localhost:8000/graphql/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '{ imageCollections(first: 1) { edges { node { id } } } }'
  }),
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

### Step 7: Start Development Server

```bash
npm start
```

✅ Should see no build errors

---

## 🧪 Testing & Verification

### Test Checklist

#### Backend Tests

- [ ] Run `python manage.py test saleor.banner`
- [ ] All tests pass (15+ test cases)
- [ ] Test coverage >= 80%
- [ ] No SQL errors

#### Frontend Navigation

- [ ] Click "Banners" in navigation menu
- [ ] Page loads without errors
- [ ] See "Image Collections" heading
- [ ] Create button is visible

#### GraphQL Operations

- [ ] Query returns empty collection list initially
- [ ] Can create collection via mutation
- [ ] Can fetch collection detail
- [ ] Can update collection
- [ ] Can delete collection

#### Collection Management

- [ ] Create collection form appears
- [ ] Can enter collection name
- [ ] Can select channel
- [ ] Can toggle active status
- [ ] Form saves successfully
- [ ] Collection appears in list

#### Banner Management

- [ ] Click "Manage Banners" opens modal
- [ ] Can create banner
- [ ] Banner form has all 5 sections
- [ ] Can upload image
- [ ] Can add key-value pairs
- [ ] Can schedule banner
- [ ] Can save banner
- [ ] Banner appears in list

#### Drag-and-Drop

- [ ] Can grab banner item
- [ ] Drag visual feedback appears
- [ ] Can drop to reorder
- [ ] Position updates after drop
- [ ] Changes saved to backend

#### Search & Filter

- [ ] Type in search updates list
- [ ] Channel filter works
- [ ] Status filter works
- [ ] Filters can be combined
- [ ] Clear filters shows all

#### Error Handling

- [ ] Invalid form shows errors
- [ ] Empty required fields show error
- [ ] GraphQL errors display as toast/notification
- [ ] Network errors handled gracefully
- [ ] Can retry after error

---

## 🚀 Deployment Checklist

### Before Deployment

#### Backend

- [ ] All migrations applied
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Static files collected
- [ ] Tests pass
- [ ] Permission system verified

#### Frontend

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Production build tested locally
- [ ] Environment variables set

### Deployment Steps

#### Backend (Django)

```bash
# 1. Verify settings
export DJANGO_SETTINGS_MODULE=saleor.settings

# 2. Collect static files
python manage.py collectstatic --noinput

# 3. Run migrations
python manage.py migrate

# 4. Test GraphQL endpoint
python manage.py shell_plus

# 5. Restart server (using your deployment method)
# systemctl restart saleor
# or docker restart saleor-api
```

#### Frontend (Dashboard)

```bash
# 1. Build production bundle
npm run build

# 2. Test build locally (optional)
npm run serve

# 3. Deploy build output (usually to CDN or nginx)
# cp -r build/* /var/www/saleor-dashboard/
# or push to deployment service

# 4. Restart dashboard
# systemctl restart saleor-dashboard
# or redeploy container
```

### Post-Deployment

- [ ] Visit dashboard URL in browser
- [ ] Navigation menu shows Banners
- [ ] Click Banners navigates correctly
- [ ] Collection list loads data
- [ ] Can create new collection
- [ ] Can create new banner
- [ ] Can manage banners (edit, delete)
- [ ] Drag-drop works
- [ ] No console errors

---

## 📊 Performance Tuning

### Database Optimization

```sql
-- Add indexes for better query performance
CREATE INDEX idx_banner_collection_channel ON banner_collection(channel_id);
CREATE INDEX idx_banner_collection_is_active ON banner_collection(is_active);
CREATE INDEX idx_banner_position ON banner(collection_id, position);
CREATE INDEX idx_banner_is_active ON banner(is_active);
```

✅ Verify:

```sql
SELECT * FROM pg_indexes WHERE tablename IN ('banner_collection', 'banner');
```

### Query Optimization

In GraphQL queries, use fragments to avoid overfetching:

```typescript
// BAD - fetches all fields
query GetCollections {
  imageCollections(first: 10) {
    edges { node { id name description channel { id name slug } banners { id title } } }
  }
}

// GOOD - uses fragment, only fetch needed fields
query GetCollections {
  imageCollections(first: 10) {
    edges { node { ...BannerCollection } }
  }
}
```

### Frontend Performance

```typescript
// Use React.memo for collection cards
const CollectionCard = React.memo(({ collection, onEdit, onDelete }) => {
  // ...
});

// Use useCallback for event handlers
const handleEdit = useCallback(id => {
  setSelectedId(id);
}, []);
```

### Caching Strategy

```typescript
// Configure Apollo Client cache
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        imageCollections: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});
```

---

## 🔒 Security Hardening

### Backend Security

```python
# In settings.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'",),
    "img-src": ("'self'", "data:", "https:"),
}
```

### GraphQL Security

```python
# In graphql/api.py
GRAPHENE = {
    "SCHEMA": "saleor.graphql.api.schema",
    "MIDDLEWARE": [
        "saleor.core.middleware.RequestPermissionMiddleware",
        "saleor.graphql.middleware.RateLimitMiddleware",
    ],
}
```

### Frontend Security

```typescript
// Environment variables
REACT_APP_GRAPHQL_ENDPOINT=https://api.example.com/graphql/  // Use HTTPS
REACT_APP_API_TIMEOUT=30000

// Content Security Policy
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' data: https:;">
```

---

## 📈 Monitoring & Logging

### Backend Monitoring

```python
# In settings.py
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "/var/log/saleor/banner.log",
        },
    },
    "loggers": {
        "saleor.banner": {
            "handlers": ["file"],
            "level": "INFO",
            "propagate": True,
        },
    },
}
```

### Frontend Monitoring

```typescript
// Setup Sentry or similar
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.REACT_APP_ENV,
});

// Log GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(err => {
      Sentry.captureException(err);
    });
  }
});
```

---

## ✨ Common Customizations

### Add More Custom Fields

1. Update model:

```python
# saleor/banner/models.py
class Banner(models.Model):
    # ... existing fields
    custom_field_4 = models.CharField(max_length=255, blank=True, null=True)
    custom_field_5 = models.CharField(max_length=255, blank=True, null=True)
```

2. Create migration:

```bash
python manage.py makemigrations banner
```

3. Update GraphQL schema:

```python
# saleor/graphql/banner_types.py
class BannerType(graphene.ObjectType):
    # ... existing fields
    custom_field_4 = graphene.String()
    custom_field_5 = graphene.String()
```

4. Update React form:

```typescript
// BannerModal.tsx
// Add input fields in Custom Fields section
<Input label="Custom Field 4" value={form.custom_field_4} onChange={...} />
<Input label="Custom Field 5" value={form.custom_field_5} onChange={...} />
```

### Change Color Theme

Search and replace Tailwind colors:

```bash
# Replace blue with brand color
find src/banners -type f -name "*.tsx" -exec sed -i 's/bg-blue-600/bg-brand-600/g' {} \;
find src/banners -type f -name "*.tsx" -exec sed -i 's/text-blue-600/text-brand-600/g' {} \;
find src/banners -type f -name "*.tsx" -exec sed -i 's/border-blue-200/border-brand-200/g' {} \;
```

### Add Image Compression

```typescript
// In BannerModal.tsx
import imageCompression from "browser-image-compression";

const handleImageUpload = async (file: File) => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
  });
  // Use compressed file
};
```

---

## 🐛 Debugging Tips

### Backend Debugging

```bash
# Enable Django debug toolbar
pip install django-debug-toolbar

# Use shell_plus for testing
python manage.py shell_plus

# Test GraphQL mutation
python manage.py graphql_playground
```

### Frontend Debugging

```typescript
// Add console logging
const DEBUG = process.env.REACT_APP_DEBUG === "true";
const log = (msg, data) => DEBUG && console.log(`[BANNER] ${msg}`, data);

// React DevTools
// - Install React DevTools browser extension
// - Inspect component props and state

// Apollo DevTools
// - Install Apollo Client DevTools browser extension
// - View cached data and queries
```

### GraphQL Debugging

```bash
# GraphQL Playground
# Visit http://localhost:8000/graphql/

# Test mutation
mutation {
  createImageCollection(input: {
    name: "Test Collection"
    channelId: "Q2hhbm5lbDox"
    isActive: true
  }) {
    collection { id name }
    errors { field message code }
  }
}
```

---

## 📚 Learning Resources

- [Saleor Documentation](https://docs.saleor.io) - Platform documentation
- [Django Documentation](https://docs.djangoproject.com) - Django framework
- [GraphQL Documentation](https://graphql.org/learn) - GraphQL basics
- [React Documentation](https://react.dev) - React framework
- [Apollo Client Docs](https://www.apollographql.com/docs/react/) - Apollo Client
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Tailwind CSS

---

## 🎉 Completion Checklist

When all items checked, your Banner Management System is ready! ✅

**Phase 1: Verification**

- [ ] All backend files exist
- [ ] All frontend files exist
- [ ] No missing dependencies

**Phase 2: Backend Setup**

- [ ] Django INSTALLED_APPS configured
- [ ] GraphQL API updated
- [ ] Migrations applied
- [ ] Permission created
- [ ] Server running

**Phase 3: Frontend Setup**

- [ ] Dependencies installed
- [ ] Routes added
- [ ] Navigation updated
- [ ] Tailwind configured
- [ ] Server running

**Phase 4: Testing**

- [ ] Backend tests pass
- [ ] Frontend loads without errors
- [ ] Can create collection
- [ ] Can create banner
- [ ] Can edit and delete
- [ ] Drag-drop works
- [ ] Filters work

**Phase 5: Deployment Prep**

- [ ] Production build tested
- [ ] Environment variables verified
- [ ] Security hardening applied
- [ ] Monitoring configured
- [ ] Backup created

**Phase 6: Deployment**

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Post-deployment verification passed
- [ ] Users can access

**Phase 7: Maintenance**

- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] Keep dependencies updated
- [ ] Regular backups

---

**Congratulations! 🎉 Your Banner Management System is fully operational!**

For ongoing support, refer to the component documentation and troubleshooting guides.
"""
