"use client";

import { ChatMessage } from "@/lib/types";
import MarkdownRenderer from "./MarkdownRenderer";
import ToolCallCard from "./ToolCallCard";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-on-primary whitespace-pre-wrap">
          {message.content}
          {message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.attachments.map((attachment) => (
                <span
                  key={attachment.s3Key}
                  className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[0.6875rem] font-medium"
                >
                  📎 {attachment.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-surface-strong px-4 py-2.5 text-sm text-ink">
        {message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        {message.content ? (
          <MarkdownRenderer content={message.content} />
        ) : null}
      </div>
    </div>
  );
}
