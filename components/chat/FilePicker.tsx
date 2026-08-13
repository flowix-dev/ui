"use client";

import { useRef, useState } from "react";
import { chatApi } from "@/lib/api";
import { ChatFile } from "@/lib/types";

interface FilePickerProps {
  chatId: string;
  files: ChatFile[];
  onChange: (files: ChatFile[]) => void;
}

export default function FilePicker({
  chatId,
  files,
  onChange,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) {
      return;
    }
    setUploading(true);
    try {
      const uploaded: ChatFile[] = [];
      for (const file of Array.from(selected)) {
        const response = await chatApi.uploadFile(chatId, file);
        uploaded.push(response.data.file as ChatFile);
      }
      onChange([...files, ...uploaded]);
    } catch {
      onChange(files);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeFile = (fileId: string) => {
    onChange(files.filter((file) => file._id !== fileId));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-body hover:bg-surface-strong hover:text-ink disabled:opacity-50 cursor-pointer"
        title="Subir archivos"
      >
        {uploading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-body border-t-transparent" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        )}
      </button>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file) => (
            <span
              key={file._id}
              className="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2 py-0.5 text-[0.6875rem] font-medium text-body"
            >
              📎 {file.name}
              <button
                type="button"
                onClick={() => removeFile(file._id)}
                className="ml-0.5 text-muted hover:text-ink cursor-pointer"
                title="Quitar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
