import * as vscode from "vscode";
import { CodeSnippetsEditor } from "./CodeSnippetsEditor";
import copySnippet from "./commands/copySnippet";
import copySnippetBodyToClipboard from "./commands/copySnippetBodyToClipboard";
import createSnippet from "./commands/createSnippet";
import createSnippetTo from "./commands/createSnippetTo";
import deleteSnippet from "./commands/deleteSnippet";
import deleteSnippetFile from "./commands/deleteSnippetFile";
import duplicateSnippet from "./commands/duplicateSnippet";
import editSnippet from "./commands/editSnippet";
import { initEditSnippetBody } from "./commands/editSnippetBody";
import openEditor from "./commands/openEditor";
import openSnippetsManger from "./commands/openSnippetsManger";
import openSource from "./commands/openSource";
import pasteSnippet from "./commands/pasteSnippet";
import searchSnippet from "./commands/searchSnippet";
import viewSnippet from "./commands/viewSnippet";
import workbenchActionOpenSnippets, {
  workbenchActionOpenSnippetsId,
} from "./commands/workbenchActionOpenSnippets";
import { setContext, SnippetType } from "./share";
import getSnippets from "./utils/getSnippets";
import ExtensionSnippetsExplorerView from "./views/ExtensionSnippetsExplorerView";
import { registerHelpAndFeedbackView } from "./views/helpAndFeedbackView";
import refreshAllView from "./views/refreshAllView";
import UserSnippetsExplorerView from "./views/UserSnippetsExplorerView";
import WorkspaceSnippetsExplorerView from "./views/WorkspaceSnippetsExplorerView";

export function activate(context: vscode.ExtensionContext) {
  setContext(context);

  context.subscriptions.push(initEditSnippetBody());

  new WorkspaceSnippetsExplorerView(context);

  new UserSnippetsExplorerView(context);

  new ExtensionSnippetsExplorerView(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.openSnippetsManger",
      () => {
        return openSnippetsManger();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.search", (type) => {
      return searchSnippet(type);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.searchWorkspaceSnippets",
      async () => {
        await vscode.commands.executeCommand(
          "snippetsmanager.search",
          SnippetType.WORKSPACE,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.searchUserSnippets",
      async () => {
        await vscode.commands.executeCommand(
          "snippetsmanager.search",
          SnippetType.USER,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.searchExtensionSnippets",
      async () => {
        await vscode.commands.executeCommand(
          "snippetsmanager.search",
          SnippetType.EXTENSION,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.createSnippet",
      async (prefix?: string) => {
        return createSnippet({ prefix, escape: true });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.createSnippetTo",
      async (prefix?: string, uri?: vscode.Uri) => {
        return createSnippetTo({ prefix, uri, escape: true });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.createSnippetWithoutEscape",
      async (prefix?: string) => {
        return createSnippet({ prefix });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snippetsmanager.createSnippetWithoutEscapeTo",
      async (prefix?: string, uri?: vscode.Uri) => {
        return createSnippetTo({ prefix, uri });
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      workbenchActionOpenSnippetsId,
      workbenchActionOpenSnippets,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.deleteSnippetFile",
      (snippet) => {
        deleteSnippetFile(snippet);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.copySnippet",
      (snippet, snippets) => {
        const _snippets = getSnippets(snippet, snippets);
        copySnippet(_snippets);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.copySnippetBodyToClipboard",
      (snippet, snippets) => {
        const _snippets = getSnippets(snippet, snippets);
        copySnippetBodyToClipboard(_snippets);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.pasteSnippet",
      (snippet) => {
        pasteSnippet(snippet);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.duplicateSnippet",
      (snippet) => {
        duplicateSnippet(snippet);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.deleteSnippet",
      (snippet, snippets) => {
        const _snippets = getSnippets(snippet, snippets);
        deleteSnippet(_snippets);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.editSnippet",
      (snippet) => {
        editSnippet(snippet);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_snippetsmanager.viewSnippet",
      (snippet) => {
        viewSnippet(snippet);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.refresh", () => {
      refreshAllView();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.openSource", async () => {
      return openSource();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snippetsmanager.openEditor", async () => {
      return openEditor();
    }),
  );

  context.subscriptions.push(CodeSnippetsEditor.register(context));

  registerHelpAndFeedbackView(context);
}

export function deactivate() {}
