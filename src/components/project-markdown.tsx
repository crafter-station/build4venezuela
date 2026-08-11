import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ProjectMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, ...props }) => (
            <a
              className="text-primary underline decoration-primary/40 underline-offset-4 transition hover:text-accent"
              rel="noreferrer"
              target="_blank"
              {...props}
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="mt-10 font-mono text-3xl font-black uppercase leading-tight tracking-[-0.04em] first:mt-0 sm:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-9 font-mono text-2xl font-black uppercase leading-tight tracking-[-0.03em] sm:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 font-mono text-xl font-bold uppercase leading-tight tracking-[0.02em] sm:text-2xl">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mt-5 text-base leading-8 tracking-[0.04em] text-foreground/78">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mt-5 list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-5 list-decimal space-y-2 pl-6">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-7 tracking-[0.04em] text-foreground/78">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-accent border-l-4 pl-5 text-foreground/75 italic">
              {children}
            </blockquote>
          ),
          img: ({ alt, ...props }) => (
            // Markdown images must never retain an intrinsic width wider than the article.
            // biome-ignore lint/performance/noImgElement: Markdown image hosts and dimensions are not known ahead of time.
            <img
              className="mt-6 h-auto max-w-full rounded-xl"
              alt={alt ?? ""}
              {...props}
            />
          ),
          table: ({ children }) => (
            <div className="mt-6 w-full overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-max border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-border border-b px-3 py-2 font-mono uppercase tracking-[0.08em]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-border border-b px-3 py-2 align-top">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-sm text-primary">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mt-6 overflow-x-auto rounded-xl border border-border bg-secondary p-4 text-sm leading-6">
              {children}
            </pre>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
