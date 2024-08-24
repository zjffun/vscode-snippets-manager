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

  test("createSnippetTo command should work when has selection", async () => {
    const snippetUri = await createTestFile("{}");

    const uri = await createTestFile(escapeBody);

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetTo",
      "test",
      snippetUri,
    );

    assert.ok(res);

    const codeSnippetsService = await getCodeSnippetsService({
      uri: snippetUri,
    });
    const snippet = codeSnippetsService.getSnippetByName("test");

    assert.equal(snippet?.body, [escapedBody]);
  });

  test("createSnippetWithoutEscapeTo command should work when has selection", async () => {
    const snippetUri = await createTestFile("{}");

    const uri = await createTestFile(escapeBody);

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetWithoutEscapeTo",
      "test",
      snippetUri,
    );

    assert.ok(res);

    const codeSnippetsService = await getCodeSnippetsService({
      uri: snippetUri,
    });
    const snippet = codeSnippetsService.getSnippetByName("test");

    assert.equal(snippet?.body, [escapeBody]);
  });

  test("createSnippetTo command should work when has no selection", async () => {
    const snippetUri = await createTestFile("{}");

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetTo",
      "test",
      snippetUri,
    );

    assert.ok(res);
  });

  test("createSnippetWithoutEscapeTo command should work when has no selection", async () => {
    const snippetUri = await createTestFile("{}");

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetWithoutEscapeTo",
      "test",
      snippetUri,
    );

    assert.ok(res);
  });
});
