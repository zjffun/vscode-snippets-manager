import * as vscode from "vscode";
import { ISnippet, ISnippetWorkpace, ISnippetWorkpaceFile } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";

let managerTreeDataProvider: ManagerTreeDataProvider;

const getTreeElement = (
  element: ISnippet | ISnippetWorkpaceFile | ISnippetWorkpace
) => {
  const _element = <ISnippetWorkpaceFile | ISnippetWorkpace>element;

  if (!_element?.children) {
    return [];
  }

  return _element.children;
};

const getSnippets = async (context: vscode.ExtensionContext) => {
  const workpaces: ISnippetWorkpace[] = [];

  // TODO: read extensions snippets
  // Believe this extension will be installed with other extensions
  // context.extensionPath;

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
          const snippetsUri = vscode.Uri.joinPath(dotVSCodeFolderUri, fileName);

          // get the snippets file content
          let snippetsTextDoc;

          try {
            snippetsTextDoc = await vscode.workspace.openTextDocument(
              snippetsUri
            );
          } catch (error) {
            continue;
          }

          const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

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
};

class ManagerTreeDataProvider
  implements
    vscode.TreeDataProvider<ISnippet | ISnippetWorkpaceFile | ISnippetWorkpace>
{
  private _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

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
    element?: ISnippet | ISnippetWorkpaceFile | ISnippetWorkpace
  ):
    | ISnippet[]
    | Thenable<ISnippet[]>
    | ISnippetWorkpaceFile[]
    | Thenable<ISnippetWorkpaceFile[]>
    | ISnippetWorkpace[]
    | Thenable<ISnippetWorkpace[]> {
    return element ? getTreeElement(element) : getSnippets(this.context);
  }
}

export function refresh() {
  managerTreeDataProvider.refresh();
}

export function registerExplorerView(context: vscode.ExtensionContext) {
  managerTreeDataProvider = new ManagerTreeDataProvider(context);

  vscode.window.createTreeView("snippetsmanager-snippetsView-Explorer", {
    treeDataProvider: managerTreeDataProvider,
  });
}
