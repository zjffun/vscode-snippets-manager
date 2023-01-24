import { Buffer } from "buffer";
import * as vscode from "vscode";

const testWorkspaceRoot = <vscode.Uri>(
  vscode.workspace.workspaceFolders?.[0]?.uri
);

// @ts-ignore-next-line
export const isBrowser = vscode.env.appHost !== "desktop";

export const testWorkspaceFolder = vscode.Uri.joinPath(
  testWorkspaceRoot,
  "test"
);

let fileIndex = 0;
export async function createTestFile(
  content: string = "",
  { filename }: { filename?: string } = {}
) {
  const uri = vscode.Uri.joinPath(
    testWorkspaceRoot,
    filename === undefined ? `${fileIndex++}.temp` : filename
  );
  await writeFile(uri, content);
  return uri;
}

export async function writeFile(uri: vscode.Uri, content: string) {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
}

export async function writeTextDocument(
  textDocument: vscode.TextDocument,
  content: string
) {
  const workspaceEdit = new vscode.WorkspaceEdit();

  workspaceEdit.replace(
    textDocument.uri,
    new vscode.Range(0, 0, textDocument.lineCount, 0),
    content
  );

  const res = await vscode.workspace.applyEdit(workspaceEdit);

  if (!res) {
    throw Error("applyEdit failed");
  }

  await textDocument.save();
}

export async function closeAllEditors() {
  return vscode.commands.executeCommand("workbench.action.closeAllEditors");
}

export async function resetTestWorkspace() {
  try {
    await vscode.workspace.fs.delete(testWorkspaceFolder, { recursive: true });
  } catch {
    // ok if file doesn't exist
  }
  await vscode.workspace.fs.createDirectory(testWorkspaceFolder);
}
