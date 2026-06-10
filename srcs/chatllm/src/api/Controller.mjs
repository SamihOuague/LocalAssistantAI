import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { loadWebPage } from "../utils/loadDocs.mjs";
import { ChatMessage, ChatBox } from "./Model.mjs";
import vectorStore from "../core/agent-utils/vectorStore.mjs";
import { Op } from "sequelize";
import { agent } from "../core/agent.mjs";

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
});

export async function generateStream({ messages }, onsteps) {
    const stream = await agent.stream({ messages }, {
        streamMode: "messages",
    });

    if (stream == null) return;
    
    for await (let step of stream) {
        const data = step[0];

        if (data.type == 'ai')
            onsteps(data.content);
    }
}

export const loadDocument = async (req, res) => {
    const { name, url } = req.body;

    if (!url)
        return res.status(400).send({ message: "Bad request" });
    try {
        const docs = await loadWebPage(url, "p");

        if (docs.length == 0)
            return res.status(404).send({ message: "Loading page failed!" });

        const allSplits = await splitter.splitDocuments(docs);

        await vectorStore.addDocuments(allSplits);

        return res.status(201).send({ message: "success", allSplits });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const newChat = async (req, res) => {
    const { title } = req.body;

    if (!title)
        return res.status(400).send({ message: "Bad request." });
    try {
        let chatBox = ChatBox.build({
            idUser: req.user.id,
            title,
        });
        chatBox = await chatBox.save();
        return res.status(201).send({ id: chatBox.dataValues.id });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const generate =  async (req, res) => {
    const { messages } = req.body;

    if (!messages || !messages.length)
        return res.status(400).send({ message: "Bad request." });

    try {
        await generateStream({ messages }, (data) => {
            res.write(data);
        });
        return res.end("\n\n");
    } catch (err) {
        console.error(err);
        return res.status(500).end("\n\n");
    }
};

export const postChat =  async (req, res) => {
    const { content } = req.body;
    const { id } = req.params;

    if (!content)
        return res.status(400).send({ message: "Bad request." });

    try {
        let chatBox = await ChatBox.findByPk(id);

        if (!chatBox || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: "Chat history not found." })
        let userMessage = ChatMessage.build({
            ...{ role: "user", content },
            ChatBoxId: chatBox.dataValues.id
        });
        await userMessage.save();
        let buffer = { role: "assistant", content: "" }
        const messages = await ChatMessage.findAll({
            where: {
                ChatBoxId: id,
                role: {
                    [Op.not]: "tool"
                }
            }
        });
        await generateStream({
            messages: messages.map((value) => ({
                role: value.dataValues.role,
                content: value.dataValues.content
            })),
        }, async (data) => {
            buffer.content += data;
            res.write(data);
        });
        let message = ChatMessage.build({
            ...buffer,
            ChatBoxId: chatBox.dataValues.id,
            thinking: null
        });
        await message.save();
        return res.end('\n\n');
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const getChatboxes =  async (req, res) => {
    try {
        let chatBoxes = await ChatBox.findAll({
            where: {
                idUser: req.user.id
            }
        });

        return res.send(chatBoxes);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
};

export const getChatHistory =  async (req, res) => {
    const { id } = req.params;

    try {
        let chatBox = await ChatBox.findByPk(id);
        if (!chatBox || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: "History not found." });
        let chatMessage = await ChatMessage.findAll({
            where: {
                ChatBoxId: id
            }
        });
        return res.status(200).send(chatMessage);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
};


export const editChat = async (req, res) => {
    const { content } = req.body;
    const { id, msgId } = req.params;

    if (!content)
        return res.status(400).send({ message: "Bad request." });

    try {
        let chatBox = await ChatBox.findByPk(id);
        let userMsg = await ChatMessage.findByPk(msgId);

        if (!chatBox || !userMsg || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({message:  `Chat ${(!userMsg) ? "message" : "history"} not found.` })

        await ChatMessage.update(
            { role: "user", content },
            {
                where: {
                    id: msgId,
                },
            },
        );
        let buffer = { role: "assistant", content: "" }
        const messages = await ChatMessage.findAll({
            where: {
                ChatBoxId: id,
                role: {
                    [Op.not]: "tool"
                },
                createdAt: {
                    [Op.lte]: userMsg.dataValues.createdAt, 
                }
            }
        });
        const llmMsg = await ChatMessage.findAll({
            where: {
                ChatBoxId: id,
                role: {
                    [Op.not]: "tool"
                },
                id: {
                    [Op.gt]: userMsg.dataValues.id,
                },
            },
            limit: 1
        });
        await generateStream({
            messages: messages.map((value) => ({
                role: value.dataValues.role,
                content: value.dataValues.content
            })),
        }, async (data) => {
            buffer.content += data;
            res.write(data);
        });
        if (llmMsg.length == 0) {
            let message = ChatMessage.build({
                ...buffer,
                ChatBoxId: chatBox.dataValues.id,
                thinking: null
            });
            await message.save();
            return res.end('\n\n');
        }
        await ChatMessage.update(
            buffer,
            {
                where: {
                    id: llmMsg[0].dataValues.id,
                },
            },
        );
        return res.end('\n\n');
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Internal Error" });
    }
    return res.send({ message: "Updated!" });
};

export const deleteHistory =  async (req, res) => {
    try {
        const { id } = req.params;

        let chatBox = await ChatBox.findByPk(id);
        
        if (!chatBox || chatBox.dataValues.idUser != req.user.id)
            return res.status(404).send({ message: "History not found." });
        await chatBox.destroy();
        return res.status(201).send({ message: `Chatbox (${id}) deleted` });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ err });
    }
    return res.send({ message: "History Deleted!" });
};