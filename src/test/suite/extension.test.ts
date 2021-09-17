import * as assert from "assert";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import {
  CodeSnippetsEditor,
  currentWebviewPanel,
} from "../../CodeSnippetsEditor";

// import * as myExtension from '../../extension';

const testWorkspaceRoot = <vscode.Uri>(
  vscode.workspace.workspaceFolders?.[0]?.uri
);

assert.ok(testWorkspaceRoot);

const testWorkspaceFolder = vscode.Uri.joinPath(testWorkspaceRoot, "test");

suite("Extension", () => {
  const extensionID = "zjffun.snippetsmanager";
  const extensionShortName = "snippetsmanager";

  let extension: vscode.Extension<any> | undefined;

  extension = vscode.extensions.getExtension(extensionID);

  setup(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  teardown(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  test("All package.json commands should be registered in extension", (done) => {
    if (!extension) {
      throw Error("can't find extension");
    }

    const packageCommands = extension.packageJSON.contributes.commands.map(
      (c: any) => c.command
    );

    // get all extension commands excluding internal commands.
    vscode.commands.getCommands(true).then((allCommands) => {
      const activeCommands = allCommands.filter((c) =>
        c.startsWith(`${extensionShortName}.`)
      );

      activeCommands.forEach((command) => {
        const result = packageCommands.some((c: any) => c === command);
        assert.ok(result);
      });

      done();
    });
  });

  test("Create snippet command shouldn't work when has no selection", async () => {
    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippet"
    );

    assert.strictEqual(res, undefined);
  });

  test("Create snippet command should work when has selection", async () => {
    const testfileUri = vscode.Uri.joinPath(testWorkspaceRoot, "testfile");
    await vscode.workspace.fs.writeFile(
      testfileUri,
      Uint8Array.from(Buffer.from("test content"))
    );

    await vscode.commands.executeCommand("vscode.open", testfileUri);
    await vscode.commands.executeCommand(
      "editor.action.selectAll",
      testfileUri
    );

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippet",
      "test"
    );

    assert.ok(res);
  });

  test("Explorer should work", async () => {
    await vscode.commands.executeCommand(
      "workbench.view.extension.snippetsmanager-snippetsView"
    );
  });

  test("Snippet editor should work", async () => {
    const testfileUri = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "test.code-snippets"
    );
    await vscode.workspace.fs.writeFile(
      testfileUri,
      Uint8Array.from(Buffer.from(""))
    );

    await vscode.commands.executeCommand("vscode.open", testfileUri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(currentWebviewPanel);

    await vscode.commands.executeCommand("workbench.action.splitEditorRight");
    await vscode.commands.executeCommand(
      "workbench.action.files.newUntitledFile"
    );
    assert.strictEqual(currentWebviewPanel, null);

    await vscode.commands.executeCommand("vscode.open", testfileUri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(currentWebviewPanel);
  });

  test("Snippet editor context should currect", async () => {
    const testfileUri = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "test.code-snippets"
    );
    const testfileUri2 = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "test2.code-snippets"
    );
    const testfileUri3 = vscode.Uri.joinPath(testWorkspaceRoot, "test3.json");
    await vscode.workspace.fs.writeFile(
      testfileUri,
      Uint8Array.from(Buffer.from(""))
    );
    await vscode.workspace.fs.writeFile(
      testfileUri2,
      Uint8Array.from(Buffer.from(""))
    );
    await vscode.workspace.fs.writeFile(
      testfileUri3,
      Uint8Array.from(Buffer.from(""))
    );

    await vscode.commands.executeCommand("vscode.open", testfileUri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("vscode.open", testfileUri2);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("vscode.open", testfileUri3);
    assert.ok(!CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("vscode.open", testfileUri2);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("snippetsmanager.showSource");
    assert.ok(!CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);
  });

  test("Snippet editor open array json file should work", async () => {
    const testfileUri = vscode.Uri.joinPath(
      testWorkspaceRoot,
      "test.code-snippets"
    );
    await vscode.workspace.fs.writeFile(
      testfileUri,
      Uint8Array.from(Buffer.from(`[{"test": {}}]`))
    );

    await vscode.commands.executeCommand("vscode.open", testfileUri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(currentWebviewPanel);
  });
});

export async function closeAllEditors() {
  return vscode.commands.executeCommand("workbench.action.closeAllEditors");
}

async function resetTestWorkspace() {
  try {
    await vscode.workspace.fs.delete(testWorkspaceFolder, { recursive: true });
  } catch {
    // ok if file doesn't exist
  }
  await vscode.workspace.fs.createDirectory(testWorkspaceFolder);
}
