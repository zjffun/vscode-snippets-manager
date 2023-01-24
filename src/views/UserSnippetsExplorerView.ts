import * as vscode from "vscode";
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
    return CodeSnippetsService.getUserSnippetsTree();
  }
}

export function refresh() {
  snippetsExplorerView.refresh();
}
