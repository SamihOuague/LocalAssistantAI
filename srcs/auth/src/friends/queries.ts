import type { Prisma } from '../generated/prisma/client.js';

export function acceptedFriendsWhere(userId: string): Prisma.FriendshipWhereInput {
	return {
	  status: 'ACCEPTED',
	  OR: [{ userLow: userId }, { userHigh: userId }],
	};
}
