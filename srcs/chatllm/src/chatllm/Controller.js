import { ChatBox, ChatMessage } from "./Model.js"

export async function chatList(req, res) {
    try {
        let chatBoxList = await ChatBox.findAll({
            where: {
                idUser: req.userId
            },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).send(chatBoxList);
    } catch (err) {
        return res.status(500).send({ err });
    }
}

export async function chatHistory(req, res) {
    try {
        let chatBox = await ChatMessage.findAll({
            where: {
                ChatBoxId: req.params.chatBoxId
            }
        });
        return res.status(200).send(chatBox);
    } catch (err) {
        return res.status(500).send({ err });
    }
}

export async function ping(req, res) {
    return res.send({ pong: "pong" });
}