import { Ollama } from "ollama";
import { ChatBox, ChatMessage } from "../chatllm/Model.js";
import OllamaProvider from "../core/OllamaProvider.js";
import LLMService from "../service/LLMService.js";
import url from "url";
import jwt from "jsonwebtoken";

const provider = new OllamaProvider("LegallyAI");
const llmService = new LLMService(provider);

export const isAuthWs = (ws, req) => {
    try {
        const parameters = url.parse(req.url, true);
        const token = parameters.query.token;

        if (!token) {
            ws.send(
                JSON.stringify({
                    status: "auth",
                })
            );
            ws.close();
            return false;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

        ws.userId = decoded.userId;
        console.log("User connecté :", ws.userId);
    } catch (err) {
        ws.send(
            JSON.stringify({
                status: "auth",
            })
        );
        ws.close();
        return false;
    }
    return true;
}

export const llmSubscribe = (ws) => {
    ws.on("message", async (data) => {
        const { messages, think = true, chatBoxId } = JSON.parse(data.toString());

        llmService.generateChat({
            messages,
            think,
            chatBoxId,
            ontoken: (data) => ws.send(JSON.stringify(data)),
        });
    });
}