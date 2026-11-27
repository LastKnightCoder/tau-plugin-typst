import { defineI18n } from "@tau/plugins";
import type { TranslationValues } from "@tau/plugins";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import enUS from "./locales/en-US.json";

export const messages = defineI18n({
  fallbackLocale: "zh-CN",
  resources: { "zh-CN": zhCN, "zh-TW": zhTW, "en-US": enUS },
});

export type MessageKey = Parameters<typeof messages.ref>[0];

// 声明字段与异步状态在消费边界解析：激活时捕获宿主翻译器，未激活（含测试）回落到源语言词典
let hostTranslate: ((key: MessageKey, values?: TranslationValues) => string) | null = null;

export function captureTranslator(
  translate: (key: MessageKey, values?: TranslationValues) => string,
): void {
  hostTranslate = translate;
}

const fallbackDictionary = zhCN as Record<string, string>;

const interpolate = (template: string, values?: TranslationValues) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values?.[name] ?? ""));

export function t(key: MessageKey, values?: TranslationValues): string {
  const fallback = () =>
    interpolate(fallbackDictionary[key] ?? fallbackDictionary[`${key}_other`] ?? key, values);
  if (!hostTranslate) return fallback();
  try {
    return hostTranslate(key, values);
  } catch {
    return fallback();
  }
}
