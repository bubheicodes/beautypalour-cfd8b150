import Link from "next/link";
import type { ReactNode } from "react";

// A small Markdown subset for help articles: headings (## / ###), paragraphs, ordered and
// unordered lists, **bold**, *italic*, `code` and [links](/path or https://…). Everything is
// rendered as React elements — never as HTML — so article text can't inject markup.

type Block =
  | { kind: "h2" | "h3" | "p" | "quote"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function parse(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const list = line.match(/^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/);
    if (!line.trim()) flush();
    else if (line.startsWith("### ")) (flush(), blocks.push({ kind: "h3", text: line.slice(4) }));
    else if (line.startsWith("## ") || line.startsWith("# ")) (flush(), blocks.push({ kind: "h2", text: line.replace(/^#+\s/, "") }));
    else if (line.startsWith("> ")) (flush(), blocks.push({ kind: "quote", text: line.slice(2) }));
    else if (list) {
      flush();
      const kind = list[1] ? "ul" : "ol";
      const last = blocks[blocks.length - 1];
      if (last && last.kind === kind) last.items.push(list[3]);
      else blocks.push({ kind, items: [list[3]] });
    } else if (/^\s{2,}\S/.test(line) && blocks.at(-1)?.kind.match(/^[uo]l$/) && !para.length) {
      const last = blocks[blocks.length - 1] as { items: string[] };
      last.items[last.items.length - 1] += ` ${line.trim()}`; // wrapped list item
    } else para.push(line.trim());
  }
  flush();
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(href: string): string | null {
  return /^(https:\/\/|http:\/\/|\/(?!\/)|#)/.test(href) ? href : null;
}

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-semibold text-ink-100">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i} className="num rounded bg-fg/[0.07] px-1.5 py-0.5 text-[0.85em] text-ink-100">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return link[1];
      return href.startsWith("/") ? (
        <Link key={i} href={href} className="font-medium text-brand-light hover:underline">{link[1]}</Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-brand-light hover:underline">{link[1]}</a>
      );
    }
    return part;
  });
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="space-y-4 text-[0.95rem] leading-relaxed text-ink-300">
      {parse(source).map((b, i) => {
        switch (b.kind) {
          case "h2":
            return <h2 key={i} className="pt-3 text-xl font-bold tracking-tight text-ink-100">{inline(b.text)}</h2>;
          case "h3":
            return <h3 key={i} className="pt-2 text-lg font-semibold text-ink-100">{inline(b.text)}</h3>;
          case "quote":
            return <blockquote key={i} className="border-l-2 border-brand/50 pl-4 text-ink-400">{inline(b.text)}</blockquote>;
          case "ul":
            return <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-brand-light">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>;
          case "ol":
            return <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:text-brand-light">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>;
          default:
            return <p key={i}>{inline(b.text)}</p>;
        }
      })}
    </div>
  );
}
