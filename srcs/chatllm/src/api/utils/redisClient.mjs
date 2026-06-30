import { createClient } from "redis";

export const client = createClient({
    url: "redis://redis:6379",
    password: process.env.REDIS_PASSWORD
});

export const redisConfig = {
    redis: {
        port: 6379,
        host: 'redis',
        password: process.env.REDIS_PASSWORD
    }
}