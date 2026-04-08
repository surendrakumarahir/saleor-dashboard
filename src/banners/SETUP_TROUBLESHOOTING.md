"""

# Banner Management System - Complete Setup & Troubleshooting

## Quick Start (5 minutes)

### Backend Setup

1. Ensure `saleor.banner` is in Django INSTALLED_APPS
2. Run `python manage.py migrate banner`
3. Add to `saleor/graphql/api.py`:

   ```python
   from saleor.banner.graphql import BannerQueries, BannerMutations

   class Query(BannerQueries, ...):
       pass

   class Mutation(BannerMutations, ...):
       pass
   ```

4. Restart Django server

### Frontend Setup

1. Copy `src/banners/` folder to your dashboard
2. Run `npm install react-beautiful-dnd react-datepicker`
3. Add route: `<Route path="/banners" component={ImageCollectionsList} />`
4. Add navigation menu item
5. Restart dashboard dev server

---

## Detailed Configuration

### 1. Database Configuration (Backend)

**Check migration status:**

```bash
python manage.py showmigrations banner
```

**Apply migrations:**

```bash
python manage.py migrate banner
```

**Verify tables created:**

```bash
python manage.py shell
>>> from saleor.banner.models import ImageCollection, Banner
>>> ImageCollection.objects.count()  # Should work without errors
>>> Banner.objects.count()
```

### 2. GraphQL API Configuration (Backend)

**File: `saleor/graphql/api.py`**

```python
from saleor.banner.graphql import BannerQueries, BannerMutations

class Query(
    BannerQueries,  # ADD THIS
    # ... other query mixins
):
    pass

class Mutation(
    BannerMutations,  # ADD THIS
    # ... other mutation mixins
):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
```

**Test GraphQL endpoint:**

```bash
# Navigate to http://localhost:8000/graphql/
# Execute query:
query {
  imageCollections(first: 10) {
    edges {
      node {
        id
        name
        channel { slug }
      }
    }
  }
}
```

### 3. Dashboard Route Configuration

**File: `src/routes.ts` or `src/App.tsx`**

For React Router v6:

```typescript
import { ImageCollectionsList } from "@/banners";

export const routes = [
  {
    path: "/banners",
    name: "Banners",
    element: <ImageCollectionsList />,
    requiredPermission: "banner.manage_banners",
  },
  // ... other routes
];
```

For React Router v5:

```typescript
<Route path="/banners" component={ImageCollectionsList} exact />
```

### 4. Navigation Menu Configuration

**File: `src/components/Navigation.tsx` or similar**

```typescript
import { bannerMenuItem } from "@/banners/routes";

const navigationItems = [
  // ... other items
  {
    label: "Banners",
    path: bannerMenuItem.path,
    icon: "image", // Use your icon component
    requiredPermission: bannerMenuItem.requiredPermission,
  },
];
```

### 5. Apollo Client Setup

**Verify Apollo Client is configured:**

```typescript
// src/apollo.ts or similar
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from "@apollo/client";
import { onError } from "@apollo/client/link/error";

const httpLink = new HttpLink({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:8000/graphql/",
  credentials: "include",
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(`[GraphQL error]: Message: ${message}`),
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});
```

### 6. Tailwind CSS Configuration

**File: `tailwind.config.js`**

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/banners/**/*.{js,ts,jsx,tsx}", // Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Rebuild Tailwind:**

```bash
npm run build:css
# or if using Tailwind CLI:
npx tailwindcss -i ./src/styles/index.css -o ./src/styles/output.css --watch
```

### 7. TypeScript Configuration

**Ensure your `tsconfig.json` supports the imports:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/banners": ["src/banners"],
      "@/banners/*": ["src/banners/*"]
    }
  }
}
```

---

## Dependency Installation

### NPM

```bash
npm install react-beautiful-dnd react-datepicker
npm install --save-dev @types/react-beautiful-dnd
```

### Yarn

```bash
yarn add react-beautiful-dnd react-datepicker
yarn add --dev @types/react-beautiful-dnd
```

### Check installed versions:

```bash
npm list react-beautiful-dnd react-datepicker
```

Expected:

```
├── react-beautiful-dnd@13.1.0+
├── react-datepicker@4.0.0+
└── @types/react-beautiful-dnd@13.1.1+
```

---

## Troubleshooting Guide

### Issue 1: "Module not found: Can't resolve 'react-beautiful-dnd'"

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Verification:**

```bash
ls node_modules | grep react-beautiful
# Should show: react-beautiful-dnd
```

### Issue 2: "Cannot find module '@/banners'"

**Solution:**
Verify `tsconfig.json` has correct baseUrl and paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

If using different path alias:

```typescript
// Change imports from:
import { ImageCollectionsList } from "@/banners";
// To:
import { ImageCollectionsList } from "./banners";
// Or your actual relative path
```

### Issue 3: GraphQL endpoint returns 401/403

**Solution:**
Check authentication and permissions:

```bash
# Verify user has permission in Django:
python manage.py shell
>>> from django.contrib.auth.models import Permission
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.get(username="your_user")
>>> perm = Permission.objects.get(codename="manage_banners")
>>> perm in user.user_permissions.all()  # Should be True
```

If False, add permission:

```python
user.user_permissions.add(perm)
user.save()
```

### Issue 4: Drag-drop not working

**Root cause:** Missing CSS or React context issue

**Solution:**

1. Verify react-beautiful-dnd CSS is imported:

   ```typescript
   // In your main component or App.tsx
   import "react-beautiful-dnd/dist/easy-peasy.css"; // Optional but recommended
   ```

2. Check component structure - ensure:
   - `<DragDropContext>` wraps `<Droppable>`
   - `<Draggable>` components are direct children of `<Droppable>`
   - Scroll container doesn't have `overflow: hidden`

3. Test with console:
   ```javascript
   // In browser console
   import("react-beautiful-dnd").then(dnd => console.log(dnd));
   // Should log the library without errors
   ```

### Issue 5: Date picker not showing

**Solution:**
Import CSS for react-datepicker:

```typescript
// In your main App.tsx or CSS file
import "react-datepicker/dist/react-datepicker.css";
```

**Verify CSS path:**

```bash
ls node_modules/react-datepicker/dist/
# Should show: react-datepicker.css
```

### Issue 6: Tailwind styles not applying

**Solution:**

```bash
# Clear Tailwind cache
rm -rf .next node_modules/.cache

# Rebuild CSS
npm run build:css

# Or if using dev mode:
npm run dev
```

**Check Tailwind config:**

```bash
# Verify content paths
grep -A 5 "content:" tailwind.config.js
# Should include: "./src/banners/**/*.{js,ts,jsx,tsx}"
```

### Issue 7: "Syntax error: Unexpected token"

**Solution:**
If you see JSX syntax errors:

1. Verify file extension is `.tsx` (not `.ts`)
2. Check TypeScript configuration in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "jsx": "react-jsx" // or "react"
     }
   }
   ```

### Issue 8: Apollo Client cache issues

**Solution:**
After mutations, data doesn't update:

```typescript
// Ensure mutations call refetch or update cache
const { data, refetch } = useQuery(GET_IMAGE_COLLECTIONS);

const [createCollection] = useMutation(CREATE_IMAGE_COLLECTION, {
  onCompleted: () => {
    refetch(); // Refresh data after creation
  },
});
```

### Issue 9: "Permission denied" errors

**Solution:**

```bash
# Check user permissions in Django:
python manage.py shell
>>> from django.contrib.auth.models import Permission
>>> perm = Permission.objects.get(codename="manage_banners")
>>> print(f"Permission ID: {perm.id}")
>>> print(f"Permission: {perm}")

# Grant to user:
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.get(username="your_username")
>>> user.user_permissions.add(perm)
>>> user.save()
```

### Issue 10: Import loops or circular dependencies

**Solution:**
Check import order in files. Common issue:

```typescript
// BAD - circular import
// index.ts
export { ImageCollectionsList } from "./pages/ImageCollectionsList";
export { types } from "./types"; // types might import from index

// GOOD - separate concerns
// index.ts
export { ImageCollectionsList } from "./pages/ImageCollectionsList";
export * from "./types";
```

---

## Performance Debugging

### Check Network Requests

```javascript
// In browser console
// Monitor Apollo Client network activity
import { useApolloClient } from "@apollo/client";
const client = useApolloClient();
console.log(client.cache.data.data); // View cached data
```

### Profile Component Renders

```typescript
// Wrap component with Profiler
import { Profiler } from "react";

<Profiler id="ImageCollectionsList" onRender={onRender}>
  <ImageCollectionsList />
</Profiler>
```

### Check Tailwind Build Size

```bash
npm run build
ls -lh build/static/css/
# Compare sizes before/after adding banners
```

---

## Environment Variables

Create `.env.local` file in dashboard root:

```env
# GraphQL Endpoint
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:8000/graphql/

# Debug Mode (set to true for verbose logging)
REACT_APP_DEBUG=false

# API Timeout (in ms)
REACT_APP_API_TIMEOUT=30000

# Banner Image Max Size (in MB)
REACT_APP_BANNER_IMAGE_MAX_SIZE=10

# Banner Collection Max Banners
REACT_APP_BANNER_COLLECTION_MAX_BANNERS=100
```

Usage in components:

```typescript
const apiEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT;
const maxImageSize = parseInt(process.env.REACT_APP_BANNER_IMAGE_MAX_SIZE || "10") * 1024 * 1024;
```

---

## Build & Deployment

### Development Build

```bash
npm start
# or
npm run dev
```

### Production Build

```bash
npm run build
# Build output will be in build/ or dist/

# Test production build locally:
npm run serve
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t saleor-dashboard .
docker run -p 3000:3000 saleor-dashboard
```

---

## Testing Setup

### Unit Tests

```typescript
// tests/banners.test.ts
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ImageCollectionsList } from "@/banners";

describe("Banner Components", () => {
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

Run tests:

```bash
npm test
```

---

## Security Checklist

- [ ] All API calls use authenticated GraphQL endpoint
- [ ] MANAGE_BANNERS permission is checked server-side
- [ ] User input is validated before sending to API
- [ ] Image uploads are validated (type, size)
- [ ] XSS prevention: Avoid dangerouslySetInnerHTML (not used in these components)
- [ ] CSRF tokens included in requests (handled by Apollo Client)
- [ ] Sensitive data not logged to console in production
- [ ] API endpoint uses HTTPS in production

---

## Monitoring & Logging

### Enable Debug Mode

```typescript
// In BannerModal.tsx or other components
const DEBUG = process.env.REACT_APP_DEBUG === "true";

const logDebug = (msg: string, data?: any) => {
  if (DEBUG) {
    console.log(`[BANNER] ${msg}`, data);
  }
};

// Usage
logDebug("Collection created", { id: collection.id });
```

### Log GraphQL Errors

```typescript
// In App.tsx or Apollo setup
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error in ${operation.operationName}]: ${message}`);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});
```

---

## FAQ

**Q: Can I use this with a different UI framework?**
A: Yes, but you'd need to rewrite components. The GraphQL queries remain the same.

**Q: How do I customize the styling?**
A: All styling is done with Tailwind CSS classes. Search and replace color/spacing values to match your theme.

**Q: Can I add more custom fields?**
A: Yes, modify the Banner model to add more fields, then update the GraphQL schema and React forms.

**Q: Is there an API rate limit?**
A: Depends on your Saleor setup. Add rate limiting middleware if needed.

**Q: How do I backup banner data?**
A: Use Django's dumpdata command:

```bash
python manage.py dumpdata banner > backup.json
```

**Q: Can I bulk import banners?**
A: Not built-in, but you can create a management command or use Django REST framework endpoints.

---

## Support Resources

- **Saleor Documentation**: https://docs.saleor.io
- **React Beautiful DND**: https://beautiful-dnd.atlassian.net/
- **React DatePicker**: https://reactdatepicker.com/
- **Apollo Client**: https://www.apollographql.com/docs/react/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Happy Banner Management! 🎉**

For additional help, check the component files for inline documentation or create an issue in your repository.
"""
