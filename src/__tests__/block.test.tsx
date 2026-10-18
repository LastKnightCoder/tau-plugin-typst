import { act, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TypstBlock } from "../editor/TypstBlock";
import type { TypstElement } from "../editor/types";

const fixture = vi.hoisted(() => ({
  update: (_properties: Record<string, unknown>) => {},
  edit: (_source: string) => {},
  writes: [] as Record<string, unknown>[],
  compile: vi.fn(async ({ source }: { source: string }) => ({ html: `<p>${source}</p>` })),
}));
vi.mock("@tau/plugins", () => ({
  usePluginServices: () => ({ typst: { compile: fixture.compile } }),
  useSourceBlock: () => ({ theme: { isDark: false }, update: fixture.update }),
  useReportPreviewError: () => false,
  SourceBlockEditor: ({
    children,
    onChange,
  }: {
    children: ReactNode;
    onChange(source: string): void;
  }) => {
    fixture.edit = onChange;
    return children;
  },
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const host = document.createElement("div");
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.useFakeTimers();
  fixture.writes = [];
  fixture.compile.mockClear();
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
});

function Harness() {
  const [element, setElement] = useState<TypstElement>({
    type: "typst",
    content: "A",
    children: [{ type: "formatted", text: "" }],
  });
  fixture.update = properties => {
    fixture.writes.push(properties);
    setElement(old => ({ ...old, ...properties }));
  };
  return (
    <TypstBlock attributes={{ "data-slate-node": "element", ref: null }} element={element}>
      {null}
    </TypstBlock>
  );
}

it("预览挂载不写文档，用户编辑成功后才保存匹配的缓存", async () => {
  await act(async () => root.render(<Harness />));
  await act(async () => vi.advanceTimersByTime(200));
  expect(fixture.writes).toHaveLength(0);
  expect(host.textContent).toContain("A");
  await act(async () => fixture.edit("B"));
  await act(async () => vi.advanceTimersByTime(200));
  expect(fixture.writes[0]).toMatchObject({ content: "B", html: "" });
  expect(fixture.writes[1]).toMatchObject({
    html: "<p>B</p>",
    compiledFrom: "B",
    compiledAt: expect.any(Number),
  });
  expect(host.textContent).toContain("B");
});
