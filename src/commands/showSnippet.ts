import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import { CodeSnippetsEditor } from "../CodeSnippetsEditor";

export default async (snippet: ISnippetExtra) => {
  if (!snippet.uri) {
    return;
  }
  const snippetUri = snippet.uri;

  await vscode.commands.executeCommand(
    "vscode.openWith",
    snippetUri,
    CodeSnippetsEditor.viewType
  );

  await CodeSnippetsEditor.currentEditor?.webviewPanel?.webview?.postMessage?.({
    type: "show",
    name: snippet.name,
  });
};
