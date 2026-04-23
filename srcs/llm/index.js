import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import { Ollama } from "ollama";
import fs from "fs";
import path from "path";
import { marked } from "marked";
import puppeteer from "puppeteer";
import { Document, Packer, Paragraph, TextRun } from "docx";

const client = new Ollama({
  host: "http://172.17.0.1:11434"
});

// ================= INIT =================
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================= DIRS =================
const BASE_DIR = process.cwd();
const DOCUMENTS_DIR = path.join(BASE_DIR, "documents");

const MD_DIR = path.join(DOCUMENTS_DIR, "md");
const PDF_DIR = path.join(DOCUMENTS_DIR, "pdf");
const DOCX_DIR = path.join(DOCUMENTS_DIR, "docx");

for (const dir of [MD_DIR, PDF_DIR, DOCX_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

app.use("/documents", express.static(DOCUMENTS_DIR));

// ================= HELPERS =================
async function mdToPDF(md, filenameBase) {
  const html = `
  <html>
    <body style="font-family: Arial; padding: 40px; line-height: 1.6;">
      ${marked.parse(md)}
    </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const filePath = path.join(PDF_DIR, `${filenameBase}.pdf`);

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return filePath;
}

async function mdToDocx(md, filenameBase) {
  const doc = new Document({
    sections: [
      {
        children: md.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line)],
            })
        ),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  const filePath = path.join(DOCX_DIR, `${filenameBase}.docx`);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

// ================= WS =================
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (data) => {
    try {
      const { messages, think = true } = JSON.parse(data.toString());

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
            })
          );
          thinking += chunk.message.thinking;
        }

        if (chunk.message?.content) {
          ws.send(
            JSON.stringify({
              status: "answer",
              chunk: chunk.message.content,
            })
          );
          content += chunk.message.content;
        }
      }

      const isDocument =
        content.includes("<!-- DOCUMENT_START -->");

      const baseName = `doc-${Date.now()}`;

      let files = null;

      if (isDocument) {
        const clean = content
          .replace("<!-- DOCUMENT_START -->", "")
          .replace("<!-- DOCUMENT_END -->", "")
          .trim();

        const mdPath = path.join(MD_DIR, `${baseName}.md`);
        fs.writeFileSync(mdPath, clean);

        await mdToPDF(clean, baseName);
        await mdToDocx(clean, baseName);

        files = {
          md: `/documents/md/${baseName}.md`,
          pdf: `/documents/pdf/${baseName}.pdf`,
          docx: `/documents/docx/${baseName}.docx`,
          name: `${baseName}`,
        };

        ws.send(JSON.stringify({ status: "file", files }));
      }

      ws.send(
        JSON.stringify({
          status: "finished",
          newMessages: [
            {
              role: "assistant",
              content,
              thinking,
              files,
            },
          ],
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