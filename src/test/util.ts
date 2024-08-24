import * as assert from "assert";
import { Buffer } from "buffer";
import * as vscode from "vscode";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import getSnippetUri from "../core/getSnippetUri";

const testWorkspaceRoot = <vscode.Uri>(
  vscode.workspace.workspaceFolders?.[0]?.uri
);

export const testWorkspaceFolder = vscode.Uri.joinPath(
  testWorkspaceRoot,
  "test",
);

let fileIndex = 0;
export async function createTestFile(
  content: string = "",
  { filename }: { filename?: string } = {},
) {
  const uri = vscode.Uri.joinPath(
    testWorkspaceRoot,
    filename === undefined ? `${fileIndex++}.temp` : filename,
  );
  await writeFile(uri, content);
  return uri;
}

export async function writeFile(uri: vscode.Uri, content: string) {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
}

export async function writeTextDocument(
  textDocument: vscode.TextDocument,
  content: string,
) {
  const workspaceEdit = new vscode.WorkspaceEdit();

  workspaceEdit.replace(
    textDocument.uri,
    new vscode.Range(0, 0, textDocument.lineCount, 0),
    content,
  );

  const res = await vscode.workspace.applyEdit(workspaceEdit);

  if (!res) {
    throw Error("applyEdit failed");
  }

  const saveRes = await textDocument.save();

  if (!saveRes) {
    throw Error("save failed");
  }

  return true;
}

export async function closeAllEditors() {
  return vscode.commands.executeCommand("workbench.action.closeAllEditors");
}

export async function resetTestWorkspace() {
  try {
    await vscode.workspace.fs.delete(testWorkspaceFolder, { recursive: true });
    await vscode.workspace.fs.delete(
      vscode.Uri.joinPath(
        testWorkspaceRoot,
        ".vscode",
        "default-snippets-manager.code-snippets",
      ),
    );
  } catch {
    // ok if file doesn't exist
  }
  await vscode.workspace.fs.createDirectory(testWorkspaceFolder);
}

export async function getCodeSnippetsService({
  uri,
}: { uri?: vscode.Uri } = {}) {
  let _snippetUri = uri;

  if (!_snippetUri) {
    _snippetUri = await getSnippetUri();
  }

  if (!_snippetUri) {
    assert.fail("can't find snippet uri");
  }

  const textDocument = await getSnippetTextDocument({
    snippetsUri: _snippetUri,
  });

  const codeSnippetsService = new CodeSnippetsService(textDocument);
  return codeSnippetsService;
}

export const escapeBody = `test content $1 \\$1`;
export const escapedBody = `test content \\$1 \\\\\\$1`;
