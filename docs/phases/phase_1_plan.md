# Phase 1: Role-Based Access Control (RBAC) Foundation

## Context
- The codebase uses a native MongoDB driver with a repository pattern located in `api-lib/db/user.js`.
- User validation rules are centralized in `api-lib/constants.js` under `ValidateProps.user`.
- `dbProjectionUsers()` provides an exclusion projection (e.g., `{ password: 0, email: 0 }`), meaning any new fields (like `role`) will be implicitly exposed when a user document is returned from the database.

## Dependency Map
- `pages/api/users/index.js` → imports `insertUser` from `api-lib/db/user.js` and `ValidateProps` from `api-lib/constants.js`.
- `api-lib/db/post.js` & `api-lib/db/comment.js` → imports `dbProjectionUsers` from `api-lib/db/user.js`.
- `pages/api/user/index.js` → imports `ValidateProps` for updating user profile.

## Proposed Changes

### Database Layer

#### [MODIFY] [api-lib/db/user.js](file:///home/jimfleax/Documents/antigravity/SafePaws/api-lib/db/user.js)
- **What**: Update `insertUser` to accept `role` with a default value of `'citizen'` and add it to the inserted user object. Add a comment to `dbProjectionUsers()` clarifying that `role` is exposed by default since it uses an exclusion projection.
- **Why**: Establishes the base RBAC field for all new users.
- **Impact**: All new users will be assigned the `'citizen'` role upon registration.

### Validation Configuration

#### [MODIFY] [api-lib/constants.js](file:///home/jimfleax/Documents/antigravity/SafePaws/api-lib/constants.js)
- **What**: Add `role` validation constraints to `ValidateProps.user` (e.g., `role: { type: 'string', minLength: 1, maxLength: 50 }`).
- **Why**: Allows the `ajv` middleware to recognize and validate the `role` field across endpoints if required.
- **Impact**: Any API endpoint validating against `ValidateProps.user` will now allow `role`.

## DRY Reuse Opportunities
- Utilize the existing `ValidateProps` object instead of creating an independent validation schema.

## Risks & Edge Cases
- **Security**: By adding `role` to `ValidateProps.user`, `req.body.role` might be validated and passed down to `insertUser` by the `POST /api/users` registration endpoint. We need to ensure that `insertUser` forces the role to `'citizen'` for standard sign-ups, or that the route explicitly filters it out, to prevent privilege escalation during registration.
