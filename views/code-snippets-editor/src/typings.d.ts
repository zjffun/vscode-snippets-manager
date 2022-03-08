import { DUPLICATE_INDEX, EDIT, NEWITEM } from "./symbols";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vscode-button": any;
      "vscode-text-field": any;
      "vscode-text-area": any;
    }
  }
}

export interface Snippet {
  body: string[];
  description: string;
  prefix: string;
  scope: string;
  [EDIT]?: boolean;
  [NEWITEM]?: boolean;
  [DUPLICATE_INDEX]?: number;
}

export type SnippetEntries = [string, Snippet][];
