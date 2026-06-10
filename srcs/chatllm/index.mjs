import app from "./src/app.mjs";
import { agentRouter, defaultRoutes } from "./src/core/agent-utils/SemanticRouter.mjs"

app.listen(process.env.PORT, async () => {
    await agentRouter.initRoutes(defaultRoutes);
    console.log(`Listening on port ${process.env.PORT}.`)
});