import { ChatMessage, ChatBox } from "./Model.mjs";
import { Op } from "sequelize";
import { llmQueue } from "./utils/llmQueue.mjs";
import { createChatBox, readChatBox } from "./CRUD/ChatBox.mjs"
import { createChatMessage, readChatMessage, updateChatMessage } from "./CRUD/ChatMessage.mjs"
import { markStreamReady } from "./utils/waiters.mjs";
import { registerStream, deleteStream } from "./utils/streams.mjs";
import {
    editChatParams,
    chatParams,
    getStreamParams,
    getStreamBody,
    generateBody,
    chatBody,
    docsBody,
    newChatBody
} from "./utils/inputSchema.mjs";


try {
    await llmQueue.empty();
} catch (err) {
    console.error(err);
}

export const newChat = async (req, res) => {
    const body = newChatBody.safeParse(req.body);

    if (!body.success)
        return res.status(400).send({ message: "Bad request" });

    try {
        const { title } = body.data;
        let chatBox = await createChatBox({
            idUser: req.user.id,
            title
        });

        if (!chatBox) return res.status(500).send({ message: "Chatbox creation failed." });

        return res.status(201).send({ id: chatBox.dataValues.id });
    } catch (err) {
        return res.status(500).send({ message: "Internal Error" });
    }
};

const nonceCheck = async (nonce, jobId) => {
    try {
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${nonce}`));
        const encoded = Array.from(new Uint8Array(hash)).map((d) => (d.toString(16).padStart(2, "0"))).join("");
        
        if (encoded != jobId)
            return (null);
        return (encoded);
    } catch (err) {
        console.error(err);
        return (null);
    }
}

export const getStream = async (req, res) => {
    const body = getStreamBody.safeParse(req.body);
    const params = getStreamParams.safeParse(req.params);

    if (!body.success || !params.success)
        return res.status(400).end("Bad request.\n\n");

    try {
        const { nonce } = body.data;
        const { jobId } = params.data;
        const job = await llmQueue.getJob(jobId);
        
        if (!job)
            return res.status(404).end(JSON.stringify({message: "Job not found."}));
    
        const encoded = await nonceCheck(nonce, jobId);
    
        if (!encoded)
            return res.status(401).end(JSON.stringify({message:"Bad nonce."}));
        
        const jobStatus = await job.getState();
        
        if (jobStatus != 'waiting' && jobStatus != 'active') {
            await job.remove();
            return res.status(500).end(JSON.stringify({message: "Job failed."}));
        }
        
        registerStream(jobId, res);

        markStreamReady(jobId);

        req.on("close", () => {
            console.log("Client disconnected");
            deleteStream(jobId);
        });
    } catch (err) {
        console.error(err);
        return res.status(500).end(JSON.stringify({message: "Internal Error."}));
    }
}

export const generate = async (req, res) => {
    const body = generateBody.safeParse(req.body);

    if (!body.success || !body.data.messages.length)
        return res.status(400).send({ message: "Bad request." });

    try {
        const { messages, nonce } = body.data;
        const j = await llmQueue.add({
            handler: "handleGenerate",
            params: {
                messages,
                nonce
            }
        }, {
            jobId: nonce,
            removeOnComplete: true,
            removeOnFail: true,
        });

        return res.send({ jobId: j.id });
    } catch (err) {
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const postChat = async (req, res) => {
    const body = chatBody.safeParse(req.body);
    const params = chatParams.safeParse(req.params);

    if (!body.success || !params.success)
        return res.status(400).send({ message: "Bad request." });

    try {
        const { content, nonce } = body.data;
        const { id } = params.data;

        const chatBox = await ChatBox.findByPk(id);

        if (!chatBox || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: "Chat history not found." })

        const messages = (await readChatMessage(id)).map((value) => ({
            role: value.dataValues.role,
            content: value.dataValues.content
        }));
        
        if (messages.length > 0 && messages[messages.length - 1].role == "user")
            return res.status(400).send({ message: "Waiting for llm response." })
            
        const msg = await createChatMessage({ id, content, role: "user" });

        const j = await llmQueue.add({
            handler: "handlePostChat",
            params: {
                messages: [...messages, { 
                    role: msg.dataValues.role,
                    content: msg.dataValues.content
                }],
                chatBoxId: id,
                nonce,
            }
        }, {
            jobId: nonce,
            removeOnComplete: true,
            removeOnFail: true,
        });

        return res.send({ jobId: j.id });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error\n\n" });
    }
};

export const getChatboxes = async (req, res) => {
    try {
        let chatBoxes = await readChatBox(req.user.id);

        return res.send(chatBoxes);
    } catch (err) {
        return res.status(500).send({ message: "Internal Error", err });
    }
};

export const getChatHistory = async (req, res) => {
    const params = chatParams.safeParse(req.params);

    if (!params.success)
        return res.status(400).send({ message: "Bad request." });
    try {
        const { id } = params.data;
        const chatBox = await ChatBox.findByPk(id);

        if (!chatBox || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: "History not found." });

        const messages = (await readChatMessage(id)).map((value) => ({
            id: value.dataValues.id,
            role: value.dataValues.role,
            content: value.dataValues.content
        }));

        return res.status(200).send(messages);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const editChat = async (req, res) => {
    const body = chatBody.safeParse(req.body);
    const params = editChatParams.safeParse(req.params);

    if (!body.success || !params.success)
        return res.status(400).send({ message: "Bad request." });

    try {
        const { content, nonce } = body.data;
        const { id, msgId } = params.data;

        let chatBox = await ChatBox.findByPk(id);
        let userMsg = await ChatMessage.findByPk(msgId);

        if (!chatBox || !userMsg || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: `Chat ${(!userMsg) ? "message" : "history"} not found.` })

        await updateChatMessage({ content, msgId });

        const messages = (await readChatMessage(id, {
            createdAt: {
                [Op.lte]: userMsg.dataValues.createdAt,
            }
        })).map((value) => ({
            role: value.dataValues.role,
            content: value.dataValues.content
        }));

        const llmMsg = await readChatMessage(id, {
            id: {
                [Op.gt]: msgId,
            }
        }, 1);

        const j = await llmQueue.add({
            handler: "handleEditChat",
            params: {
                messages,
                chatBoxId: id,
                llmMsg,
                msgId,
                nonce,
            }
        }, {
            jobId: nonce,
            removeOnComplete: true,
            removeOnFail: true,
        });

        return res.send({ jobId: j.id });
    } catch (err) {
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const deleteHistory = async (req, res) => {
    const params = chatParams.safeParse(req.params);

    try {
        const { id } = params.data;

        let chatBox = await ChatBox.findByPk(id);

        if (!chatBox || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: "History not found." });
        await chatBox.destroy();
        return res.status(201).send({ message: `Chatbox (${id}) deleted` });
    } catch (err) {
        return res.status(500).send({ message: "Internal error", err });
    }
    return res.send({ message: "History Deleted!" });
};