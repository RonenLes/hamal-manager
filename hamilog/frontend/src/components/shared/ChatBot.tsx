"use client";

import { useState } from "react";
import { sendChatbotMessage } from "@/lib/api-client";

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

// Renders the chat bot component.
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi, I am Hamilog Assistant. How can I help?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Handles the send action.
  async function handleSend() {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const data = await sendChatbotMessage(userMessage);
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, I could not connect to the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 rounded-2xl border border-app bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-main">Hamilog Assistant</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-muted hover:text-main"
            >
              ✕
            </button>
          </div>

          <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl px-3 py-2 text-sm ${
                  item.role === "user"
                    ? "ml-8 bg-blue-600 text-white"
                    : "mr-8 bg-card-soft text-main"
                }`}
              >
                {item.text}
              </div>
            ))}

            {loading && (
              <div className="mr-8 rounded-xl bg-card-soft px-3 py-2 text-sm text-muted">
                Thinking...
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask something..."
              className="min-w-0 flex-1 rounded-xl border border-app bg-app px-3 py-2 text-sm text-main outline-none"
            />

            <button
              type="button"
              onClick={handleSend}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full bg-blue-600 px-5 py-4 text-xl text-white shadow-xl hover:bg-blue-500"
      >
        💬
      </button>
    </div>
  );
}