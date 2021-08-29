import * as vscode from "vscode";
import createSnippetObject from "./core/createSnippetObject";
import updateSnippets from "./core/updateSnippets";
import { refresh } from "./explorerView";

export default async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor) {
    vscode.window.showErrorMessage(
      "Get `vscode.window.activeTextEditor` failed."
    );
    return;
  }

  const activeWorkspaceFolder = vscode.workspace.getWorkspaceFolder(
    activeTextEditor.document.uri
  );

  if (!activeWorkspaceFolder?.uri) {
    vscode.window.showErrorMessage(
      "Get workspaceFolder by `vscode.window.activeTextEditor.document.uri` failed."
    );
    return;
  }

  const input = vscode.window.createInputBox();
  input.title = "Create Snippet";
  input.value = "";
  input.prompt = "Enter snippet prefix";
  input.show();

  const prefix = await new Promise<string>((resolve, reject) => {
    input.onDidAccept(() => {
      resolve(input.value);
      input.dispose();
    });
  });

  const description = prefix;
  const bodyText = activeTextEditor?.document.getText(
    activeTextEditor.selection
  );
  const scope = activeTextEditor?.document.languageId;
  const newSnippet = createSnippetObject({
    bodyText,
    prefix,
    description,
    scope,
  });

  const snippetsUri = vscode.Uri.joinPath(
    activeWorkspaceFolder?.uri,
    ".vscode",
    "default-snippets-manager.code-snippets"
  );

  await updateSnippets({
    snippetsUri,
    snippets: {
      [description]: newSnippet,
    },
    createSnippetsFileIfNotExists: true,
  });

  refresh();
};
