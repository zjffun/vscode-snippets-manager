import { JSONVisitor, parse, ParseErrorCode, visit } from "jsonc-parser";
import * as vscode from "vscode";
import {
  IPackageJSONContributesSnippet,
  ISnippet,
  ISnippetContainer,
  ISnippetExtra,
  IVSCodeSnippet,
} from ".";
import getKey from "./core/getKey";
import getUserSnippetsFilesInfo from "./core/getUserSnippetsFilesInfo";
import getWorkspaceSnippetsFilesInfo from "./core/getWorkspaceSnippetsFilesInfo";
import { log } from "./extension";
import { refresh } from "./views/WorkspaceSnippetsExplorerView";
import {
  applyEdit,
  removeProperty,
  setProperty,
} from "./vscode/src/vs/base/common/jsonEdit";

type IVSCodeSnippetMap = Map<string, IVSCodeSnippet>;

export enum SnippetsResultType {
  TREE = "TREE",
  LIST = "LIST",
}

export class CodeSnippetsService {
  private textDocument: vscode.TextDocument;

  constructor(textDocument: vscode.TextDocument) {
    this.textDocument = textDocument;
  }

  getMap(): IVSCodeSnippetMap {
    let currentProperty: string | null = null;
    let currentParent: any = [];
    const initCurrentParent = currentParent;
    const previousParents: any[] = [];

    function onValue(value: any) {
      if (Array.isArray(currentParent)) {
        (<any[]>currentParent).push(value);
      } else if (currentParent instanceof Map) {
        if (currentProperty !== null) {
          currentParent.set(currentProperty, value);
        }
      } else if (currentProperty !== null) {
        currentParent[currentProperty] = value;
      }
    }

    const visitor: JSONVisitor = {
      onObjectBegin: () => {
        const object = currentParent === initCurrentParent ? new Map() : {};
        onValue(object);
        previousParents.push(currentParent);
        currentParent = object;
        currentProperty = null;
      },
      onObjectProperty: (name: string) => {
        currentProperty = name;
      },
      onObjectEnd: () => {
        currentParent = previousParents.pop();
      },
      onArrayBegin: () => {
        const array: any[] = [];
        onValue(array);
        previousParents.push(currentParent);
        currentParent = array;
        currentProperty = null;
      },
      onArrayEnd: () => {
        currentParent = previousParents.pop();
      },
      onLiteralValue: onValue,
      onError: (e: ParseErrorCode, offset: number, length: number) => {
        if (
          currentParent === initCurrentParent &&
          e === ParseErrorCode.ValueExpected
        ) {
          throw Error(`Parse error: empty content`);
        }

        throw Error(`Parse error`);
      },
    };
    visit(this.textDocument.getText(), visitor);

    if (currentParent[0] instanceof Map) {
      for (const [_, snippet] of currentParent[0]) {
        if (typeof snippet !== "object") {
          throw Error("Not the correct format");
        }

        // handle body
        if (snippet.body === undefined) {
          snippet.body = [];
        } else if (typeof snippet.body === "string") {
          snippet.body = [snippet.body];
        } else if (Array.isArray(snippet.body)) {
          // do nothing
        } else {
          throw Error("Not the correct format");
        }
      }
    } else {
      throw Error("Not the correct format");
    }

    return currentParent[0];
  }

  getEntriesString(): string {
    const map = this.getMap();

    return JSON.stringify(Array.from(map.entries()));
  }

  async insert(snippet: ISnippet, opts?: { index?: number }) {
    const index = opts?.index;
    let content = this.textDocument.getText();
    content = this.insertProp(content, snippet, index ? { index } : {});

    if (content) {
      return await this.save(content);
    }

    return false;
  }

  async update(snippet: ISnippet, name: string) {
    if (!name === undefined) {
      return;
    }

    let snippetsMap;
    try {
      snippetsMap = this.getMap();
    } catch (error: any) {
      log.appendLine(error?.message);
      return false;
    }

    let oldSnippet: ISnippet;
    let oldSnippetIndex = 0;
    for (const [k, v] of snippetsMap) {
      if (k === name) {
        oldSnippet = CodeSnippetsService.createSnippet(v, { name: k });
        break;
      }
      oldSnippetIndex++;
    }

    // @ts-ignore
    if (!oldSnippet) {
      return false;
    }

    let content = this.textDocument.getText();
    content = this.updateProp(content, snippet, oldSnippet, oldSnippetIndex);

    if (content) {
      return await this.save(content);
    }

    return false;
  }

  async delete(name: string) {
    let content = this.textDocument.getText();
    content = this.deleteProp(content, name);

    if (content) {
      return this.save(content);
    }
  }

