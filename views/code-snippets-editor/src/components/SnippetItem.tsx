import { useRef } from "react";
import { getState } from "../common";
import getVsCode from "../getVsCode";
import { EDIT, NAME, NEW_ITEM } from "../symbols";
import { ISnippet } from "../typings";

import "./SnippetItem.scss";

interface Props {
  snippet: ISnippet;
  clickEdit(): void;
  saveEdit(): void;
  cancelEdit(): void;
}

const SnippetItem = ({ snippet, clickEdit, saveEdit, cancelEdit }: Props) => {
  const vscode = getVsCode();
  const keyName = snippet[NAME];
  const editing = snippet[EDIT];
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleChange = () => {
    if (!formRef.current) {
      return;
    }

    const data = new FormData(formRef.current);
    const newSnippet = {
      name: data.get("name")?.toString() || "",
      prefix: data.get("prefix")?.toString() || "",
      scope: data.get("scope")?.toString() || "",
      description: data.get("description")?.toString() || "",
      body: data.get("body")?.toString() || "",
    };
    const state = getState();

    if (snippet[NEW_ITEM]) {
      const index = state.addingSnippets.findIndex((d) => d[NAME] === keyName);

      if (index === -1) {
        return;
      }

      const currentSnippet = state.addingSnippets[index];

      state.addingSnippets.splice(index, 1, {
        ...currentSnippet,
        ...newSnippet,
      });

      vscode.setState(state);
      return;
    }

    if (editing) {
      const snippet = state.editingSnippetObjMap[keyName];
      if (!snippet) {
        return;
      }

      state.editingSnippetObjMap[keyName] = {
        ...snippet,
        ...newSnippet,
      };
      vscode.setState(state);
      return;
    }
  };

  return (
    <section id={keyName} className="code-snippets-editor-snippet">
      <div hidden={editing}>
        <div className="code-snippets-editor-snippet__top">
          <div className="code-snippets-editor-top-items">
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label">
                {window.i18nText.name}:{" "}
              </span>
              {keyName}
            </div>
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label">
                {window.i18nText.prefix}:{" "}
              </span>
              {snippet.prefix}
            </div>
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label">
                {window.i18nText.scope}:{" "}
              </span>
              {snippet.scope}
            </div>
          </div>
          <div style={{ flex: "1 1 0" }}></div>
          <div className="code-snippets-editor-operation">
            <vscode-button
              appearance="icon"
              aria-label={window.i18nText.editItem}
              title={window.i18nText.editItem}
              onClick={clickEdit}
            >
              <span className="codicon codicon-edit"></span>
            </vscode-button>
            <vscode-button
              appearance="icon"
              aria-label={window.i18nText.duplicateItem}
              title={window.i18nText.duplicateItem}
              onClick={() => {
                vscode.postMessage({
                  type: "duplicate",
                  payload: {
                    keyName,
                  },
                });
              }}
            >
              <span className="codicon codicon-files"></span>
            </vscode-button>
            <vscode-button
              appearance="icon"
              aria-label={window.i18nText.deleteItem}
              title={window.i18nText.deleteItem}
              onClick={() => {
                vscode.postMessage({
                  type: "delete",
                  payload: { keyName },
                });
              }}
            >
              <span className="codicon codicon-close"></span>
            </vscode-button>
          </div>
        </div>
        <div className="code-snippets-editor-snippet__desc">
          <span className="code-snippets-editor-label">
            {window.i18nText.description}:{" "}
          </span>
          {snippet.description}
        </div>
        <div className="code-snippets-editor-snippet__body">
          <div>
            <span className="code-snippets-editor-label code-snippets-editor-label--body">
              {window.i18nText.body}{" "}
              <span className="code-snippets-editor-label--body__edit-button">
                <vscode-button
                  appearance="icon"
                  aria-label={window.i18nText.editBody}
                  title={window.i18nText.editBody}
                  onClick={() => {
                    vscode.postMessage({
                      type: "editBody",
                      payload: { keyName },
                    });
                  }}
                >
                  <span className="codicon codicon-edit"></span>
                </vscode-button>
              </span>{" "}
              :
            </span>
          </div>
          <div className="code-snippets-editor-snippet__body__content">
            <pre>{snippet.body}</pre>
          </div>
        </div>
      </div>
      {editing && (
        <form ref={formRef}>
          <div className="code-snippets-editor-snippet__top">
            <div className="code-snippets-editor-top-items">
              <vscode-text-field
                name="name"
                value={snippet.name}
                onInput={handleChange}
              >
                {window.i18nText.name}
              </vscode-text-field>
              <vscode-text-field
                name="prefix"
                value={snippet.prefix}
                onInput={handleChange}
              >
                {window.i18nText.prefix}
              </vscode-text-field>
              <vscode-text-field
                name="scope"
                value={snippet.scope}
                onInput={handleChange}
              >
                {window.i18nText.scope}
              </vscode-text-field>
            </div>
            <div style={{ flex: "1 1 0" }}></div>
            <div className="code-snippets-editor-operation">
              <vscode-button onClick={saveEdit}>
                {window.i18nText.save}
              </vscode-button>
              <vscode-button appearance="secondary" onClick={cancelEdit}>
                {window.i18nText.cancel}
              </vscode-button>
            </div>
          </div>
          <div className="code-snippets-editor-snippet__desc">
            <vscode-text-field
              name="description"
              value={snippet.description}
              onInput={handleChange}
            >
              {window.i18nText.description}
            </vscode-text-field>
          </div>
          <div className="code-snippets-editor-snippet__body">
            <vscode-text-area
              resize="vertical"
              name="body"
              rows={10}
              value={snippet.body}
              onInput={handleChange}
            >
              {window.i18nText.body}
            </vscode-text-area>
          </div>
        </form>
      )}
    </section>
  );
};

export default SnippetItem;
