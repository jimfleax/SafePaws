/**
 * @file index.js
 * @description API route to handle operations for a specific post by ID.
 * @architecture Next.js API Route (next-connect)
 */

import { findPostById, deletePostById } from '@/api-lib/db';
import { auths } from '@/api-lib/middlewares';
import { getMongoDb } from '@/api-lib/mongodb';
import { ncOpts } from '@/api-lib/nc';
import nc from 'next-connect';

const handler = nc(ncOpts);

handler.use(...auths);

handler.delete(async (req, res) => {
  if (!req.user) {
    return res.status(401).end();
  }

  const db = await getMongoDb();

  if (!/^[0-9a-fA-F]{24}$/.test(req.query.postId)) {
    return res.status(404).json({ error: { message: 'Post is not found.' } });
  }

  const post = await findPostById(db, req.query.postId);

  if (!post) {
    return res.status(404).json({ error: { message: 'Post is not found.' } });
  }

  // Ensure the user deleting the post is the creator
  if (post.creatorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      error: { message: 'You do not have permission to delete this post.' },
    });
  }

  await deletePostById(db, req.query.postId);

  res.status(204).end();
});

/**
 * @function handler
 * @description Default API route handler
 */
export default handler;
