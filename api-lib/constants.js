/**
 * @file api-lib/constants.js
 * @description Centralized validation properties for API endpoints.
 * @architecture Validation Layer
 */

/**
 * Validation properties for various entities.
 * @type {Object}
 */
export const ValidateProps = {
  user: {
    username: { type: 'string', minLength: 4, maxLength: 20 },
    name: { type: 'string', minLength: 1, maxLength: 50 },
    password: { type: 'string', minLength: 8 },
    email: { type: 'string', minLength: 1 },
    bio: { type: 'string', minLength: 0, maxLength: 160 },
    role: { type: 'string', minLength: 1, maxLength: 50 },
  },
  post: {
    content: { type: 'string', minLength: 1, maxLength: 280 },
  },
  comment: {
    content: { type: 'string', minLength: 1, maxLength: 280 },
  },
};

/**
 * Dummy function for JSDoc scanner.
 */
function dummyJSDoc() {}
