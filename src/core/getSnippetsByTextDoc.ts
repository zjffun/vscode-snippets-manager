import * as vscode from "vscode";
import { Snippets } from "..";

export default async (snippetsTextDoc: vscode.TextDocument) => {
  const snippetsText = snippetsTextDoc.getText();
  let resultSnippets: Snippets = {};

  if (snippetsText !== "") {
    try {
      resultSnippets = JSON.parse(snippetsText) || {};
    } catch (error) {
      vscode.window.showErrorMessage(
        "Parse `default-snippets-manager.code-snippets` failed."
      );
      return;
    }
  }

  return resultSnippets;
};
