import { JSONVisitor, parse, ParseErrorCode, visit } from "jsonc-parser";
import { isString } from "lodash";
import * as vscode from "vscode";
import {
  IPackageJSONContributesSnippet,
  ISnippet,
  ISnippetContainer,
  ISnippetExtra,
  IVscodeSnippet,
} from ".";
import getKey from "./core/getKey";
import getUserSnippetsFilesInfo from "./core/getUserSnippetsFilesInfo";
import getWorkspaceSnippetsFilesInfo from "./core/getWorkspaceSnippetsFilesInfo";
import jsonStringify from "./utils/jsonStringify";
import logger from "./utils/logger";
import { refresh } from "./views/WorkspaceSnippetsExplorerView";
import {
  applyEdit,
  removeProperty,
  setProperty,
} from "./vscode/src/vs/base/common/jsonEdit";

type IVSCodeSnippetMap = Map<string, IVscodeSnippet>;

export enum SnippetsResultType {
  TREE = "TREE",
  LIST = "LIST",
}

export class CodeSnippetsService {
  textDocument: vscode.TextDocument;

  constructor(textDocument: vscode.TextDocument) {
    this.textDocument = textDocument;
  }

  getMap(): IVSCodeSnippetMap {
    const currentFilename = this.textDocument.uri.path.split("/").pop();
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
      onError: (
        e: ParseErrorCode,
        offset: number,
        length: number,
        startLine: number,
        startCharacter: number,
      ) => {
        if (
          currentParent === initCurrentParent &&
          e === ParseErrorCode.ValueExpected
        ) {
          throw Error(`Parse Error: empty content`);
        }

        let errorType = "Unknown";

        try {
          // @ts-expect-error enum
          if (ParseErrorCode[e]) {
            // @ts-expect-error enum
            errorType = ParseErrorCode[e];
          }
        } catch (error) {
          console.error(error);
        }

        throw Error(
          `Parse Error: ${errorType} in ${currentFilename} (Line: ${
            startLine + 1
          }, Char: ${startCharacter + 1}).\n` +
            `Tip: Check if the file conforms to the JSONC specification, example single quotes.`,
        );
      },
    };
    visit(this.textDocument.getText(), visitor, {
      allowTrailingComma: true,
    });

