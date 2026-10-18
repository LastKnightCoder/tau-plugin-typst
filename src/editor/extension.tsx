import { FileType } from "lucide-react";
import {
  defineEditorElement,
  defineEditorExtension,
  insertSourceBlock,
  sourceBlockParagraphBehavior,
} from "@tau/plugins";
import { TypstBlock } from "./TypstBlock";
import { typstHtml } from "./markdown";
import type { TypstElement } from "./types";

export const typstExtension = defineEditorExtension({
  id: "tau.typst",
  elements: [
    defineEditorElement<TypstElement>({
      type: "typst",
      kind: "block",
      drag: true,
      isVoid: true,
      isEmpty: element => !element.content,
      render: props => <TypstBlock {...props} />,
    }),
  ],
  blockPanel: [
    {
      icon: FileType,
      title: "Typst",
      description: "Typst 排版",
      keywords: ["typst", "math", "typeset"],
      onClick: editor => {
        insertSourceBlock(editor, {
          type: "typst",
          content: "",
          children: [{ type: "formatted", text: "" }],
        });
      },
    },
  ],
  behaviorsFor: { paragraph: sourceBlockParagraphBehavior("typst") },
  htmlSerializers: [{ type: "typst", toHtml: typstHtml }],
});
