import "katex/dist/katex.min.css"; // math styles only where math is shown
import { cn } from "@/lib/utils";

/**
 * Shows HTML produced by renderMarkdown() (src/lib/markdown/render.ts), which
 * is sanitized. Never pass any other HTML to this component.
 */
export function RichText({ html, className, ...rest }: { html: string; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("question-content", className)} dangerouslySetInnerHTML={{ __html: html }} {...rest} />;
}
