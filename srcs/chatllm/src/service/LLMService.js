import { ChatBox, ChatMessage } from "../chatllm/Model.js";

class LLMService {
    constructor(provider) {
        this.provider = provider;
    }

    async generateChat({ messages, think = true, chatBoxId, ontoken }, wsCallback) {
        try {
            let chatBox = await ChatBox.findByPk(chatBoxId);

            if (!chatBox) {
                chatBox = ChatBox.build({
                    idUser: ws.userId,
                    title: "Nouvelle conversation",
                });
                chatBox = await chatBox.save();
            }

            let userMessage = ChatMessage.build({
                ...messages[messages.length - 1],
                ChatBoxId: chatBox.dataValues.id
            });

            await userMessage.save();

            await this.provider.generateStream({
                messages,
                think,
                ontoken: (data) => ws.send(JSON.stringify({ ...data, chatBoxId }))
            }, async ({ status, content, thinking }) => {
                let message = ChatMessage.build({
                    ChatBoxId: chatBox.dataValues.id,
                    role: "assistant",
                    content,
                    thinking
                });

                await message.save();

                wsCallback({
                    status: "finished",
                    newMessages: [
                        {
                            role: "assistant",
                            content,
                            thinking
                        },
                    ],
                    chatBoxId
                });
            });
        } catch (err) {
            console.error(err);
            wsCallback({
                status: "error",
                message: "Server error",
            });
        }
    }
}

export default LLMService;