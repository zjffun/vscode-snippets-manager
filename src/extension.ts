import * as vscode from "vscode";
import createSnippet from "./createSnippet";
import deleteSnippet from "./deleteSnippet";
import editSnippet from "./editSnippet";
import { CodeSnippetsEditor } from "./CodeSnippetsEditor";
import { refresh, registerExplorerView } from "./explorerView";
import { registerHelpAndFeedbackView } from "./helpAndFeedbackView";
import showSnippet from "./showSnippet";

export function activate(context: vscode.ExtensionContext) {
  registerExplorerView(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.createSnippet", () => {
      createSnippet();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.deleteSnippet",
      (snippet) => {
        deleteSnippet(snippet);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.editSnippet",
      (snippet) => {
        editSnippet(snippet);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.showSnippet",
      (snippet) => {
        showSnippet(snippet);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.refresh", () => {
      refresh();
    })
  );

  context.subscriptions.push(CodeSnippetsEditor.register(context));

  registerHelpAndFeedbackView(context);
}

export function deactivate() {}
