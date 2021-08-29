import * as vscode from "vscode";
import createSnippet from "./createSnippet";
import deleteSnippet from "./deleteSnippet";
import editSnippet from "./editSnippet";
import { refresh, registerExplorerView } from "./explorerView";
import { registerHelpAndFeedbackView } from "./helpAndFeedbackView";

export function activate(context: vscode.ExtensionContext) {
  registerExplorerView(context);

  const createSnippetCmd = vscode.commands.registerCommand(
    "snippetsmanager.createSnippet",
    () => {
      createSnippet();
    }
  );

  const deleteSnippetCmd = vscode.commands.registerCommand(
    "_snippetsmanager.deleteSnippet",
    (snippet) => {
      deleteSnippet(snippet);
    }
  );
  const editSnippetCmd = vscode.commands.registerCommand(
    "_snippetsmanager.editSnippet",
    (snippet) => {
      editSnippet(snippet);
    }
  );

  const refreshCmd = vscode.commands.registerCommand(
    "snippetsmanager.refresh",
    () => {
      refresh();
    }
  );

  context.subscriptions.push(createSnippetCmd);
  context.subscriptions.push(deleteSnippetCmd);
  context.subscriptions.push(editSnippetCmd);
  context.subscriptions.push(refreshCmd);

  registerHelpAndFeedbackView(context);
}

export function deactivate() {}
