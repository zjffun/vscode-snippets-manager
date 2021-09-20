import * as assert from "assert";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { CodeSnippetsService } from "../../CodeSnippetsService";
import {
  closeAllEditors,
  createTestFile,
  resetTestWorkspace,
  testWorkspaceFolder,
  writeTextDocument,
} from "../util";

// import * as myExtension from '../../extension';

assert.ok(testWorkspaceFolder);

suite("CodeSnippetsService", () => {
  setup(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  teardown(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  test("constructor should work", async () => {
    const uri = await createTestFile("{}");

    const textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);
    assert.ok(codeSnippetsService);
  });

  test("getMap should return error when paser fails", async () => {
    const uri = await createTestFile();
    let textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);
    await writeTextDocument(textDocument, "[]");

    assert.deepStrictEqual(textDocument.getText(), "[]");
    assert.ok(codeSnippetsService.getMap()[0] instanceof Error);

    await writeTextDocument(textDocument, "");
    assert.deepStrictEqual(textDocument.getText(), "");
    assert.ok(codeSnippetsService.getMap()[0] instanceof Error);

    await writeTextDocument(textDocument, "{");
    assert.deepStrictEqual(textDocument.getText(), "{");
    assert.ok(codeSnippetsService.getMap()[0] instanceof Error);

    await writeTextDocument(textDocument, `{"a":1}`);
    assert.deepStrictEqual(textDocument.getText(), `{"a":1}`);
    assert.ok(codeSnippetsService.getMap()[0] instanceof Error);
  });

  test("getMap should return map when paser success", async () => {
    const uri = await createTestFile();
    const textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);

    await writeTextDocument(textDocument, "{}");
    assert.deepStrictEqual(textDocument.getText(), "{}");
    assert.ok(codeSnippetsService.getMap()[1] instanceof Map);

    await writeTextDocument(textDocument, `{"a":{}}`);
    assert.deepStrictEqual(textDocument.getText(), `{"a":{}}`);
    assert.ok(codeSnippetsService.getMap()[1] instanceof Map);
  });
});
