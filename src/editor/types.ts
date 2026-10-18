export interface TypstElement {
  type: "typst";
  content: string;
  html?: string;
  compiledFrom?: string;
  compiledAt?: number;
  children: { type: "formatted"; text: string }[];
}
declare module "@tau/plugins" {
  interface EditorElementMap {
    typst: TypstElement;
  }
}
