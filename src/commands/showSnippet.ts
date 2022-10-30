import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import { CodeSnippetsEditor, currentWebviewPanel } from "../CodeSnippetsEditor";

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

  currentWebviewPanel?.webview?.postMessage?.({
    type: "show",
    keyName: snippet.name,
  });
};
