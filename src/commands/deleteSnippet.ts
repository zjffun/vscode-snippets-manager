import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import getSnippetTextDocument from "../core/getSnippetTextDocument";
import { refresh } from "../views/WorkspaceSnippetsExplorerView";

export default async (snippet: ISnippet) => {
  if (!snippet.uri) {
    return;
  }
  if (!snippet.name) {
    return;
  }

  const textDocument = await getSnippetTextDocument({
    snippetsUri: snippet.uri,
  });

  const codeSnippetsService = new CodeSnippetsService(textDocument);

  await codeSnippetsService.delete(snippet.name);

  refresh();
};
