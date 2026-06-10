FROM node:20-alpine

COPY . /app

RUN apk add --no-cache \
    bash \
    curl \
    jq

WORKDIR /app

RUN npm install

EXPOSE 3002

ENTRYPOINT [ "bash", "setup.sh" ]