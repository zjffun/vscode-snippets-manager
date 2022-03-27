import * as vscode from "vscode";

export enum SnippetType {
  WORKSPACE = "WORKSPACE",
  USER = "USER",
  EXTENSION = "EXTENSION",
}

export let context: vscode.ExtensionContext;

export const setContext = (c: vscode.ExtensionContext) => (context = c);

export const getUserFolderUri = () =>
  vscode.Uri.joinPath(context.globalStorageUri, "../../../User/snippets");
