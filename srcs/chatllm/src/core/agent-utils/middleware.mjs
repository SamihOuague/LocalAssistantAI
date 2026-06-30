import { gllm, ollm } from "./models.mjs";
import { createMiddleware } from "langchain";
import { agentRouter } from "./SemanticRouter.mjs";

export const dynamicModelSelection = createMiddleware({
	name: "DynamicModelSelection",
	wrapModelCall: async (request, handler) => {
		const messageCount = request.messages.length;

		if (messageCount > 0)
		{
			const msg = request.messages[messageCount - 1];
			const r = await agentRouter.classify(msg);

			if (r && r.name != "simple") {
				return handler({
					...request,
					model: gllm,
				});
			}
		}
		return handler({
			...request,
			model: ollm
		});
	},
});