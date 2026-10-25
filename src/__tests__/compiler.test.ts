import { afterEach, expect, it, vi } from "vitest";
import {
  loadResource,
  setResourceCacheForTest,
  totalResourceBytes,
  compilerResourceKey,
} from "../compiler/resources";
import { formatDiagnostics } from "../compiler/engine";

const memoryCache = () => {
  const store = new Map<string, Uint8Array>();
  return {
    get: async (key: string) => store.get(key),
    put: async (key: string, bytes: Uint8Array) => void store.set(key, bytes),
  };
};

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => {
  setResourceCacheForTest(undefined);
  fetchMock.mockReset();
});

it("未知资源直接报错", async () => {
  setResourceCacheForTest(memoryCache());
  await expect(loadResource("not-exist")).rejects.toThrow("未知资源");
});

it("下载内容校验失败时逐源重试，全部失败后报错", async () => {
  setResourceCacheForTest(memoryCache());
  fetchMock
    .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3])))
    .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3])));
  await expect(loadResource(compilerResourceKey)).rejects.toThrow("下载");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[0][0]).toContain("cdn.jsdelivr.net");
  expect(fetchMock.mock.calls[1][0]).toContain("unpkg.com");
});

it("命中缓存时不发起网络请求", async () => {
  const store = new Map<string, Uint8Array>();
  setResourceCacheForTest({
    get: async key => store.get(key),
    put: async (key, bytes) => void store.set(key, bytes),
  });
  const cached = new Uint8Array(new ArrayBuffer(21732903));
  store.set(compilerResourceKey, cached);
  const bytes = await loadResource(compilerResourceKey);
  expect(bytes).toBe(cached);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("资源清单体积与进度基数覆盖编译器、渲染器与字体", () => {
  expect(totalResourceBytes).toBeGreaterThan(30 * 1024 * 1024);
  expect(totalResourceBytes).toBeLessThan(40 * 1024 * 1024);
});

it("诊断信息格式化为可读消息", () => {
  expect(formatDiagnostics([])).toBe("编译失败");
  expect(
    formatDiagnostics([
      { message: "unknown variable: x", hints: ["did you mean `y`?"] },
      { message: "second" },
    ])
  ).toContain("unknown variable: x");
  expect(
    formatDiagnostics([{ message: "unknown variable: x", hints: ["did you mean `y`?"] }])
  ).toContain("提示：did you mean `y`?");
});

it("结构化诊断按用户源码行号格式化，扣除前置的页面设置行", () => {
  expect(
    formatDiagnostics([
      { path: "/main.typ", range: "3:3-3:6", severity: "error", message: "unknown variable: sun" },
    ])
  ).toBe("第 3 行：unknown variable: sun");
  expect(
    formatDiagnostics([{ path: "@preview/x/lib.typ", range: "0:0-0:1", message: "包错误" }])
  ).toBe("包错误");
  expect(formatDiagnostics("compiler panicked")).toBe("compiler panicked");
  expect(formatDiagnostics(undefined)).toBe("编译失败");
});
