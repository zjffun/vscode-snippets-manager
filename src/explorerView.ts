import * as vscode from "vscode";
import { ISnippet, ISnippetWorkpace } from ".";
import { CodeSnippetsService } from "./CodeSnippetsService";
import getSnippetTextDocument from "./core/getSnippetTextDocument";

let managerTreeDataProvider: ManagerTreeDataProvider;

const getTreeElement = (element?: ISnippetWorkpace | ISnippet) => {
  const _element = <ISnippetWorkpace | undefined>element;

  if (!_element?.children) {
    return [];
  }

  return _element.children;
};

const getSnippets = async () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workpaces: ISnippetWorkpace[] = [];

  if (workspaceFolders) {
    for (const workspaceFolder of workspaceFolders) {
      const snippetsUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        ".vscode",
        "default-snippets-manager.code-snippets"
      );

      // get the snippets file content
      let snippetsTextDoc;

      try {
        snippetsTextDoc = await vscode.workspace.openTextDocument(snippetsUri);
      } catch (error) {
        continue;
      }

      const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

      const [_, snippets] = await codeSnippetsService.getMap();
      if (!snippets) {
        continue;
      }

      workpaces.push({
        name: workspaceFolder.name,
        children: Array.from(snippets).map(([name, snippet]) => {
          return codeSnippetsService.getSnippet(snippet, {
            name,
            uri: snippetsUri,
          });
        }),
      });
    }
  }

  return workpaces;
};

class ManagerTreeDataProvider
  implements vscode.TreeDataProvider<ISnippet | ISnippetWorkpace>
{
  private _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  constructor() {}

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }
  public getTreeItem(element: ISnippet | ISnippetWorkpace): vscode.TreeItem {
    const isSnippetWorkpace = (<ISnippetWorkpace>element).children;

    const showSnippetCommand = {
      command: "_snippetsmanager.showSnippet",
      title: "Show this snippet in editor.",
      arguments: [element],
    };

    return {
      label: element.name,
      command: !isSnippetWorkpace ? showSnippetCommand : undefined,
      collapsibleState: isSnippetWorkpace
        ? vscode.TreeItemCollapsibleState.Collapsed
        : undefined,
      contextValue: !isSnippetWorkpace
        ? "snippetsmanager-snippetsView-Explorer-Item"
        : "",
    };
  }

  public getChildren(
    element?: ISnippet | ISnippetWorkpace
  ):
    | ISnippet[]
    | Thenable<ISnippet[]>
    | ISnippetWorkpace[]
    | Thenable<ISnippetWorkpace[]> {
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
