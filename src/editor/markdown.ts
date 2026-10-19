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

/** 博客与文档内嵌场景：去掉交互脚本并限制宽度，避免超出容器。 */
export function embeddableSvg(svg: string): string {
  const withoutScript = svg.replace(/<script[\s\S]*?<\/script>/g, "");
  return withoutScript.includes('<svg style="')
    ? withoutScript.replace('<svg style="', '<svg style="max-width:100%;height:auto;')
    : withoutScript.replace("<svg ", '<svg style="max-width:100%;height:auto" ');
}

export function typstHtml(element: Record<string, unknown>): string {
  const content = typeof element.content === "string" ? element.content : "";
  const cached = typeof element.html === "string" ? element.html : "";
  if (cached && (!element.compiledFrom || element.compiledFrom === content)) {
    const inner = cached.trimStart().startsWith("<svg") ? embeddableSvg(cached) : cached;
    return `<div class="typst-html">${inner}</div>`;
  }
  const escaped = content.replace(
    /[&<>"']/g,
    char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!
  );
  return `<pre class="typst-fallback"><code>${escaped}</code></pre>`;
}
