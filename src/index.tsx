import { editorMetrics } from "./metrics";
import { definePlugin } from "@tau/plugins";
import { typstExtension } from "./editor/extension";
import { typstCodec } from "./editor/markdown";
import { captureTranslator, messages } from "./i18n";
declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  i18n: messages,
  create: () => ({
    activate(context) {
      captureTranslator(context.i18n.t);
    },
  }),
  editorExtensions: [typstExtension],
  editorMetrics,
  editorCodecs: [typstCodec],
});
