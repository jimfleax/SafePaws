/**
 * @file index.js
 * @description API route to handle operations for a specific comment by ID.
 * @architecture Next.js API Route (next-connect)
 */

import { findCommentById, deleteCommentById } from '@/api-lib/db/comment';
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

  if (!/^[0-9a-fA-F]{24}$/.test(req.query.commentId)) {
    return res
      .status(404)
      .json({ error: { message: 'Comment is not found.' } });
  }

  const comment = await findCommentById(db, req.query.commentId);

  if (!comment) {
    return res
      .status(404)
      .json({ error: { message: 'Comment is not found.' } });
  }

  // Ensure the user deleting the comment is the creator
  if (comment.creatorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      error: {
        message: 'You do not have permission to delete this comment.',
      },
    });
  }

  await deleteCommentById(db, req.query.commentId);

  res.status(204).end();
});

/**
 * @function handler
 * @description Default API route handler
 */
export default handler;
