import * as vscode from "vscode";
import { Snippets } from "../index.d";
import getSnippetsByTextDoc from "./getSnippetsByTextDoc";

const getKey = (key: string, currentSnippets: { [key: string]: any }) => {
  if (!currentSnippets[key]) {
    return key;
  }

  let newKey = key;
  let num = 1;
  while (currentSnippets[`${newKey}${num}`]) {
    num++;
  }
  return `${newKey}${num}`;
};

export default async ({
  snippetsUri,
  snippets,
  createSnippetsFileIfNotExists = false,
}: {
  snippetsUri: vscode.Uri;
  snippets: Snippets | { [key: string]: undefined };
  createSnippetsFileIfNotExists?: boolean;
}) => {
  const workspaceEdit = new vscode.WorkspaceEdit();

  if (createSnippetsFileIfNotExists) {
    workspaceEdit.createFile(snippetsUri, { ignoreIfExists: true });
    await vscode.workspace.applyEdit(workspaceEdit);
  }

  // get the snippets file content
  const snippetsTextDoc = await vscode.workspace.openTextDocument(snippetsUri);
  const tempSnippets = await getSnippetsByTextDoc(snippetsTextDoc);
  if (!tempSnippets) {
    return;
  }

  let resultSnippets = tempSnippets;

  // add the snippet to the snippets file
  Object.entries(snippets).forEach(([key, snippet]) => {
    if (!snippet) {
      delete resultSnippets[key];
      return;
    }
    if (resultSnippets[key]) {
      resultSnippets = {
        [getKey(key, resultSnippets)]: snippet,
        ...resultSnippets,
      };
      return;
    }
    resultSnippets = { [key]: snippet, ...resultSnippets };
  });
  workspaceEdit.replace(
    snippetsUri,
    new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
    ),
    JSON.stringify(resultSnippets, null, 2)
  );
  await vscode.workspace.applyEdit(workspaceEdit);

  // save snippets file
  snippetsTextDoc.save();
};
