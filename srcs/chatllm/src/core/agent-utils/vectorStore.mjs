import { Client } from "@elastic/elasticsearch";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { embeddings } from "./models.mjs";
import * as fs from "node:fs";

const config = {
    node: process.env.ELASTIC_HOSTS ?? "https://es01:9200",
};

if (process.env.ELASTIC_API_KEY) {
    config.auth = {
        apiKey: process.env.ELASTIC_API_KEY,
    };
} else if (process.env.ELASTIC_USER && process.env.ELASTIC_PASSWORD) {
    config.auth = {
        username: process.env.ELASTIC_USER,
        password: process.env.ELASTIC_PASSWORD,
    };
}

if (process.env.ELASTIC_CERT_PATH) {
    config.tls = {
        ca: fs.readFileSync(process.env.ELASTIC_CERT_PATH),
        rejectUnauthorized: false,
    }
}

const clientArgs = {
    client: new Client(config),
    indexName: process.env.ELASTIC_INDEX ?? "test_vectorstore",
};

const vectorStore = new ElasticVectorSearch(embeddings, clientArgs);

export default vectorStore;