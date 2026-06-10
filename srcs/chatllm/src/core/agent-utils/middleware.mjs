import { openAi, vllm, ollm } from "./models.mjs";
import { createMiddleware } from "langchain";
import { agentRouter } from "./SemanticRouter.mjs";

export const dynamicModelSelection = createMiddleware({
  name: "DynamicModelSelection",
  wrapModelCall: async (request, handler) => {
    const messageCount = request.messages.length;
    const r = await agentRouter.classify(request.messages[messageCount - 1]);

    if (r && r.name == "complex") {
      return handler({
        ...request,
        model: (!process.env.OPENAI_URL) ? ollm : openAi,
      });
    }
    return handler({
      ...request,
      model: ollm
    });
  },
});