import * as vscode from "vscode";
import { ISnippet } from "..";
import { setClipboard } from "../core/snippetsClipboard";

export default async (snippets: ISnippet[]) => {
  if (!snippets.length) {
    vscode.window.showWarningMessage(vscode.l10n.t("No snippets to copy."));
    return;
  }

  vscode.commands.executeCommand(
    "setContext",
    "snippetsmanager.copyingSnippets",
    true,
  );

  setClipboard(snippets);
};
