import * as vscode from "vscode";
import { ISnippetContainer } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import BasicSnippetsExplorerView from "./BasicSnippetsExplorerView";

let workspaceSnippetsExplorerView: WorkspaceSnippetsExplorerView;

export default class WorkspaceSnippetsExplorerView extends BasicSnippetsExplorerView {
  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  public static viewId =
    "snippetsmanager-snippetsView-WorkspaceSnippetsExplorerView";

  constructor(context: vscode.ExtensionContext) {
    super(context);

    workspaceSnippetsExplorerView = this;
  }

  protected async getSnippets(context: vscode.ExtensionContext) {
    const workpaces: ISnippetContainer[] = [];

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

        const workspaceSnippetFiles = [];
        for (const [fileName, fileType] of workspaceDotVSCodeFiles) {
          if (
            fileType === vscode.FileType.File &&
            fileName.endsWith(".code-snippets")
          ) {
            const snippetsUri = vscode.Uri.joinPath(
              dotVSCodeFolderUri,
              fileName
            );

            // get the snippets file content
            let snippetsTextDoc;

            try {
              snippetsTextDoc = await vscode.workspace.openTextDocument(
                snippetsUri
              );
            } catch (error) {
              continue;
            }

            const codeSnippetsService = new CodeSnippetsService(
              snippetsTextDoc
            );

            const [_, snippets] = await codeSnippetsService.getMap();
            if (!snippets) {
              continue;
            }
            workspaceSnippetFiles.push({
              name: fileName,
              children: Array.from(snippets).map(([name, snippet]) => {
                return codeSnippetsService.getSnippet(snippet, {
                  name,
                  uri: snippetsUri,
                });
              }),
            });
          }
        }

        workpaces.push({
          name: workspaceFolder.name,
          children: workspaceSnippetFiles,
        });
      }
    }

    return workpaces;
  }
}

export function refresh() {
  workspaceSnippetsExplorerView.refresh();
}
