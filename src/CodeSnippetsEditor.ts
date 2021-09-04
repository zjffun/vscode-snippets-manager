import * as vscode from "vscode";
import { Snippet } from ".";
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
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
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
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(({ type, payload }) => {
      switch (type) {
        case "update":
          this.updateSnippet(document, payload);
          return;

        case "delete":
          this.deleteSnippet(document, payload.key);
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

  /**
   * Add a new scratch to the current document.
   */
  private updateSnippet(document: vscode.TextDocument, payload: any) {
    let snippetEntries = this.getDocumentAsSnippetEntries(document);

    snippetEntries = snippetEntries.map(([key, snippet]) => {
      if (key === payload.key) {
        snippet.prefix = payload.data.prefix;
        snippet.description = payload.data.description;
        snippet.scope = payload.data.scope;
        snippet.body = payload.data.body.split("\n");
        return [payload.data.name, snippet];
      }
      return [key, snippet];
    });

    return this.updateTextDocument(document, snippetEntries);
  }

  /**
   * Delete an existing scratch from a document.
   */
  private deleteSnippet(document: vscode.TextDocument, key: string) {
    let snippetEntries = this.getDocumentAsSnippetEntries(document);

    snippetEntries = snippetEntries.filter(([_key]) => _key !== key);

    return this.updateTextDocument(document, snippetEntries);
  }

  /**
   * Try to get a current document as object entries.
   */
  private getDocumentAsSnippetEntries(
    document: vscode.TextDocument
  ): [string, Snippet][] {
    const text = document.getText();
    if (text.trim().length === 0) {
      return Object.entries({});
    }

    try {
      return Object.entries(JSON.parse(text));
    } catch {
      throw new Error(
        "Could not get document as json. Content is not valid json"
      );
    }
  }

  /**
   * Write out the snippet entries to a given document.
   */
  private updateTextDocument(
    document: vscode.TextDocument,
    snippetEntries: any
  ) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(Object.fromEntries(snippetEntries), null, 2)
    );

    return vscode.workspace.applyEdit(edit);
  }
}
