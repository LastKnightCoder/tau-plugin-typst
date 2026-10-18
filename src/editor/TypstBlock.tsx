import { FileType } from "lucide-react";
import { useMemo, useRef } from "react";
import { SourceBlockEditor, useSourceBlock, usePluginServices, type EditorElementRenderProps } from "@tau/plugins";
import { TypstPreview } from "./TypstPreview";
import type { TypstElement } from "./types";

export function TypstBlock({ attributes, element, children }: EditorElementRenderProps<TypstElement>) {
  const { update, theme } = useSourceBlock(element);
  const services = usePluginServices();
  const editedSource = useRef<string | undefined>(undefined);
  const compile = useMemo(() => services ? async (source: string, signal: AbortSignal) =>
    (await services.typst.compile({ source, format: "html" }, { signal })).html : undefined, [services]);
  return (
    <div {...attributes}>
      <SourceBlockEditor mode="stex" title="Typst" icon={FileType} initValue={element.content} element={element} center
        onChange={content => {
          editedSource.current = content;
          update({ content, html: "", compiledFrom: undefined, compiledAt: undefined });
        }}>
        <TypstPreview compile={compile} content={element.content} initialHtml={element.html} compiledFrom={element.compiledFrom} isDark={theme.isDark}
          onCompiled={(html, compiledFrom) => {
            if (editedSource.current !== compiledFrom || element.content !== compiledFrom) return;
            editedSource.current = undefined;
            update({ html, compiledFrom, compiledAt: Date.now() });
          }} />
      </SourceBlockEditor>
      {children}
    </div>
  );
}
