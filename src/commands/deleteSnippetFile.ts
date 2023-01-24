import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import { isBrowser } from "../share";
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

  await vscode.workspace.fs.delete(snippet.uri, { useTrash: !isBrowser });

  refreshAllView();

  return true;
};
