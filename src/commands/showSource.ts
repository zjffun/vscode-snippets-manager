import * as vscode from "vscode";
import { CodeSnippetsEditor } from "../CodeSnippetsEditor";

export default async () => {
  const uri = CodeSnippetsEditor.currentEditor?.document?.uri;

  if (!uri) {
    vscode.window.showErrorMessage(
      "Get `CodeSnippetsEditor.currentEditor.document.uri` failed."
    );
    return false;
  }

  return vscode.workspace.openTextDocument(uri).then((document) => {
    vscode.window.showTextDocument(document);
  });
};
