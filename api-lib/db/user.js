/**
 * @file api-lib/db/user.js
 * @description Database operations for the User entity.
 * @architecture Database Layer
 */

import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import normalizeEmail from 'validator/lib/normalizeEmail';

/**
 * Finds a user by email and compares the provided password.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} email - The user's email address.
 * @param {string} password - The plaintext password to check.
 * @returns {Promise<Object|null>} The user document without the password field, or null.
 */
export async function findUserWithEmailAndPassword(db, email, password) {
  email = normalizeEmail(email);
  const user = await db.collection('users').findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    return { ...user, password: undefined }; // filtered out password
  }
  return null;
}

/**
 * Finds a user by ID for authentication purposes, excluding the password.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Object|null>} The user document without the password field, or null.
 */
export async function findUserForAuth(db, userId) {
  return db
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } })
    .then((user) => user || null);
}

/**
 * Finds a user by ID and applies the standard user projection.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Object|null>} The user document, or null.
 */
export async function findUserById(db, userId) {
  return db
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: dbProjectionUsers() })
    .then((user) => user || null);
}

/**
 * Finds a user by username and applies the standard user projection.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} username - The user's username.
 * @returns {Promise<Object|null>} The user document, or null.
 */
export async function findUserByUsername(db, username) {
  return db
    .collection('users')
    .findOne({ username }, { projection: dbProjectionUsers() })
    .then((user) => user || null);
}

/**
 * Finds a user by email and applies the standard user projection.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} email - The user's email address.
 * @returns {Promise<Object|null>} The user document, or null.
 */
export async function findUserByEmail(db, email) {
  email = normalizeEmail(email);
  return db
    .collection('users')
    .findOne({ email }, { projection: dbProjectionUsers() })
    .then((user) => user || null);
}

/**
 * Updates a user's details by ID.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} id - The user's ID.
 * @param {Object} data - The data to update.
 * @returns {Promise<Object>} The updated user document.
 */
export async function updateUserById(db, id, data) {
  return db
    .collection('users')
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: 'after', projection: { password: 0 } }
    )
    .then(({ value }) => value);
}

/**
 * Inserts a new user into the database.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {Object} payload - The user details.
 * @param {string} payload.email - The user's email.
 * @param {string} payload.originalPassword - The user's plaintext password.
 * @param {string} [payload.bio=''] - The user's bio.
 * @param {string} payload.name - The user's name.
 * @param {string} [payload.profilePicture] - The user's profile picture URL.
 * @param {string} payload.username - The user's username.
 * @param {string} [payload.role='citizen'] - The user's RBAC role.
 * @returns {Promise<Object>} The inserted user document.
 */
export async function insertUser(
  db,
  { email, originalPassword, bio = '', name, profilePicture, username, role = 'citizen' }
) {
  const user = {
    emailVerified: false,
    profilePicture,
    email,
    name,
    username,
    bio,
    role,
  };
  const password = await bcrypt.hash(originalPassword, 10);
  const { insertedId } = await db
    .collection('users')
    .insertOne({ ...user, password });
  user._id = insertedId;
  return user;
}

/**
 * Updates a user's password if the old password matches.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} id - The user's ID.
 * @param {string} oldPassword - The old plaintext password.
 * @param {string} newPassword - The new plaintext password.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function updateUserPasswordByOldPassword(
  db,
  id,
  oldPassword,
  newPassword
) {
  const user = await db.collection('users').findOne(new ObjectId(id));
  if (!user) return false;
  const matched = await bcrypt.compare(oldPassword, user.password);
  if (!matched) return false;
  const password = await bcrypt.hash(newPassword, 10);
  await db
    .collection('users')
    .updateOne({ _id: new ObjectId(id) }, { $set: { password } });
  return true;
}

/**
 * Updates a user's password without checking the old password.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} id - The user's ID.
 * @param {string} newPassword - The new plaintext password.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function UNSAFE_updateUserPassword(db, id, newPassword) {
  const password = await bcrypt.hash(newPassword, 10);
  const result = await db
    .collection('users')
    .updateOne({ _id: new ObjectId(id) }, { $set: { password } });
  return result.modifiedCount === 1;
}

/**
 * Returns the standard projection for user documents.
 * @param {string} [prefix=''] - An optional prefix for the fields.
 * @returns {Object} The MongoDB projection object.
 */
export function dbProjectionUsers(prefix = '') {
  // Note: Since this is an exclusion projection, `role` is exposed by default.
  return {
    [`${prefix}password`]: 0,
    [`${prefix}email`]: 0,
    [`${prefix}emailVerified`]: 0,
  };
}

/**
 * Deletes a user by ID, along with their associated tokens, comments, and posts.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 * @param {string} id - The user's ID.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function deleteUserById(db, id) {
  const userId = new ObjectId(id);
  // Cascade delete all tokens, posts, and comments created by this user
  await db.collection('tokens').deleteMany({ creatorId: userId });
  await db.collection('comments').deleteMany({ creatorId: userId });
  await db.collection('posts').deleteMany({ creatorId: userId });
  // Delete the user
  const result = await db.collection('users').deleteOne({ _id: userId });
  return result.deletedCount === 1;
}

/**
 * Dummy function for JSDoc scanner.
 */
function dummyJSDoc() {}
