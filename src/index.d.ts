import * as vscode from "vscode";

export interface ISnippetExtra {
  name?: string;
  uri?: vscode.Uri;
}

export interface ISnippet extends ISnippetExtra {
  body: string;
  description: string;
  prefix: string;
  scope: string;
}

export interface IVSCodeSnippet {
  body: string[];
  description: string;
  prefix: string;
  scope: string;
}

export interface ISnippets {
  [key: string]: ISnippet;
}

export interface ISnippetContainer {
  name: string;
  children: ISnippetContainer[] | ISnippet[];
}
