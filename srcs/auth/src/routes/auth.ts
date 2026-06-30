import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SignJWT, type CryptoKey } from 'jose';
import { verifyPassword } from '../auth/password.js';
import type { Encryptor } from '../auth/encryption.js';
import { derivePresence } from '../presence/presence.js';
import * as OTPAuth from 'otpauth';
import { generateScratchCodes, normalizeScratchCode } from '../auth/scratch.js';
import {
  authenticateRequest,
  authenticateIntermediateToken,
  ACCESS_TOKEN_AUDIENCE,
  INTERMEDIATE_TOKEN_AUDIENCE,
  COOKIE_NAME_2FA,
} from '../auth/tokens.js';
import { acceptedFriendsWhere } from '../friends/queries.js';
import { detectImageMime } from '../auth/imageType.js';
import multer, { MulterError } from 'multer';

const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$ieXIovdukovEeGRKwvjIpQ$uSyvnWZF1zokmIt7DDWaJa2ifBxibtV+AbUOo29lJiA';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RETRY_GRACE_MS = 10_000;
const ABSOLUTE_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const INVALID_REFRESH = { error: 'invalid or expired refresh token' };

const OAUTH_42_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize';
const OAUTH_STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
const COOKIE_NAME_OAUTH_42_STATE = `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}oauth_42_state`;
const COOKIE_NAME_REFRESH = `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}refresh_token`;
const OAUTH_42_TOKEN_URL = 'https://api.intra.42.fr/oauth/token';
const OAUTH_42_ME_URL = 'https://api.intra.42.fr/v2/me';

const TOTP_ISSUER = 'ft_transcendence';

const INTERMEDIATE_TOKEN_TTL = '5m';
const INTERMEDIATE_COOKIE_MAX_AGE_MS = 5 * 60 * 1000;

const TOTP_MAX_FAILURES = 5;
const TOTP_BLOCK_DURATION_MS = 15 * 60 * 1000;

const AVATAR_MAX_BYTES = 1 * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
}).single('avatar');

class ConflictError extends Error {}

type RefreshOutcome =
  | { kind: 'reject' }
  | { kind: 'rotated'; userId: string; newRawToken: string };

type OAuthConfig = {
	cookieSecret: string;
	frontendUrl: string;
	providers: {
		fortyTwo: {
			clientId: string;
			clientSecret: string;
			redirectUri: string;
		};
	};
};

function hashToken(raw: string): string {
	return createHash('sha256').update(raw).digest('hex');
}

function generateRefreshToken(): { rawToken: string; tokenHash: string } {
	const rawToken = randomBytes(32).toString('base64url');
	return { rawToken, tokenHash: hashToken(rawToken) };
}

function isAllowedOrigin(req: Request, allowed: Set<string>): boolean {
	const origin = req.get('origin');
	if (origin === undefined)
	{
		return true;
	}
	return allowed.has(origin);
}

function setRefreshCookie(res: Response, rawToken: string): void {
	res.cookie(COOKIE_NAME_REFRESH, rawToken, {
	  httpOnly: true,
	  sameSite: 'none',
	  path: '/',
	  maxAge: REFRESH_TOKEN_TTL_MS,
	  secure: process.env.NODE_ENV === 'production',
	  signed: false,
	});
}

function clearRefreshCookie(res: Response): void {
	res.clearCookie(COOKIE_NAME_REFRESH, {
	  httpOnly: true,
	  sameSite: 'none',
	  path: '/',
	  secure: process.env.NODE_ENV === 'production',
	});
}

function oauthErrorRedirect(res: Response, frontendUrl: string, code: string): void {
	res.redirect(302, `${frontendUrl}/login?error=${code}`);
}

async function signAccessToken(userId: string, key: CryptoKey): Promise<string> {
	return new SignJWT({})
	  .setProtectedHeader({ alg: 'RS256' })
    	  .setSubject(userId)
	  .setAudience(ACCESS_TOKEN_AUDIENCE)
    	  .setIssuedAt()
    	  .setExpirationTime(ACCESS_TOKEN_TTL)
    	  .sign(key);
}

async function signIntermediateToken(userId: string, key: CryptoKey): Promise<string> {
	return new SignJWT({})
	  .setProtectedHeader({ alg: 'RS256' })
    	  .setSubject(userId)
    	  .setAudience(INTERMEDIATE_TOKEN_AUDIENCE)
    	  .setIssuedAt()
    	  .setExpirationTime(INTERMEDIATE_TOKEN_TTL)
    	  .sign(key);
}

