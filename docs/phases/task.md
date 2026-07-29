# Phase 1 Tasks

- [ ] Update `api-lib/constants.js`
  - [ ] Add `role: { type: 'string', minLength: 1, maxLength: 50 }` to `ValidateProps.user`.
- [ ] Update `api-lib/db/user.js`
  - [ ] Update `insertUser` parameters to include `role = 'citizen'`.
  - [ ] Ensure `role` is added to the `user` object in `insertUser`.
  - [ ] Add comment to `dbProjectionUsers` clarifying that `role` is implicitly exposed via exclusion projection.
