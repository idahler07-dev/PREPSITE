import siteConfig from "@site";

/** Applies the brand colors from site.config.ts on top of the default theme tokens. */
export function BrandStyle({ nonce }: { nonce?: string }) {
  const { light, dark } = siteConfig.colors;
  const vars = (c: { primary: string; primaryForeground: string; accent: string; accentForeground: string }) =>
    `--primary:${c.primary};--primary-foreground:${c.primaryForeground};--ring:${c.primary};--accent:${c.accent};--accent-foreground:${c.accentForeground};`;
  const css = `:root{${vars(light)}}.dark{${vars(dark)}}`;
  // Browsers hide nonce values from the DOM, so React sees a harmless mismatch.
  return <style nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: css }} />;
}