async function issuePostAuthResponse(
	user: { id: string; totpEnabled: boolean },
	prisma: PrismaClient,
	privateKey: CryptoKey,
): Promise <
	| { requires2fa: true; intermediateToken: string }
	| { accessToken: string; refreshToken: string }
> {
	if (user.totpEnabled)
	{
		const intermediateToken = await signIntermediateToken(user.id, privateKey);
		return { requires2fa: true, intermediateToken };
	}

	const accessToken = await signAccessToken(user.id, privateKey);
	const { rawToken, tokenHash } = generateRefreshToken();
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

	await prisma.$transaction([
		prisma.refreshToken.create({
			data: {
			  userId: user.id,
			  tokenHash,
			  familyId: randomUUID(),
			  expiresAt,
			},
		}),
		prisma.user.update({
		  where: { id: user.id },
		  data: { isOnline: true, lastSeenAt: new Date() },
		}),
	]);

	return { accessToken, refreshToken: rawToken };
}

type FailureRecord = { count: number; blockedUntil: number };
const totpFailures = new Map<string, FailureRecord>();

function isBlocked(userId: string): boolean {
	const record = totpFailures.get(userId);
	if (record === undefined)
	{
		return false;
	}
	return record.blockedUntil > Date.now();
}

function recordFailure(userId: string): void {
	const existing = totpFailures.get(userId);
	const count = (existing?.count ?? 0) + 1;
	const blockedUntil = count >= TOTP_MAX_FAILURES
		? Date.now() + TOTP_BLOCK_DURATION_MS
		: 0;
	totpFailures.set(userId, { count, blockedUntil });
}

function clearFailures(userId: string): void {
	totpFailures.delete(userId);
}

const registerSchema = z.object({
  email: z.email().max(255),
  username: z.string().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/),
  password: z.string().min(8).max(128),
});

const updateMeSchema = z.object({
  username: registerSchema.shape.username,
});

const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
});

const callbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1),
  error: z.string().min(1).optional(),
  error_description: z.string().optional(),
});

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

const meResponseSchema = z.object({
  id: z.number(),
  email: z.email(),
  login: z.string().min(1),
});

const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

const scratchCodeSchema = z.object({
  code: z.string().min(8).max(64),
});

