// @vitest-environment node
import { describe, expect, it } from "vitest";
import { TypstEngine, formatDiagnostics } from "../compiler/engine";

/** 真实下载与编译链路验证：TYPST_E2E=1 pnpm test 时执行，需要网络。 */
const enabled = !!process.env.TYPST_E2E;

describe.skipIf(!enabled)("Typst 引擎端到端", () => {
  it(
    "下载编译组件并编译出 SVG（含数学公式与字体）",
    async () => {
      const engine = await TypstEngine.create();
      const svg = engine.compile("= 你好 Typst\n\n*加粗* 与 $x + y = z$ 公式。");
      expect(svg.trimStart().startsWith("<svg")).toBe(true);
      expect(svg).toContain("</svg>");
      expect(engine.compile("#table(columns: 2)[a][b]")).toContain("<svg");
    },
    { timeout: 300_000 }
  );

  it("诊断错误格式化不抛异常", () => {
    expect(formatDiagnostics([{ message: "unknown variable: x" }])).toContain("unknown variable");
  });
});
