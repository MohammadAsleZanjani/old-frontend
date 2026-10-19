"use client";

import { useEffect } from "react";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Link, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

type BlogTiptapEditorProps = {
  disabled?: boolean;
  initialContent?: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, text: string) => void;
  placeholder?: string;
};

export function BlogTiptapEditor({
  disabled,
  initialContent,
  onChange,
  placeholder = "Write article content...",
}: BlogTiptapEditorProps) {
  const editor = useEditor({
    content: initialContent ?? { content: [{ type: "paragraph" }], type: "doc" },
    editable: !disabled,
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>, editor.getText({ blockSeparator: "\n\n" }));
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const tools = [
    { icon: Bold, label: "Bold", onClick: () => editor.chain().focus().toggleBold().run(), pressed: editor.isActive("bold") },
    { icon: Italic, label: "Italic", onClick: () => editor.chain().focus().toggleItalic().run(), pressed: editor.isActive("italic") },
    { icon: Heading2, label: "Heading", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), pressed: editor.isActive("heading", { level: 2 }) },
    { icon: List, label: "Bullet list", onClick: () => editor.chain().focus().toggleBulletList().run(), pressed: editor.isActive("bulletList") },
    { icon: ListOrdered, label: "Ordered list", onClick: () => editor.chain().focus().toggleOrderedList().run(), pressed: editor.isActive("orderedList") },
    { icon: Quote, label: "Quote", onClick: () => editor.chain().focus().toggleBlockquote().run(), pressed: editor.isActive("blockquote") },
    {
      icon: Link,
      label: "Link",
      onClick: () => {
        const href = window.prompt("URL");
        if (href) editor.chain().focus().setLink({ href }).run();
      },
      pressed: editor.isActive("link"),
    },
    { icon: Undo2, label: "Undo", onClick: () => editor.chain().focus().undo().run(), pressed: false },
    { icon: Redo2, label: "Redo", onClick: () => editor.chain().focus().redo().run(), pressed: false },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/70 shadow-sm">
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
          {tools.map((tool) => (
            <Tooltip key={tool.label}>
              <TooltipTrigger asChild>
                <Button
                  aria-pressed={tool.pressed}
                  className={tool.pressed ? "bg-primary/10 text-primary" : ""}
                  disabled={disabled}
                  onClick={tool.onClick}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tool.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <EditorContent
        className="prose-content min-h-72 max-w-none px-4 py-3 focus-within:outline-none [&_.tiptap]:min-h-72 [&_.tiptap]:outline-none"
        editor={editor}
      />
    </div>
  );
}
