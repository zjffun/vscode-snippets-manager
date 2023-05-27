import * as vscode from "vscode";
import * as nls from "vscode-nls";
import { context, getUserFolderUri } from "../share";

const localize = nls.loadMessageBundle();

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
    const answer = await vscode.window.showInformationMessage(
      localize(
        "askAddUserSnippetsMsg",
        "Can't find workspace folder, do you want to add the snippet to user snippets?"
      ),
      ...["Yes, and don't ask me again", "Yes", "No"]
    );

    if (answer === "No") {
      return;
    }

    if (answer === "Yes, and don't ask me again") {
      context.globalState.update("askAddUserSnippets", false);
    }

    return vscode.Uri.joinPath(
      getUserFolderUri(),
      "default-snippets-manager.code-snippets"
    );
  }
}
