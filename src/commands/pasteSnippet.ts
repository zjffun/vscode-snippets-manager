import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import { getClipboard } from "../core/snippetsClipboard";
import refreshAllView from "../views/refreshAllView";

export default async (snippetFile: ISnippetExtra) => {
  if (!snippetFile.uri) {
    return;
  }

  const snippetsTextDoc = await vscode.workspace.openTextDocument(
    snippetFile.uri
  );

  const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

  const snippets = getClipboard();

  for (const snippet of snippets) {
    await codeSnippetsService.insert(snippet);
  }

  refreshAllView();

  return true;
};
