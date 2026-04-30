import express from 'express';
import cors from 'cors';
import users from './users/Router.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(users);

export default app;