import { tool } from "@langchain/core/tools";
import vectorStore from "./vectorStore.mjs";
import * as z from "zod";

const retrieveSchema = z.object({ query: z.string() });

export const retrieve = tool(
    async ({ query }) => {
        const retrievedDocs = await vectorStore.similaritySearch(query, 5);
        const serialized = retrievedDocs.map(
                (doc) => `Source: chatllm_rag\nContent: ${doc.pageContent}`
            )
            .join("\n");
        return [serialized, retrievedDocs];
    },
    {
        name: "retrieve",
        description: "Retrieve information related to a query.",
        schema: retrieveSchema,
        responseFormat: "content_and_artifact",
    }
);