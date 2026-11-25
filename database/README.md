# Database

The schema is shared by every backend, and owned by this folder rather than by any backend.

- `migrations/` holds the versioned Flyway migrations (`V<n>__<description>.sql`).
  Never edit a migration that has already been applied anywhere: add a new one.
- `seed/` holds repeatable demo data (`R__<description>.sql`) for local development only.
  Tests and production don't use it.

Docker Compose runs both through the `flyway` service when the stack starts.

## Password hashes

`app_user.password_hash` must be readable and writable by every backend,
so that users can log in whichever backend is running:

- **Algorithm:** bcrypt, cost factor 10.
- **Format:** the standard 60-character string, e.g. `$2a$10$…`, with no prefix
  (not Spring Security's `{bcrypt}`).
- **Versions:** write `$2a$` or `$2b$` hashes; accept `$2a$`, `$2b$` and `$2y$` when verifying.
- **Length:** reject passwords longer than 72 bytes in UTF-8 with a 422 before hashing,
  because bcrypt silently ignores everything after the 72nd byte.