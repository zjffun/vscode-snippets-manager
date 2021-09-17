import * as vscode from "vscode";
import { currentDocument } from "../CodeSnippetsEditor";

export default async () => {
  const uri = currentDocument?.uri;

  if (!uri) {
    vscode.window.showErrorMessage("Get `currentDocument.uri` failed.");
    return false;
  }

  return vscode.workspace.openTextDocument(uri).then((document) => {
    return vscode.window.showTextDocument(document);
  });
};
