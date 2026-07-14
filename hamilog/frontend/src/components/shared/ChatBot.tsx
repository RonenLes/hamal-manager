"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { sendChatbotMessage } from "@/lib/api-client";
import { limitWords } from "@/lib/text-limit";
import Icon from "@/components/shared/Icon";

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

// Renders the chat bot component.
export default function ChatBot() {
  const pathname = usePathname();
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
      const nextMessages: ChatMessage[] = [
        ...messages,
        { role: "user", text: userMessage },
      ];
      const data = await sendChatbotMessage(userMessage, {
        pagePath: pathname,
        history: nextMessages.slice(-8),
      });
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
        <div className="mb-3 w-80 rounded-xl border border-app bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-main">Hamilog Assistant</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-card-soft hover:text-main"
              aria-label="Close assistant"
            >
              <Icon name="close" className="h-4 w-4" />
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
              onChange={(e) => setMessage(limitWords(e.target.value))}
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
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-500"
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      >
        <Icon name={isOpen ? "close" : "chat"} className="h-6 w-6" />
      </button>
    </div>
  );
}
