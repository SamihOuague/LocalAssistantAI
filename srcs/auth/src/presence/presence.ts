// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   presence.ts                                        :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: lsouc <lsouc@student.42paris.fr>           +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2026/06/08 23:59:16 by lsouc             #+#    #+#             //
//   Updated: 2026/06/08 23:59:19 by lsouc            ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export const PRESENCE_WINDOW_MS = 90_000;

export function derivePresence(isOnline: boolean, lastSeenAt: Date | null): boolean {
	if (!isOnline)
	{
		return false;
	}
	if (lastSeenAt === null)
	{
		return false;
	}
	return Date.now() - lastSeenAt.getTime() < PRESENCE_WINDOW_MS;
}
