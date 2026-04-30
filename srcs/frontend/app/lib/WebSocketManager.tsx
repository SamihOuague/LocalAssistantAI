// app/lib/websocket.ts

type MessageHandler = (data: any) => void;

class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null = null;
  private listeners: MessageHandler[] = [];
  private reconnectDelay = 2000;
  private url = "wss://localhost/llm";

  private constructor() {}

  // Singleton
  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Connection unique
  public connect(token: string) {
    if (typeof window === "undefined" || !token) return;

    if (
      this.socket &&
      (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    this.socket = new WebSocket(`${this.url}?token=${token}`);

    this.socket.onopen = () => {
      console.log("WS connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error("WS parse error:", error);
      }
    };

    this.socket.onclose = () => {
      console.log("WS disconnected → reconnecting...");

      setTimeout(() => {
        this.connect(token);
      }, this.reconnectDelay);
    };

    this.socket.onerror = (error) => {
      console.error("WS error:", error);
      this.socket?.close();
    };
  }

  public send(payload: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }

  public subscribe(callback: MessageHandler) {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}

export default WebSocketManager.getInstance();