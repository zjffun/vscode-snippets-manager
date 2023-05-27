import * as vscode from "vscode";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import getSnippetUri from "../core/getSnippetUri";
import refreshAllView from "../views/refreshAllView";

const unsupportedScope = ["vue"];

export default async ({
  prefix,
  uri,
  escapeDollar,
}: {
  prefix?: string;
  uri?: vscode.Uri;
  escapeDollar?: boolean;
} = {}) => {
  const { activeTextEditor } = vscode.window;

  let _snippetUri = uri;

  if (!_snippetUri) {
    _snippetUri = await getSnippetUri();
  }

  if (!_snippetUri) {
    return;
  }

  let _prefix = prefix;
  if (_prefix === undefined || typeof _prefix !== "string") {
    const input = vscode.window.createInputBox();
    input.title = "Create Snippet";
    input.value = "";
    input.prompt = "Enter snippet prefix";
    input.show();

    _prefix = await new Promise<string>((resolve, reject) => {
      input.onDidAccept(() => {
        resolve(input.value);
        input.dispose();
      });
    });
  }

  let bodyText =
    activeTextEditor?.document?.getText?.(activeTextEditor?.selection) || "";

  if (escapeDollar === true) {
    bodyText = bodyText.replaceAll("$", "\\$");
  }

  let scope = activeTextEditor?.document?.languageId;
  if (scope === undefined || unsupportedScope.includes(scope)) {
    scope = "";
  }

  const textDocument = await getSnippetTextDocument({
    snippetsUri: _snippetUri,
    createSnippetsFileIfNotExists: true,
  });

  const codeSnippetsService = new CodeSnippetsService(textDocument);

  await codeSnippetsService.insert({
    name: _prefix,
    prefix: _prefix,
    description: _prefix,
    scope,
    body: bodyText,
  });

  refreshAllView();

  return true;
};
