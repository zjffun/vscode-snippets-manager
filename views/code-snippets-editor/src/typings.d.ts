import { EDIT, NAME, NEW_ITEM } from "./symbols";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "vscode-button": any;
      "vscode-text-field": any;
      "vscode-text-area": any;
    }
  }
  interface Window {
    i18nText: {
      [key: string]: string;
    };
  }
}

export interface IVscodeSnippet {
  body: string[] | string;
  description: string;
  prefix: string;
  scope: string;
}

export interface ISnippet {
  name: string;
  body: string;
  description: string;
  prefix: string;
  scope: string;
  [NAME]: string;
  [EDIT]?: boolean;
  [NEW_ITEM]?: boolean;
}

export type SnippetObjMap = { [key: string]: ISnippet };

export type VscodeSnippetEntries = [string, IVscodeSnippet][];

export interface IVscodeState {
  addingSnippets?: ISnippet[];
  editingSnippetObjMap?: SnippetObjMap;
  vscodeSnippetEntries?: VscodeSnippetEntries;
  scrollY?: number;
}
