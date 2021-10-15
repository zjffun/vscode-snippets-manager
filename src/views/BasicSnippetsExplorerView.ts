import * as vscode from "vscode";
import { ISnippet, ISnippetContainer } from "..";

export default abstract class BasicSnippetsExplorerView
  implements vscode.TreeDataProvider<ISnippet | ISnippetContainer>
{
  public static viewId = "";

  protected abstract _onDidChangeTreeData: vscode.EventEmitter<any>;

  public abstract readonly onDidChangeTreeData: vscode.Event<any>;

  protected abstract getSnippets(): Promise<ISnippetContainer[]>;

  protected context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const that = this;

    // wait for onDidChangeTreeData and _onDidChangeTreeData added
    setImmediate(() => {
      vscode.window.createTreeView((that.constructor as any).viewId, {
        treeDataProvider: that,
        showCollapseAll: true,
      });
    });
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }

  public getTreeItem(element: ISnippet | ISnippetContainer): vscode.TreeItem {
    const { children: isSnippetContainer, isFile } = <ISnippetContainer>element;

    const showSnippetCommand = {
      command: "_snippetsmanager.showSnippet",
      title: "Show this snippet in editor.",
      arguments: [element],
    };

    let contextValue = "";
    if (isFile) {
      contextValue = "snippetsmanager-snippetsView-Explorer-FileItem";
    } else if (!isSnippetContainer) {
      contextValue = "snippetsmanager-snippetsView-Explorer-Item";
    }

    return {
      label: element.name,
      command: !isSnippetContainer ? showSnippetCommand : undefined,
      collapsibleState: isSnippetContainer
        ? vscode.TreeItemCollapsibleState.Collapsed
        : undefined,
      contextValue: contextValue,
    };
  }

  public getChildren(
    element?: ISnippet | ISnippetContainer
  ):
    | ISnippet[]
    | Thenable<ISnippet[]>
    | ISnippetContainer[]
    | Thenable<ISnippetContainer[]> {
    return element ? this.getTreeElement(element) : this.getSnippets();
  }

  protected getTreeElement = (element: ISnippet | ISnippetContainer) => {
    const _element = <ISnippetContainer>element;

    if (!_element?.children) {
      return [];
    }

    return _element.children;
  };
}