export function createAuthRouter(
  prisma: PrismaClient,
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  oauth: OAuthConfig,
  encryptor: Encryptor,
  allowedOrigins: Set<string>,
): Router {
	const router = Router();

	router.post('/register', async (req: Request, res: Response) => {
		const parsed = registerSchema.safeParse(req.body);
		if (!parsed.success)
		{
			return res.status(400).json({error: 'invalid input' });
		}
		const { email, username, password } = parsed.data;

		const passwordHash = await hashPassword(password);

		try {
			const user = await prisma.user.create({
			  data: {email, username, passwordHash },
			  omit: { passwordHash: true,
    			  totpSecretEncrypted: true,
    			  lastTotpStepConsumed: true,
  		  	},
		});
		return res.status(201).json(user);
		} catch(err) { 
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
			{
				return res.status(409).json({error: 'email or username already in use' });
			}
			throw err;
		}
	});
	router.post('/login', async (req: Request, res: Response) => {
		const parsed = loginSchema.safeParse(req.body)
		if (!parsed.success)
		{
			return res.status(400).json( {error: 'invalid input' });
		}
		const { email, password } = parsed.data;

		const user = await prisma.user.findUnique({ where: { email } });

		const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
		const passwordValid = await verifyPassword(hashToCheck, password);

		if (!user || !user.passwordHash || !passwordValid)
		{
			return res.status(401).json({ error: 'invalid credentials' });
		}

		const result = await issuePostAuthResponse(user, prisma, privateKey);
		if ('requires2fa' in result)
		{
			return res.status(200).json(result);
		}
		setRefreshCookie(res, result.refreshToken);
		return res.status(200).json({ accessToken: result.accessToken });
	});
	router.post('/refresh', async (req, res) => {
		if (!isAllowedOrigin(req, allowedOrigins))
		{
			return res.status(403).json({ error: 'forbidden origin' });
		}
		const presentedToken = req.cookies[COOKIE_NAME_REFRESH];
		if (typeof presentedToken !== 'string' || presentedToken.length === 0)
		{
			return res.status(401).json(INVALID_REFRESH);
		}
		const presentedHash = hashToken(presentedToken);
		const now = new Date();

		let outcome: RefreshOutcome;
		try {
			outcome = await prisma.$transaction(async (tx) => {
				const revokeFamily = (familyId: string) =>
					tx.refreshToken.updateMany({
					  where: { familyId, revokedAt: null },
					  data: { revokedAt: now },
					});

				const token = await tx.refreshToken.findUnique({
				  where: { tokenHash: presentedHash },
				});

				if (token === null) return { kind: 'reject' } as const;
      				if (token.expiresAt <= now) return { kind: 'reject' } as const;
      				if (token.revokedAt !== null) return { kind: 'reject' } as const;

				const birth = await tx.refreshToken.aggregate({
     				  where: { familyId: token.familyId },
      				  _min: { createdAt: true },
      				});
      				const bornAt = birth._min.createdAt;
      				if (bornAt !== null &&
          				now.getTime() - bornAt.getTime() > ABSOLUTE_SESSION_TTL_MS)
				{
        				await revokeFamily(token.familyId);
        				return { kind: 'reject' } as const;
      				}
				let tip = token;
      				if (token.replacedById !== null)
				{
					const successor = await tx.refreshToken.findUnique({
        				  where: { id: token.replacedById },
        				});

					if (successor === null
					    || successor.revokedAt !== null
					    || successor.replacedById !== null
					    || now.getTime() - successor.createdAt.getTime() > RETRY_GRACE_MS)
					{
        					await revokeFamily(token.familyId);
        					return { kind: 'reject' } as const;
					}
					tip = successor;
				}

				const { rawToken, tokenHash } = generateRefreshToken();

				const created = await tx.refreshToken.create({
        			  data: {
        			    userId: tip.userId,
        			    familyId: tip.familyId,
        			    tokenHash,
        			    expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        			  },
      				});

				const superseded = await tx.refreshToken.updateMany({
      				  where: { id: tip.id, replacedById: null },
      				  data: { replacedById: created.id },
      				});
      				if (superseded.count === 0)
				{
      					throw new ConflictError();
      				}
				return { kind: 'rotated', userId: tip.userId, newRawToken: rawToken } as const;
    			});
		}
		catch (err)
		{
			if (err instanceof ConflictError)
			{
				return res.status(409).json({ error: 'concurrent refresh, please retry' });
			}
			throw err;
		}

		if (outcome.kind === 'reject')
		{
   			 return res.status(401).json(INVALID_REFRESH);
  		}

		const accessToken = await signAccessToken(outcome.userId, privateKey);
		setRefreshCookie(res, outcome.newRawToken);
		return res.status(200).json({ accessToken });
	});
	router.post('/logout', async (req: Request, res: Response) => {
		const presentedToken = req.cookies[COOKIE_NAME_REFRESH];
		if (typeof presentedToken === 'string' && presentedToken.length > 0)
		{
			const presentedHash = hashToken(presentedToken);
			const token = await prisma.refreshToken.findUnique({
			  where: { tokenHash: presentedHash },
			});
			if (token !== null)
			{
				await prisma.$transaction([
					prisma.refreshToken.updateMany({
					  where: { familyId: token.familyId, revokedAt: null },
					  data: { revokedAt: new Date() },
					}),
					prisma.user.update({
					  where: { id: token.userId },
					  data: { isOnline: false, lastSeenAt: new Date() },
					}),
				]);
			}
		}
		clearRefreshCookie(res);
		return res.status(204).send();
	});
	router.get('/me', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const [user, friendCount] = await Promise.all([
			prisma.user.findUnique({
			  where: { id: userId },
			  omit: { passwordHash: true,
				  totpSecretEncrypted: true,
				  lastTotpStepConsumed: true,
			  },
			}),
			prisma.friendship.count({ where: acceptedFriendsWhere(userId) }),
		]);

		if (user === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		return res.status(200).json({
		  ...user,
		  isOnline: derivePresence(user.isOnline, user.lastSeenAt),
		  friendCount,
		});
	});
	router.patch('/me', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const parsed = updateMeSchema.safeParse(req.body);
		if (!parsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}

		try
		{
			const user = await prisma.user.update({
			  where: { id: userId },
			  data: { username: parsed.data.username },
			  omit: { passwordHash: true,
				  totpSecretEncrypted: true,
				  lastTotpStepConsumed: true,
			  },
			});
				
			const friendCount = await prisma.friendship.count({ where: acceptedFriendsWhere(userId) });

			return res.status(200).json({
			  ...user,
			  isOnline: derivePresence(user.isOnline, user.lastSeenAt),
			  friendCount,
			});
		}
		catch (err)
		{
			if (err instanceof Prisma.PrismaClientKnownRequestError)
			{
				if (err.code === 'P2002')
				{
					return res.status(409).json({ error: 'username already in use' });
				}
				if (err.code === 'P2025')
				{
					return res.status(401).json({ error: 'invalid token' });
				}
			}
			throw err;
		}
	});
	router.put('/me/avatar', avatarUpload, async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		if (req.file === undefined)
		{
			return res.status(400).json({ error: 'no file uploaded' });
		}
		const mimeType = detectImageMime(req.file.buffer);
		if (mimeType === null)
		{
			return res.status(400).json({ error: 'unsupported image type' });
		}
		const data = new Uint8Array(req.file.buffer);
		const [user, friendCount] = await prisma.$transaction(async (tx) => {
			await tx.avatar.upsert({
			  where: { userId },
			  create: { userId, data, mimeType },
			  update: { data, mimeType },
			});
			const updated = await tx.user.update({
			  where: { id: userId },
			  data: { avatarUrl: `/auth/users/${userId}/avatar` },
			  omit: { passwordHash: true,
				  totpSecretEncrypted: true,
				  lastTotpStepConsumed: true,
			  },
			});
			const count = await tx.friendship.count({ where: acceptedFriendsWhere(userId) });
			return [updated, count] as const;
		});
		return res.status(200).json({
		  ...user,
		  isOnline: derivePresence(user.isOnline, user.lastSeenAt),
		  friendCount,
		});
	}, (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
		if (err instanceof MulterError)
		{
			if (err.code === 'LIMIT_FILE_SIZE')
			{
				return res.status(413).json({ error: 'file too large' });
			}
			return res.status(400).json({ error: 'invalid upload' });
		}
		return res.status(500).json({ error: 'upload failed' });
	});
	router.get('/users/:id/avatar', async (req: Request, res: Response) => {
		const id = req.params.id;
		if (typeof id !== 'string')
		{
			return res.status(400).json({ error: 'invalid user id' });
		}
		const avatar = await prisma.avatar.findUnique({
		  where: { userId: id },
		});
		if (avatar === null)
		{
			return res.status(404).json({ error: 'avatar not found' });
		}
		res.setHeader('Content-Type', avatar.mimeType);
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
		return res.status(200).send(Buffer.from(avatar.data));
	});
	router.post('/presence/heartbeat', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const result = await prisma.user.updateMany({
		  where: { id: userId },
		  data: { isOnline: true, lastSeenAt: new Date() },
		});
		if (result.count === 0)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		return res.status(204).send();
	});
	router.post('/2fa/setup', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		if (user.totpEnabled)
		{
			return res.status(409).json({ error: '2FA is already enabled' });
		}

		const secret = new OTPAuth.Secret({ size: 20 });
		const totp = new OTPAuth.TOTP({
		  issuer: TOTP_ISSUER,
		  label: user.email,
		  algorithm: 'SHA1',
		  digits: 6,
		  period: 30,
		  secret,
		});
		const otpauthUri = totp.toString();

		const { plaintext, hashes } = generateScratchCodes();
		const encryptedSecret = encryptor.encrypt(secret.base32);

		await prisma.$transaction([
			prisma.user.update({
		    	  where: { id: userId },
		     	  data: { totpSecretEncrypted: encryptedSecret },
		  	}),
		  	prisma.scratchCode.deleteMany({ where: { userId } }),
		  	prisma.scratchCode.createMany({
		          data: hashes.map((codeHash) => ({ userId, codeHash })),
			  }),
		]);

		return res.status(200).json({
		  otpauthUri,
		  secret: secret.base32,
		  scratchCodes: plaintext,
		});
	});
	router.post('/2fa/enable', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const parsed = totpCodeSchema.safeParse(req.body);
		if (!parsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		if (user.totpEnabled)
		{
			return res.status(409).json({ error: '2FA is already enabled' });
		}
		if (user.totpSecretEncrypted === null)
		{
			return res.status(400).json({ error: 'no 2FA setup in progress' });
		}

		let secretBase32: string;
		try
		{
			secretBase32 = encryptor.decrypt(user.totpSecretEncrypted);
		}
		catch (err)
		{
			console.error(`TOTP secret decrypt failed for user ${userId}:`, err);
			return res.status(500).json({ error: 'could not verify 2FA, please try again' });
		}
		const totp = new OTPAuth.TOTP({
		  issuer: TOTP_ISSUER,
		  label: user.email,
		  algorithm: 'SHA1',
		  digits: 6,
		  period: 30,
		  secret: OTPAuth.Secret.fromBase32(secretBase32),
		});

		const delta = totp.validate({ token: parsed.data.code, window: 1 });
		if (delta === null)
		{
			return res.status(401).json({ error: 'invalid code' });
		}

		await prisma.user.update({
		  where: { id: userId },
		  data: { totpEnabled: true },
		});

		return res.status(200).json({ enabled: true });
	});
	router.post('/2fa/disable', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const parsed = totpCodeSchema.safeParse(req.body);
		if (!parsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		if (!user.totpEnabled || user.totpSecretEncrypted === null)
		{
			return res.status(409).json({ error: '2FA is not enabled' });
		}
		
		let secretBase32: string;
		try
		{
			secretBase32 = encryptor.decrypt(user.totpSecretEncrypted);
		}
		catch (err)
		{
			console.error(`TOTP secret decrypt failed for user ${userId}:`, err);
			return res.status(500).json({ error: 'could not verify 2FA, please try again' });
		}
		const totp = new OTPAuth.TOTP({
		  issuer: TOTP_ISSUER,
		  label: user.email,
		  algorithm: 'SHA1',
		  digits: 6,
		  period: 30,
		  secret: OTPAuth.Secret.fromBase32(secretBase32),
		});

		const delta = totp.validate({ token: parsed.data.code, window: 1 });
		if (delta === null)
		{
			return res.status(401).json({ error: 'invalid code' });
		}

		await prisma.$transaction([
			prisma.user.update({
			  where: { id: userId },
			  data: {
			    totpEnabled: false,
			    totpSecretEncrypted: null,
			    lastTotpStepConsumed: null,
			  },
			}),
			prisma.scratchCode.deleteMany({ where: { userId } }),
		]);

		clearFailures(userId);
		return res.status(200).json({ disabled: true });
	});
	router.post('/2fa/scratch/regenerate', async (req: Request, res: Response) => {
		const userId = await authenticateRequest(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		const parsed = totpCodeSchema.safeParse(req.body);
		if (!parsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}
		if (!user.totpEnabled || user.totpSecretEncrypted === null)
		{
			return res.status(409).json({ error: '2FA is not enabled' });
		}

		let secretBase32: string;
		try
		{
			secretBase32 = encryptor.decrypt(user.totpSecretEncrypted);
		}
		catch (err)
		{
			console.error(`TOTP secret decrypt failed for user ${userId}:`, err);
			return res.status(500).json({ error: 'could not verify 2FA, please try again' });
		}
		const totp = new OTPAuth.TOTP({
		  issuer: TOTP_ISSUER,
		  label: user.email,
		  algorithm: 'SHA1',
		  digits: 6,
		  period: 30,
		  secret: OTPAuth.Secret.fromBase32(secretBase32),
		});

		const delta = totp.validate({ token: parsed.data.code, window: 1 });
		if (delta === null)
		{
			return res.status(401).json({ error: 'invalid code' });
		}

		const { plaintext, hashes } = generateScratchCodes();

		await prisma.$transaction([
			prisma.scratchCode.deleteMany({ where: { userId } }),
			prisma.scratchCode.createMany({
				data: hashes.map((codeHash) => ({ userId, codeHash })),
			}),
		]);

		return res.status(200).json({ scratchCodes: plaintext });
	});
	router.post('/login/2fa', async (req: Request, res: Response) => {
		const userId = await authenticateIntermediateToken(req, publicKey);
		if (userId === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		if (isBlocked(userId))
		{
			return res.status(429).json({ error: 'too many failed attempts, try again later' });
		}

		const body: unknown = req.body;
		const totpParsed = totpCodeSchema.safeParse(body);
		const scratchParsed = scratchCodeSchema.safeParse(body);
		if (!totpParsed.success && !scratchParsed.success)
		{
			return res.status(400).json({ error: 'invalid input' });
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (user === null || !user.totpEnabled || user.totpSecretEncrypted === null)
		{
			return res.status(401).json({ error: 'invalid token' });
		}

		let verified = false;

		if (totpParsed.success)
		{
			let secretBase32: string;
			try
			{
				secretBase32 = encryptor.decrypt(user.totpSecretEncrypted);
			}
			catch (err)
			{
				console.error(`TOTP secret decrypt failed for user ${userId}:`, err);
				return res.status(401).json({ error: 'invalid code' });
			}

			const totp = new OTPAuth.TOTP({
			  issuer: TOTP_ISSUER,
			  label: user.email,
			  algorithm: 'SHA1',
			  digits: 6,
			  period: 30,
			  secret: OTPAuth.Secret.fromBase32(secretBase32),
			});

			const delta = totp.validate({ token: totpParsed.data.code, window: 1 });
			if (delta !== null)
			{
				const currentStep = Math.floor(Date.now() / 1000 / 30);
				const validatedStep = currentStep + delta;
				if (user.lastTotpStepConsumed === null
				    || BigInt(validatedStep) > user.lastTotpStepConsumed)
				{
					const accessToken = await signAccessToken(userId, privateKey);
					const { rawToken, tokenHash } = generateRefreshToken();
					const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

					await prisma.$transaction([
						prisma.user.update({
						  where: { id: userId },
						  data: {
						    lastTotpStepConsumed: BigInt(validatedStep),
						    isOnline: true,
						    lastSeenAt: new Date(),
						  },
						}),
						prisma.refreshToken.create({
						  data: {
						    userId,
						    tokenHash,
						    familyId: randomUUID(),
						    expiresAt,
						  },
						}),
					]);
					
					clearFailures(userId);
					res.clearCookie(COOKIE_NAME_2FA, { path: '/' });
					setRefreshCookie(res, rawToken);
					return res.status(200).json({ accessToken });
				}
			}
			verified = false;
		}

		if (!verified && scratchParsed.success)
		{
			const normalized = normalizeScratchCode(scratchParsed.data.code);
			const codeHash = createHash('sha256').update(normalized).digest('hex');

			const consumed = await prisma.scratchCode.updateMany({
			  where: { userId, codeHash, consumedAt: null },
			  data: { consumedAt: new Date() },
			});

			if (consumed.count === 1)
			{
				const accessToken = await signAccessToken(userId, privateKey);
				const { rawToken, tokenHash } = generateRefreshToken();
				const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

				await prisma.$transaction([
					prisma.refreshToken.create({
						data: {
						  userId,
						  tokenHash,
						  familyId: randomUUID(),
						  expiresAt,
						},
					}),
					prisma.user.update({
					  where: { id: userId },
					  data: { isOnline: true, lastSeenAt: new Date() },
					}),
				]);

				clearFailures(userId);
				res.clearCookie(COOKIE_NAME_2FA, { path: '/' });
				setRefreshCookie(res, rawToken);
				return res.status(200).json({ accessToken });
			}
		}

		recordFailure(userId);
		return res.status(401).json({ error: 'invalid code' });
	});
	router.get('/oauth/42', (req: Request, res: Response) => {
		const state = randomBytes(32).toString('base64url');

  		res.cookie(COOKIE_NAME_OAUTH_42_STATE, state, {
  		  httpOnly: true,
  		  sameSite: 'lax',
  		  path: '/',
  		  maxAge: OAUTH_STATE_COOKIE_MAX_AGE_MS,
  		  secure: process.env.NODE_ENV === 'production',
  		  signed: true,
  		});

  		const authorizeUrl = new URL(OAUTH_42_AUTHORIZE_URL);
  		authorizeUrl.searchParams.set('client_id', oauth.providers.fortyTwo.clientId);
  		authorizeUrl.searchParams.set('redirect_uri', oauth.providers.fortyTwo.redirectUri);
  		authorizeUrl.searchParams.set('response_type', 'code');
  		authorizeUrl.searchParams.set('scope', 'public');
  		authorizeUrl.searchParams.set('state', state);
		
  		return res.redirect(302, authorizeUrl.toString());
	});
	router.get('/oauth/42/callback', async (req: Request, res: Response) => {
		const parsed = callbackQuerySchema.safeParse(req.query);
		if (!parsed.success)
		{
			console.error('OAuth callback: invalid callback parameters', parsed.error.issues);
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		const { code, state: stateFromUrl, error: oauthError, error_description } = parsed.data;

		const stateFromCookie = req.signedCookies[COOKIE_NAME_OAUTH_42_STATE];
		res.clearCookie(COOKIE_NAME_OAUTH_42_STATE, { path: '/' });

		if (stateFromCookie === undefined)
		{
			console.error('OAuth callback: missing state cookie');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		if (stateFromCookie === false)
		{
			console.error('OAuth callback: tampered state cookie');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		if (stateFromCookie !== stateFromUrl)
		{
			console.error('OAuth callback: state mismatch');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}

		if (oauthError !== undefined)
		{
			if (oauthError === 'access_denied')
			{
				return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_denied');
			}
			console.error(`OAuth callback: 42 returned error "${oauthError}"`, error_description ?? '');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		if (code === undefined)
		{
			console.error('OAuth callback: missing code parameter');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}

		const tokenRequestBody = new URLSearchParams({
		  grant_type: 'authorization_code',
		  client_id: oauth.providers.fortyTwo.clientId,
		  client_secret: oauth.providers.fortyTwo.clientSecret,
		  code,
		  redirect_uri: oauth.providers.fortyTwo.redirectUri,
		});

		const tokenResponse = await fetch(OAUTH_42_TOKEN_URL, {
		  method: 'POST',
		  body: tokenRequestBody,
		});
		if (!tokenResponse.ok)
		{
			console.error(`OAuth callback: token exchange failed (${tokenResponse.status})`);
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		const tokenParsed = tokenResponseSchema.safeParse(await tokenResponse.json());
		if (!tokenParsed.success)
		{
			console.error('OAuth callback: invalid token response from 42');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		const accessToken42 = tokenParsed.data.access_token;

		const meResponse = await fetch(OAUTH_42_ME_URL, {
		  headers: { Authorization: `Bearer ${accessToken42}` },
		});
		if (!meResponse.ok)
		{
			console.error(`OAuth callback: profile fetch failed (${meResponse.status})`);
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		const meParsed = meResponseSchema.safeParse(await meResponse.json());
		if (!meParsed.success)
		{
			console.error('OAuth callback: invalid profile response from 42');
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}
		const { id: fortyTwoId, email: fortyTwoEmail, login: fortyTwoLogin } = meParsed.data;
		const providerId = String(fortyTwoId);

		let userId: string;

		const existingOAuth = await prisma.oAuthAccount.findUnique({
		  where: { provider_providerId: { provider: '42', providerId } },
		});

		if (existingOAuth !== null)
		{
			userId = existingOAuth.userId;
		}
		else
		{
			const existingUser = await prisma.user.findUnique({
			  where: { email: fortyTwoEmail },
			});

			if (existingUser !== null)
			{
				await prisma.oAuthAccount.create({
				  data: { userId: existingUser.id, provider: '42', providerId },
				});
				userId = existingUser.id;
			}
			else
			{
				try
				{
					const newUser = await prisma.user.create({
					  data: { email: fortyTwoEmail, username: fortyTwoLogin },
					});
					await prisma.oAuthAccount.create({
					  data: { userId: newUser.id, provider: '42', providerId },
					});
					userId = newUser.id;
				}
				catch (err)
				{
					if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
					{
						const newUser = await prisma.user.create({
						  data: { email: fortyTwoEmail, username: `${fortyTwoLogin}-${providerId}` },
						});
						await prisma.oAuthAccount.create({
						  data: { userId: newUser.id, provider: '42', providerId },
						});
						userId = newUser.id;
					}
					else
					{
						throw err;
					}
				}
			}
		}
		const user = await prisma.user.findUnique({
		  where: { id: userId },
		  select: { id: true, totpEnabled: true },
		});
		if (user === null)
		{
			console.error(`OAuth callback: user ${userId} vanished during oauth flow`);
			return oauthErrorRedirect(res, oauth.frontendUrl, 'oauth_failed');
		}

		const result = await issuePostAuthResponse(user, prisma, privateKey);
		if ('requires2fa' in result)
		{
			res.cookie(COOKIE_NAME_2FA, result.intermediateToken, {
			  httpOnly: true,
			  sameSite: 'none',
			  path: '/',
			  maxAge: INTERMEDIATE_COOKIE_MAX_AGE_MS,
			  secure: process.env.NODE_ENV === 'production',
			  signed: false,
			});
			return res.redirect(302, `${oauth.frontendUrl}/login?2fa=1`);
		}
		setRefreshCookie(res, result.refreshToken);
		return res.redirect(302, oauth.frontendUrl);
	});
	return router;
}
