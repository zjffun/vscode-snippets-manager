import * as vscode from "vscode";
import { CodeSnippetsService } from "./CodeSnippetsService";
import showSource from "./commands/showSource";
import { getNonce } from "./util";
import refreshAllView from "./views/refreshAllView";

export let currentDocument: vscode.TextDocument | null = null;

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
      provider
    );
    return providerRegistration;
  }

  private static readonly activeContextKey =
    "snippetsmanagerCodeSnippetsEditorFocus";

  public static isActive: boolean = false;

  public static readonly viewType = "snippetsmanager.codeSnippetsEditorView";

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when our custom editor is opened.
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.setCurrent({ document, webviewPanel });
    this.setActiveContext(true);

    webviewPanel.onDidChangeViewState(() => {
      if (
        currentWebviewPanel === null ||
        currentWebviewPanel === webviewPanel
      ) {
        if (webviewPanel.visible) {
          this.setCurrent({ document, webviewPanel });
        } else {
          this.setCurrent();
        }
        this.setActiveContext(webviewPanel.visible);
      }
    });

    const codeSnippetsService = new CodeSnippetsService(document);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    async function updateWebview() {
      let text;
      try {
        text = codeSnippetsService.getEntriesString();
      } catch (error: any) {
        if (error?.message !== "Parse error: empty content") {
          webviewPanel.webview.postMessage({
            type: "error",
            error: error.message,
          });
          return;
        }

        vscode.workspace.fs.writeFile(
          document.uri,
          Uint8Array.from(Buffer.from("{}"))
        );

        // wait for take effect
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 100);
        });

        try {
          text = codeSnippetsService.getEntriesString();
        } catch (error: any) {
          webviewPanel.webview.postMessage({
            type: "error",
            error: error?.message,
          });
          return;
        }
      }

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
      if (currentWebviewPanel === webviewPanel) {
        this.setCurrent();
        this.setActiveContext(false);
      }
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(({ type, payload }) => {
      switch (type) {
        case "insert":
          codeSnippetsService.insert(payload.data, { index: payload.index });
          refreshAllView();
          return;

        case "update":
          codeSnippetsService.update(payload.data, payload.name);
          return;

        case "delete":
          codeSnippetsService.delete(payload.name);
          refreshAllView();
          return;

        case "openInDefaultEditor":
          showSource();
          return;
        case "error":
          this.showErrorMessage(payload.data);
          return;
      }
    });

    await updateWebview();
  }

  private async showErrorMessage(ErrMsg: string) {
    const answer = await vscode.window.showErrorMessage(
      `It seems an error occurred in the code snippets editor, do you want to open in default editor? (Error Message: ${ErrMsg})`,
      "Yes",
      "No"
    );

    if (answer === "Yes") {
      showSource();
      return;
    }
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out-view", "main.js")
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out-view", "main.css")
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

    const globalErrorHandlerUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "media",
        "globalErrorHandler.js"
      )
    );

    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js"
      )
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource} 'nonce-${nonce}'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
    CodeSnippetsEditor.isActive = value;
  }

  private setCurrent({
    document = null,
    webviewPanel = null,
  }: {
    document?: vscode.TextDocument | null;
    webviewPanel?: vscode.WebviewPanel | null;
  } = {}) {
    currentDocument = document;
    currentWebviewPanel = webviewPanel;
  }
}
