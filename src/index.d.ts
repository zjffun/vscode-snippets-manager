import * as vscode from "vscode";

export interface Snippet {
  body: any;
  description: string;
  prefix: string;
  scope: string;
  key?: string;
  uri?: vscode.Uri;
}

export interface Snippets {
  [key: string]: Snippet;
}

export interface SnippetWorkpace {
  name: string;
  children: Snippet[];
}
