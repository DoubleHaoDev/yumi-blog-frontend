# Frontend Migration Guide
## GraphQL → Spring Boot REST API

> **Date**: April 25, 2026
> **Backend**: Spring Boot 4.0.5 running on `http://localhost:8080`
> **Strategy**: Big Bang — migrate all endpoints at once

---

## Decisions Made

| Decision | Choice |
|---|---|
| Comments proxy (`/pages/api/comments.js`) | **Removed — call backend directly** |
| Content format | **HTML string** — render with `dangerouslySetInnerHTML` |
| Image URLs | Backend returns full URL string |
| Comment authentication | **Future feature — not required now** |
| Migration strategy | **Big Bang** |

---

## Step 1: Dependencies

### Remove
```bash
npm uninstall graphql graphql-request
```

### Add
```bash
npm install axios
```

---

## Step 2: Environment Variables

In `.env.local`, remove the old GraphCMS variables and add:
```bash
# Remove these:
# NEXT_PUBLIC_GRAPHCMS_ENDPOINT=...
# GRAPHCMS_TOKEN=...

# Add this:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

In `.env.production`:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api
```

---

## Step 3: Create API Utility (`/lib/api.js`)

Create a new file `/lib/api.js`:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Step 4: Replace `/services/index.js`

Replace the entire file with the following:

```javascript
import apiClient from '../lib/api';

export const getPosts = async () => {
  return apiClient.get('/posts');
};

export const getFeaturedPosts = async () => {
  return apiClient.get('/posts?featured=true');
};

export const getRecentPosts = async () => {
  return apiClient.get('/posts/recent');
};

export const getPostDetails = async (slug) => {
  return apiClient.get(`/posts/${slug}`);
};

export const getSimilarPosts = async (categories, slug) => {
  return apiClient.get(`/posts/${slug}/similar`);
};

export const getAdjacentPosts = async (createdAt, slug) => {
  return apiClient.get(`/posts/${slug}/adjacent`);
};

export const getCategories = async () => {
  return apiClient.get('/categories');
};

export const getCategoryPost = async (slug) => {
  return apiClient.get(`/categories/${slug}/posts`);
};

export const getComments = async (slug) => {
  return apiClient.get(`/posts/${slug}/comments`);
};

export const submitComment = async (obj) => {
  return apiClient.post('/comments', {
    name: obj.name,
    email: obj.email,
    content: obj.comment,  // Note: field renamed from 'comment' to 'content'
    slug: obj.slug,
  });
};
```

---

## Step 5: Delete `/pages/api/comments.js`

This file is no longer needed. The frontend now calls the Spring Boot backend directly.

---

## Step 6: Data Structure Changes

### 6.1 Posts List — Remove `edges.node` unwrapping

**BEFORE (GraphQL)**:
```javascript
posts.map((post) => {
  const { node } = post;
  return <PostCard post={node} />;
});
```

**AFTER (REST)**:
```javascript
posts.map((post) => {
  return <PostCard post={post} />;
});
```

### 6.2 Featured Image — No longer nested

**BEFORE**:
```javascript
post.featuredImage.url
```

**AFTER**:
```javascript
post.featuredImage  // Already a URL string
```

### 6.3 Post Content — Now an HTML string

**BEFORE**:
```javascript
// content.raw is Rich Text JSON requiring a renderer
getRichTextContent(post.content.raw)
```

**AFTER**:
```javascript
// content is already an HTML string
<div dangerouslySetInnerHTML={{ __html: post.content }} />
```

### 6.4 Author Photo — No longer nested

**BEFORE**:
```javascript
post.author.photo.url
```

**AFTER**:
```javascript
post.author.photoUrl
```

### 6.5 Adjacent Posts — New structure

The `getAdjacentPosts` endpoint returns:
```json
{
  "next": { ...PostListDTO },
  "previous": { ...PostListDTO }
}
```
Access with `result.next` and `result.previous`. Either can be `null` if there is no next/previous post.

### 6.6 Comments — Field renamed

The comment body field is now `content` instead of `comment`:
```javascript
// BEFORE
comment.comment

// AFTER
comment.content
```

---

