import * as vscode from "vscode";
import { ISnippetExtra } from "..";
import { l10nDelete } from "../common/l10n";
import { isBrowser } from "../share";
import refreshAllView from "../views/refreshAllView";

export default async (snippet: ISnippetExtra) => {
  if (!snippet.uri) {
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    vscode.l10n.t(`Do you want to delete {0}?`, snippet.name || ""),
    {
      modal: true,
    },
    l10nDelete,
  );

  if (answer !== l10nDelete) {
    return;
  }

  await vscode.workspace.fs.delete(snippet.uri, { useTrash: !isBrowser });

  refreshAllView();

  return true;
};
