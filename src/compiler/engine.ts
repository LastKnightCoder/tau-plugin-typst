/**
 * 渲染进程内的 Typst 编译引擎：wasm 编译器 + 渲染器，输出自包含 SVG。
 *
 * 首次编译前需要联网下载编译组件（约 32 MiB，含默认字体集），此后缓存在本机，
 * 离线可用。Wasm 异步初始化以适配移动 WebView，排版执行仍配合预览防抖使用。
 */

import { loadEngineResources, type DownloadProgress } from "./resources";
import initializeCompiler, { TypstCompilerBuilder } from "../vendor/typst_ts_web_compiler.mjs";
import initializeRenderer, {
  TypstRenderer,
  type RenderSession,
} from "../vendor/typst_ts_renderer.mjs";

/** 让页面尺寸贴合内容，适合嵌在文档块里的排版片段；用户源码里 set page 可覆盖。 */
const DEFAULT_PRELUDE = "#set page(width: auto, height: auto, margin: 1em)\n";
const PRELUDE_LINES = 1;
const MAIN_PATH = "/main.typ";
/** 编译器的结构化诊断格式：不抛异常，返回 { result } 或 { diagnostics }，诊断带文件与范围 */
const STRUCTURED_DIAGNOSTICS = 3;

/** 结构化诊断：range 形如 "3:3-3:6"（行、列均从 0 起，含前置的页面设置行） */
export interface TypstDiagnostic {
  path?: string;
  range?: string;
  severity?: string;
  message?: string;
  hints?: unknown[];
}

/** 诊断所在的用户源码行（从 1 起）；不在用户源码里或无法解析时为 undefined */
function sourceLine(diagnostic: TypstDiagnostic): number | undefined {
  if (diagnostic.path !== MAIN_PATH || !diagnostic.range) return undefined;
  const line = Number(diagnostic.range.split(":")[0]) + 1 - PRELUDE_LINES;
  return Number.isInteger(line) && line >= 1 ? line : undefined;
}

export function formatDiagnostics(diagnostics: unknown): string {
  if (typeof diagnostics === "string" && diagnostics.trim()) return diagnostics.trim();
  if (!Array.isArray(diagnostics) || !diagnostics.length) return "编译失败";
  return diagnostics
    .slice(0, 3)
    .map(item => {
      const diagnostic = item as TypstDiagnostic;
      const line = sourceLine(diagnostic);
      const hints = (diagnostic.hints ?? []).join("；");
      return [
        line ? `第 ${line} 行：${diagnostic.message ?? ""}` : diagnostic.message,
        hints ? `提示：${hints}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join("\n");
}

export class TypstEngine {
  private constructor(
    private readonly compiler: {
      add_source(path: string, content: string): boolean;
      compile(
        path: string,
        inputs: unknown[] | null | undefined,
        fmt: string,
        diagnosticsFormat: number
      ): unknown;
    },
    private readonly renderer: {
      session_from_artifact(artifact: Uint8Array, decoder: string): RenderSession;
      svg_data(session: RenderSession, parts?: number | null): string;
    }
  ) {}

  static async create(
    options: {
      signal?: AbortSignal;
      onDownloadProgress?: (progress: DownloadProgress) => void;
    } = {}
  ): Promise<TypstEngine> {
    const { compilerWasm, rendererWasm, fonts } = await loadEngineResources({
      signal: options.signal,
      onProgress: options.onDownloadProgress,
    });
    options.signal?.throwIfAborted();
    await Promise.all([
      initializeCompiler({ module_or_path: compilerWasm }),
      initializeRenderer({ module_or_path: rendererWasm }),
    ]);
    options.signal?.throwIfAborted();
    const builder = new TypstCompilerBuilder();
    await builder.set_dummy_access_model();
    for (const font of fonts) await builder.add_raw_font(font);
    return new TypstEngine(await builder.build(), new TypstRenderer());
  }

  /** 编译源码并返回自包含 SVG 字符串；signal 只在编译开始前生效（wasm 同步执行不可中断）。 */
  compile(source: string, signal?: AbortSignal, inputs: Record<string, string> = {}): string {
    signal?.throwIfAborted();
    if (!source.trim()) throw new Error("源码为空");
    const inputPairs = Object.entries(inputs);
    let output: { result?: Uint8Array; diagnostics?: TypstDiagnostic[] } | undefined;
    try {
      this.compiler.add_source(MAIN_PATH, `${DEFAULT_PRELUDE}${source}`);
      output = this.compiler.compile(
        MAIN_PATH,
        inputPairs,
        "vector",
        STRUCTURED_DIAGNOSTICS
      ) as typeof output;
    } catch (error) {
      throw new Error(`Typst 编译失败：${formatDiagnostics(error)}`);
    }
    const errors = (output?.diagnostics ?? []).filter(item => item.severity !== "warning");
    if (errors.length) throw new Error(`Typst 编译失败：${formatDiagnostics(errors)}`);
    const artifact = output?.result;
    if (!artifact?.length) throw new Error("Typst 编译失败：未产生排版结果");
    return this.renderer.svg_data(this.renderer.session_from_artifact(artifact, "vector"));
  }
}

let enginePromise: Promise<TypstEngine> | null = null;
let lastProgress: DownloadProgress | null = null;

/** 进度在引擎就绪前持续更新，组件据此显示下载/初始化状态。 */
export function engineDownloadProgress(): DownloadProgress | null {
  return lastProgress;
}

export function getTypstEngine(
  options: {
    signal?: AbortSignal;
    onDownloadProgress?: (progress: DownloadProgress) => void;
  } = {}
): Promise<TypstEngine> {
  if (!enginePromise) {
    lastProgress = null;
    enginePromise = TypstEngine.create({
      signal: options.signal,
      onDownloadProgress: progress => {
        lastProgress = progress;
        options.onDownloadProgress?.(progress);
      },
    }).catch(error => {
      enginePromise = null;
      lastProgress = null;
      throw error;
    });
  }
  return enginePromise;
}

/** 测试隔离用：丢弃已就绪的引擎与进度状态。 */
export function resetTypstEngineForTest(): void {
  enginePromise = null;
  lastProgress = null;
}
