import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ws from "../lib/WebSocketManager";

export default function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);

  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Nouvelle conversation 👋 Posez votre question.",
    },
  ]);

  const [input, setInput] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const [thinking, setThinking] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const fetchChatHistory = async () => {
      try {
        let response = await fetch(`https://localhost/docs/chat/${activeConversation}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Barear ${token}`
          }
        });
        if (response.status != 200)
          return ;
        let chatHistory = await response.json();
        if (chatHistory.length)
          setMessages(chatHistory);
      } catch(err) {
        console.error(err);
      }
    };

    fetchChatHistory();
  }, [activeConversation]);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const fetchChatBox = async () => {
      try {
        let response = await fetch("https://localhost/docs/chat-list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Barear ${token}`
          }
        });
        if (response.status != 200)
          return ;
        let chatList = await response.json();
        setConversations(chatList);
      } catch(err) {
        console.error(err);
      }
    };
    ws.connect(token);

    let answerBuffer = "";
    let thinkingBuffer = "";

    const unsubscribe = ws.subscribe((data) => {
      if (data.chatBoxId != activeConversation)
        return ;
      
      if (data.status === "thinking") {
        if (showThinking) {
          thinkingBuffer += data.chunk || "";
          setThinking(thinkingBuffer);
        }
        return;
      }

      if (data.status === "answer") {
        setIsLoading(true);

        const chunk = data.chunk || "";
        answerBuffer += chunk;

        setMessages((prev) => {
          const last = prev[prev.length - 1];

          if (last?.role === "assistant-stream") {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: answerBuffer,
              },
            ];
          }

          return [
            ...prev,
            {
              role: "assistant-stream",
              content: answerBuffer,
            },
          ];
        });

        return;
      }

      if (data.status === "finished") {
        setIsLoading(false);

        setMessages((prev) => {
          const last = prev[prev.length - 1];

          if (last?.role === "assistant-stream") {
            return [
              ...prev.slice(0, -1),
              {
                role: "assistant",
                content: last.content,
              },
            ];
          }

          return prev;
        });

        answerBuffer = "";
        thinkingBuffer = "";
        setThinking("");
      }
    });
    fetchChatBox();
    return () => {
      unsubscribe();
    };
  }, [showThinking, activeConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const resetToNewChat = () => {
    setActiveConversation(null);
    setThinking("");
    setMessages([
      {
        role: "assistant",
        content: "Nouvelle conversation 👋 Posez votre question.",
      },
    ]);
  };

  const createLocalConversationIfNeeded = () => {
    if (activeConversation) return activeConversation;

    const tempId = conversations.length + 1;

    const newConversation = {
      id: tempId,
      title: "Nouvelle conversation",
      updatedAt: new Date().toLocaleDateString(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(tempId);

    return tempId;
  };

  const sendMessage = () => {
    // sécurité totale : impossible d’envoyer pendant le loading
    if (isLoading) return;

    // sécurité input vide
    if (!input.trim()) return;

    const currentChatId = createLocalConversationIfNeeded();

    const cleanInput = input.trim();

    const userMessage = {
      role: "user",
      content: cleanInput,
    };

    const updatedMessages = [...messages, userMessage];

    // lock immédiat UI
    setIsLoading(true);

    // reset UI
    setInput("");
    setThinking("");

    // affichage instantané message user
    setMessages(updatedMessages);

    try {
      ws.send({
        chatBoxId: currentChatId,
        think: showThinking,
        messages: updatedMessages.map((message) => ({
          role:
            message.role === "assistant-stream"
              ? "assistant"
              : message.role,
          content: message.content,
        })),
      });
    } catch (err) {
      console.error("WS send error:", err);

      // rollback si erreur websocket
      setIsLoading(false);

      setMessages((prev) =>
        prev.filter(
          (msg, index) =>
            !(index === prev.length - 1 && msg.content === cleanInput)
        )
      );
    }
  };

  const deleteConversation = (id: number) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (activeConversation === id) {
      resetToNewChat();
    }
  };

  const handleUpload = () => {
    alert("Upload document (backend plus tard)");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#050816] via-[#0b1220] to-[#070b14] text-white">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-semibold">⚖️ IA Juridique</div>
          <div className="text-xs text-white/40">Assistant entreprise</div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <Link
            to="/"
            className="text-xs text-white/60 hover:text-white transition"
          >
            ← Dashboard
          </Link>

          <button
            onClick={resetToNewChat}
            className="w-full rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 px-4 py-3 text-sm transition"
          >
            + Nouveau chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between rounded-2xl border p-3 transition ${activeConversation === conv.id
                ? "bg-white/10 border-white/20"
                : "border-transparent hover:bg-white/5"
                }`}
            >
              <button
                onClick={() => setActiveConversation(conv.id)}
                className="flex-1 text-left"
              >
                <div className="text-sm truncate">{conv.title}</div>
                <div className="text-xs text-white/40">
                  {conv.updatedAt}
                </div>
              </button>

              <button
                onClick={() => deleteConversation(conv.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 px-6 flex items-center border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <h1 className="font-medium">Chat Assistant</h1>
        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === "user"
                ? "justify-end"
                : "justify-start"
                }`}
            >
              {message.role === "user" ? (
                <div className="max-w-[70%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  {message.content}
                </div>
              ) : (
                <div className="max-w-[80%] text-sm leading-relaxed text-white/90">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {showThinking && thinking && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60 italic">
                🧠 {thinking}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* INPUT */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              rows={2}
              disabled={isLoading}
              className={`flex-1 resize-none bg-transparent outline-none text-sm ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading) sendMessage();
                }
              }}
            />

            <button
              onClick={handleUpload}
              disabled={isLoading}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${isLoading
                ? "opacity-40 cursor-not-allowed border-white/5 bg-white/5"
                : "border-white/10 bg-white/10 hover:bg-white/20"
                }`}
              title="Upload"
            >
              📎
            </button>

            <button
              onClick={() => !isLoading && setShowThinking((prev) => !prev)}
              disabled={isLoading}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${isLoading
                ? "opacity-40 cursor-not-allowed border-white/5 bg-white/5"
                : showThinking
                  ? "bg-green-500 text-black border-green-400"
                  : "bg-white/10 hover:bg-white/20 border-white/10"
                }`}
              title="Thinking"
            >
              🧠
            </button>

            <button
              onClick={sendMessage}
              disabled={isLoading}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition ${isLoading
                ? "opacity-40 cursor-not-allowed border-white/5 bg-white/5"
                : "border-white/10 bg-white/10 hover:bg-white/20"
                }`}
              title="Envoyer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "➤"
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}