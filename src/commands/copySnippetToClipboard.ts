import * as vscode from "vscode";
import { ISnippet } from "..";

export default async (snippets: ISnippet[]) => {
  if (!snippets.length) {
    vscode.window.showWarningMessage(vscode.l10n.t("No snippets to copy."));
    return;
  }

  const snippetBody = snippets.map(snippet => snippet.body).join("\n");

  await vscode.env.clipboard.writeText(snippetBody);

  vscode.window.showInformationMessage(vscode.l10n.t("Snippet copied to clipboard."));
};
