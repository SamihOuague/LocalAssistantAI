import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
//import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogle } from "@langchain/google";

console.log(process.env.OLLM_MODEL_NAME);
export const embeddings = new OllamaEmbeddings({
    model: "embeddinggemma",
    baseUrl: process.env.OLLAMA_URL
});

export const ollm = new ChatOllama({
    model: process.env.OLLM_MODEL_NAME,
    baseUrl: process.env.OLLAMA_URL,
    numCtx: 8192,
});

export const gllm = new ChatGoogle({
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.GOOGLE_MODEL_NAME,
});

//export const vllm = new ChatOpenAI({
//    model: process.env.VLLM_MODEL_NAME,
//    apiKey: "dummy",
//    configuration: {
//        baseURL: process.env.VLLM_URL,
//    },
//});
//
//export const openAi = new ChatOpenAI({
//    model: process.env.OPENAI_MODEL_NAME,
//    apiKey: process.env.OPENAI_API_KEY,
//    configuration: {
//        baseURL: process.env.OPENAI_URL,
//    }
//});
