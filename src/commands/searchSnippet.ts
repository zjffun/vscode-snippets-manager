import * as vscode from "vscode";
import { ISnippet } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";
import { no, yes } from "../common/l10n";
import { SnippetType, snippetTypeNameMap } from "../share";

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

  if (!quickPickItems.length) {
    const allName = vscode.l10n.t("workspace, user and extension");

    if (type) {
      const answer = await vscode.window.showWarningMessage(
        vscode.l10n.t(
          "No {0} snippets found. Do you want to search from all ({1}) snippets?",
          snippetTypeNameMap.get(type) || "",
          allName
        ),
        {
          modal: true,
        },
        yes,
        no
      );

      if (answer !== yes) {
        return;
      }

      vscode.commands.executeCommand("snippetsmanager.search");
      return;
    }

    vscode.window.showWarningMessage(
      vscode.l10n.t("No {0} snippets found.", allName)
    );
    return;
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
