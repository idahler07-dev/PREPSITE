import { useId } from "react";
import { CHOSEN_CONCEPT, flatMarkInner, glossMarkInner, type MarkConcept } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/*
 * The markup comes from src/lib/brand-mark.ts (static geometry, no user input),
 * shared with the icon generator so the app and the favicons always match.
 */

type Props = { className?: string; title?: string; concept?: MarkConcept };

function Svg({ className, title, html }: { className?: string; title?: string; html: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Flat mark for 16–48px: Otto in one color on the cobalt squircle (follows the theme). */
export function BrandMark({ className, title, concept = CHOSEN_CONCEPT }: Props) {
  return <Svg className={cn("size-8", className)} title={title} html={flatMarkInner(concept, { bgClass: "fill-primary", fgClass: "fill-primary-foreground", strokeClass: "stroke-primary-foreground" })} />;
}

/** Glossy 3D mark for 64px and up. Light and dark versions; CSS shows the one for the theme. */
export function BrandMarkGloss({ className, title, concept = CHOSEN_CONCEPT, theme }: Props & { theme?: "light" | "dark" }) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  if (theme) return <Svg className={cn("size-16", className)} title={title} html={glossMarkInner(concept, theme, `${id}${theme}`)} />;
  return (
    <span className={cn("relative inline-block size-16 shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <Svg className="absolute inset-0 size-full dark:hidden" html={glossMarkInner(concept, "light", `${id}l`)} />
      <Svg className="absolute inset-0 hidden size-full dark:block" html={glossMarkInner(concept, "dark", `${id}d`)} />
    </span>
  );
}
