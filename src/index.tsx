import { definePlugin } from "@tau/plugins";
import { typstExtension } from "./editor/extension";
import { typstCodec } from "./editor/markdown";
declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  editorExtensions: [typstExtension],
  editorCodecs: [typstCodec],
});
