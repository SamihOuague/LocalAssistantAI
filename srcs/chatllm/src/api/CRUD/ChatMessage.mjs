import { ChatBox, ChatMessage } from "../Model.mjs";
import { Op } from "sequelize";

export const createChatMessage = async (data) => {
    try {
        const { id, content, role } = data;

        let userMessage = ChatMessage.build({
            role,
            content,
            ChatBoxId: id
        });

        return await userMessage.save();
    } catch (err) {
        console.error(err);
        return (null);
    }
};

export const readChatMessage = async (id, addWhere = {}, limit = 150, order = []) => {
    try {
        return await ChatMessage.findAll({
            where: {
                ...addWhere,
                ChatBoxId: id,
                role: {
                    [Op.not]: "tool"
                }
            },
            limit,
            order
        });
    } catch (err) {
        console.error(err);
        return (null);
    }
};

export const updateChatMessage = async (data) => {
    try {
        const { content, role, msgId } = data;

        return await ChatMessage.update(
            { role, content },
            {
                where: {
                    id: msgId,
                },
            },
        );
    } catch (err) {
        console.error(err);
        return (null);
    }
};