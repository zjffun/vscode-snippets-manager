import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsEditor, currentWebviewPanel } from "../CodeSnippetsEditor";

export default async (snippet: ISnippet) => {
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

  currentWebviewPanel?.webview?.postMessage?.({
    type: "edit",
    keyName: snippet.name,
  });
};
