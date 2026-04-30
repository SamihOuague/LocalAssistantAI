import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import { isAuthWs, llmSubscribe } from "./src/middleware/ws.js";
import app from "./src/app.js";

// ================= INIT =================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  if (!isAuthWs(ws, req))
    return ;
  llmSubscribe(ws);
});

server.listen(3002, () => {
  console.log("WS server running on http://localhost:3002");
});