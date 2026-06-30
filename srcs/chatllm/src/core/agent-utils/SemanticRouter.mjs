import { embeddings } from "./models.mjs";

class SemanticRoute {
    constructor(name, examples = []) {
        this.name = name;
        this.examples = examples;
        this.embeds = [];
    }

    async examplesEmbedding() {
        this.embeds = await embeddings.embedDocuments(this.examples);
    }
}

class SemanticRouter {
    constructor() {
        this.routes = [];
    }

    async route(name, examples = []) {
        const route = new SemanticRoute(name, examples)
        await route.examplesEmbedding();
        this.routes.push(route);
    }

    cosineSimilarity(a, b) {
        let dot = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        return dot / (normA * normB);
    }

    async classify(prompt) {
        const { content } = prompt;

        try {
            const embed = await embeddings.embedQuery(content);
        
            let best = { score: 0.0 };
            let score = 0;


            for (const r in this.routes) {
                for (const e in this.routes[r].embeds) {
                    score = this.cosineSimilarity(embed, this.routes[r].embeds[e]);
                    if (score > best.score)
                        best = { ...this.routes[r], score };
                }
            }
            return best;
        } catch(err) {
            console.error(err);
            return ({name: "complex", score: 0, examples: []});
        }
    }

    async initRoutes(routes) {

        for (let i = 0; i < routes.length; i++) {
            let { name, examples } = routes[i];

            await this.route(name, examples);
        }
    }
}

export const defaultRoutes = [
    {
        name: "simple",
        examples: [
            "Hello",
            "How are you ?",
            "Summarize this conversation"
        ]
    },
    {
        name: "medium",
        examples: [
            "Give me more informations about this project",
            "Tell me about the architecture",
            "What is a RAG ?",
            "What modules are claimed ?"
        ]
    },
    {
        name: "complex",
        examples: [
            "Write a script that interact with the api",
            "Give me a complete detailed description of the project",
            "Explain every single service in this docs"
        ]
    },
]

export const agentRouter = new SemanticRouter();

export default SemanticRouter;