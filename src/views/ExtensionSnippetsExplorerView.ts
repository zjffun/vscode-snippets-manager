import * as vscode from "vscode";
import { ISnippetContainer } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import BasicSnippetsExplorerView from "./BasicSnippetsExplorerView";

let snippetsExplorerView: ExtensionSnippetsExplorerView;

export default class ExtensionSnippetsExplorerView extends BasicSnippetsExplorerView {
  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  public static viewId =
    "snippetsmanager-snippetsView-ExtensionSnippetsExplorerView";

  constructor(context: vscode.ExtensionContext) {
    super(context);

    snippetsExplorerView = this;
  }

  protected async getSnippets() {
    const extensions: ISnippetContainer[] = [];

    for (const extension of vscode.extensions.all) {
      let { packageJSON } = extension;
      if (
        packageJSON &&
        packageJSON.isBuiltin === false &&
        packageJSON?.contributes?.snippets
      ) {
        const snippetFiles = [];
        for (const snippet of packageJSON.contributes.snippets) {
          const snippetsUri = vscode.Uri.joinPath(
            vscode.Uri.file(extension.extensionPath),
            snippet.path
          );

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
          snippetFiles.push({
            name: snippet.path,
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
        extensions.push({
          name: packageJSON.name,
          children: snippetFiles,
        });
      }
    }

    return extensions;
  }
}

export function refresh() {
  snippetsExplorerView.refresh();
}
