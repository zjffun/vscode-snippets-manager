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

export interface IDisabledInfo {
  body: boolean;
  description: boolean;
  prefix: boolean;
  scope: boolean;
}

export interface ISnippetExtra {
  name?: string;
  index?: number;
  disabledInfo?: IDisabledInfo;
  vscodeSnippet?: IVscodeSnippet;
}

// vscodeSnippet parse from JSON, so types are unknown
export interface IVscodeSnippet {
  body?: unknown;
  description?: unknown;
  prefix?: unknown;
  scope?: unknown;
}

export interface ISnippet extends ISnippetExtra {
  name: string;
  body: string;
  description: string;
  prefix: string | string[];
  scope: string;
  [NAME]: string;
  [EDIT]?: boolean;
  [NEW_ITEM]?: boolean;
}

export type SnippetObjMap = { [key: string]: ISnippet };

export interface IVscodeState {
  addingSnippets?: ISnippet[];
  editingSnippetObjMap?: SnippetObjMap;
  snippetList?: ISnippet[];
  scrollY?: number;
}
