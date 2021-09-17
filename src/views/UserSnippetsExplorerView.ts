import * as vscode from "vscode";
import { ISnippetContainer } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import BasicSnippetsExplorerView from "./BasicSnippetsExplorerView";

let snippetsExplorerView: UserSnippetsExplorerView;

export default class UserSnippetsExplorerView extends BasicSnippetsExplorerView {
  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  public static viewId =
    "snippetsmanager-snippetsView-UserSnippetsExplorerView";

  constructor(context: vscode.ExtensionContext) {
    super(context);

    snippetsExplorerView = this;
  }

  protected async getSnippets() {
    const userSnippets: ISnippetContainer[] = [];

    const userFolderUri = vscode.Uri.joinPath(
      this.context.globalStorageUri,
      "../../../User/snippets"
    );

    let userSnippetFiles: [string, vscode.FileType][] = [];
    try {
      userSnippetFiles = await vscode.workspace.fs.readDirectory(userFolderUri);
    } catch (error) {
      // havn no .vscode folder, do noting
    }

    for (const [fileName, fileType] of userSnippetFiles) {
      if (
        fileType === vscode.FileType.File &&
        (fileName.endsWith(".code-snippets") || fileName.endsWith(".json"))
      ) {
        const snippetsUri = vscode.Uri.joinPath(userFolderUri, fileName);

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
        userSnippets.push({
          name: fileName,
          isFile: true,
          uri: snippetsUri,
          children: Array.from(snippets).map(([name, snippet]) => {
            return codeSnippetsService.getSnippet(snippet, {
              name,
              uri: snippetsUri,
            });
          }),
        });
      }
    }

    return userSnippets;
  }
}

export function refresh() {
  snippetsExplorerView.refresh();
}
