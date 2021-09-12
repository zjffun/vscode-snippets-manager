import * as vscode from "vscode";

export default async (uri: vscode.Uri) => {
  if (!uri) {
    vscode.window.showErrorMessage("Get `Uri` failed.");
    return false;
  }

  return vscode.workspace.openTextDocument(uri).then((document) => {
    vscode.window.showTextDocument(document);
  });
};
