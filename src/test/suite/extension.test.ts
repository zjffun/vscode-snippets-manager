import * as assert from "assert";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import {
  CodeSnippetsEditor,
  currentWebviewPanel,
} from "../../CodeSnippetsEditor";
import {
  closeAllEditors,
  createTestFile,
  resetTestWorkspace,
  testWorkspaceFolder,
} from "../util";

// import * as myExtension from '../../extension';

assert.ok(testWorkspaceFolder);

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

  test("Create snippet command should work when has selection", async () => {
    const uri = await createTestFile("test content");

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippet",
      "test"
    );

    assert.ok(res);
  });

  test("Create snippet to command should work when has no selection", async () => {
    const uri = await createTestFile("{}");

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetTo",
      "test",
      uri
    );

    assert.ok(res);
  });

  test("Explorer should work", async () => {
    await vscode.commands.executeCommand(
      "workbench.view.extension.snippetsmanager-snippetsView"
    );
  });

  test("Snippet editor should work", async () => {
    const uri = await createTestFile("");

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(currentWebviewPanel);

    await vscode.commands.executeCommand("workbench.action.splitEditorRight");
    await vscode.commands.executeCommand(
      "workbench.action.files.newUntitledFile"
    );
    assert.strictEqual(currentWebviewPanel, null);

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(currentWebviewPanel);
  });

  test("Snippet editor context should currect", async () => {
    const uri = await createTestFile("");
    const uri2 = await createTestFile("");
    const uri3 = await createTestFile("");

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("vscode.open", uri2);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("vscode.open", uri3);
    assert.ok(!CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("vscode.open", uri2);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("snippetsmanager.showSource");
    assert.ok(!CodeSnippetsEditor.isActive);

    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(CodeSnippetsEditor.isActive);
  });

  test("Snippet editor open array json file should work", async () => {
    const uri = await createTestFile(`[{"test": {}}]`);

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("snippetsmanager.showEditor");
    assert.ok(currentWebviewPanel);
  });
});
