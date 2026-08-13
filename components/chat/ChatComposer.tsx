"use client";

import { useRef, useState } from "react";
import { ChatFile } from "@/lib/types";
import FilePicker from "./FilePicker";

interface ChatComposerProps {
  chatId: string;
  disabled: boolean;
  onSend: (content: string, fileIds: string[]) => void;
}

export default function ChatComposer({
  chatId,
  disabled,
  onSend,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<ChatFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && (text.trim().length > 0 || files.length > 0);

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    onSend(
      text.trim(),
      files.map((file) => file._id),
    );
    setText("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const autoResize = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    const target = event.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-hairline-strong bg-canvas px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-hairline-strong bg-canvas-soft px-2 py-2 focus-within:border-hairline-strong">
        <FilePicker chatId={chatId} files={files} onChange={setFiles} />
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          className="max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition hover:bg-primary-active disabled:opacity-40 disabled:hover:bg-primary cursor-pointer"
          title="Enviar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl text-center text-[0.6875rem] text-muted">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
}
