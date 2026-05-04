import { Ollama } from "ollama";

class OllamaProvider {
    constructor(model = "LegallyAI") {
        this.model = model;
        this.client = new Ollama({
            host: process.env.OLLAMA_URL || "http://172.17.0.1:11434"
        });
    }

    async generateStream({ messages, think = true, ontoken }, callback) {
        const stream = await this.client.chat({
            model: this.model,
            messages,
            stream: true,
            think,
        });
        let content = "";
        let thinking = "";

        for await (const chunk of stream) {
            if (chunk.message?.thinking)
                thinking += chunk.message.thinking;
            else if (chunk.message?.content)
                content += chunk.message.content;
            ontoken({
                status: chunk.message?.thinking ? "thinking" : "answer",
                chunk: chunk.message.thinking || chunk.message.content,
            });
        }
        callback({ status: "finished", content, thinking });
    }
}

export default OllamaProvider;