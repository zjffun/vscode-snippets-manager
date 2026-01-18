import * as vscode from "vscode";
import moveSnippets, { movingSnippetsMimeType } from "../core/moveSnippets";
import getSnippets from "../utils/getSnippets";
import { ISnippet, ISnippetContainer } from "..";

// Map filename → extension
const extensionMap = {
  // Core web
  html: "html",
  css: "css",
  sass: "scss",
  scss: "scss",
  less: "less",
  javascript: "js",
  javascriptreact: "jsx",
  jquery: "js",
  typescript: "ts",
  typescriptreact: "tsx",
  // Templates
  twig: "twig",
  jinja: "jinja",
  // Backend / scripting
  php: "php",
  python: "py",
  java: "java",
  // Data / query
  json: "json",
  sql: "sql",
  // Shell / automation
  bash: "sh",
  batch: "bat",
  bat: "bat",
  powershell: "ps1",
  // Platforms / tooling
  node: "js",
  npm: "json",
  // Systems / languages
  go: "go",
  rust: "rs",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  kotlin: "kt",
  lua: "lua",
  dart: "dart",
  perl: "pl",
  ruby: "rb",
  swift: "swift",
  r: "r",
  vue: "vue",
  // Docs
  markdown: "md",
  md: "md"
};

export class SnippetTreeItem extends vscode.TreeItem {
  name?: string = "";
  isFile?: boolean;
  uri?: vscode.Uri;
  children?: SnippetTreeItem[] = [];
}

export default abstract class BasicSnippetsExplorerView
  implements vscode.TreeDataProvider<SnippetTreeItem> {
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
            token,
          ) {
            const snippets = getSnippets(undefined, source);

            if (!snippets.length) {
              token.isCancellationRequested = true;
              return;
            }

            dataTransfer.set(
              movingSnippetsMimeType,
              new vscode.DataTransferItem(snippets),
            );
          },
          async handleDrop(
            target: ISnippet | ISnippetContainer,
            dataTransfer,
            token,
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
    const viewSnippetCommand = {
      command: "_snippetsmanager.viewSnippet",
      title: "View this snippet in editor.",
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
      element.isFile
        ? vscode.TreeItemCollapsibleState.Collapsed
        : element.children
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None
    );
    if (element.isFile) {
      item.iconPath = vscode.ThemeIcon.File;
      // Map filename → extension
      const lang = (element.name ?? "").toLowerCase().replace(/\.(json|code-snippets)$/i, "");
      // Language-specific file icon
      const langKey = lang as keyof typeof extensionMap;
      item.resourceUri = vscode.Uri.file(`_.${extensionMap[langKey] ?? "txt"}`);
    }
    item.command = !element.children ? viewSnippetCommand : undefined;
    item.contextValue = contextValue;

    return item;
  }

  public getChildren(
    element?: SnippetTreeItem,
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
