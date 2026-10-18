# Authentication and Express

## Decision

Auth.js (`next-auth` 5.0.0-beta.32) runs inside the Next.js app. The stable `next-auth` 4 line does not declare a Next.js 16 peer dependency. v5 is still tagged beta; it is the Auth.js release that peers Next.js 14–16 and `@auth/core` 0.41.3. The Prisma adapter version is `@auth/prisma-adapter` 2.11.3.

The session strategy is JWT. The session cookie is HttpOnly and is set by Next.js for the web origin. Express is a different origin in local development (`localhost:4000` vs `localhost:3000`) and must not be given the Auth.js cookie to decrypt. Sharing the cookie would require a parent domain, `SameSite=None`, and a compatible decryption implementation. That is not the M01 mechanism.

## Browser flow

1. The person registers through the Next.js server action or `POST /api/v1/auth/register`. The password is hashed with scrypt before it is stored. The request schema is strict, so a caller cannot submit `platformRole`.
2. The person signs in with the Auth.js Credentials provider. Auth.js stores the user id in the JWT session cookie.
3. `GET /api/session/access-token` on the Next.js origin calls `auth()`, then signs a short-lived JWT with `jose` and `AUTH_SECRET`.
4. The browser calls Express with `Authorization: Bearer <token>`.
5. Express verifies issuer `aeo-web`, audience `aeo-api`, HMAC-SHA256, and expiry (10 minutes).
6. Express loads the user and organization membership from Postgres. Permissions come from `packages/shared/src/permissions.ts`.

The access token carries `sub`, `email`, and `name`. It does not carry an organization id, a role, or a permission list. A token cannot be reused as proof of access to a tenant.

API clients and tests may call `POST /api/v1/auth/login` and receive the same bearer token. That route checks the password against the same store. It is not a second user database.

## Authorization

`authorizeTenantAction` receives the membership row loaded by the server. A client-supplied organization id is only the resource being requested.

- No membership, and the caller is not a platform admin: the API responds `404` with a generic message. The body does not include the other tenant's name.
- Membership without the required permission: `403`.
- `CLIENT_VIEWER` resource reads require a workspace id that appears in `workspace_memberships`.
- Agency roles (`OWNER`, `ADMIN`, `MEMBER`) can see every workspace in their organization in M01. That is an explicit rule, not an oversight. Narrower agency assignments can be added later without changing the viewer rule.
- `PLATFORM_ADMIN` is a column on `users`, not an organization role. Platform admins can pass the permission check, and the handler still returns `404` when the organization row does not exist.

## Session cookie settings

Auth.js defaults apply: HttpOnly session cookie, `SameSite=Lax`, 12-hour max age configured in `apps/web/src/auth.ts`. Production must set `AUTH_SECRET` to at least 32 characters. `TRUST_PROXY=1` is off unless the API sits behind a trusted load balancer.

## What is not in M01

- OAuth provider buttons. The Account table and Prisma adapter are present so a provider can be added without a new identity model.
- Email magic links and verification sending.
- Password reset.
- A distributed rate limiter. Body size limits and Helmet are in place. Login throttling belongs to a later milestone.
- Revocation of individual access tokens before expiry. Tokens are short lived. Session revocation can be added by storing `jti` denylist entries or by switching the API to introspection.
