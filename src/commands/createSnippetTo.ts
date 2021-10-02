import * as vscode from "vscode";
import { Uri } from "vscode";
import getUserSnippetsFilesInfo from "../core/getUserSnippetsFilesInfo";
import getWorkspaceSnippetsFilesInfo from "../core/getWorkspaceSnippetsFilesInfo";
import createSnippet from "./createSnippet";

type Item = vscode.QuickPickItem & { uri: Uri };
type Items = Item[];

export default async (prefix?: string) => {
  const userSnippetsFilesInfo = await getUserSnippetsFilesInfo();
  const workspaceSnippetsFilesInfo = await getWorkspaceSnippetsFilesInfo();

  const items: Items = [
    ...userSnippetsFilesInfo.map(({ fileName, uri }) => ({
      description: "User Snippets",
      label: fileName,
      uri,
    })),
    ...workspaceSnippetsFilesInfo.reduce<Items>((prev, cur) => {
      return prev.concat(
        cur.snippetsFiles.map(({ name, uri }) => {
          return {
            description: `Workspace Snippets - ${cur.folder.name}`,
            label: name,
            uri,
          };
        })
      );
    }, []),
  ];

  const snippetsFile = await vscode.window.showQuickPick<Item>(items, {
    matchOnDescription: true,
    placeHolder: items.length
      ? "Select Snippets File"
      : "Snippets Files Not Found",
  });

  if (!snippetsFile) {
    return;
  }

  createSnippet(prefix, snippetsFile.uri);
};
