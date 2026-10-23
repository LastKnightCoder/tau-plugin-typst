/** typst.ts 0.6.1-rc3 编译器 wasm 包装层（vendor 自带，仅声明本插件用到的导出）。 */

export interface TypstDiagnostic {
  severity?: string;
  message?: string;
  trace?: unknown[];
  hints?: unknown[];
}
export class IncrServer {
  reset(): void;
  current(): Uint8Array | undefined;
}
export class TypstCompiler {
  reset(): void;
  set_inputs(inputs: unknown): void;
  add_source(path: string, content: string): boolean;
  get_loaded_fonts(): string[];
  compile(
    mainFilePath: string,
    inputs: unknown[] | null | undefined,
    fmt: string,
    diagnosticsFormat: number
  ): unknown;
  create_incr_server(): IncrServer;
}
export class TypstCompilerBuilder {
  constructor();
  set_dummy_access_model(): Promise<void>;
  add_raw_font(data: Uint8Array): Promise<void>;
  build(): Promise<TypstCompiler>;
}
export default function initialize(input: { module_or_path: BufferSource }): Promise<unknown>;
