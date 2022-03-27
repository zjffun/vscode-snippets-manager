import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import { SnippetType } from "../share";

interface ISnippetQuickPickItem extends vscode.QuickPickItem {
  snippet: ISnippet;
}

export default async (type?: SnippetType) => {
  let snippets: ISnippet[];

  switch (type) {
    case SnippetType.WORKSPACE:
      snippets = await CodeSnippetsService.getWorkspaceSnippetsList();
      break;
    case SnippetType.USER:
      snippets = await CodeSnippetsService.getUserSnippetsList();
      break;
    case SnippetType.EXTENSION:
      snippets = await CodeSnippetsService.getExtensionSnippetsList();
      break;
    default:
      snippets = (await CodeSnippetsService.getWorkspaceSnippetsList()).concat(
        await CodeSnippetsService.getUserSnippetsList(),
        await CodeSnippetsService.getExtensionSnippetsList()
      );
      break;
  }

  const quickPickItems: ISnippetQuickPickItem[] = [];

  for (const snippet of snippets) {
    const desc = [];
    if (snippet.name) {
      desc.push(snippet.name);
    }
    if (snippet.description) {
      desc.push(snippet.description);
    }

    quickPickItems.push({
      label: snippet.prefix ?? "",
      description: desc.join(" | "),
      detail: snippet.body ?? "",
      snippet: snippet,
    });
  }

  const result = await vscode.window.showQuickPick(quickPickItems, {
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (result) {
    vscode.commands.executeCommand(
      "_snippetsmanager.showSnippet",
      result.snippet
    );
  }
};
