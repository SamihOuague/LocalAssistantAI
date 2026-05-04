import OpenAI from "openai";

class VLLMProvider {
    constructor(model = "LegallyAI") {
        this.model = model;
        this.client = new OpenAI({
            baseURL: process.env.OPENAI_URL || "http://vllmService:8000/v1",
            apiKey: "None",
        });
    }

    async generateStream({ messages, think = true, ontoken }, callback) {
        const stream = await this.client.responses.create({
            model: this.model,
            input: messages,
            stream: true
        });
        let content = "";

        for await (const response of stream) {
            if (response.delta)
                content += response.delta;
            ontoken({
                status: "answer",
                chunk: response.delta,
            });
        }
        callback({ status: "finished", content });
    }
}

export default VLLMProvider;