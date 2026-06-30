import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import type { CryptoKey } from 'jose';
import { authenticateRequest } from '../auth/tokens.js';
import { canonicalPair } from '../friends/canonical.js';
import { derivePresence } from '../presence/presence.js';
import { acceptedFriendsWhere } from '../friends/queries.js';

interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

function parsePagination(req: Request): { take: number; skip: number } {
	let take = 20;
	let skip = 0;
	const limitRaw = req.query.limit;
	const offsetRaw = req.query.offset;
	if (typeof limitRaw === 'string')
	{
		const n = Number.parseInt(limitRaw, 10);
		if (Number.isFinite(n) && n > 0)
		{
			take = Math.min(n, 100);
		}
	}
	if (typeof offsetRaw === 'string')
	{
		const n = Number.parseInt(offsetRaw, 10);
		if (Number.isFinite(n) && n >= 0)
		{
			skip = n;
		}
	}
	return { take, skip };
}

async function listFriendships(
  prisma: PrismaClient,
  userId: string,
  where: Prisma.FriendshipWhereInput,
  take: number,
  skip: number,
): Promise<{ items: PublicUser[]; hasMore: boolean }> {
	const rows = await prisma.friendship.findMany({
	  where,
	  orderBy: { createdAt: 'desc' },
	  skip,
	  take: take + 1,
	  select: {
	    userLow: true,
	    userHigh: true,
	    userLowUser: { select: { id: true, username: true, avatarUrl: true, isOnline: true, lastSeenAt: true } },
	    userHighUser: { select: { id: true, username: true, avatarUrl: true, isOnline: true, lastSeenAt: true } },
	  },
	});
	const hasMore = rows.length > take;
	const page = hasMore ? rows.slice(0, take) : rows;
	const items = page.map((row) =>
	{
		const u = row.userLow === userId ? row.userHighUser : row.userLowUser;
		return {
		  id: u.id,
		  username: u.username,
		  avatarUrl: u.avatarUrl,
		  isOnline: derivePresence(u.isOnline, u.lastSeenAt),
		};
	});
	return { items, hasMore };
}

const sendRequestSchema = z.object({
  userId: z.string().uuid(),
});

export function createFriendsRouter(
  prisma: PrismaClient,
  publicKey: CryptoKey,
): Router {
	const router = Router();

	router.post('/requests', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const parsed = sendRequestSchema.safeParse(req.body);
		if (!parsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}
		const targetId = parsed.data.userId;

		if (targetId === userId)
		{
			return res.status(400).json({ error: 'cannot friend yourself' });
		}

		const target = await prisma.user.findUnique({ where: { id: targetId } });
		if (target === null)
		{
			return res.status(404).json({ error: 'user not found' });
		}

		const { userLow, userHigh } = canonicalPair(userId, targetId);

		const existing = await prisma.friendship.findUnique({
		  where: { userLow_userHigh: { userLow, userHigh } },
		});

		if (existing !== null)
		{
			if (existing.status === 'ACCEPTED')
			{
				return res.status(409).json({ error: 'already friends' });
			}
			if (existing.requestedById === userId)
			{
				return res.status(409).json({ error: 'request already sent' });
			}
			return res.status(409).json({ error: 'this user already sent you a request' });
		}

		try
		{
			await prisma.friendship.create({
			  data: { userLow, userHigh, requestedById: userId },
			});
			return res.status(201).json({ status: 'PENDING' });
		}
		catch (err)
		{
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
			{
				return res.status(409).json({ error: 'friend request already exists' });
			}
			throw err;
		}
	});
	router.post('/requests/:userId/accept', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const otherId = req.params.userId;
		if (typeof otherId !== 'string')
		{
			return res.status(400).json({ error: 'invalid request' });
		}
		if (otherId === userId)
		{
			return res.status(400).json({ error: 'invalid request' });
		}

		const { userLow, userHigh } = canonicalPair(userId, otherId);

		const existing = await prisma.friendship.findUnique({
		  where: { userLow_userHigh: { userLow, userHigh } },
		});

		if (existing === null)
		{
			return res.status(404).json({ error: 'no such request' });
		}
		if (existing.status === 'ACCEPTED')
		{
			return res.status(409).json({ error: 'already friends' });
		}
		if (existing.requestedById === userId)
		{
			return res.status(403).json({ error: 'cannot accept your own request' });
		}

		await prisma.friendship.updateMany({
		  where: { userLow, userHigh, status: 'PENDING' },
		  data: { status: 'ACCEPTED' },
		});

		return res.status(200).json({ status: 'ACCEPTED' });
	});
	router.delete('/:userId', async (req: Request, res: Response) => {
    		const userId = await authenticateRequest(req, publicKey);
    		if (userId === null)
    		{
    			return res.status(401).json({ error: 'invalid token' });
    		}

    		const otherId = req.params.userId;
    		if (typeof otherId !== 'string')
    		{
        		return res.status(400).json({ error: 'invalid request' });
    		}

    		const { userLow, userHigh } = canonicalPair(userId, otherId);

    		const result = await prisma.friendship.deleteMany({
    		  where: { userLow, userHigh },
    		});

    		if (result.count === 0)
    		{
        		return res.status(404).json({ error: 'no such friendship' });
    		}

    		return res.status(204).send();
	});
	router.get('/', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		const { take, skip } = parsePagination(req);
		const { items, hasMore } = await listFriendships(prisma, userId, acceptedFriendsWhere(userId), take, skip);
		return res.status(200).json({
		  data: items,
		  pagination: { limit: take, offset: skip, hasMore },
		});
	});
	router.get('/requests/incoming', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		const { take, skip } = parsePagination(req);
		const { items, hasMore } = await listFriendships(prisma, userId, {
		  status: 'PENDING',
		  requestedById: { not: userId },
		  OR: [{ userLow: userId }, { userHigh: userId }],
		}, take, skip);
		return res.status(200).json({
		  data: items,
		  pagination: { limit: take, offset: skip, hasMore },
		});
	});
	router.get('/requests/outgoing', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		const { take, skip } = parsePagination(req);
		const { items, hasMore } = await listFriendships(prisma, userId, {
		  status: 'PENDING',
		  requestedById: userId,
		}, take, skip);
		return res.status(200).json({
		  data: items,
		  pagination: { limit: take, offset: skip, hasMore },
		});
	});
	return router;
}
