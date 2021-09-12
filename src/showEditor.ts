import * as vscode from "vscode";
import { CodeSnippetsEditor } from "./CodeSnippetsEditor";

export default async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor) {
    vscode.window.showErrorMessage(
      "Get `vscode.window.activeTextEditor` failed."
    );
    return;
  }

  await vscode.commands.executeCommand(
    "vscode.openWith",
    activeTextEditor.document.uri,
    CodeSnippetsEditor.viewType
  );
};
