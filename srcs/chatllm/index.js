import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import url from "url";
import { Ollama } from "ollama";
import { ChatBox, ChatMessage } from "./src/chatllm/Model.js";
import app from "./src/app.js";

const client = new Ollama({
  host: "http://172.17.0.1:11434"
});

// ================= INIT =================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {

  try {
    const parameters = url.parse(req.url, true);
    const token = parameters.query.token;

    if (!token) {
      ws.close();
      return;
    }

    const decoded = jwt.verify(token, "secretkey");

    ws.userId = decoded.userId;

    console.log("User connecté :", ws.userId);

    ws.on("message", (message) => {
      console.log("Message reçu :", message.toString());
    });

  } catch (err) {
    console.log("JWT invalid", err);
    ws.close();
  }

  ws.on("message", async (data) => {
    try {
      const { messages, think = true, chatBoxId } = JSON.parse(data.toString());
      let chatBox = await ChatBox.findByPk(chatBoxId);

      if (!chatBox) {
        chatBox = ChatBox.build({
          idUser: ws.userId,
          title: "Nouvelle conversation",
        });
        chatBox = await chatBox.save();
      }

      let userMessage = ChatMessage.build({
        ...messages[messages.length - 1],
        ChatBoxId: chatBox.dataValues.id
      });
      
      await userMessage.save();
      
      const stream = await client.chat({
        model: "LegallyAI",
        messages,
        stream: true,
        think,
      });

      let content = "";
      let thinking = "";

      for await (const chunk of stream) {
        if (chunk.message?.thinking) {
          ws.send(
            JSON.stringify({
              status: "thinking",
              chunk: chunk.message.thinking,
              chatBoxId
            })
          );
          thinking += chunk.message.thinking;
        }

        if (chunk.message?.content) {
          ws.send(
            JSON.stringify({
              status: "answer",
              chunk: chunk.message.content,
              chatBoxId
            })
          );
          content += chunk.message.content;
        }
      }

      let message = ChatMessage.build({
        ChatBoxId: chatBox.dataValues.id,
        role: "assistant",
        content,
        thinking
      });

      await message.save();

      ws.send(
        JSON.stringify({
          status: "finished",
          newMessages: [
            {
              role: "assistant",
              content,
              thinking
            },
          ],
          chatBoxId
        })
      );
    } catch (err) {
      console.error(err);
      ws.send(
        JSON.stringify({
          status: "error",
          message: "Server error",
        })
      );
    }
  });
});

server.listen(3002, () => {
  console.log("WS server running on http://localhost:3002");
});