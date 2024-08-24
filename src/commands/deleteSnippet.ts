import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import refreshAllView from "../views/refreshAllView";

export default async (snippets: ISnippet[]) => {
  if (snippets.length === 0) {
    return;
  }

  let message = vscode.l10n.t(
    "Do you want to delete selected {0} snippets?",
    snippets.length,
  );

  if (snippets.length === 1) {
    if (!snippets[0].name) {
      return;
    }

    message = vscode.l10n.t(
      "Do you want to delete snippet {0}?",
      snippets[0].name,
    );
  }

  const answer = await vscode.window.showWarningMessage(
    message,
    {
      modal: true,
    },
    "Delete",
  );

  if (answer !== "Delete") {
    return;
  }

  for (const snippet of snippets) {
    if (!snippet.uri) {
      continue;
    }

    if (!snippet.name) {
      continue;
    }

    const textDocument = await getSnippetTextDocument({
      snippetsUri: snippet.uri,
    });

    const codeSnippetsService = new CodeSnippetsService(textDocument);

    await codeSnippetsService.delete(snippet.name);
  }

  refreshAllView();

  return true;
};
