import * as vscode from "vscode";
import { ISnippet, ISnippetExtra } from "..";
import { CodeSnippetsService } from "../CodeSnippetsService";

export const movingSnippetsMimeType =
  "application/vnd.code.tree.snippetsmanager-moving-snippets";

export default async (
  targetSnippet: ISnippetExtra,
  sourceSnippets: ISnippet[]
) => {
  if (!targetSnippet.uri) {
    return;
  }

  if (!sourceSnippets.length) {
    return;
  }

  const snippetsTextDoc = await vscode.workspace.openTextDocument(
    targetSnippet.uri
  );

  const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

  const targetSnippetIndex = targetSnippet.index || 0;

  if (
    sourceSnippets.length === 1 &&
    sourceSnippets[0].uri?.toString() === targetSnippet.uri?.toString()
  ) {
    // moving one snippet within the same file
    const snippet = sourceSnippets[0];

    if (snippet.name && snippet.index !== targetSnippetIndex) {
      await codeSnippetsService.delete(snippet.name);
      await codeSnippetsService.insert(snippet, {
        index: targetSnippetIndex,
      });
    }
  } else {
    let currentTargetIndex = targetSnippet.index;
    if (currentTargetIndex === undefined) {
      currentTargetIndex = 0;
    } else {
      currentTargetIndex++;
    }

    for (const snippet of sourceSnippets) {
      if (!snippet.uri || !snippet.name) {
        continue;
      }

      if (snippet.uri.toString() === targetSnippet.uri?.toString()) {
        // If the snippet is the same as the target snippet, update it position (delete then insert)

        if (snippet.name) {
          if (
            snippet.index !== undefined &&
            snippet.index <= targetSnippetIndex
          ) {
            currentTargetIndex--;
          }

          await codeSnippetsService.delete(snippet.name);

          await codeSnippetsService.insert(snippet, {
            index: currentTargetIndex,
          });
        }
      } else {
        // If the snippet is not the same as the target snippet, move it (insert then delete)
        await codeSnippetsService.insert(snippet, {
          index: currentTargetIndex,
        });

        const sourceSnippetsTextDoc = await vscode.workspace.openTextDocument(
          snippet.uri
        );

        const sourceCodeSnippetsService = new CodeSnippetsService(
          sourceSnippetsTextDoc
        );

        await sourceCodeSnippetsService.delete(snippet.name);
      }

      currentTargetIndex++;
    }
  }

  // Can't use refreshAllView directly because of circular dependency
  const { default: refreshAllView } = await import("../views/refreshAllView");
  refreshAllView();

  return true;
};
