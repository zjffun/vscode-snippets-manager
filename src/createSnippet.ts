import * as vscode from "vscode";
import { Position } from "vscode";
import createSnippetJSON from "./core/createSnippetJSON";

export default async () => {
  if (vscode.window.activeTextEditor) {
    const activeWorkspaceFolder = vscode.workspace.getWorkspaceFolder(
      vscode.window.activeTextEditor.document.uri
    );
    if (!activeWorkspaceFolder?.uri) {
      return;
    }
    const editor = vscode.window.activeTextEditor;
    const prefix = "test" + Math.random();
    const description = prefix;
    const snippetsBodyText = editor?.document.getText(editor.selection);
    const snippetsLang = editor?.document.languageId;
    const newSnippets = createSnippetJSON({
      bodyText: snippetsBodyText,
      prefix,
      description,
      scope: snippetsLang,
    });

    const workspaceEdit = new vscode.WorkspaceEdit();
    const snippetsUri = vscode.Uri.joinPath(
      activeWorkspaceFolder?.uri,
      ".vscode",
      "default-snippets-manager.code-snippets"
    );
    const doc = await vscode.workspace.openTextDocument(snippetsUri);
    const oldSnippet = doc.getText();

    // workspaceEdit.createFile(snippetsUri, { ignoreIfExists: true });
    workspaceEdit.replace(
      snippetsUri,
      new vscode.Range(
        new Position(0, 0),
        new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
      ),
      JSON.stringify(
        {
          ...JSON.parse(oldSnippet),
          [description]: newSnippets,
        },
        null,
        2
      )
    );
    const res = await vscode.workspace.applyEdit(workspaceEdit);

    doc.save();
  }
};
