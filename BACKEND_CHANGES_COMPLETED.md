# Backend Changes Completed
## Response to `BACKEND_CHANGES_REQUIRED.md`

> **Date**: April 26, 2026
> **Backend**: Spring Boot 4.0.5 running on `http://localhost:8080`

All requested changes have been implemented. Here is the full status:

---

## ✅ 1. JSON Field Name Mismatches — All Resolved

| Field | Status | Detail |
|---|---|---|
| `featuredImage` | ✅ Done | Returned as a flat URL string in both `PostListDTO` and `PostDetailDTO` |
| `author.photoUrl` | ✅ Done | Returned as a flat string inside the `AuthorDTO` object |
| `comment.content` | ✅ Done | Comment body field is named `content` in `CommentDTO` |
| `post.content` | ✅ Done | Returned as a plain HTML string — not Rich Text JSON |

---

## ✅ 2. `POST /api/comments` — Request Body

`CreateCommentRequest.java` accepts exactly:

```json
{
  "name": "string (required)",
  "email": "valid email (required)",
  "content": "string (required)",
  "slug": "string (required)"
}
```

The field is named `content`, not `comment`. ✅

---

## ✅ 3. `GET /api/posts/{slug}/adjacent` — Response Field Names

Returns exactly:

```json
{
  "next": { ...PostListDTO or null },
  "previous": { ...PostListDTO or null }
}
```

Field names `next` and `previous` are confirmed correct. ✅

---

## ✅ 4. `CommentDTO` Fields

`CommentDTO` response includes all required fields:

```json
{
  "id": "uuid",
  "name": "string",
  "content": "string",
  "createdAt": "2026-04-26T10:00:00"
}
```

Note: `email` is intentionally excluded from the response for privacy. ✅

---

## ✅ 5. `AuthorDTO` includes `photoUrl`

All post list and post detail responses include the author object with `photoUrl` as a flat camelCase string:

```json
{
  "author": {
    "id": "uuid",
    "name": "string",
    "bio": "string",
    "photoUrl": "string or null"
  }
}
```

---

## ✅ 6. Jackson Serialization — camelCase Confirmed

No custom `ObjectMapper` is configured. Spring Boot's default Jackson behavior is used — all fields are serialized in camelCase:

- `featuredImage` ✅
- `photoUrl` ✅
- `createdAt` ✅
- `featuredPost` ✅

---

## ✅ 7. `POST /api/comments` — Returns HTTP 201

`CommentController.java` returns `ResponseEntity.status(HttpStatus.CREATED)` with the `CommentDTO` body.

### ⚠️ Frontend Action Required
`CommentsForm.jsx` must be updated to check for a successful `201` response instead of `res.createComment`. Example:

```javascript
// BEFORE (GraphCMS)
if (res.createComment) {
  setShowSuccessMessage(true);
}

// AFTER (REST)
// axios throws on non-2xx, so just show success after await resolves
try {
  await submitComment(formData);
  setShowSuccessMessage(true);
} catch (err) {
  // handle error
}
```

---

## ✅ 8. `GET /api/images/{imageId}` — Implemented

`ImageController.java` has been created with two endpoints:

### Get Image
```
GET /api/images/{id}
```
Returns raw image bytes with the correct `Content-Type` header (e.g. `image/jpeg`, `image/png`).
Use directly as `<img src="http://localhost:8080/api/images/{id}" />`.

### Upload Image
```
POST /api/images
Content-Type: multipart/form-data
```
Request: `file` field (multipart)

Response `201 Created`:
```json
{ "url": "/api/images/some-uuid" }
```

Store the returned URL in the post's `featured_image_url` column. It will be returned as `featuredImage` in all post responses.

### ⚠️ Frontend Action Required
Run this SQL in pgAdmin to create the `images` table before using this endpoint:

```sql
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(100) NOT NULL,
    data BYTEA NOT NULL
);
```

---

## Summary Checklist

- [x] `featuredImage` is returned as a **flat URL string**
- [x] Author `photoUrl` is returned as a **flat string**
- [x] Comment body field is named **`content`** in both request and response
- [x] `POST /api/comments` returns **HTTP 201** with a `CommentDTO` body
- [x] `CommentDTO` includes `id`, `name`, `content`, `createdAt`
- [x] Adjacent posts response uses **`next`** and **`previous`** as field names
- [x] `GET /api/images/{imageId}` endpoint implemented in `ImageController.java`
- [x] Jackson is **not** configured to use snake_case — all fields stay camelCase
- [ ] ⚠️ **Frontend**: Update `CommentsForm.jsx` to check `201` instead of `res.createComment`
- [ ] ⚠️ **Frontend**: Run `images` table SQL in pgAdmin before using image upload

