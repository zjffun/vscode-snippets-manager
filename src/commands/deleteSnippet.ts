import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import refreshAllView from "../views/refreshAllView";

export default async (snippet: ISnippet) => {
  if (!snippet.uri) {
    return;
  }
  if (!snippet.name) {
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    `Do you want to delete snippet ${snippet.name}?`,
    {
      modal: true,
    },
    "Delete"
  );

  if (answer !== "Delete") {
    return;
  }

  const textDocument = await getSnippetTextDocument({
    snippetsUri: snippet.uri,
  });

  const codeSnippetsService = new CodeSnippetsService(textDocument);

  await codeSnippetsService.delete(snippet.name);

  refreshAllView();
};
