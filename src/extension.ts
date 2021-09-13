import * as vscode from "vscode";
import { CodeSnippetsEditor } from "./CodeSnippetsEditor";
import createSnippet from "./commands/createSnippet";
import deleteSnippet from "./commands/deleteSnippet";
import editSnippet from "./commands/editSnippet";
import showEditor from "./commands/showEditor";
import showSnippet from "./commands/showSnippet";
import showSource from "./commands/showSource";
import ExtensionSnippetsExplorerView from "./views/extensionSnippetsExplorerView";
import { registerHelpAndFeedbackView } from "./views/helpAndFeedbackView";
import WorkspaceSnippetsExplorerView, {
  refresh,
} from "./views/WorkspaceSnippetsExplorerView";

export function activate(context: vscode.ExtensionContext) {
  new WorkspaceSnippetsExplorerView(context);

  new ExtensionSnippetsExplorerView(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.createSnippet",
      async (prefix?: string) => {
        return createSnippet(prefix);
      }
    )
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

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.showSource", (uri) => {
      showSource(uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.showEditor", () => {
      showEditor();
    })
  );

  context.subscriptions.push(CodeSnippetsEditor.register(context));

  registerHelpAndFeedbackView(context);
}

export function deactivate() {}
