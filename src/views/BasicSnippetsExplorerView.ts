import * as vscode from "vscode";
import { ISnippet, ISnippetContainer, ISnippetContainerFile } from "..";

export default abstract class BasicSnippetsExplorerView
  implements
    vscode.TreeDataProvider<
      ISnippet | ISnippetContainerFile | ISnippetContainer
    >
{
  public static viewId = "";

  protected abstract _onDidChangeTreeData: vscode.EventEmitter<any>;

  public abstract readonly onDidChangeTreeData: vscode.Event<any>;

  protected abstract getSnippets(
    context: vscode.ExtensionContext
  ): Promise<ISnippetContainer[]>;

  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    vscode.window.createTreeView((this.constructor as any).viewId, {
      treeDataProvider: this,
    });
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }

  public getTreeItem(element: ISnippet | ISnippetContainer): vscode.TreeItem {
    const isSnippetContainer = (<ISnippetContainer>element).children;

    const showSnippetCommand = {
      command: "_snippetsmanager.showSnippet",
      title: "Show this snippet in editor.",
      arguments: [element],
    };

    return {
      label: element.name,
      command: !isSnippetContainer ? showSnippetCommand : undefined,
      collapsibleState: isSnippetContainer
        ? vscode.TreeItemCollapsibleState.Collapsed
        : undefined,
      contextValue: !isSnippetContainer
        ? "snippetsmanager-snippetsView-Explorer-Item"
        : "",
    };
  }

  public getChildren(
    element?: ISnippet | ISnippetContainerFile | ISnippetContainer
  ):
    | ISnippet[]
    | Thenable<ISnippet[]>
    | ISnippetContainerFile[]
    | Thenable<ISnippetContainerFile[]>
    | ISnippetContainer[]
    | Thenable<ISnippetContainer[]> {
    return element
      ? this.getTreeElement(element)
      : this.getSnippets(this.context);
  }

  protected getTreeElement = (
    element: ISnippet | ISnippetContainerFile | ISnippetContainer
  ) => {
    const _element = <ISnippetContainerFile | ISnippetContainer>element;

    if (!_element?.children) {
      return [];
    }

    return _element.children;
  };
}
