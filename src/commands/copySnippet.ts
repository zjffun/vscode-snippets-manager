import * as vscode from "vscode";
import { ISnippet } from "..";
import { setClipboard } from "../core/snippetsClipboard";

export default async (snippets: ISnippet[]) => {
  vscode.commands.executeCommand(
    "setContext",
    "snippetsmanager.copyingSnippets",
    true
  );

  setClipboard(snippets);
};
