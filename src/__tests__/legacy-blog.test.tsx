import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { TypstBlock } from "../editor/TypstBlock";

const update = vi.hoisted(() => vi.fn());
vi.mock("@tau/plugins", () => ({
  usePluginServices: undefined,
  useSourceBlock: () => ({ theme: { isDark: false }, update }),
  useReportPreviewError: () => false,
  SourceBlockEditor: ({ children }: { children: ReactNode }) => children,
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("旧博客没有服务入口时仍显示缓存，缺缓存时回退源码且不写节点", async () => {
  const host = document.createElement("div");
  const root = createRoot(host);
  const element = {
    type: "typst" as const,
    content: "= A",
    html: "<p>历史预览</p>",
    children: [{ type: "formatted" as const, text: "" }],
  };
  const attributes = { "data-slate-node": "element" as const, ref: null };
  await act(async () =>
    root.render(
      <TypstBlock attributes={attributes} element={element}>
        {null}
      </TypstBlock>
    )
  );
  expect(host.textContent).toContain("历史预览");
  await act(async () =>
    root.render(
      <TypstBlock attributes={attributes} element={{ ...element, html: "" }}>
        {null}
      </TypstBlock>
    )
  );
  expect(host.querySelector("code")?.textContent).toBe("= A");
  expect(update).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});
