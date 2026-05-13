import { ChatBox, ChatMessage } from "../chatllm/Model.js";
import SemanticRouter from "./SemanticRouter.js";
import VLLMProvider from "../core/VLLMProvider.js";
import OllamaProvider from "../core/OllamaProvider.js";

class LLMService {
    constructor() {
        this.vllmProvider = new VLLMProvider("Qwen/Qwen2.5-3B-Instruct");
        this.ollamaProvider = new OllamaProvider("llama3.1");
        this.router = new SemanticRouter();
    }

    async generateChat({ messages, think = true, chatBoxId, ontoken, userId }, wsCallback) {
        try {
            let chatBox = await ChatBox.findByPk(chatBoxId);
            let provider = this.ollamaProvider;

            if (!chatBox) {
                chatBox = ChatBox.build({
                    idUser: userId,
                    title: "Nouvelle conversation",
                });
                chatBox = await chatBox.save();
            }

            let userMessage = ChatMessage.build({
                ...messages[messages.length - 1],
                ChatBoxId: chatBox.dataValues.id
            });

            await userMessage.save();

            const classifiedPrompt = await this.router.classify(messages[messages.length - 1].content);

            if (classifiedPrompt.name !== 'simple')
                provider = this.vllmProvider;
            
            console.log(classifiedPrompt, messages[messages.length - 1]);
            await provider.generateStream({
                messages,
                think,
                ontoken
            }, async function ({ status, content, thinking }) {
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