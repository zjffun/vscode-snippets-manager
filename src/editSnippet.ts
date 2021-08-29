import * as vscode from "vscode";
import { Snippet } from ".";

export default async (snippet: Snippet) => {
  if (!snippet.uri) {
    return;
  }
  const snippetUri = snippet?.uri;
  const doc = await vscode.workspace.openTextDocument(snippetUri);
  vscode.window.showTextDocument(doc);
};