    if (currentParent[0] instanceof Map) {
      for (const [_, snippet] of currentParent[0]) {
        if (typeof snippet !== "object") {
          throw Error("Not the correct format");
        }

        // handle scope
        snippet.scope = snippet.scope || "";

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

  getSnippetList(): ISnippet[] {
    const map = this.getMap();

    return CodeSnippetsService.getSnippetList(map, {
      uri: this.textDocument.uri,
    });
  }

  async insert(snippet: ISnippet, opts?: { index?: number }) {
    const newContent = await this.getInsertContent(snippet, opts);
    const result = await this.save(newContent);
    return result;
  }

  async update(snippet: ISnippet, name: string) {
    const newContent = await this.getUpdateContent(snippet, name);
    const result = await this.save(newContent);
    return result;
  }

  async delete(name: string) {
    const newContent = await this.getDeleteContent(name);
    const result = await this.save(newContent);
    return result;
  }

  async duplicate(name: string) {
    const snippet = await this.getSnippetByName(name);
    if (!snippet) {
      return;
    }

    let index = snippet.index;
    if (index !== undefined) {
      index = index + 1;
    }

    const result = this.insert(snippet, { index });
    return result;
  }

  getInsertContent(snippet: ISnippet, opts?: { index?: number }) {
    const index = opts?.index;
    const content = this.textDocument.getText();
    const newContent = this.insertProp(
      content,
      snippet,
      index ? { index } : {},
    );

    return newContent;
  }

  getUpdateContent(snippet: ISnippet, name: string) {
    const oldSnippet = this.getSnippetByName(name);

    if (!oldSnippet) {
      throw Error(`Snippet '${name}' not found`);
    }

    const content = this.textDocument.getText();
    const newContent = this.updateProp(content, snippet, oldSnippet);

    return newContent;
  }

  getDeleteContent(name: string) {
    const content = this.textDocument.getText();
    const newContent = this.deleteProp(content, name);

    return newContent;
  }

  insertProp(content: string, snippet: ISnippet, { index = 0 } = {}) {
    const vSnippet = this.getVSCodeSnippet(snippet);

    const [edit] = setProperty(
      content,
      [getKey(snippet.name || "", this.getObj())],
      vSnippet,
      {},
      () => index,
    );

    const newContent = applyEdit(content, edit);

    return newContent;
  }

  updateProp(content: string, snippet: ISnippet, oldSnippet: ISnippet) {
    const name = snippet.name;
    const oldName = oldSnippet.name;

    if (oldName === undefined) {
      return "";
    }

    let _content = content;

    // name change, replace the snippet
    if (name !== oldName) {
      _content = this.deleteProp(_content, oldName);
      _content = this.insertProp(_content, snippet, {
        index: oldSnippet.index,
      });
      return _content;
    }

    // name not change, update other fields of the snippet
    const vSnippet = this.getVSCodeSnippet(snippet);
    const oldVSnippet = this.getVSCodeSnippet(oldSnippet);
    for (const key of ["scope", "description", "prefix"]) {
      const val = (<any>vSnippet)[key];
      const oldVal = (<any>oldVSnippet)[key];

      if (val !== oldVal && val !== undefined) {
        const [edit] = setProperty(_content, [name, key], val, {});

        if (edit) {
          _content = applyEdit(_content, edit);
        }
      }
    }

    if (snippet.body !== oldSnippet.body) {
      const [edit] = setProperty(_content, [name, "body"], vSnippet.body, {});

      if (edit) {
        _content = applyEdit(_content, edit);
      }
    }

    return _content;
  }

  deleteProp(content: string, name: string) {
    const [edit] = removeProperty(content, [name], {});

    const newContent = applyEdit(content, edit);

    return newContent;
  }

  async apply(content: string) {
    const workspaceEdit = new vscode.WorkspaceEdit();

    workspaceEdit.replace(
      this.textDocument.uri,
      new vscode.Range(0, 0, this.textDocument.lineCount, 0),
      content,
    );

    const result = await vscode.workspace.applyEdit(workspaceEdit);

    return result;
  }

  async save(content: string, { refreshExplorerView = true } = {}) {
    const applyRes = await this.apply(content);

    if (!applyRes) {
      return applyRes;
    }

    const saveRes = await this.textDocument.save();

    if (saveRes && refreshExplorerView) {
      refresh();
    }

    return saveRes;
  }

  getVSCodeSnippet(snippet: ISnippet): IVscodeSnippet {
    const { disabledInfo, vscodeSnippet } = snippet;

    let _prefix: unknown = snippet.prefix;
    if (disabledInfo?.prefix) {
      _prefix = vscodeSnippet?.prefix;
    } else if (Array.isArray(_prefix)) {
      if (snippet.prefix.length < 2) {
        _prefix = snippet.prefix?.[0] || "";
      } else {
        _prefix = snippet.prefix;
      }
    }

    let _description: unknown = snippet.description;
    if (disabledInfo?.description) {
      _description = vscodeSnippet?.description;
    }

    let _scope: unknown = snippet.scope;
    if (disabledInfo?.scope) {
      _scope = vscodeSnippet?.scope;
    }

    let _body: unknown = undefined;
    if (disabledInfo?.body) {
      _body = vscodeSnippet?.body;
    } else {
      _body = snippet.body.split("\n");
    }

    const vSnippet: IVscodeSnippet = {
      prefix: _prefix,
      description: _description,
      scope: _scope,
      body: _body,
    };

    return vSnippet;
  }

  getSnippetByName(name: string) {
    const snippetsMap = this.getMap();
    let snippetIndex = 0;

    for (const [k, v] of snippetsMap) {
      if (k === name) {
        const snippet = CodeSnippetsService.createSnippet(v, {
          name: k,
          uri: this.textDocument.uri,
          index: snippetIndex,
        });
        return snippet;
      }
      snippetIndex++;
    }
  }

  private getObj(): { [key: string]: IVscodeSnippet } {
    return parse(this.textDocument.getText()) || {};
  }

  static createSnippet(
    vscodeSnippet: IVscodeSnippet,
    { name, uri, index }: ISnippetExtra = {},
  ): ISnippet {
    const { prefix, body, description, scope } = vscodeSnippet;

    const disabledInfo = {
      prefix: true,
      body: true,
      description: true,
      scope: true,
    };

    let _prefix: string | string[] = [];
    if (prefix === undefined) {
      disabledInfo.prefix = false;
    } else if (isString(prefix)) {
      disabledInfo.prefix = false;
      _prefix = [String(prefix)];
    } else if (Array.isArray(prefix)) {
      disabledInfo.prefix = false;
      _prefix = prefix as string[];
    } else {
      _prefix = jsonStringify({
        data: prefix,
        error: function (error) {
          logger.error(`JSON.stringify prefix error: ${error?.message}`);
          return "";
        },
      });
    }

    let _body = "";
    if (body === undefined) {
      disabledInfo.body = false;
    } else if (isString(body)) {
      disabledInfo.body = false;
      _body = String(body);
    } else if (Array.isArray(body)) {
      disabledInfo.body = false;
      _body = body.join("\n");
    } else {
      _body = jsonStringify({
        data: body,
        error: function (error) {
          logger.error(`JSON.stringify body error: ${error?.message}`);
          return "";
        },
      });
    }

    let _description = "";
    if (description === undefined) {
      disabledInfo.description = false;
    } else if (isString(description)) {
      disabledInfo.description = false;
      _description = String(description);
    } else if (Array.isArray(description)) {
      disabledInfo.description = false;
      _description = description.join("\n");
    } else {
      _description = jsonStringify({
        data: description,
        error: function (error) {
          logger.error(`JSON.stringify description error: ${error?.message}`);
          return "";
        },
      });
    }

    let _scope = "";
    if (scope === undefined) {
      disabledInfo.scope = false;
    } else if (isString(scope)) {
      disabledInfo.scope = false;
      _scope = String(scope);
    }

    return {
      name,
      uri,
      index,
      prefix: _prefix,
      description: _description,
      scope: _scope,
      body: _body,
      disabledInfo,
      vscodeSnippet,
    };
  }

  static getSnippetList(
    vscodeSnippets: Map<string, IVscodeSnippet>,
    { uri }: ISnippetExtra = {},
  ) {
    const list = Array.from(vscodeSnippets).map(([name, snippet], index) => {
      return CodeSnippetsService.createSnippet(snippet, {
        name,
        uri,
        index,
      });
    });

    return list;
  }

  static async getSnippetsByUri(uri: vscode.Uri) {
    const snippetsTextDoc = await vscode.workspace.openTextDocument(uri);

    const codeSnippetsService = new CodeSnippetsService(snippetsTextDoc);

    let snippets: IVSCodeSnippetMap = new Map();
    try {
      snippets = await codeSnippetsService.getMap();
    } catch (error: any) {
      logger.error(error?.message);
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
          logger.error(error?.message);
          continue;
        }

        workspaceSnippetFiles.push({
          name,
          isFile: true,
          uri,
          children: CodeSnippetsService.getSnippetList(snippets, { uri }),
        });
      }

      tree.push({
        name: folder.name,
        isWorkspace: true,
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
        logger.error(error?.message);
        continue;
      }

      tree.push({
        name: fileName,
        isFile: true,
        uri,
        children: CodeSnippetsService.getSnippetList(snippets, { uri }),
      });
    }

    return tree;
  }

  static async getExtensionSnippetsTree() {
    const tree: ISnippetContainer[] = [];

    for (const extension of vscode.extensions.all) {
      const { packageJSON } = extension;
      if (
        packageJSON &&
        packageJSON.isBuiltin === false &&
        packageJSON?.contributes?.snippets
      ) {
        const snippetFiles = [];

        const snippetPaths = this.getExtensionSnippetPaths(
          packageJSON.contributes.snippets,
        );

        for (const snippetPath of snippetPaths) {
          if (!snippetPath) {
            continue;
          }

          const uri = vscode.Uri.joinPath(extension.extensionUri, snippetPath);

          let snippets;
          try {
            snippets = await CodeSnippetsService.getSnippetsByUri(uri);
          } catch (error: any) {
            logger.error(error?.message);
            continue;
          }

          snippetFiles.push({
            name: snippetPath,
            isFile: true,
            uri: uri,
            children: CodeSnippetsService.getSnippetList(snippets, { uri }),
          });
        }
        tree.push({
          name: packageJSON.name,
          isExtension: true,
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
          logger.error(error?.message);
          continue;
        }

        list = list.concat(
          CodeSnippetsService.getSnippetList(snippets, { uri }),
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
        logger.error(error?.message);
        continue;
      }

      list = list.concat(CodeSnippetsService.getSnippetList(snippets, { uri }));
    }

    return list;
  }

  static async getExtensionSnippetsList() {
    let list: ISnippet[] = [];

    for (const extension of vscode.extensions.all) {
      const { packageJSON } = extension;
      if (
        packageJSON &&
        packageJSON.isBuiltin === false &&
        packageJSON?.contributes?.snippets
      ) {
        const snippetPaths = this.getExtensionSnippetPaths(
          packageJSON.contributes.snippets,
        );

        for (const snippetPath of snippetPaths) {
          if (!snippetPath) {
            continue;
          }

          const uri = vscode.Uri.joinPath(
            vscode.Uri.file(extension.extensionPath),
            snippetPath,
          );

          let snippets;
          try {
            snippets = await CodeSnippetsService.getSnippetsByUri(uri);
          } catch (error: any) {
            logger.error(error?.message);
            continue;
          }

          list = list.concat(
            CodeSnippetsService.getSnippetList(snippets, { uri }),
          );
        }
      }
    }

    return list;
  }

  private static getExtensionSnippetPaths(
    snippets: IPackageJSONContributesSnippet[],
  ) {
    // remove duplicate snippet paths
    return new Set<string | undefined>(snippets.map((snippet) => snippet.path));
  }
}
