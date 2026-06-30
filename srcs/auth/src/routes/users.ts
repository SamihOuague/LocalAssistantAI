import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { CryptoKey } from 'jose';
import { authenticateRequest } from '../auth/tokens.js';

const searchQuerySchema = z.object({
  q: z.string().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export function createUsersRouter(
  prisma: PrismaClient,
  publicKey: CryptoKey,
): Router {
	const router = Router();

	router.get('/search', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const parsed = searchQuerySchema.safeParse(req.query);
		if (!parsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}
		const { q, limit } = parsed.data;

		const prefix = q.replace(/_/g, '\\_');

		const users = await prisma.user.findMany({
		  where: {
		    username: { startsWith: prefix },
		    id: { not: userId },
		  },
		  select: {
		    id: true,
		    username: true,
		    avatarUrl: true,
		  },
		  orderBy: { username: 'asc' },
		  take: limit,
		});
		return res.status(200).json({
		  data: users,
		  pagination: { limit, offset: 0, hasMore: users.length === limit },
		});
	});

	return router;
}
