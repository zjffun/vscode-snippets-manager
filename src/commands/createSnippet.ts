import * as vscode from "vscode";
import * as nls from "vscode-nls";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import { context, getUserFolderUri } from "../share";
import refreshAllView from "../views/refreshAllView";

const localize = nls.loadMessageBundle();

const unsupportedScope = ["vue"];

async function getSnippetUri() {
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

export default async ({
  prefix,
  uri,
  escapeDollar,
}: {
  prefix?: string;
  uri?: vscode.Uri;
  escapeDollar?: boolean;
} = {}) => {
  const { activeTextEditor } = vscode.window;

  let _snippetUri = uri;

  if (!_snippetUri) {
    _snippetUri = await getSnippetUri();
  }

  if (!_snippetUri) {
    return;
  }

  let _prefix = prefix;
  if (_prefix === undefined || typeof _prefix !== "string") {
    const input = vscode.window.createInputBox();
    input.title = "Create Snippet";
    input.value = "";
    input.prompt = "Enter snippet prefix";
    input.show();

    _prefix = await new Promise<string>((resolve, reject) => {
      input.onDidAccept(() => {
        resolve(input.value);
        input.dispose();
      });
    });
  }

  let bodyText =
    activeTextEditor?.document?.getText?.(activeTextEditor?.selection) || "";

  if (escapeDollar === true) {
    bodyText = bodyText.replaceAll("$", "\\$");
  }

  let scope = activeTextEditor?.document?.languageId;
  if (scope === undefined || unsupportedScope.includes(scope)) {
    scope = "";
  }

  const textDocument = await getSnippetTextDocument({
    snippetsUri: _snippetUri,
    createSnippetsFileIfNotExists: true,
  });

  const codeSnippetsService = new CodeSnippetsService(textDocument);

  await codeSnippetsService.insert({
    name: _prefix,
    prefix: _prefix,
    description: _prefix,
    scope,
    body: bodyText,
  });

  refreshAllView();

  return true;
};
