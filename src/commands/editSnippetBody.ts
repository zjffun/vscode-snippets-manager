import { ensureFileSync, writeFileSync } from "fs-extra";
import * as crypto from "node:crypto";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";

export const fsPathSnippetMap = new Map<string, ISnippet>();

export function initEditSnippetBody() {
  async function onDidSaveTextDocument(document: vscode.TextDocument) {
    const snippet = fsPathSnippetMap.get(document.uri.fsPath);
    if (!snippet?.uri || !snippet?.name) {
      return;
    }

    const snippetsTextDoc = await vscode.workspace.openTextDocument(
      snippet?.uri
    );
    const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

    await codeSnippetsService.update(
      {
        ...snippet,
        body: document.getText(),
      },
      snippet.name
    );

    if (vscode.window.activeTextEditor?.document === document) {
      vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    }
  }

  vscode.workspace.onDidSaveTextDocument((document) => {
    onDidSaveTextDocument(document);
  });
}

export default async (snippet: ISnippet) => {
  if (!snippet.uri || !snippet.name) {
    return;
  }

  const tmpFilePath = path.join(
    os.tmpdir(),
    crypto.createHash("sha1").update(snippet.uri.path).digest("hex"),
    `Edit Snippet ${snippet.name}`
  );

  ensureFileSync(tmpFilePath);

  writeFileSync(tmpFilePath, snippet.body);

  const uri = vscode.Uri.file(tmpFilePath);
  const editor = await vscode.window.showTextDocument(uri);

  const vscodeLanguages = await vscode.languages.getLanguages();
  const scopes = snippet.scope.split(",");

  for (const scope of scopes) {
    if (vscodeLanguages.includes(scope)) {
      vscode.languages.setTextDocumentLanguage(editor.document, snippet.scope);
      break;
    }
  }

  fsPathSnippetMap.set(uri.fsPath, snippet);

  return editor;
};
