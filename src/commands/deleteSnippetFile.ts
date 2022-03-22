import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import refreshAllView from "../views/refreshAllView";

export default async (snippet: ISnippetExtra) => {
  if (!snippet.uri) {
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    `Do you want to delete ${snippet.name}?`,
    {
      modal: true,
    },
    "Delete"
  );

  if (answer !== "Delete") {
    return;
  }

  await vscode.workspace.fs.delete(snippet.uri, { useTrash: true });

  refreshAllView();

  return true;
};
