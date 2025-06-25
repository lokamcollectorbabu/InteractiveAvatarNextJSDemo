import React, { useEffect, useRef } from "react";

import { useMessageHistory, MessageSender } from "../logic";

export const MessageHistory: React.FC = () => {
  const { messages } = useMessageHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || messages.length === 0) return;

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-4 space-y-3"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white/50 text-sm">
          Conversation will appear here...
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === MessageSender.CLIENT
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.sender === MessageSender.CLIENT
                  ? "bg-blue-600/80 text-white ml-4"
                  : "bg-white/10 text-white mr-4 border border-white/20"
              }`}
            >
              <div className="text-xs opacity-70 mb-1">
                {message.sender === MessageSender.AVATAR ? "Avatar" : "You"}
              </div>
              <div className="text-sm leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};