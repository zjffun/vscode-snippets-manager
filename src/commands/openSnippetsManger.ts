import * as vscode from "vscode";

export default async () => {
  await vscode.commands.executeCommand(
    "workbench.view.extension.snippetsmanager-snippetsView",
  );
};
