import * as vscode from "vscode";
import { ISnippetContainer } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import userSnippetsFilesInfo from "../core/getUserSnippetsFilesInfo";
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

    const userSnippetInfo = await userSnippetsFilesInfo();

    for (const { uri, fileName } of userSnippetInfo) {
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
      userSnippets.push({
        name: fileName,
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

    return userSnippets;
  }
}

export function refresh() {
  snippetsExplorerView.refresh();
}
