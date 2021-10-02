import * as vscode from "vscode";

export let context: vscode.ExtensionContext;

export const setContext = (c: vscode.ExtensionContext) => (context = c);

export const getUserFolderUri = () =>
  vscode.Uri.joinPath(context.globalStorageUri, "../../../User/snippets");
