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

  test("getMap should return error when parse fails", async () => {
    const uri = await createTestFile();
    const textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);
    await writeTextDocument(textDocument, "[]");

    assert.deepStrictEqual(textDocument.getText(), "[]");
    assert.throws(codeSnippetsService.getMap);

    await writeTextDocument(textDocument, "");
    assert.deepStrictEqual(textDocument.getText(), "");
    assert.throws(codeSnippetsService.getMap);

    await writeTextDocument(textDocument, "{");
    assert.deepStrictEqual(textDocument.getText(), "{");
    assert.throws(codeSnippetsService.getMap);

    await writeTextDocument(textDocument, `{"a":1}`);
    assert.deepStrictEqual(textDocument.getText(), `{"a":1}`);
    assert.throws(codeSnippetsService.getMap);
  });

  test("getMap should return map when parse success", async () => {
    const uri = await createTestFile();
    const textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);

    await writeTextDocument(textDocument, "{}");
    assert.deepStrictEqual(textDocument.getText(), "{}");
    assert.ok(codeSnippetsService.getMap() instanceof Map);

    await writeTextDocument(textDocument, `{"a":{}}`);
    assert.deepStrictEqual(textDocument.getText(), `{"a":{}}`);
    assert.ok(codeSnippetsService.getMap() instanceof Map);
  });

  test("update multiple props should work", async () => {
    const uri = await createTestFile("{}");
    const textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);

    await codeSnippetsService.insert({
      name: "test",
      body: "body",
      description: "description",
      prefix: "prefix",
      scope: "scope",
    });

    await codeSnippetsService.update(
      {
        name: "test",
        body: "bodyNew",
        description: "descriptionNew",
        prefix: "prefixNew",
        scope: "scopeNew",
      },
      "test",
    );

    const newSnippet = await codeSnippetsService.getSnippetByName("test");

    assert.equal(newSnippet?.body, "bodyNew");
    assert.equal(newSnippet?.description, "descriptionNew");
    assert.equal(newSnippet?.prefix, "prefixNew");
    assert.equal(newSnippet?.scope, "scopeNew");
  });
});
