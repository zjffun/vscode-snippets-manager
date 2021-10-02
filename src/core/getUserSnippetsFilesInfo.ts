import * as vscode from "vscode";
import { getUserFolderUri } from "../share";

export default async () => {
  const userSnippetsFileUris = [];

  const userFolderUri = getUserFolderUri();
  let userSnippetFiles: [string, vscode.FileType][] = [];
  try {
    userSnippetFiles = await vscode.workspace.fs.readDirectory(userFolderUri);
  } catch (error) {
    // havn no .vscode folder, do noting
  }

  for (const [fileName, fileType] of userSnippetFiles) {
    if (
      fileType === vscode.FileType.File &&
      (fileName.endsWith(".code-snippets") || fileName.endsWith(".json"))
    ) {
      const snippetUri = vscode.Uri.joinPath(userFolderUri, fileName);

      userSnippetsFileUris.push({ fileName, uri: snippetUri });
    }
  }

  return userSnippetsFileUris;
};
