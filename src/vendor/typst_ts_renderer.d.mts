/** typst.ts 0.6.1-rc3 渲染器 wasm 包装层（vendor 自带，仅声明本插件用到的导出）。 */

export interface RenderSession {
  readonly doc_width: number;
  readonly doc_height: number;
}
export class TypstRenderer {
  constructor();
  session_from_artifact(artifact: Uint8Array, decoder: string): RenderSession;
  svg_data(session: RenderSession, parts?: number | null): string;
}
export default function initialize(input: { module_or_path: BufferSource }): Promise<unknown>;
