import * as vscode from "vscode";

export default async () => {
  const workpaces: {
    folder: vscode.WorkspaceFolder;
    snippetsFiles: {
      name: string;
      uri: vscode.Uri;
    }[];
  }[] = [];

  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders) {
    for (const workspaceFolder of workspaceFolders) {
      const dotVSCodeFolderUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        ".vscode"
      );

      let workspaceDotVSCodeFiles: [string, vscode.FileType][] = [];
      try {
        workspaceDotVSCodeFiles = await vscode.workspace.fs.readDirectory(
          dotVSCodeFolderUri
        );
      } catch (error) {
        // havn no .vscode folder, do noting
      }

      const snippetsFiles = [];
      for (const [fileName, fileType] of workspaceDotVSCodeFiles) {
        if (
          fileType === vscode.FileType.File &&
          fileName.endsWith(".code-snippets")
        ) {
          const snippetsUri = vscode.Uri.joinPath(dotVSCodeFolderUri, fileName);

          snippetsFiles.push({
            name: fileName,
            uri: snippetsUri,
          });
        }
      }

      workpaces.push({
        folder: workspaceFolder,
        snippetsFiles,
      });
    }
  }

  return workpaces;
};
