import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import { getClipboard } from "../core/snippetsClipboard";
import refreshAllView from "../views/refreshAllView";

export default async (targetSnippet: ISnippetExtra) => {
  if (!targetSnippet.uri) {
    return;
  }

  const snippetsTextDoc = await vscode.workspace.openTextDocument(
    targetSnippet.uri
  );

  const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

  const snippets = getClipboard();

  let index = targetSnippet.index;

  if (index !== undefined) {
    index += 1;
  }

  for (const snippet of snippets) {
    await codeSnippetsService.insert(snippet, {
      index,
    });
  }

  refreshAllView();

  return true;
};
