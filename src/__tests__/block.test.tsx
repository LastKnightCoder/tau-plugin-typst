import { act, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TypstBlock } from "../editor/TypstBlock";
import type { TypstElement } from "../editor/types";

const fixture = vi.hoisted(() => ({
  update: (_properties: Record<string, unknown>) => {},
  edit: (_source: string) => {},
  writes: [] as Record<string, unknown>[],
  compile: vi.fn(async (source: string) => `<svg viewBox="0 0 10 10">${source}</svg>`),
}));
vi.mock("@tau/plugins", () => ({
  useSourceBlock: () => ({ theme: { isDark: false }, update: fixture.update }),
  useReportPreviewError: () => false,
  SourceBlockEditor: ({
    children,
    field,
  }: {
    children: ReactNode;
    element: TypstElement;
    field: string;
  }) => {
    expect(field).toBe("content");
    fixture.edit = source => fixture.update({ content: source });
    return children;
  },
}));
vi.mock("../compiler/engine", () => ({
  getTypstEngine: async () => ({ compile: fixture.compile }),
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

it("源码经字段绑定更新，编译预览不把缓存写回文档", async () => {
  await act(async () => root.render(<Harness />));
  await act(async () => vi.advanceTimersByTime(200));
  expect(fixture.writes).toHaveLength(0);
  expect(host.textContent).toContain("A");
  await act(async () => fixture.edit("B"));
  await act(async () => vi.advanceTimersByTime(200));
  expect(fixture.writes).toEqual([{ content: "B" }]);
  expect(host.textContent).toContain("B");
});
