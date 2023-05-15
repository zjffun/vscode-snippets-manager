import * as vscode from "vscode";

const log = vscode.window.createOutputChannel("Snippets Manager");

const logger = {
  debug: (message: string) => {
    log.appendLine(`[DEBUG] ${message}`);
  },
  info: (message: string) => {
    log.appendLine(`[INFO] ${message}`);
  },
  error: (message: string) => {
    log.appendLine(`[ERROR] ${message}`);
  },
};

export default logger;
