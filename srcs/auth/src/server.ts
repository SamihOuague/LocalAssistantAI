import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import express, { Request, Response } from 'express';
import { createAuthRouter } from './routes/auth.js';
import { createFriendsRouter } from './routes/friends.js';
import { createUsersRouter } from './routes/users.js';
import { importPKCS8, importSPKI } from 'jose';
import cookieParser from 'cookie-parser';
import { createEncryptor } from './auth/encryption.js';
import { execSync } from 'node:child_process';

const vaultAddr = process.env.VAULT_ADDR;
if (!vaultAddr) {
  throw new Error('VAULT_ADDR is not set');
}

const vaultRoleId = process.env.VAULT_ROLE_ID;
if (!vaultRoleId) {
  throw new Error('VAULT_ROLE_ID is not set');
}

const vaultSecretId = process.env.VAULT_SECRET_ID;
if (!vaultSecretId) {
  throw new Error('VAULT_SECRET_ID is not set');
}

interface AuthSecrets {
  JWT_PRIVATE_KEY: string;
  JWT_PUBLIC_KEY: string;
  TOTP_ENCRYPTION_KEY: string;
  OAUTH_COOKIE_SECRET: string;
  OAUTH_42_CLIENT_ID: string;
  OAUTH_42_CLIENT_SECRET: string;
}

interface DbSecrets {
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_HOST: string;
  DB_DIALECT: string;
}

async function vaultLogin(addr: string, roleId: string, secretId: string): Promise<string> {
  console.log('Authenticating to Vault...', `${addr}/v1/auth/approle/login`);
  const res = await fetch(`${addr}/v1/auth/approle/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_id: roleId, secret_id: secretId }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vault login failed: ${res.status} ${body}`);
  }
  const json = await res.json() as { auth: { client_token: string } };
  return json.auth.client_token;
}

async function getSecrets<T>(addr: string, token: string, path: string): Promise<T> {
  console.log('Fetching secrets from Vault...');
  const res = await fetch(`${addr}/v1/secret/data/${path}`, {
    headers: { 'X-Vault-Token': token },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vault secret fetch failed: ${res.status} ${body}`);
  }
  const json = await res.json() as { data: { data: T } };
  return json.data.data;
}

const vaultToken = await vaultLogin(vaultAddr, vaultRoleId, vaultSecretId);
const secrets = await getSecrets<AuthSecrets>(vaultAddr, vaultToken, "auth-service");
const mariaSecrets = await getSecrets<DbSecrets>(vaultAddr, vaultToken, "mariadb-service");

const databaseUrl = `mysql://${mariaSecrets.DB_USER}:${mariaSecrets.DB_PASSWORD}@${mariaSecrets.DB_HOST}:3306/${mariaSecrets.DB_NAME}`;
process.env.DATABASE_URL = databaseUrl;
let migrated = false;
for (let attempt = 1; attempt <= 30; attempt++) {
  try {
    console.log(`Running database migrations (attempt ${attempt})...`);
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    migrated = true;
    break;
  }
  catch {
    console.log('DB not ready / migrate failed, retrying in 2s...');
    await new Promise((r) => setTimeout(r, 2000));
  }
}
if (!migrated) {
  throw new Error('Failed to apply migrations after 30 attempts');
}


const privateKey = await importPKCS8(secrets.JWT_PRIVATE_KEY, 'RS256');
const publicKey = await importSPKI(secrets.JWT_PUBLIC_KEY, 'RS256');

const totpEncryptionKey = Buffer.from(secrets.TOTP_ENCRYPTION_KEY, 'base64');
if (totpEncryptionKey.length !== 32) {
  throw new Error('TOTP_ENCRYPTION_KEY must be a base64-encoded 32-byte key. '
    + 'Generate with: openssl rand -base64 32');
}
const encryptor = createEncryptor(totpEncryptionKey);

const oauthCookieSecret = secrets.OAUTH_COOKIE_SECRET;
if (!oauthCookieSecret) {
  throw new Error('OAUTH_COOKIE_SECRET is missing from Vault secrets');
}

const oauth42ClientId = secrets.OAUTH_42_CLIENT_ID;
if (!oauth42ClientId) {
  throw new Error('OAUTH_42_CLIENT_ID is missing from Vault secrets');
}

const oauth42ClientSecret = secrets.OAUTH_42_CLIENT_SECRET;
if (!oauth42ClientSecret) {
  throw new Error('OAUTH_42_CLIENT_SECRET is missing from Vault secrets');
}

const oauth42RedirectUri = process.env.OAUTH_42_REDIRECT_URI;
if (!oauth42RedirectUri) {
  throw new Error('OAUTH_42_REDIRECT_URI is not set');
}

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  throw new Error('FRONTEND_URL is not set');
}
const allowedOriginsRaw = process.env.ALLOWED_ORIGINS;
if (!allowedOriginsRaw)
{
	throw new Error('ALLOWED_ORIGINS is not set');
}
const allowedOrigins = new Set(
	allowedOriginsRaw.split(',').map((o) => o.trim()).filter((o) => o.length > 0),
);
if (allowedOrigins.size === 0)
{
	throw new Error('ALLOWED_ORIGINS is empty after parsing');
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const PORT: number = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cookieParser(oauthCookieSecret));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'auth',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/', createAuthRouter(prisma, privateKey, publicKey, {
  cookieSecret: oauthCookieSecret,
  frontendUrl: frontendUrl,
  providers: {
    fortyTwo: {
      clientId: oauth42ClientId,
      clientSecret: oauth42ClientSecret,
      redirectUri: oauth42RedirectUri,
    },
  },
}, encryptor, allowedOrigins));

app.use('/friends', createFriendsRouter(prisma, publicKey));
app.use('/users', createUsersRouter(prisma, publicKey));

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'not found',
    path: req.path,
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth service listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received in Auth service, shutting down');
  server.close(async () => {
    console.log('Auth server closed, disconnecting DB');
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Error disconnecting DB:', err);
      process.exit(1);
    }
  });
  setTimeout(() => {
    console.error('Auth service has forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
});
