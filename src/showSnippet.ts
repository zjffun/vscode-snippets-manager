import * as vscode from "vscode";
import { Snippet } from ".";
import { CodeSnippetsEditor } from "./CodeSnippetsEditor";

export default async (snippet: Snippet) => {
  if (!snippet.uri) {
    return;
  }
  const snippetUri = snippet?.uri;

  vscode.commands.executeCommand(
    "vscode.openWith",
    snippetUri,
    CodeSnippetsEditor.viewType
  );

  // TODO: jump to selected snippet
};
