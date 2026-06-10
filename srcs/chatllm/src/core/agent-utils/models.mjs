import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

console.log(process.env.OLLAMA_URL);

export const embeddings = new OllamaEmbeddings({
    model: "embeddinggemma",
    baseUrl: process.env.OLLAMA_URL
});

export const ollm = new ChatOllama({
    model: "llama3.1",
    baseUrl: process.env.OLLAMA_URL,
});

export const vllm = new ChatOpenAI({
    model: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    apiKey: "dummy",
    configuration: {
        baseURL: process.env.VLLM_URL,
    }
});

export const openAi = new ChatOpenAI({
    model: process.env.OPENAI_MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_URL,
    }
});