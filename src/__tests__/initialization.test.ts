import { expect, it, vi } from "vitest";
import { TypstEngine } from "../compiler/engine";
const fixture = vi.hoisted(() => ({ compiler: vi.fn(async () => undefined), renderer: vi.fn(async () => undefined), compilerWasm: new Uint8Array([1]), rendererWasm: new Uint8Array([2]) }));
vi.mock("../compiler/resources", () => ({ loadEngineResources: async () => ({ compilerWasm: fixture.compilerWasm, rendererWasm: fixture.rendererWasm, fonts: [] }) }));
vi.mock("../vendor/typst_ts_web_compiler.mjs", () => ({
  default: fixture.compiler,
  initSync: () => { throw Error("不得同步初始化 Wasm"); },
  TypstCompilerBuilder: class { async set_dummy_access_model() {} async build() { return {}; } },
}));
vi.mock("../vendor/typst_ts_renderer.mjs", () => ({ default: fixture.renderer, TypstRenderer: class {} }));

it("使用异步 Wasm 初始化器，避免移动主线程大模块限制", async () => {
  await TypstEngine.create();
  expect(fixture.compiler).toHaveBeenCalledWith({ module_or_path: fixture.compilerWasm });
  expect(fixture.renderer).toHaveBeenCalledWith({ module_or_path: fixture.rendererWasm });
});
