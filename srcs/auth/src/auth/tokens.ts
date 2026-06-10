import { jwtVerify, type CryptoKey } from 'jose';
import type { Request } from 'express';

export const ACCESS_TOKEN_AUDIENCE = 'transcendence-api';
export const INTERMEDIATE_TOKEN_AUDIENCE = 'transcendence-2fa';

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

export async function authenticateIntermediateToken(
  req: Request,
  publicKey: CryptoKey,
): Promise<string | null> {
	const authHeader = req.headers.authorization;
	if (authHeader === undefined || !authHeader.startsWith('Bearer '))
	{
		return null;
	}
	const intermediateToken = authHeader.slice('Bearer '.length);

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
