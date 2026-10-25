import { FileType } from "lucide-react";
import { useMemo, useState } from "react";
import { SourceBlockEditor, useSourceBlock, type EditorElementRenderProps } from "@tau/plugins";
import { getTypstEngine } from "../compiler/engine";
import { TypstPreview } from "./TypstPreview";
import type { TypstElement } from "./types";

export function TypstBlock({
  attributes,
  element,
  children,
}: EditorElementRenderProps<TypstElement>) {
  const { theme } = useSourceBlock(element);
  const [statusText, setStatusText] = useState<string>();
  const compile = useMemo(
    () => async (source: string, signal: AbortSignal) => {
      setStatusText("正在准备 Typst 编译组件…");
      const engine = await getTypstEngine({
        signal,
        onDownloadProgress: ({ loadedBytes, totalBytes }) =>
          setStatusText(
            `正在下载编译组件与字体（仅首次，约 ${Math.round(totalBytes / 1024 / 1024)} MiB）：${Math.floor((loadedBytes / totalBytes) * 100)}%`
          ),
      });
      setStatusText(undefined);
      return engine.compile(source, signal);
    },
    []
  );
  return (
    <div {...attributes}>
      <SourceBlockEditor
        mode="typst"
        title="Typst"
        icon={FileType}
        field="content"
        element={element}
        center
      >
        <TypstPreview
          compile={compile}
          content={element.content}
          initialHtml={element.compiledFrom === element.content ? element.html : undefined}
          compiledFrom={element.compiledFrom}
          isDark={theme.isDark}
          statusText={statusText}
        />
      </SourceBlockEditor>
      {children}
    </div>
  );
}
