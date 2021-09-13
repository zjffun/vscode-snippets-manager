import * as vscode from "vscode";
import { IVSCodeSnippet, ISnippet, ISnippets, ISnippetExtra } from ".";
import getKey from "./core/getKey";
import { refresh } from "./views/explorerView";

import {
  JSONVisitor,
  parse,
  ParseError,
  ParseErrorCode,
  visit,
} from "./vscode/src/vs/base/common/json";
import {
  applyEdit,
  removeProperty,
  setProperty,
} from "./vscode/src/vs/base/common/jsonEdit";

type IVSCodeSnippetMap = Map<string, IVSCodeSnippet>;

export class CodeSnippetsService {
  private textDocument: vscode.TextDocument;

  constructor(textDocument: vscode.TextDocument) {
    this.textDocument = textDocument;
  }

  getMap(): [ParseError[], IVSCodeSnippetMap] {
    let currentProperty: string | null = null;
    let currentParent: any = [];
    const initCurrentParent = currentParent;
    const previousParents: any[] = [];
    const errors: ParseError[] = [];

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
      onError: (error: ParseErrorCode, offset: number, length: number) => {
        errors.push({ error, offset, length });
      },
    };
    visit(this.textDocument.getText(), visitor);

    return [errors, currentParent[0] || new Map()];
  }

  getEntriesString(): [ParseError[], string] {
    const [errors, map] = this.getMap();

    return [errors, JSON.stringify(Array.from(map.entries()))];
  }

  async insert(snippet: ISnippet) {
    let content = this.textDocument.getText();
    content = this.insertProp(content, snippet);

    if (content) {
      return await this.save(content);
    }

    return false;
  }

  async update(snippet: ISnippet, name: string) {
    if (!name === undefined) {
      return;
    }

    const [errors, snippetsMap] = this.getMap();
    let oldSnippet: ISnippet;
    let oldSnippetIndex = 0;
    for (const [k, v] of snippetsMap) {
      if (k === name) {
        oldSnippet = this.getSnippet(v, { name: k });
        break;
      }
      oldSnippetIndex++;
    }

    // @ts-ignore
    if (!oldSnippet) {
      return "";
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

  getSnippet(
    vscodeSnippet: IVSCodeSnippet,
    { name, uri }: ISnippetExtra = {}
  ): ISnippet {
    return {
      name,
      uri,
      prefix: vscodeSnippet.prefix,
      description: vscodeSnippet.description,
      scope: vscodeSnippet.scope,
      body: vscodeSnippet.body.join("\n"),
    };
  }

  private getObj(): { [key: string]: IVSCodeSnippet } {
    return parse(this.textDocument.getText()) || {};
  }
}
