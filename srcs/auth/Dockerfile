FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

ENV NODE_ENV=production

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://127.0.0.1:3001/health || exit 1

CMD ["node", "dist/server.js"]
