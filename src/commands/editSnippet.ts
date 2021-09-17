import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsEditor, currentWebviewPanel } from "../CodeSnippetsEditor";

export default async (snippet: ISnippet) => {
  if (!snippet.uri) {
    return;
  }
  const snippetUri = snippet.uri;

  vscode.commands.executeCommand(
    "vscode.openWith",
    snippetUri,
    CodeSnippetsEditor.viewType
  );

  await currentWebviewPanel?.webview?.postMessage?.({
    type: "show",
    name: snippet.name,
  });
  await currentWebviewPanel?.webview?.postMessage?.({
    type: "edit",
    name: snippet.name,
  });
};
