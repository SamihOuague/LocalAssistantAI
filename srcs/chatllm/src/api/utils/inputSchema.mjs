import * as z from "zod";

export const docsBody = z.object({
    name: z.string(),
    url: z.string(),
});

export const newChatBody = z.object({
    title: z.string().min(1).max(50),
});

export const getStreamBody = z.object({
    nonce: z.coerce.number(),
});

export const getStreamParams = z.object({
    jobId: z.string(),
});

export const generateBody = z.object({
    messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
    })),
    nonce: z.string().min(1),
});

export const chatBody = z.object({
    content: z.string().min(1).max(2000),
    nonce: z.string().min(1),
});

export const chatParams = z.object({
    id: z.coerce.number(),
});

export const editChatParams = z.object({
    id: z.coerce.number(),
    msgId: z.coerce.number(),
});
