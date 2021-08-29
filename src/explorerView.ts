import * as vscode from "vscode";
import { Snippet, SnippetWorkpace } from ".";
import getSnippetsByTextDoc from "./core/getSnippetsByTextDoc";

let managerTreeDataProvider: ManagerTreeDataProvider;

const getTreeElement = (element?: SnippetWorkpace | Snippet) => {
  const _element = <SnippetWorkpace | undefined>element;

  if (!_element?.children) {
    return [];
  }

  return _element.children;
};

const getSnippets = async () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workpaces: SnippetWorkpace[] = [];

  if (workspaceFolders) {
    for (const workspaceFolder of workspaceFolders) {
      const snippetsUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        ".vscode",
        "default-snippets-manager.code-snippets"
      );

      // get the snippets file content
      const snippetsTextDoc = await vscode.workspace.openTextDocument(
        snippetsUri
      );

      const snippets = await getSnippetsByTextDoc(snippetsTextDoc);
      if (!snippets) {
        continue;
      }

      workpaces.push({
        name: workspaceFolder.name,
        children: Object.entries(snippets).map(([key, snippet]) => {
          return {
            ...snippet,
            key,
            uri: snippetsUri,
          };
        }),
      });
    }
  }

  return workpaces;
};

class ManagerTreeDataProvider
  implements vscode.TreeDataProvider<Snippet | SnippetWorkpace>
{
  private _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  constructor() {}

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }
  public getTreeItem(element: Snippet | SnippetWorkpace): vscode.TreeItem {
    const isSnippetWorkpace = (<SnippetWorkpace>element).children;

    return {
      label: (<SnippetWorkpace>element).name || (<Snippet>element).key,
      collapsibleState: isSnippetWorkpace
        ? vscode.TreeItemCollapsibleState.Collapsed
        : undefined,
      contextValue: !isSnippetWorkpace
        ? "snippetsmanager-snippetsView-Explorer-Item"
        : "",
    };
  }

  public getChildren(
    element?: Snippet | SnippetWorkpace
  ):
    | Snippet[]
    | Thenable<Snippet[]>
    | SnippetWorkpace[]
    | Thenable<SnippetWorkpace[]> {
    return element ? getTreeElement(element) : getSnippets();
  }
}

export function refresh() {
  managerTreeDataProvider.refresh();
}

export function registerExplorerView(context: vscode.ExtensionContext) {
  managerTreeDataProvider = new ManagerTreeDataProvider();

  vscode.window.createTreeView("snippetsmanager-snippetsView-Explorer", {
    treeDataProvider: managerTreeDataProvider,
  });
}
