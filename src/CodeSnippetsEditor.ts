import { Buffer } from "buffer";
import * as vscode from "vscode";
import { CodeSnippetsService } from "./CodeSnippetsService";
import editSnippetBody from "./commands/editSnippetBody";
import openSource from "./commands/openSource";
import { no, yes } from "./common/l10n";
import { getNonce } from "./util";
import logger from "./utils/logger";
import refreshAllView from "./views/refreshAllView";
import copySnippetBodyToClipboard from "./commands/copySnippetBodyToClipboard";

const i18nText = {
  addSnippet: vscode.l10n.t("Add Snippet"),
  name: vscode.l10n.t("Name"),
  prefix: vscode.l10n.t("Prefix"),
  scope: vscode.l10n.t("Scope"),
  description: vscode.l10n.t("Description"),
  body: vscode.l10n.t("Body"),
  editItem: vscode.l10n.t("Edit Item"),
  copyBody: vscode.l10n.t("Copy Body To Clipboard"),
  editBody: vscode.l10n.t("Edit Body"),
  duplicateItem: vscode.l10n.t("Duplicate Item"),
  deleteItem: vscode.l10n.t("Delete Item"),
  snippetSyntax: vscode.l10n.t("Snippet Syntax"),
  save: vscode.l10n.t("Save"),
  cancel: vscode.l10n.t("Cancel"),
  noSnippets: vscode.l10n.t("No snippets."),
};

export let currentWebviewPanel: vscode.WebviewPanel | null = null;

/**
 * Provider for Code Snippets editor.
 *
 * Code Snippets editor are used for `.code-snippets` files, which are just json files.
 * To get started, run this extension and open an empty `.code-snippets` file in VS Code.
 *
 * This provider demonstrates:
 *
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class CodeSnippetsEditor implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new CodeSnippetsEditor(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      CodeSnippetsEditor.viewType,
      provider,
    );
    return providerRegistration;
  }

  private static readonly activeContextKey =
    "snippetsmanagerCodeSnippetsEditorFocus";

  public static readonly viewType = "snippetsmanager.codeSnippetsEditorView";

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    logger.debug(
      `Set currentWebviewPanel resolveCustomTextEditor: ${document.uri.toString()}`,
    );
    currentWebviewPanel = webviewPanel;

    const codeSnippetsService = new CodeSnippetsService(document);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    async function updateWebview() {
      let snippetList;
      let readonly = false;
      try {
        snippetList = codeSnippetsService.getSnippetList();
      } catch (error: any) {
        const errMsg = error?.message;
        if (errMsg !== "Parse Error: empty content") {
          webviewPanel.webview.postMessage({
            type: "error",
            errMsg,
          });
          return;
        }

        vscode.workspace.fs.writeFile(document.uri, Buffer.from("{}"));

        // wait for take effect
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 100);
        });

        try {
          snippetList = codeSnippetsService.getSnippetList();
        } catch (error: any) {
          const errMsg = error?.message;
          webviewPanel.webview.postMessage({
            type: "error",
            errMsg,
          });
          return;
        }
      }

      try {
        readonly = document.uri.toString().startsWith("git");
      } catch (error: any) {
        logger.error(`Failed to check readonly: ${error?.message}`);
      }

      webviewPanel.webview.postMessage({
        type: "update",
        snippetList,
        readonly,
      });
    }

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      },
    );

    webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.visible) {
        logger.debug(
          `Set currentWebviewPanel onDidChangeViewState: ${document.uri.toString()}`,
        );
        currentWebviewPanel = webviewPanel;
        updateWebview();
      } else if (currentWebviewPanel === webviewPanel) {
        logger.debug(
          `Set currentWebviewPanel onDidChangeViewState: null, from ${document.uri.toString()}`,
        );
        currentWebviewPanel = null;
      }
    });

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      logger.debug(
        `Set currentWebviewPanel onDidDispose: null, from ${document.uri.toString()}`,
      );
      currentWebviewPanel = null;
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(async ({ type, payload }) => {
      switch (type) {
        case "ready":
          updateWebview();
          return;

        case "insert": {
          await codeSnippetsService.insert(payload.snippet, {
            index: payload.index,
          });

          webviewPanel.webview.postMessage({
            type: "insertSuccess",
            keyName: payload.keyName,
          });

          refreshAllView();
          return;
        }

        case "update": {
          await codeSnippetsService.update(payload.snippet, payload.keyName);

          webviewPanel.webview.postMessage({
            type: "updateSuccess",
            keyName: payload.keyName,
          });

          refreshAllView();
          return;
        }

        case "duplicate": {
          await codeSnippetsService.duplicate(payload.keyName);
          refreshAllView();
          return;
        }

        case "delete":
          await codeSnippetsService.delete(payload.keyName);
          refreshAllView();
          return;

        case "editBody": {
          const snippets = codeSnippetsService.getSnippetByName(
            payload.keyName,
          );

          if (snippets) {
            editSnippetBody(snippets);
          }
          return;
        }

        case "openInDefaultEditor":
          openSource();
          return;

        case "help":
          vscode.env.openExternal(
            vscode.Uri.parse(
              "https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax",
            ),
          );
          return;

        case "copySnippetBody": {
          const snippet = codeSnippetsService.getSnippetByName(payload.keyName);

          if (snippet) {
            copySnippetBodyToClipboard([snippet]);
          }

          return;
        }

        case "error":
          this.showErrorMessage(payload.errMsg);
          return;
      }
    });

    await updateWebview();
  }

  private async showErrorMessage(errMsg: string) {
    const answer = await vscode.window.showErrorMessage(
      vscode.l10n.t(
        `It seems an error occurred in the code snippets editor, do you want to open in default editor? (Error Message: {0})`,
        errMsg,
      ),
      yes,
      no,
    );

    if (answer === yes) {
      openSource();
      return;
    }
  }

  /**
   * Get the static html used for the editor webview.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out-view", "main.js"),
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out-view", "main.css"),
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css",
      ),
    );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css"),
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css"),
    );

    const globalErrorHandlerUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "media",
        "globalErrorHandler.js",
      ),
    );

    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js",
      ),
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource};
          style-src ${webview.cspSource} 'nonce-${nonce}';
          font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta property="csp-nonce" content="${nonce}" />

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleUri}" rel="stylesheet" />

        <script nonce="${nonce}" src="${globalErrorHandlerUri}"></script>
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>

				<title>Code Snippets Editor</title>
			</head>
			<body>
				<div id="root">
          <vscode-progress-ring></vscode-progress-ring>
        </div>
        <script nonce="${nonce}">
          window.i18nText = ${JSON.stringify(i18nText)}
        </script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
