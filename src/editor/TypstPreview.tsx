import { useEffect, useRef, useState } from "react";
import { useI18n, useReportPreviewError } from "@tau/plugins";
import { messages, t } from "../i18n";

export interface TypstPreviewProps {
  compile?: (source: string, signal: AbortSignal) => Promise<string>;
  content: string;
  initialHtml?: string;
  compiledFrom?: string;
  isDark?: boolean;
  /** 编译准备阶段的说明（下载编译组件/初始化），编译完成后清空。 */
  statusText?: string;
  onCompiled?(html: string, source: string): void;
}

export function TypstPreview({
  compile,
  content,
  initialHtml = "",
  compiledFrom,
  isDark,
  statusText,
  onCompiled,
}: TypstPreviewProps) {
  const { t: translate } = useI18n(messages);
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const callback = useRef(onCompiled);
  callback.current = onCompiled;
  const validCache = !!initialHtml && (!compiledFrom || compiledFrom === content);
  // 在源码预览块内由宿主显示错误，自己只在块外（如博客）显示
  const reported = useReportPreviewError(error, { stale: !!html });

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    if (!content.trim()) {
      setHtml("");
      return;
    }
    if (validCache) setHtml(initialHtml);
    if (!compile || (validCache && compiledFrom === content)) return;
    const timer = setTimeout(() => {
      void compile(content, controller.signal).then(
        result => {
          if (controller.signal.aborted) return;
          setHtml(result);
          setError(null);
          callback.current?.(result, content);
        },
        cause => {
          if (!controller.signal.aborted)
            setError(cause instanceof Error ? cause.message : t("error.compileFailed"));
        }
      );
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [content, compile, validCache, initialHtml, compiledFrom]);

  if (!content.trim())
    return <p className="text-ink-3 py-3 text-center">{translate("preview.emptyContent")}</p>;
  const displayed = compile ? html : validCache ? initialHtml : "";
  return (
    <div data-tau-typst-preview>
      {displayed ? (
        <div
          className="overflow-x-auto"
          style={{ filter: isDark ? "invert(1) hue-rotate(180deg)" : undefined }}
          dangerouslySetInnerHTML={{ __html: displayed }}
        />
      ) : (
        <div>
          <p className="text-ink-3">
            {compile
              ? error
                ? translate("preview.noPreview")
                : (statusText ?? translate("preview.compiling"))
              : translate("preview.noSaved")}
          </p>
          {!compile && (
            <pre>
              <code>{content}</code>
            </pre>
          )}
        </div>
      )}
      {error && !reported && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
