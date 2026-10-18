import { definePlugin } from "@tau/plugins";
import { typstExtension } from "./editor/extension";
import { typstCodec } from "./editor/markdown";
import content from "./skills/typst.md";
declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  editorExtensions: [typstExtension],
  editorCodecs: [typstCodec],
  skills: [
    {
      id: "authoring",
      name: "Typst 排版",
      description: "创建或修改文档中的 Typst 排版块时使用。",
      content,
    },
  ],
});