  insertProp(content: string, snippet: ISnippet, { index = 0 } = {}) {
    const vSnippet = this.getVSCodeSnippet(snippet);

    const [edit] = setProperty(
      content,
      [getKey(snippet.name || "", this.getObj())],
      vSnippet,
      {},
      () => index
    );

    if (edit) {
      return applyEdit(content, edit);
    }

    return "";
  }

  updateProp(
    content: string,
    snippet: ISnippet,
    oldSnippet: ISnippet,
    oldSnippetIndex: number
  ) {
    const name = snippet.name;
    const oldName = oldSnippet.name;

    if (oldName === undefined) {
      return "";
    }

    let _content = content;

    const vSnippet = this.getVSCodeSnippet(snippet);
    const oldVSnippet = this.getVSCodeSnippet(oldSnippet);

    // name change, replace the snippet
    if (name !== oldName) {
      _content = this.deleteProp(_content, oldName);
      if (!_content) {
        return "";
      }
      return this.insertProp(_content, snippet, { index: oldSnippetIndex });
    }

    // name not change, update other fields of the snippet
    for (const key of ["scope", "description", "prefix"]) {
      const val = (<any>vSnippet)[key];
      const oldVal = (<any>oldVSnippet)[key];

      if (val !== oldVal && val !== undefined) {
        const [edit] = setProperty(content, [name, key], val, {});

        if (edit) {
          _content = applyEdit(content, edit);
        }
      }
    }

    if (vSnippet.body.join("") !== oldVSnippet.body.join("")) {
      const [edit] = setProperty(content, [name, "body"], vSnippet.body, {});

      if (edit) {
        _content = applyEdit(content, edit);
      }
    }

    return _content;
  }

  deleteProp(content: string, name: string) {
    const [edit] = removeProperty(content, [name], {});

    if (edit) {
      return applyEdit(content, edit);
    }

    return "";
  }

  async save(content: string, { refreshExplorerView = true } = {}) {
    const workspaceEdit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    workspaceEdit.replace(
      this.textDocument.uri,
      new vscode.Range(0, 0, this.textDocument.lineCount, 0),
      content
    );

    const applyEditRes = await vscode.workspace.applyEdit(workspaceEdit);

    if (!applyEditRes) {
      return applyEditRes;
    }

    const saveRes = await this.textDocument.save();

    if (saveRes && refreshExplorerView) {
      refresh();
    }

    return saveRes;
  }

  getVSCodeSnippet(snippet: ISnippet): IVSCodeSnippet {
    const vSnippet: IVSCodeSnippet = {
      prefix: snippet.prefix,
      description: snippet.description,
      scope: snippet.scope,
      body: snippet.body.split("\n"),
    };

    return vSnippet;
  }

  getSnippetByName(name: string) {
    const snippetsMap = this.getMap();
    const snippet = snippetsMap.get(name);

    if (snippet) {
      return CodeSnippetsService.createSnippet(snippet, {
        name,
        uri: this.textDocument.uri,
      });
    }
  }

  private getObj(): { [key: string]: IVSCodeSnippet } {
    return parse(this.textDocument.getText()) || {};
  }

  static createSnippet(
    vscodeSnippet: IVSCodeSnippet,
    { name, uri }: ISnippetExtra = {}
  ): ISnippet {
    let body: any = vscodeSnippet.body;
    if (Array.isArray(body)) {
      body = body.join("\n");
    }

    return {
      name,
      uri,
      prefix: vscodeSnippet.prefix,
      description: vscodeSnippet.description,
      scope: vscodeSnippet.scope,
      body,
    };
  }

  static async getSnippetsByUri(uri: vscode.Uri) {
    let snippetsTextDoc = await vscode.workspace.openTextDocument(uri);

    const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

    let snippets: IVSCodeSnippetMap = new Map();
    try {
      snippets = await codeSnippetsService.getMap();
    } catch (error: any) {
      log.appendLine(error?.message);
    }

    return snippets;
  }

  static async getWorkspaceSnippetsTree() {
    const workspaceSnippetsFileInfo = await getWorkspaceSnippetsFilesInfo();
    const tree: ISnippetContainer[] = [];

    for (const { folder, snippetsFiles } of workspaceSnippetsFileInfo) {
      const workspaceSnippetFiles = [];
      for (const { name, uri } of snippetsFiles) {
        let snippets;
        try {
          snippets = await CodeSnippetsService.getSnippetsByUri(uri);
        } catch (error: any) {
          log.appendLine(error?.message);
          continue;
        }

        workspaceSnippetFiles.push({
          name,
          isFile: true,
          uri,
          children: Array.from(snippets).map(([name, snippet]) => {
            return CodeSnippetsService.createSnippet(snippet, {
              name,
              uri,
            });
          }),
        });
      }

      tree.push({
        name: folder.name,
        children: workspaceSnippetFiles,
      });
    }

    return tree;
  }

