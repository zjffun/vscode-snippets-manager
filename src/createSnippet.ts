import * as vscode from "vscode";
import { CodeSnippetsService } from "./CodeSnippetsService";
import getSnippetTextDocument from "./core/getSnippetTextDocument";
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

  const bodyText = activeTextEditor?.document.getText(
    activeTextEditor.selection
  );
  const scope = activeTextEditor?.document.languageId;

  const snippetsUri = vscode.Uri.joinPath(
    activeWorkspaceFolder?.uri,
    ".vscode",
    "default-snippets-manager.code-snippets"
  );

  const textDocument = await getSnippetTextDocument({
    snippetsUri,
    createSnippetsFileIfNotExists: true,
  });

  const codeSnippetsService = new CodeSnippetsService(textDocument);

  await codeSnippetsService.insert({
    name: prefix,
    prefix,
    description: prefix,
    scope,
    body: bodyText,
  });

  refresh();
};
