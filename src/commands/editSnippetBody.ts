import { Buffer } from "buffer";
import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import { context } from "../share";

const sha1 = require("sha1");

export const docSnippetMap = new Map<vscode.TextDocument, ISnippet>();

export function initEditSnippetBody() {
  // Clean up
  const tempFolderUri = vscode.Uri.joinPath(context.globalStorageUri, "temp");

  vscode.workspace.fs
    .delete(tempFolderUri, {
      recursive: true,
      useTrash: false,
    })
    .then(
      () => {},
      () => {
        // do nothing
      }
    );

  // Listen save event
  async function onDidSaveTextDocument(document: vscode.TextDocument) {
    const snippet = docSnippetMap.get(document);

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

    docSnippetMap.delete(document);

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

  const tmpFileUri = vscode.Uri.joinPath(
    context.globalStorageUri,
    "temp",
    sha1(snippet.uri.path),
    `Edit Snippet ${snippet.name}`
  );

  await vscode.workspace.fs.writeFile(tmpFileUri, Buffer.from(snippet.body));

  const editor = await vscode.window.showTextDocument(tmpFileUri);

  try {
    const vscodeLanguages = await vscode.languages.getLanguages();
    const scopes = snippet.scope.split(",");

    for (const scope of scopes) {
      if (vscodeLanguages.includes(scope)) {
        await vscode.languages.setTextDocumentLanguage(editor.document, scope);
        break;
      }
    }
  } catch (error) {
    // do nothing
  }

  docSnippetMap.set(editor.document, snippet);

  return editor;
};