  static async getUserSnippetsTree() {
    const tree: ISnippetContainer[] = [];

    const userSnippetInfo = await getUserSnippetsFilesInfo();

    for (const { uri, fileName } of userSnippetInfo) {
      let snippets;
      try {
        snippets = await CodeSnippetsService.getSnippetsByUri(uri);
      } catch (error: any) {
        log.appendLine(error?.message);
        continue;
      }

      tree.push({
        name: fileName,
        isFile: true,
        uri,
        children: Array.from(snippets).map(([name, snippet]) => {
          return CodeSnippetsService.createSnippet(snippet, {
            name,
            uri,
          });
        }),
      });
    }

    return tree;
  }

  static async getExtensionSnippetsTree() {
    const tree: ISnippetContainer[] = [];

    for (const extension of vscode.extensions.all) {
      let { packageJSON } = extension;
      if (
        packageJSON &&
        packageJSON.isBuiltin === false &&
        packageJSON?.contributes?.snippets
      ) {
        const snippetFiles = [];

        const snippetPaths = this.getExtensionSnippetPaths(
          packageJSON.contributes.snippets
        );

        for (const snippetPath of snippetPaths) {
          if (!snippetPath) {
            continue;
          }

          const snippetsUri = vscode.Uri.joinPath(
            vscode.Uri.file(extension.extensionPath),
            snippetPath
          );

          let snippets;
          try {
            snippets = await CodeSnippetsService.getSnippetsByUri(snippetsUri);
          } catch (error: any) {
            log.appendLine(error?.message);
            continue;
          }

          snippetFiles.push({
            name: snippetPath,
            isFile: true,
            uri: snippetsUri,
            children: Array.from(snippets).map(([name, snippet]) => {
              return CodeSnippetsService.createSnippet(snippet, {
                name,
                uri: snippetsUri,
              });
            }),
          });
        }
        tree.push({
          name: packageJSON.name,
          children: snippetFiles,
        });
      }
    }

    return tree;
  }

  static async getWorkspaceSnippetsList() {
    const workspaceSnippetsFileInfo = await getWorkspaceSnippetsFilesInfo();
    let list: ISnippet[] = [];

    for (const { snippetsFiles } of workspaceSnippetsFileInfo) {
      for (const { uri } of snippetsFiles) {
        let snippets;
        try {
          snippets = await CodeSnippetsService.getSnippetsByUri(uri);
        } catch (error: any) {
          log.appendLine(error?.message);
          continue;
        }

        list = list.concat(
          Array.from(snippets).map(([name, snippet]) => {
            return CodeSnippetsService.createSnippet(snippet, {
              name,
              uri,
            });
          })
        );
      }
    }

    return list;
  }

  static async getUserSnippetsList() {
    let list: ISnippet[] = [];

    const userSnippetInfo = await getUserSnippetsFilesInfo();

    for (const { uri } of userSnippetInfo) {
      let snippets;
      try {
        snippets = await CodeSnippetsService.getSnippetsByUri(uri);
      } catch (error: any) {
        log.appendLine(error?.message);
        continue;
      }

      list = list.concat(
        Array.from(snippets).map(([name, snippet]) => {
          return CodeSnippetsService.createSnippet(snippet, {
            name,
            uri,
          });
        })
      );
    }

    return list;
  }

  static async getExtensionSnippetsList() {
    let list: ISnippet[] = [];

    for (const extension of vscode.extensions.all) {
      let { packageJSON } = extension;
      if (
        packageJSON &&
        packageJSON.isBuiltin === false &&
        packageJSON?.contributes?.snippets
      ) {
        const snippetPaths = this.getExtensionSnippetPaths(
          packageJSON.contributes.snippets
        );

        for (const snippetPath of snippetPaths) {
          if (!snippetPath) {
            continue;
          }

          const snippetsUri = vscode.Uri.joinPath(
            vscode.Uri.file(extension.extensionPath),
            snippetPath
          );

          let snippets;
          try {
            snippets = await CodeSnippetsService.getSnippetsByUri(snippetsUri);
          } catch (error: any) {
            log.appendLine(error?.message);
            continue;
          }

          list = list.concat(
            Array.from(snippets).map(([name, snippet]) => {
              return CodeSnippetsService.createSnippet(snippet, {
                name,
                uri: snippetsUri,
              });
            })
          );
        }
      }
    }

    return list;
  }

  private static getExtensionSnippetPaths(
    snippets: IPackageJSONContributesSnippet[]
  ) {
    // remove duplicate snippet paths
    return new Set<string | undefined>(snippets.map((snippet) => snippet.path));
  }
}
