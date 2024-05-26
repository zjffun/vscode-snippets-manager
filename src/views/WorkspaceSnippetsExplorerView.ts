import * as vscode from "vscode";
import { CodeSnippetsService } from "../CodeSnippetsService";
import BasicSnippetsExplorerView from "./BasicSnippetsExplorerView";

let snippetsExplorerView: WorkspaceSnippetsExplorerView;

export default class WorkspaceSnippetsExplorerView extends BasicSnippetsExplorerView {
  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  public static viewId =
    "snippetsmanager-snippetsView-WorkspaceSnippetsExplorerView";

  constructor(context: vscode.ExtensionContext) {
    super(context);

    snippetsExplorerView = this;
  }

  protected async getSnippets() {
    return CodeSnippetsService.getWorkspaceSnippetsTree();
  }
}

export function refresh() {
  snippetsExplorerView?.refresh();
}
