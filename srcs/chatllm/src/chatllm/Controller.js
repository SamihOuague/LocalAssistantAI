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
        const { chatBoxId } = req.params;
        let chatBox = await ChatBox.findByPk(chatBoxId);
        let chatMessage = await ChatMessage.findAll({
            where: {
                ChatBoxId: chatBoxId
            }
        });
        if (!chatBox)
            return res.status(404).send({err: "Historique introuvable."});
        else if (chatBox.dataValues.idUser != req.userId)
            return res.status(401).send({err: "Permission refuser."});
        return res.status(200).send(chatMessage);
    } catch (err) {
        return res.status(500).send({ err });
    }
}

export async function deleteChatHistory(req, res) {
    try {
        const { chatBoxId } = req.params;

        let chatBox = await ChatBox.findByPk(chatBoxId);

        if (!chatBox)
            return res.status(404).send({err: "Historique introuvable."});
        else if (chatBox.dataValues.idUser != req.userId)
            return res.status(401).send({err: "Permission refuser."});
        await chatBox.destroy();
        return res.status(201).send({message: `Chatbox (${chatBoxId}) deleted`});
    } catch (err) {
        return res.status(500).send({ err });
    }
}

export async function ping(req, res) {
    return res.send({ pong: "pong" });
}