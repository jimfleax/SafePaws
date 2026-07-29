/**
 * @file index.js
 * @description API route to handle fetching and creating comments for a specific post.
 * @architecture Next.js API Route (next-connect)
 */

import { ValidateProps } from '@/api-lib/constants';
import { findPostById } from '@/api-lib/db';
import { findComments, insertComment } from '@/api-lib/db/comment';
import { auths, validateBody } from '@/api-lib/middlewares';
import { getMongoDb } from '@/api-lib/mongodb';
import { ncOpts } from '@/api-lib/nc';
import nc from 'next-connect';

const handler = nc(ncOpts);

handler.get(async (req, res) => {
  const db = await getMongoDb();

  if (!/^[0-9a-fA-F]{24}$/.test(req.query.postId)) {
    return res.status(404).json({ error: { message: 'Post is not found.' } });
  }

  const post = await findPostById(db, req.query.postId);

  if (!post) {
    return res.status(404).json({ error: { message: 'Post is not found.' } });
  }

  const comments = await findComments(
    db,
    req.query.postId,
    req.query.before ? new Date(req.query.before) : undefined,
    req.query.limit ? parseInt(req.query.limit, 10) : undefined
  );

  return res.json({ comments });
});

handler.post(
  ...auths,
  validateBody({
    type: 'object',
    properties: {
      content: ValidateProps.comment.content,
    },
    required: ['content'],
    additionalProperties: false,
  }),
  async (req, res) => {
    if (!req.user) {
      return res.status(401).end();
    }

    const db = await getMongoDb();

    if (!/^[0-9a-fA-F]{24}$/.test(req.query.postId)) {
      return res.status(404).json({ error: { message: 'Post is not found.' } });
    }

    const content = req.body.content;

    const post = await findPostById(db, req.query.postId);

    if (!post) {
      return res.status(404).json({ error: { message: 'Post is not found.' } });
    }

    const comment = await insertComment(db, post._id, {
      creatorId: req.user._id,
      content,
    });

    return res.json({ comment });
  }
);

/**
 * @function handler
 * @description Default API route handler
 */
export default handler;
