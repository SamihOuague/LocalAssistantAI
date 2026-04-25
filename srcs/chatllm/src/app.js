import express from 'express';
import cors from 'cors';
import llm from './chatllm/Router.js';

const app = express();


app.use(cors());
app.use(express.json());
app.use(llm);

export default app;