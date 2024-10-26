import * as vscode from "vscode";
import { CodeSnippetsEditor } from "../CodeSnippetsEditor";

export default async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor) {
    return;
  }

  await vscode.commands.executeCommand(
    "vscode.openWith",
    activeTextEditor.document.uri,
    CodeSnippetsEditor.viewType,
  );
};
