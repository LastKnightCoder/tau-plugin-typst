import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TypstPreview } from "../editor/TypstPreview";
import { typstHtml } from "../editor/markdown";

vi.mock("@tau/plugins", () => ({ useReportPreviewError: () => false }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  root = createRoot(host);
  vi.useFakeTimers();
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
});

it("博客不编译，匹配和历史缓存可显示，过期缓存回退到源码", async () => {
  const onCompiled = vi.fn();
  await act(async () =>
    root.render(<TypstPreview content="= A" initialHtml="<p>旧预览</p>" onCompiled={onCompiled} />)
  );
  expect(host.textContent).toContain("旧预览");
  await act(async () =>
    root.render(
      <TypstPreview
        content="= B"
        compiledFrom="= B"
        initialHtml="<p>新预览</p>"
        onCompiled={onCompiled}
      />
    )
  );
  expect(host.textContent).toContain("新预览");
  await act(async () =>
    root.render(
      <TypstPreview
        content="= C"
        compiledFrom="= B"
        initialHtml="<p>新预览</p>"
        onCompiled={onCompiled}
      />
    )
  );
  expect(host.textContent).not.toContain("新预览");
  expect(host.querySelector("code")?.textContent).toBe("= C");
  expect(onCompiled).not.toHaveBeenCalled();
});

it("防抖、取消、迟到结果、失败保留与卸载的生命周期", async () => {
  const requests: {
    signal: AbortSignal;
    resolve(value: string): void;
    reject(error: Error): void;
  }[] = [];
  const compile = vi.fn(
    (_source: string, signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => requests.push({ signal, resolve, reject }))
  );
  const save = vi.fn();
  const render = async (content: string) => {
    await act(async () =>
      root.render(<TypstPreview content={content} compile={compile} onCompiled={save} />)
    );
    await act(async () => vi.advanceTimersByTime(200));
  };
  await render("A");
  await render("B");
  expect(requests[0].signal.aborted).toBe(true);
  await act(async () => requests[1].resolve("<p>B</p>"));
  await act(async () => requests[0].resolve("<p>A</p>"));
  expect(host.textContent).toBe("B");
  expect(save).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith("<p>B</p>", "B");
  await render("bad");
  await act(async () => requests[2].reject(new Error("语法错误")));
  expect(host.textContent).toContain("B");
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("语法错误");
  await render("");
  expect(host.querySelector("[data-tau-typst-preview]")).toBeNull();
  await render("pending");
  await act(async () => root.render(<div />));
  expect(requests[3].signal.aborted).toBe(true);
});

it("匹配缓存不重复编译，静态导出拒绝过期缓存并转义源码", async () => {
  const compile = vi.fn();
  await act(async () =>
    root.render(
      <TypstPreview content="A" compiledFrom="A" initialHtml="<p>A</p>" compile={compile} />
    )
  );
  await act(async () => vi.advanceTimersByTime(300));
  expect(compile).not.toHaveBeenCalled();
  expect(typstHtml({ content: "A", html: "<p>A</p>", compiledFrom: "A" })).toContain("<p>A</p>");
  expect(typstHtml({ content: "A", html: "<p>历史</p>" })).toContain("历史");
  expect(typstHtml({ content: "<script>", html: "过期", compiledFrom: "旧源码" })).toContain(
    "&lt;script&gt;"
  );
});
