# Backend Changes Required
## Changes needed so the Spring Boot API matches what the frontend components actually consume

> Scanned files: all components, sections, pages, and `services/index.js`
> Reference: `backend-springboot-plan.md` and `FRONTEND_MIGRATION.md`

---

## 1. JSON Field Name Mismatches

These are fields the frontend currently uses (from GraphCMS) vs. what the backend plan returns.
The backend **must** use the exact JSON key names shown in the "Required" column.

| Component | Frontend currently uses | Backend plan returns | ✅ Required backend field |
|---|---|---|---|
| `PostCard`, `FeaturedPostCard`, `PostWidget`, `AdjacentPostCard`, `PostDetail` | `post.featuredImage.url` | `post.featuredImage` (flat string) | **`featuredImage`** — must be a flat URL string, NOT a nested object |
| `PostCard`, `PostDetail`, `FeaturedPostCard` | `post.author.photo.url` | `post.author.photoUrl` | **`photoUrl`** — must be a flat string inside the author object |
| `Author` component | `author.photo.url` | `author.photoUrl` | **`photoUrl`** — same as above |
| `Comments` component | `comment.comment` | `comment.content` | **`content`** — comment body field must be named `content` |
| `PostDetail` component | `post.content.raw.children` (Rich Text JSON) | `post.content` (HTML string) | **`content`** — must be a plain HTML string |

---

## 2. `POST /api/comments` — Request Body Field Name

The `CommentsForm.jsx` component builds this object and sends it via `submitComment()`:

```js
// CommentsForm.jsx — formData state
{ name, email, comment, slug }
```

The `FRONTEND_MIGRATION.md` service layer maps `comment → content` before sending to the backend:

```js
// services/index.js (after migration)
submitComment({ name, email, content: obj.comment, slug })
```

**Backend `CreateCommentRequest.java` must accept:**
```json
{
  "name": "string (required)",
  "email": "valid email (required)",
  "content": "string (required)",    ← field name must be "content", NOT "comment"
  "slug": "string (required)"
}
```

---

## 3. `GET /api/posts/{slug}/adjacent` — Response Field Names

`AdjacentPosts.jsx` accesses:
```js
adjacentPost.previous   // previous post
adjacentPost.next       // next post
```

Backend must return exactly:
```json
{
  "next": { ...PostListDTO or null },
  "previous": { ...PostListDTO or null }
}
```
✅ This already matches the backend plan — just confirming field names `next` and `previous` are correct.

---

## 4. `GET /api/comments` — Response Must Include `comment.name` and `comment.createdAt`

`Comments.jsx` renders:
```js
comment.name        // author's display name
comment.createdAt   // timestamp
comment.comment     // body text  ← will become comment.content after migration
```

**Backend `CommentDTO` must include:**
- `id`
- `name`
- `content` (body text)
- `createdAt`

> ⚠️ The backend plan's `CommentDTO` currently uses `content` — make sure `name` and `createdAt` are also in the response (they are in the plan, just confirming).

---

## 5. `GET /api/posts` and `GET /api/posts?featured=true` — Author Must Include `photoUrl`

Every component that renders a post list (`PostCard`, `FeaturedPostCard`, `PostWidget`) accesses:
```js
post.author.photo.url   // BEFORE migration
post.author.photoUrl    // AFTER migration
```

The `PostListDTO` author object **must** include `photoUrl` as a flat string.
The backend plan's `AuthorDTO` has `photoUrl` — ✅ correct, just make sure it is serialized as `photoUrl` (camelCase) in JSON.

---

## 6. Spring Boot JSON Serialization — camelCase

Ensure `application.properties` or Jackson config does **not** convert camelCase to snake_case.
All frontend field accesses use camelCase:
- `featuredImage` ✅
- `photoUrl` ✅
- `createdAt` ✅
- `featuredPost` ✅

Default Spring Boot / Jackson behavior is camelCase, so this should be fine unless you have a custom `ObjectMapper`.

---

## 7. `POST /api/comments` — Success Response

`CommentsForm.jsx` currently checks:
```js
if (res.createComment) { ... }  // GraphCMS mutation response shape
```

After migration this check must change on the **frontend**, but the backend should return a meaningful success response. Recommended:
```json
{
  "id": "uuid",
  "name": "string",
  "content": "string",
  "createdAt": "timestamp"
}
```
Return HTTP `201 Created` (not `200 OK`) for comment creation.

> ⚠️ This is a **frontend fix too** — `CommentsForm.jsx` must be updated to check for a successful `201` response instead of `res.createComment`.

---

## 8. Image Endpoint — `GET /api/images/{imageId}`

`AdjacentPostCard`, `FeaturedPostCard`, `PostCard`, `PostWidget`, and `PostDetail` all use:
```js
post.featuredImage   // used directly as <img src={...} />
```

The backend plan says `featuredImage` is a full URL like:
```
http://localhost:8080/api/images/abc123
```

**Backend must implement `GET /api/images/{imageId}`** and return the raw image bytes with the correct `Content-Type` header (e.g. `image/jpeg`, `image/png`).

> This endpoint is mentioned in the plan but **not listed in the REST API endpoints table** — make sure it is explicitly implemented in `ImageController.java`.

---


## Summary Checklist

- [ ] `featuredImage` is returned as a **flat URL string** (not `{ url: "..." }`)
- [ ] Author `photoUrl` is returned as a **flat string** (not `photo: { url: "..." }`)
- [ ] Comment body field is named **`content`** (not `comment`) in both request and response DTOs
- [ ] `POST /api/comments` returns **HTTP 201** with a `CommentDTO` body
- [ ] `CommentsForm.jsx` success check updated from `res.createComment` to handle `201` status
- [ ] `CommentDTO` includes `id`, `name`, `content`, `createdAt`
- [ ] Adjacent posts response uses **`next`** and **`previous`** as field names
- [ ] `GET /api/images/{imageId}` endpoint is implemented in `ImageController.java`
- [ ] Jackson is **not** configured to use snake_case — all fields stay camelCase