## Step 7: Update Pages

### `/pages/index.js`
- `getPosts()` returns an array directly — no more `.edges` unwrapping
- Update `getStaticProps` and component map accordingly

### `/pages/post/[slug].js`
- `getPostDetails(slug)` returns the post object directly
- `content` is an HTML string — replace any Rich Text renderer with `dangerouslySetInnerHTML`
- `getAdjacentPosts(createdAt, slug)` — signature stays the same but `createdAt` param is no longer used (backend derives it from the slug). You can pass it or remove it.

### `/pages/category/[slug].js`
- `getCategoryPost(slug)` returns an array directly — no more `.edges` unwrapping

---

## Step 8: Update Components

For each component, replace any `post.node.xyz` references with `post.xyz`:

| Old | New |
|---|---|
| `post.node.title` | `post.title` |
| `post.node.slug` | `post.slug` |
| `post.node.excerpt` | `post.excerpt` |
| `post.node.featuredImage.url` | `post.featuredImage` |
| `post.node.author.photo.url` | `post.author.photoUrl` |
| `post.node.categories` | `post.categories` |
| `post.node.createdAt` | `post.createdAt` |
| `post.content.raw` | `post.content` (HTML string) |
| `comment.comment` | `comment.content` |

---

## API Reference

### Base URL
```
http://localhost:8080/api
```

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts` | All posts |
| GET | `/posts?featured=true` | Featured posts only |
| GET | `/posts/recent` | 3 most recent posts |
| GET | `/posts/{slug}` | Single post with full content |
| GET | `/posts/{slug}/similar` | 3 similar posts by category |
| GET | `/posts/{slug}/adjacent` | Next and previous posts |
| GET | `/categories` | All categories |
| GET | `/categories/{slug}/posts` | Posts in a category |
| GET | `/posts/{slug}/comments` | Comments for a post |
| POST | `/comments` | Submit a comment |

### POST `/comments` Request Body
```json
{
  "name": "string (required)",
  "email": "valid email (required)",
  "content": "string (required)",
  "slug": "post slug (required)"
}
```

### Error Responses
| Status | Meaning |
|---|---|
| `400` | Validation failed — response body contains field-level errors |
| `404` | Resource not found — `{ "error": "..." }` |
| `500` | Unexpected server error — `{ "error": "An unexpected error occurred" }` |

---

## Data Shape Reference

### Post (List)
```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "excerpt": "string",
  "featuredImage": "http://localhost:8080/api/images/uuid or null",
  "featuredPost": true,
  "createdAt": "2026-04-25T10:00:00",
  "author": {
    "id": "uuid",
    "name": "string",
    "bio": "string",
    "photoUrl": "string or null"
  },
  "categories": [
    { "id": "uuid", "name": "string", "slug": "string" }
  ]
}
```

### Post (Detail) — adds `content`
```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "excerpt": "string",
  "content": "<h2>HTML string...</h2><p>...</p>",
  "featuredImage": "string or null",
  "featuredPost": false,
  "createdAt": "2026-04-25T10:00:00",
  "author": { "id": "uuid", "name": "string", "bio": "string", "photoUrl": "string or null" },
  "categories": [{ "id": "uuid", "name": "string", "slug": "string" }]
}
```

### Adjacent Posts
```json
{
  "next": { ...Post (List) or null },
  "previous": { ...Post (List) or null }
}
```

### Comment
```json
{
  "id": "uuid",
  "name": "string",
  "content": "string",
  "createdAt": "2026-04-25T10:00:00"
}
```

---

## Testing Checklist

- [ ] Homepage loads posts correctly
- [ ] Featured posts carousel works
- [ ] Recent posts widget works
- [ ] Post detail page renders HTML content correctly
- [ ] Similar posts widget works
- [ ] Next / previous post navigation works
- [ ] Category page loads posts correctly
- [ ] Comments load on post detail page
- [ ] Comment submission works (name, email, content, slug)
- [ ] No CORS errors in browser console
- [ ] No `edges.node` references left in codebase
- [ ] No `graphql` or `graphql-request` imports left in codebase
- [ ] `npm run build` passes with no errors

