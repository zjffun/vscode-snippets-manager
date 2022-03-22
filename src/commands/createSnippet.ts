import * as vscode from "vscode";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import { context, getUserFolderUri } from "../share";
import refreshAllView from "../views/refreshAllView";

export default async (prefix?: string, snippetUri?: vscode.Uri) => {
  const { activeTextEditor } = vscode.window;

  let _snippetUri = snippetUri;

  if (!_snippetUri) {
    // use `default-snippets-manager.code-snippets` in WorkspaceFolder or UserFolder
    const activeWorkspaceFolder =
      activeTextEditor &&
      vscode.workspace.getWorkspaceFolder(activeTextEditor.document.uri);

    if (!activeWorkspaceFolder?.uri) {
      const askAddUserSnippets = context.globalState.get(
        "askAddUserSnippets",
        true
      );
      if (askAddUserSnippets) {
        const answer = await vscode.window.showInformationMessage(
          "Can't find `activeWorkspaceFolder`, do you want to add the snippet to user snippets?",
          ...["Yes, and don't ask me again", "Yes", "No"]
        );

        if (answer === "No") {
          return;
        }

        if (answer === "Yes, and don't ask me again") {
          context.globalState.update("askAddUserSnippets", false);
        }
      }

      _snippetUri = vscode.Uri.joinPath(
        getUserFolderUri(),
        "default-snippets-manager.code-snippets"
      );
    } else {
      _snippetUri = vscode.Uri.joinPath(
        activeWorkspaceFolder?.uri,
        ".vscode",
        "default-snippets-manager.code-snippets"
      );
    }
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

  const bodyText =
    activeTextEditor?.document?.getText?.(activeTextEditor?.selection) || "";
  const scope = activeTextEditor?.document?.languageId || "";

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
