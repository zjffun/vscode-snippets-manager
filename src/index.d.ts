import * as vscode from "vscode";

export interface IPackageJSONContributesSnippet {
  name?: string;
  path?: string;
}

export interface IDisabledInfo {
  body: boolean;
  description: boolean;
  prefix: boolean;
  scope: boolean;
}

export interface ISnippetExtra {
  name?: string;
  uri?: vscode.Uri;
  index?: number;
  disabledInfo?: IDisabledInfo;
  vscodeSnippet?: IVscodeSnippet;
}

export interface ISnippet extends ISnippetExtra {
  body: string;
  description: string;
  prefix: string | string[];
  scope: string;
}

// vscodeSnippet parse from JSON, so types are unknown
export interface IVscodeSnippet {
  body?: unknown;
  description?: unknown;
  prefix?: unknown;
  scope?: unknown;
}

export interface ISnippets {
  [key: string]: ISnippet;
}

export interface ISnippetContainer {
  name: string;
  isFile?: boolean;
  isWorkspace?: boolean;
  isExtension?: boolean;
  uri?: vscode.Uri;
  children: ISnippetContainer[] | ISnippet[];
}
