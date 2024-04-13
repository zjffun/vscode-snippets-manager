import * as vscode from "vscode";
import moveSnippets, { movingSnippetsMimeType } from "../core/moveSnippets";
import getSnippets from "../utils/getSnippets";
import { ISnippet, ISnippetContainer } from "..";

export class SnippetTreeItem extends vscode.TreeItem {
  name?: string = "";
  isFile?: boolean;
  uri?: vscode.Uri;
  children?: SnippetTreeItem[] = [];
}

export default abstract class BasicSnippetsExplorerView
  implements vscode.TreeDataProvider<SnippetTreeItem>
{
  public static viewId = "";

  protected abstract _onDidChangeTreeData: vscode.EventEmitter<any>;

  public abstract readonly onDidChangeTreeData: vscode.Event<any>;

  protected abstract getSnippets(): Promise<SnippetTreeItem[]>;

  protected context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const that = this;

    // wait for onDidChangeTreeData and _onDidChangeTreeData added
    setTimeout(() => {
      vscode.window.createTreeView((that.constructor as any).viewId, {
        treeDataProvider: that,
        showCollapseAll: true,
        canSelectMany: true,
        dragAndDropController: {
          dragMimeTypes: [movingSnippetsMimeType],
          dropMimeTypes: [movingSnippetsMimeType],
          handleDrag(
            source: (ISnippet | ISnippetContainer)[],
            dataTransfer,
            token
          ) {
            const snippets = getSnippets(undefined, source);

            if (!snippets.length) {
              token.isCancellationRequested = true;
              return;
            }

            dataTransfer.set(
              movingSnippetsMimeType,
              new vscode.DataTransferItem(snippets)
            );
          },
          async handleDrop(
            target: ISnippet | ISnippetContainer,
            dataTransfer,
            token
          ) {
            if (
              (target as ISnippetContainer)?.isWorkspace ||
              (target as ISnippetContainer)?.isExtension
            ) {
              token.isCancellationRequested = true;
              return;
            }

            let snippets = dataTransfer.get(movingSnippetsMimeType)?.value;

            if (typeof snippets === "string") {
              snippets = JSON.parse(snippets, function (key, value) {
                if (key === "uri") {
                  return vscode.Uri.from(value);
                }

                return value;
              });
            }

            await moveSnippets(target, snippets);
          },
        },
      });
    }, 0);
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }

  public getTreeItem(element: SnippetTreeItem): SnippetTreeItem {
    const showSnippetCommand = {
      command: "_snippetsmanager.showSnippet",
      title: "Show this snippet in editor.",
      arguments: [element],
    };

    let contextValue = "";
    if (element.isFile) {
      contextValue = "snippetsmanager-snippetsView-Explorer-FileItem";
    } else if (!element.children) {
      contextValue = "snippetsmanager-snippetsView-Explorer-Item";
    }

    const item = new SnippetTreeItem(
      element.name || "",
      element.children ? vscode.TreeItemCollapsibleState.Collapsed : undefined
    );
    item.command = !element.children ? showSnippetCommand : undefined;
    item.contextValue = contextValue;

    return item;
  }

  public getChildren(
    element?: SnippetTreeItem
  ): SnippetTreeItem[] | Thenable<SnippetTreeItem[]> {
    if (element) {
      if (!element.children) {
        return [];
      }
      return element.children;
    }

    return this.getSnippets();
  }
}
