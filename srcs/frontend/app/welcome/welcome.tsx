import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour 👋 Je suis ton assistant juridique." },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const [thinking, setThinking] = useState("");
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const bufferRef = useRef("");
  const docModeRef = useRef(false);

  useEffect(() => {
    const ws = new WebSocket("wss://localhost/llm");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "thinking") {
        if (showThinking) setThinking((p) => p + data.chunk);
        return;
      }

      if (data.status === "answer") {
        setThinking("");

        const chunk = data.chunk;
        bufferRef.current += chunk;

        if (bufferRef.current.includes("<!-- DOCUMENT_START -->")) {
          docModeRef.current = true;
          setIsGeneratingDoc(true);
        }

        const cleaned = bufferRef.current
          .replace("<!-- DOCUMENT_START -->", "")
          .replace("<!-- DOCUMENT_END -->", "");

        setMessages((prev) => {
          const last = prev[prev.length - 1];

          if (last?.role === "assistant-stream") {
            return [...prev.slice(0, -1), { ...last, content: cleaned }];
          }

          return [...prev, { role: "assistant-stream", content: cleaned }];
        });

        return;
      }

      console.log(data);
      if (data.status === "file") {
        setDocuments((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            files: data.files,
          },
        ]);

        docModeRef.current = false;
        setIsGeneratingDoc(false);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "📄 Document disponible" },
        ]);

        return;
      }

      if (data.status === "finished") {
        setIsLoading(false);
        setThinking("");
        bufferRef.current = "";
        docModeRef.current = false;
        setIsGeneratingDoc(false);
      }
    };

    return () => ws.close();
  }, [showThinking]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const ws = wsRef.current;
    if (!ws || !inputRef.current) return;

    const text = inputRef.current.innerText.trim();
    if (!text || isLoading) return;

    inputRef.current.innerText = "";

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    ws.send(JSON.stringify({ messages: newMessages, think: showThinking }));
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#050814] via-[#0b1220] to-[#070b14] text-white overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-80 border-r border-white/10 p-4 bg-white/5 backdrop-blur-xl">
        <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
          Documents
        </h2>

        {documents.length === 0 && (
          <p className="text-xs text-white/30">Aucun document généré</p>
        )}

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <div className="text-xs text-white/60 mb-2 truncate">
                {doc.files.name || "Document"}
              </div>

              {doc.files.pdf && (
                <a
                  href={`https://localhost/docs${doc.files.pdf}`}
                  className="block text-xs bg-red-500/70 hover:bg-red-500 px-3 py-2 rounded-xl mb-2"
                >
                  📄 PDF
                </a>
              )}

              {doc.files.docx && (
                <a
                  href={`https://localhost/docs${doc.files.docx}`}
                  className="block text-xs bg-blue-500/70 hover:bg-blue-500 px-3 py-2 rounded-xl"
                >
                  📝 DOCX
                </a>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* CHAT */}
      <main className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="font-semibold tracking-wide">⚖️ LegalIA</div>

          <Link
            to="/auth"
            className="text-xs px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
          >
            Login
          </Link>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-lg backdrop-blur-md
                ${m.role === "user"
                    ? "bg-blue-600"
                    : "bg-white/5 border border-white/10"}`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {isGeneratingDoc && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/60 animate-pulse">
                📄 Génération du document...
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* THINKING */}
        {showThinking && thinking && (
          <div className="px-6 text-xs text-white/40 italic">
            🧠 {thinking}
          </div>
        )}

        {/* INPUT */}
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 shadow-lg">

            <div
              ref={inputRef}
              contentEditable
              className="flex-1 outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            <button
              onClick={() => setShowThinking((v) => !v)}
              className={`text-xs px-3 py-2 rounded-xl transition ${showThinking ? "bg-green-500" : "bg-white/10"}`}
            >
              🧠
            </button>

            <button
              onClick={send}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm transition shadow-md"
            >
              ➤
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}
