import * as vscode from "vscode";
import { ISnippet } from "..";

export default async (snippets: ISnippet[]) => {
  if (!snippets?.length) {
    vscode.window.showWarningMessage(
      vscode.l10n.t("No body of snippet to copy."),
    );
    return;
  }

  const snippetBody = snippets.map((snippet) => snippet.body).join("\n");

  await vscode.env.clipboard.writeText(snippetBody);

  vscode.window.showInformationMessage(
    vscode.l10n.t("Body of snippet copied to clipboard."),
  );
};
