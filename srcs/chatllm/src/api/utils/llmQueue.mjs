import { agent } from "../../core/agent.mjs";
import { createChatMessage, updateChatMessage, readChatMessage,  } from "../CRUD/ChatMessage.mjs";
import { redisConfig } from "./redisClient.mjs";
import { waitForStream } from "./waiters.mjs";
import { getStream, deleteStream } from "./streams.mjs";
import Queue from "bull";

const handlers = {
    "handlePostChat": async ({ chatBoxId, content }) => {
        await createChatMessage({ id: chatBoxId, content, role: "assistant" });
    },
    "handleEditChat": async ({ llmMsg, chatBoxId, content }) => {
        if (llmMsg.length > 0 && llmMsg[0].role == "assistant")
            await updateChatMessage({ content, msgId: llmMsg[0].id, role: "assistant" })
        else
            await createChatMessage({ id: chatBoxId, content, role: "assistant" });
    },
    "handleGenerate": async () => {
        return;
    }
}

export async function generateStream({ messages }, onsteps) {
    const stream = await agent.stream({ messages }, {
        streamMode: "messages",
    });

    if (stream == null) return;

    for await (let step of stream) {
        try {
            const { type, content, response_metadata } = step[0];

            onsteps({ type, content, response_metadata });
        } catch (err) {
            console.error(err);
            continue;
        }
    }
}

export const llmQueue = new Queue('llmQueue', redisConfig);

// Process jobs from the queue
llmQueue.process(async (job) => {

    console.log('Processing job:', job.data);
    return new Promise(async (resolve, reject) => {
        const { params } = job.data;

        let buffer = {
            role: "assistant",
            content: "",
        }

        try {
            await waitForStream(job.id);
        } catch (err) {
            reject(err);
            return ;
        }
        
        const client = getStream(job.id);

        if (!client)
        {
            reject("Client disconnected");
            return ;
        }

        try {
            await generateStream({ messages: params.messages }, (response) => {
                try {
                    const data = JSON.stringify(response)

                    if (response.type == 'ai' && typeof response.content == "string")
                        buffer.content += response.content;
                    if (client && typeof response.content == "string")
                        client.write(`${data}`);
                } catch(err) {
                    console.error(err);
                    return ;
                }
            });
        } catch (e) {
            // client.status(500).end(JSON.stringify({ message: e }));
            reject(e);
            return ;
        }
        if (client)
            client.end();
        deleteStream(job.id);
        resolve({ ...buffer, ...job.data });
    });
});

// Event listener for completed jobs
llmQueue.on('completed', async (job, result) => {
    try {
        const { handler, params, content } = result;

        console.log(`Job ID ${job.id} completed with result:`, result);
        await handlers[handler]({ ...params, content });
    } catch (err) {
        console.error(err);
    }
});

// Event listener for failed jobs
llmQueue.on('failed', (job, err) => {
    console.error(`Job ID ${job.id} failed with error:`, err);
    const client = getStream(job.id);

    if (job.data.params && job.data.params.chatBoxId) {
        readChatMessage(job.data.params.chatBoxId, {}, 1, [["createdAt", "DESC"]]).then((value) => {
            if (value.length > 0) value[0].destroy();
        });
    }    
    if (client)
        client.status(500).end(JSON.stringify({ message: err }));
    deleteStream(job.id);
});