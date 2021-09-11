import * as vscode from "vscode";

export default async ({
  snippetsUri,
  createSnippetsFileIfNotExists = false,
}: {
  snippetsUri: vscode.Uri;
  createSnippetsFileIfNotExists?: boolean;
}) => {
  const workspaceEdit = new vscode.WorkspaceEdit();

  if (createSnippetsFileIfNotExists) {
    workspaceEdit.createFile(snippetsUri, { ignoreIfExists: true });
    await vscode.workspace.applyEdit(workspaceEdit);
  }

  // get the snippets file content
  const snippetsTextDoc = await vscode.workspace.openTextDocument(snippetsUri);

  return snippetsTextDoc;
};
