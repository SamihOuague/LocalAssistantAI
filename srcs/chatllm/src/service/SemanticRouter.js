import OllamaProvider from "../core/OllamaProvider.js";

const provider = new OllamaProvider("nomic-embed-text");

class   SemanticRoute {
    constructor(name, examples = []) {
        this.name = name;
        this.examples = examples;
        this.embeds = [];
    }

    async examplesEmbedding() {
        for (const i in this.examples)
        {
            const response = await provider.generateEmbedding(this.examples[i]);
            this.embeds.push(response.embedding);
        }
    }
}

class   SemanticRouter {
    constructor() {
        this.routes = [];
    }

    async route(name, examples = []) {
        const   route = new SemanticRoute(name, examples)
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

    async   classify(prompt) {
        const embed = (await provider.generateEmbedding(prompt)).embedding;
        let     best = {score: 0.0};
        let     score = 0;

        
        for (const r in this.routes) {
            for (const e in this.routes[r].embeds) {
                score = this.cosineSimilarity(embed, this.routes[r].embeds[e]);
                if (score > best.score)
                    best = {route: this.routes[r], score};
            }
        }
        return best;
    }

    async initRoutes()
    {
        await this.route("simple", [
            "Quelle heure est-il ?",
            "Traduis hello en français",
            "Donne moi la capitale du Japon",
            "Écris une fonction addition en JS",
            "Résume ce texte",
            "Comment créer un tableau en JavaScript ?"
        ]);

        await this.route("medium", [
            "Fais un plan d'entraînement pour perdre du poids",
            "Compare React et Vue avec avantages et inconvénients",
            "Crée une API Express avec authentification JWT",
            "Explique les promesses en JavaScript avec exemples",
            "Optimise cette requête SQL",
            "Écris un script Node.js qui lit un fichier CSV"
        ]);

        await this.route("complex", [
            "Conçois une architecture microservice scalable pour un SaaS",
            "Crée un assistant IA avec mémoire et vector database",
            "Analyse cette codebase et propose un refactoring complet",
            "Développe un système de recommandation distribué",
            "Explique comment entraîner un modèle transformer depuis zéro",
            "Construis un clone de ChatGPT avec streaming et RAG"
        ]);
    }
}

export default SemanticRouter;