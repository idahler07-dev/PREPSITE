import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown/render";

describe("renderMarkdown", () => {
  it("renders inline and display math with KaTeX", () => {
    const html = renderMarkdown("Solve $x^2 = 4$.\n\n$$\\frac{1}{2}$$");
    expect(html).toContain('class="katex"');
    expect(html).toContain("katex-display");
    expect(html).toContain("<math");
  });

  it("does not render raw HTML or scripts", () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror="alert(1)"> <b onclick="x()">hi</b>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("onclick");
  });

  it("removes javascript: links", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("only shows private asset images", () => {
    const html = renderMarkdown("![graph](asset:clabc1234567890) ![ext](https://evil.example/x.png)");
    expect(html).toContain('src="/api/assets/clabc1234567890"');
    expect(html).not.toContain("evil.example");
    expect(html).toContain("ext");
  });

  it("highlights uncertain text", () => {
    expect(renderMarkdown("If x = [[?5]] then")).toContain('<mark class="uncertain">5</mark>');
  });

  it("renders tables", () => {
    expect(renderMarkdown("| x | y |\n|---|---|\n| 1 | 2 |")).toContain("<table>");
  });

  it("treats \\$ as a literal dollar sign", () => {
    const html = renderMarkdown("Pens cost \\$3 and pencils \\$2. Solve $x+1=2$.");
    expect(html).toContain("$3");
    expect(html).toContain("$2");
    expect(html.match(/class="katex"/g)?.length).toBe(1);
  });

  it("can skip math", () => {
    expect(renderMarkdown("costs $5 and $6", { math: false })).toContain("$5 and $6");
  });

  it("does not let KaTeX run untrusted commands", () => {
    const html = renderMarkdown("$\\href{javascript:alert(1)}{x}$");
    expect(html).not.toMatch(/href="javascript:/);
  });
});
