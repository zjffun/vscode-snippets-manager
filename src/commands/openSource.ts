import * as vscode from "vscode";

export default async () => {
  const res = await vscode.commands.executeCommand(
    "workbench.action.reopenTextEditor",
  );

  return res;
};
