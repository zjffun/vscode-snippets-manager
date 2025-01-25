import * as assert from "assert";
import * as vscode from "vscode";
import { CodeSnippetsService } from "../../../CodeSnippetsService";
import editSnippetBody from "../../../commands/editSnippetBody";
import { isBrowser } from "../../../share";
import {
  closeAllEditors,
  createTestFile,
  resetTestWorkspace,
  testWorkspaceFolder,
  writeTextDocument,
} from "../../util";

assert.ok(testWorkspaceFolder);

suite.skip("editSnippetBody", () => {
  setup(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  teardown(async () => {
    await closeAllEditors();
    await resetTestWorkspace();
  });

  test("should work", async () => {
    if (isBrowser) {
      return;
    }

    const uri = await createTestFile("{}");

    const textDocument = await vscode.workspace.openTextDocument(uri);
    const codeSnippetsService = new CodeSnippetsService(textDocument);

    const name = "testSnippet";

    await codeSnippetsService.insert({
      name,
      scope: "javascript",
      description: "description",
      prefix: "prefix",
      body: "body",
    });

    const snippet = codeSnippetsService.getSnippetByName(name);

    if (!snippet) {
      assert.fail("snippet is undefined");
    }

    const editor = await editSnippetBody(snippet);

    if (!editor) {
      assert.fail("editor is undefined");
    }

    await writeTextDocument(editor.document, "new body");

    // wait for save take effect
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.equal(
      codeSnippetsService.getSnippetByName(name)?.body,
      "new body",
      "body should be updated",
    );
  });
});
