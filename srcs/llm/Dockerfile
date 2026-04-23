FROM node:20-alpine

WORKDIR /app
COPY . .

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

RUN npm install
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

CMD ["npm", "run", "dev"]

EXPOSE 3002