import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsEditor, currentWebviewPanel } from "../CodeSnippetsEditor";
import { CodeSnippetsService } from "../CodeSnippetsService";
import refreshAllView from "../views/refreshAllView";

export default async (snippet: ISnippet) => {
  if (!snippet.uri || snippet.name === undefined) {
    return;
  }

  const snippetsTextDoc = await vscode.workspace.openTextDocument(snippet.uri);

  const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

  await codeSnippetsService.duplicate(snippet.name);

  refreshAllView();

  await vscode.commands.executeCommand(
    "vscode.openWith",
    snippet.uri,
    CodeSnippetsEditor.viewType,
  );

  await currentWebviewPanel?.webview?.postMessage?.({
    type: "show",
    keyName: snippet.name,
  });
};
