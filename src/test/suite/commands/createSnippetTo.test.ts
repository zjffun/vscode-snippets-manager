import * as assert from "assert";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import {
  closeAllEditors,
  createTestFile,
  getCodeSnippetsService,
  resetTestWorkspace,
  testWorkspaceFolder,
} from "../../util";

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

  test("createSnippetTo command should work when has selection", async () => {
    const snippetUri = await createTestFile("{}");

    const uri = await createTestFile("test content $1");

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetTo",
      "test",
      snippetUri
    );

    assert.ok(res);

    const codeSnippetsService = await getCodeSnippetsService({
      uri: snippetUri,
    });
    const snippet = codeSnippetsService.getSnippetByName("test");

    assert.equal(snippet?.body, ["test content \\$1"]);
  });

  test("createSnippetWithoutEscapeDollarTo command should work when has selection", async () => {
    const snippetUri = await createTestFile("{}");

    const uri = await createTestFile("test content $1");

    await vscode.commands.executeCommand("vscode.open", uri);
    await vscode.commands.executeCommand("editor.action.selectAll", uri);

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetWithoutEscapeDollarTo",
      "test"
    );

    assert.ok(res);

    const codeSnippetsService = await getCodeSnippetsService({
      uri: snippetUri,
    });
    const snippet = codeSnippetsService.getSnippetByName("test");

    assert.equal(snippet?.body, ["test content $1"]);
  });

  test("createSnippetTo command should work when has no selection", async () => {
    const snippetUri = await createTestFile("{}");

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetTo",
      "test",
      snippetUri
    );

    assert.ok(res);
  });

  test("createSnippetWithoutEscapeDollarTo command should work when has no selection", async () => {
    const snippetUri = await createTestFile("{}");

    const res = await vscode.commands.executeCommand(
      "snippetsmanager.createSnippetWithoutEscapeDollarTo",
      "test",
      snippetUri
    );

    assert.ok(res);
  });
});
