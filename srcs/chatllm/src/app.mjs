import router from "./api/Router.mjs";
import express, { json } from "express";

const app = express();

app.use(json());

// Source - https://stackoverflow.com/a/58165719
 app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ status: 400, message: err.message }); // Bad request
    }
    next();
});

app.use("/", router);

export default app;