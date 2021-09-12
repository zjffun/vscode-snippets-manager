import * as vscode from "vscode";
import { CodeSnippetsService } from "./CodeSnippetsService";
import { getNonce } from "./util";

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
      provider
    );
    return providerRegistration;
  }

  private static readonly activeContextKey =
    "snippetsmanagerCodeSnippetsEditorFocus";

  public static readonly viewType = "snippetsmanager.codeSnippetsEditorView";

  public static currentWebviewPanel: vscode.WebviewPanel | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    CodeSnippetsEditor.currentWebviewPanel = webviewPanel;
    this.setActiveContext(true);

    webviewPanel.onDidChangeViewState(() => {
      CodeSnippetsEditor.currentWebviewPanel = webviewPanel.visible
        ? webviewPanel
        : null;
      this.setActiveContext(webviewPanel.visible);
    });

    const codeSnippetsService = new CodeSnippetsService(document);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
      const [errors, text] = codeSnippetsService.getEntriesString();

      webviewPanel.webview.postMessage({
        type: "update",
        text,
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
      }
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      CodeSnippetsEditor.currentWebviewPanel = null;
      this.setActiveContext(false);
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(({ type, payload }) => {
      switch (type) {
        case "insert":
          codeSnippetsService.insert(payload.data);
          return;

        case "update":
          codeSnippetsService.update(payload.data, payload.name);
          return;

        case "delete":
          codeSnippetsService.delete(payload.name);
          return;
      }
    });

    updateWebview();
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "code-snippets-editor",
        "dist",
        "main.js"
      )
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "code-snippets-editor",
        "dist",
        "main.css"
      )
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

        
				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleUri}" rel="stylesheet" />

				<title>Code Snippets</title>
			</head>
			<body>
				<div id="root"></div>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private setActiveContext(value: boolean) {
    vscode.commands.executeCommand(
      "setContext",
      CodeSnippetsEditor.activeContextKey,
      value
    );
  }
}
