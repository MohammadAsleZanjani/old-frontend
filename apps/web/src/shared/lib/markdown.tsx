import { type ReactNode } from "react";

// Very small markdown-lite renderer: ## headings, paragraphs, - bullets, ```code blocks
export function renderMarkdown(src: string): { nodes: ReactNode[]; toc: { id: string; text: string }[] } {
  const lines = src.split("\n");
  const nodes: ReactNode[] = [];
  const toc: { id: string; text: string }[] = [];
  let i = 0;
  let key = 0;

  const slug = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-").slice(0, 80) || `h-${key}`;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      nodes.push(
        <pre key={key++} className="my-6 overflow-x-auto rounded-xl border border-border bg-card/60 p-4 text-xs font-mono leading-6 text-foreground/90">
          <code>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      const id = slug(text);
      toc.push({ id, text });
      nodes.push(
        <h2 key={key++} id={id} className="scroll-mt-28 mt-12 mb-4 font-display text-2xl sm:text-3xl font-black text-gradient-gold">
          {text}
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(lines[i].slice(2)); i++; }
      nodes.push(
        <ul key={key++} className="my-4 list-disc space-y-2 ps-6 text-foreground/90 leading-8">
          {items.map((t, idx) => <li key={idx}>{t}</li>)}
        </ul>
      );
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    // paragraph: gather until blank
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("## ") && !lines[i].startsWith("- ") && !lines[i].startsWith("```")) {
      buf.push(lines[i]); i++;
    }
    nodes.push(
      <p key={key++} className="my-4 text-foreground/85 leading-8">{buf.join(" ")}</p>
    );
  }

  return { nodes, toc };
}
