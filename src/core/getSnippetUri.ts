import * as vscode from "vscode";
import { no, yes } from "../common/l10n";
import { context, getUserFolderUri } from "../share";

export default async function getSnippetUri() {
  const { activeTextEditor } = vscode.window;

  // use `default-snippets-manager.code-snippets` in WorkspaceFolder or UserFolder
  const activeWorkspaceFolder =
    activeTextEditor &&
    vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri);

  if (activeWorkspaceFolder?.uri) {
    return vscode.Uri.joinPath(
      activeWorkspaceFolder.uri,
      ".vscode",
      "default-snippets-manager.code-snippets"
    );
  }

  if (vscode.workspace.workspaceFolders?.length === 1) {
    return vscode.Uri.joinPath(
      vscode.workspace.workspaceFolders[0].uri,
      ".vscode",
      "default-snippets-manager.code-snippets"
    );
  }

  if (vscode.workspace.workspaceFolders?.length) {
    const items = vscode.workspace.workspaceFolders.map((folder) => ({
      label: folder.name,
      uri: folder.uri,
    }));

    const workspaceFolder = await vscode.window.showQuickPick<{
      label: string;
      uri: vscode.Uri;
    }>(items, {
      placeHolder: "Select a workspace folder for the snippet",
    });

    if (!workspaceFolder) {
      return;
    }

    return vscode.Uri.joinPath(
      workspaceFolder.uri,
      ".vscode",
      "default-snippets-manager.code-snippets"
    );
  }

  const askAddUserSnippets = context.globalState.get(
    "askAddUserSnippets",
    true
  );

  if (askAddUserSnippets) {
    const yesAndDoNotAsk = vscode.l10n.t("Yes, and don't ask me again");

    const answer = await vscode.window.showInformationMessage(
      vscode.l10n.t(
        "Can't find workspace folder, do you want to add the snippet to user snippets?"
      ),
      ...[yesAndDoNotAsk, yes, no]
    );

    if (answer === no) {
      return;
    }

    if (answer === yesAndDoNotAsk) {
      context.globalState.update("askAddUserSnippets", false);
    }

    return vscode.Uri.joinPath(
      getUserFolderUri(),
      "default-snippets-manager.code-snippets"
    );
  }
}
