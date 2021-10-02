import * as vscode from "vscode";
import { ISnippetContainer } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import workspaceSnippetsFilesInfo from "../core/getWorkspaceSnippetsFilesInfo";
import BasicSnippetsExplorerView from "./BasicSnippetsExplorerView";

let snippetsExplorerView: WorkspaceSnippetsExplorerView;

export default class WorkspaceSnippetsExplorerView extends BasicSnippetsExplorerView {
  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  public static viewId =
    "snippetsmanager-snippetsView-WorkspaceSnippetsExplorerView";

  constructor(context: vscode.ExtensionContext) {
    super(context);

    snippetsExplorerView = this;
  }

  protected async getSnippets() {
    const workspaceSnippetsFileInfo = await workspaceSnippetsFilesInfo();
    const workpaces: ISnippetContainer[] = [];

    for (const { folder, snippetsFiles } of workspaceSnippetsFileInfo) {
      const workspaceSnippetFiles = [];
      for (const { name, uri } of snippetsFiles) {
        let snippetsTextDoc;

        try {
          snippetsTextDoc = await vscode.workspace.openTextDocument(uri);
        } catch (error) {
          continue;
        }

        const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

        const [_, snippets] = await codeSnippetsService.getMap();
        if (!snippets) {
          continue;
        }
        workspaceSnippetFiles.push({
          name,
          isFile: true,
          uri,
          children: Array.from(snippets).map(([name, snippet]) => {
            return codeSnippetsService.getSnippet(snippet, {
              name,
              uri,
            });
          }),
        });
      }

      workpaces.push({
        name: folder.name,
        children: workspaceSnippetFiles,
      });
    }

    return workpaces;
  }
}

export function refresh() {
  snippetsExplorerView.refresh();
}
