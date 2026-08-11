"use client";

import { useRef, useState } from "react";
import { ProjectMarkdown } from "@/components/project-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MarkdownEditorProps = {
  id: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
};

type FormatAction = {
  label: string;
  title: string;
  apply: (selection: string) => { nextSelection: string; fallback: string };
};

const formatActions: FormatAction[] = [
  {
    label: "B",
    title: "Bold",
    apply: (selection) => ({
      nextSelection: `**${selection || "bold text"}**`,
      fallback: "**bold text**",
    }),
  },
  {
    label: "I",
    title: "Italic",
    apply: (selection) => ({
      nextSelection: `_${selection || "italic text"}_`,
      fallback: "_italic text_",
    }),
  },
  {
    label: "H2",
    title: "Heading",
    apply: (selection) => ({
      nextSelection: `## ${selection || "Section heading"}`,
      fallback: "## Section heading",
    }),
  },
  {
    label: "List",
    title: "Bulleted list",
    apply: (selection) => ({
      nextSelection: selection
        ? selection
            .split("\n")
            .map((line) => `- ${line}`)
            .join("\n")
        : "- First point\n- Second point",
      fallback: "- First point\n- Second point",
    }),
  },
  {
    label: "Quote",
    title: "Quote",
    apply: (selection) => ({
      nextSelection: selection
        ? selection
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n")
        : "> Helpful context",
      fallback: "> Helpful context",
    }),
  },
  {
    label: "Link",
    title: "Link",
    apply: (selection) => ({
      nextSelection: `[${selection || "link text"}](https://example.com)`,
      fallback: "[link text](https://example.com)",
    }),
  },
];

export function MarkdownEditor({
  id,
  name,
  onChange,
  placeholder,
  required,
  value,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");

  function applyFormat(action: FormatAction) {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const selectedText = value.slice(selectionStart, selectionEnd);
    const { nextSelection, fallback } = action.apply(selectedText);
    const insert = selectedText ? nextSelection : fallback;
    const nextValue = `${value.slice(0, selectionStart)}${insert}${value.slice(selectionEnd)}`;

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(
        selectionStart,
        selectionStart + insert.length,
      );
    });
  }

  return (
    <div className="border border-input bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-border border-b p-2">
        <div className="flex flex-wrap gap-1">
          {formatActions.map((action) => (
            <Button
              className="font-mono uppercase tracking-[0.12em]"
              key={action.title}
              onClick={() => applyFormat(action)}
              size="xs"
              title={action.title}
              type="button"
              variant="outline"
            >
              {action.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            aria-pressed={mode === "write"}
            className="font-mono uppercase tracking-[0.12em] aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            onClick={() => setMode("write")}
            size="xs"
            type="button"
            variant="outline"
          >
            Write
          </Button>
          <Button
            aria-pressed={mode === "preview"}
            className="font-mono uppercase tracking-[0.12em] aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            onClick={() => setMode("preview")}
            size="xs"
            type="button"
            variant="outline"
          >
            Preview
          </Button>
        </div>
      </div>
      {mode === "write" ? (
        <Textarea
          className="min-h-72 border-0 text-sm leading-6 focus-visible:ring-0"
          id={id}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          ref={textareaRef}
          required={required}
          value={value}
        />
      ) : (
        <div className="min-h-72 px-3 py-4">
          {value.trim() ? (
            <ProjectMarkdown markdown={value} />
          ) : (
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Preview appears here as you write.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
