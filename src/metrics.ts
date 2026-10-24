import type { EditorMetricRule } from "@tau/plugins";

export const editorMetrics = [
  {
    type: "typst",
    textFields: ["content"],
  },
] as const satisfies readonly EditorMetricRule[];
