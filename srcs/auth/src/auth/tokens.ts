import { jwtVerify, type CryptoKey } from 'jose';
import type { Request } from 'express';

export const ACCESS_TOKEN_AUDIENCE = 'transcendence-api';
export const INTERMEDIATE_TOKEN_AUDIENCE = 'transcendence-2fa';
export const COOKIE_NAME_2FA =
  (process.env.NODE_ENV === 'production' ? '__Host-' : '') + 'twofa_pending';

export async function authenticateRequest(
  req: Request,
  publicKey: CryptoKey,
): Promise<string | null> {
	const authHeader = req.headers.authorization;
	if (authHeader === undefined || !authHeader.startsWith('Bearer '))
	{
		return null;
	}
	const accessToken = authHeader.slice('Bearer '.length);

	try
	{
		const { payload } = await jwtVerify(accessToken, publicKey, {
		  algorithms: ['RS256'],
		  audience: ACCESS_TOKEN_AUDIENCE,
		});
		if (typeof payload.sub !== 'string')
		{
			return null;
		}
		return payload.sub;
	}
	catch
	{
		return null;
	}
}

function extractIntermediateToken(req: Request): string | null {
	const authHeader = req.headers.authorization;
	if (authHeader !== undefined && authHeader.startsWith('Bearer '))
	{
		const fromHeader = authHeader.slice('Bearer '.length);
		if (fromHeader.length > 0)
		{
			return fromHeader;
		}
	}
	const fromCookie = req.cookies?.[COOKIE_NAME_2FA];
	if (typeof fromCookie === 'string')
	{
		return fromCookie;
	}
	return null;
}

export async function authenticateIntermediateToken(
  req: Request,
  publicKey: CryptoKey,
): Promise<string | null> {
	const intermediateToken = extractIntermediateToken(req);
	if (intermediateToken === null)
	{
		return null;
	}
	try
	{
		const { payload } = await jwtVerify(intermediateToken, publicKey, {
		  algorithms: ['RS256'],
		  audience: INTERMEDIATE_TOKEN_AUDIENCE,
		});
		if (typeof payload.sub !== 'string')
		{
			return null;
		}
		return payload.sub;
	}
	catch
	{
		return null;
	}
}
