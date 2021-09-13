import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsEditor } from "../CodeSnippetsEditor";

export default async (snippet: ISnippet) => {
  if (!snippet.uri) {
    return;
  }
  const snippetUri = snippet.uri;

  vscode.commands.executeCommand(
    "vscode.openWith",
    snippetUri,
    CodeSnippetsEditor.viewType
  );

  // TODO: jump to selected snippet
};
