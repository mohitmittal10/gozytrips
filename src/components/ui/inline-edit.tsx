"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  placeholder?: string;
  onEditStart?: () => void;
  disabled?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  multiline = false,
  placeholder = "Enter text...",
  onEditStart,
  disabled = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Use setTimeout to ensure the element is focused before selecting
      setTimeout(() => {
        if (inputRef.current) {
          if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
            inputRef.current.select();
          }
        }
      }, 0);
    }
  }, [editing]);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    if (disabled) {
      return <span className={className}>{value}</span>;
    }

    return (
      <span
        className={cn(
          "group/edit cursor-pointer inline-flex items-center gap-1.5 rounded px-1 -mx-1 transition-colors hover:bg-primary/10 border-b border-dashed border-zinc-700/60 hover:border-primary/50",
          className
        )}
        onClick={() => {
          if (onEditStart) onEditStart();
          setEditing(true);
        }}
        title="Click to edit"
      >
        <span className="flex-1">{value}</span>
        <Pencil className="w-3 h-3 text-primary/40 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
      </span>
    );
  }

  const sharedProps = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
      if (e.key === "Escape") cancel();
    },
    onBlur: commit,
    className: cn(
      "bg-white/10 border border-primary/30 rounded px-2 py-1 text-inherit focus:outline-none focus:ring-2 focus:ring-primary/50 w-full",
      inputClassName
    ),
    placeholder,
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={3}
        {...sharedProps}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      {...sharedProps}
    />
  );
}

