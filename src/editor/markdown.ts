import type { EditorMarkdownCodec } from "@tau/plugins";

export const typstCodec: EditorMarkdownCodec = {
  type: "typst",
  isVoid: true,
  fence: { language: "typst" },
  serializer: {
    isBlock: true,
    toMarkdown: element => "```typst\n" + `${element.content || ""}` + "\n```",
  },
};

export function typstHtml(element: Record<string, unknown>): string {
  const content = typeof element.content === "string" ? element.content : "";
  if (typeof element.html === "string" && element.html && (!element.compiledFrom || element.compiledFrom === content))
    return `<div class="typst-html">${element.html}</div>`;
  const escaped = content.replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!
  );
  return `<pre class="typst-fallback"><code>${escaped}</code></pre>`;
}
