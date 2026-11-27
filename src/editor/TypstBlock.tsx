import { FileType } from "lucide-react";
import { useMemo, useState } from "react";
import { SourceBlockEditor, useSourceBlock, type EditorElementRenderProps } from "@tau/plugins";
import { getTypstEngine } from "../compiler/engine";
import { t } from "../i18n";
import { TypstPreview } from "./TypstPreview";
import type { TypstElement } from "./types";

export function TypstBlock({
  attributes,
  element,
  children,
}: EditorElementRenderProps<TypstElement>) {
  const { theme } = useSourceBlock(element);
  const [statusText, setStatusText] = useState<string>();
  // 编译是异步动作：状态文案在发生时按当前语言解析，不闭包捕获某次渲染的翻译器
  const compile = useMemo(
    () => async (source: string, signal: AbortSignal) => {
      setStatusText(t("status.preparing"));
      const engine = await getTypstEngine({
        signal,
        onDownloadProgress: ({ loadedBytes, totalBytes }) =>
          setStatusText(
            t("status.downloading", {
              size: Math.round(totalBytes / 1024 / 1024),
              percent: Math.floor((loadedBytes / totalBytes) * 100),
            }),
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
