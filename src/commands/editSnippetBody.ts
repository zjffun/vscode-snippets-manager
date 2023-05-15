import { Buffer } from "buffer";
import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import { context } from "../share";
import logger from "../utils/logger";

const sha1 = require("sha1");

export const docSnippetMap = new WeakMap<vscode.TextDocument, ISnippet>();

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

    logger.info(`Edit snippet body: save ${document.fileName}`);

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

    const config = vscode.workspace.getConfiguration("snippetsManager");
    const autoCloseSnippetBodyEditor = config.get<boolean>(
      "autoCloseSnippetBodyEditor"
    );

    if (
      autoCloseSnippetBodyEditor &&
      vscode.window.activeTextEditor?.document === document
    ) {
      logger.info(
        `Edit snippet body: autoCloseSnippetBodyEditor ${document.fileName}`
      );

      docSnippetMap.delete(document);

      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor"
      );
    }
  }

  // Can't find the way to delete `docSnippetMap` item when the editor is closed by clicking the close button.
  // onDidCloseTextDocument don't trigger when the editor is closed by clicking the close button.

  const onDidSaveTextDocumentDisposable =
    vscode.workspace.onDidSaveTextDocument((document) => {
      onDidSaveTextDocument(document);
    });

  return onDidSaveTextDocumentDisposable;
}

export default async (snippet: ISnippet) => {
  logger.info(`Edit snippet body: edit ${snippet?.name}`);

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
  } catch (error: any) {
    logger.error(error?.message);
  }

  docSnippetMap.set(editor.document, snippet);

  return editor;
};
