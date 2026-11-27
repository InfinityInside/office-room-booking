# Authentication

Every backend issues and accepts the same tokens, so a logged-in user stays logged in
when the running backend is switched.

## Access tokens

- **Format:** JWT, signed with **HS256** (HMAC-SHA256).
- **Key:** the Base64-decoded value of the `JWT_SECRET` environment variable
  (at least 32 bytes), shared by all backends.
- **Claims:**
  - `iss`: always `office-room-booking`; tokens with any other issuer are rejected
  - `sub`: the user's id, as a string
  - `iat`, `exp`: issued-at and expiry times, in seconds since the Unix epoch
- **Lifetime:** 1 hour by default; `expiresIn` in the login response says exactly how long.
- **Validation:** signature (HS256 only), `iss`, and `exp`/`nbf` with up to 60 seconds of clock skew.

The token only identifies the user. On every request the backend loads the user
from the database, so deactivating a user or changing their grants takes effect immediately.

## Authorization

- Authorities are the codes of the user's **active** grants.
- Every endpoint under `/admin` requires the `ADMIN` grant; other rules are described per endpoint in the contract.
- A token whose user no longer exists or is deactivated is rejected with 401.

## Passwords

See [database/README.md](../database/README.md#password-hashes).