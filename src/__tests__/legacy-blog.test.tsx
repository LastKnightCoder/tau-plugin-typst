import { expect, it } from "vitest";
import { typstHtml, embeddableSvg } from "../editor/markdown";

it("博客序列化保留历史 HTML 缓存，SVG 缓存转内嵌并回退过期缓存", () => {
  const element = {
    type: "typst" as const,
    content: "= A",
    html: '<p style="color:red">历史预览</p>',
    compiledFrom: "= A",
    children: [{ type: "formatted" as const, text: "" }],
  };
  expect(typstHtml(element)).toBe(
    '<div class="typst-html"><p style="color:red">历史预览</p></div>'
  );

  const svgElement = { ...element, html: '<svg style="overflow: visible;"><path/></svg>' };
  expect(typstHtml(svgElement)).toBe(
    '<div class="typst-html"><svg style="max-width:100%;height:auto;overflow: visible;"><path/></svg></div>'
  );

  expect(typstHtml({ ...element, content: "= B" })).toContain("<pre");
  expect(typstHtml({ ...element, html: "" })).toContain("= A");
});

it("内嵌 SVG 去掉交互脚本并对无样式根补宽度约束", () => {
  const dirty = '<svg viewBox="0 0 4 4"><script>window.x=1</script><circle/></svg>';
  const clean = embeddableSvg(dirty);
  expect(clean).not.toContain("<script");
  expect(clean).toContain('style="max-width:100%;height:auto"');
  expect(clean).toContain("<circle/>");

  const styled = '<svg style="overflow: visible;" class="typst-doc"><rect/></svg>';
  expect(embeddableSvg(styled)).toBe(
    '<svg style="max-width:100%;height:auto;overflow: visible;" class="typst-doc"><rect/></svg>'
  );
});
