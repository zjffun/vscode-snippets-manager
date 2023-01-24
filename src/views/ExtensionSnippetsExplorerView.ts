import * as vscode from "vscode";
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
    return CodeSnippetsService.getExtensionSnippetsTree();
  }
}

export function refresh() {
  snippetsExplorerView.refresh();
}
