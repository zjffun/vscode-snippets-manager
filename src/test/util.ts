import * as vscode from "vscode";

const testWorkspaceRoot = <vscode.Uri>(
  vscode.workspace.workspaceFolders?.[0]?.uri
);

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
    testWorkspaceFolder,
    filename === undefined ? `${fileIndex++}.temp` : filename
  );
  await writeFile(uri, content);
  return uri;
}

export async function writeFile(uri: vscode.Uri, content: string) {
  await vscode.workspace.fs.writeFile(
    uri,
    Uint8Array.from(Buffer.from(content))
  );
  await new Promise((resolve, reject) => setTimeout(resolve, 100));
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
