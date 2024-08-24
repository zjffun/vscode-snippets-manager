import * as assert from "assert";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import {
  closeAllEditors,
  createTestFile,
  escapeBody,
  escapedBody,
  getCodeSnippetsService,
  resetTestWorkspace,
  testWorkspaceFolder,
} from "../../util";

// import * as myExtension from '../../extension';

assert.ok(testWorkspaceFolder);

suite("Extension", () => {
  const extensionID = "zjffun.snippetsmanager";
  const extensionShortName = "snippetsmanager";

  const extension = vscode.extensions.getExtension(extensionID);

  setup(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  teardown(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  test("createSnippet command should work when has selection", async () => {
    const uri = await createTestFile(escapeBody);

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippet",
      "test",
    );

    assert.ok(res);

    const codeSnippetsService = await getCodeSnippetsService();
    const snippet = codeSnippetsService.getSnippetByName("test");

    assert.equal(snippet?.body, [escapedBody]);
  });

  test("createSnippetWithoutEscape command should work when has selection", async () => {
    const uri = await createTestFile(escapeBody);

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetWithoutEscape",
      "test",
    );

    assert.ok(res);

    const codeSnippetsService = await getCodeSnippetsService();
    const snippet = codeSnippetsService.getSnippetByName("test");

    assert.equal(snippet?.body, [escapeBody]);
  });

  test("createSnippet command should work when has no selection", async () => {
    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippet",
      "test",
    );

    assert.ok(res);
  });

  test("createSnippetWithoutEscape command should work when has no selection", async () => {
    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetWithoutEscape",
      "test",
    );

    assert.ok(res);
  });
});
