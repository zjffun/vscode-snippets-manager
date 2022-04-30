import React, { useRef, useState } from "react";
import { DUPLICATE_INDEX, EDIT, NEWITEM } from "../symbols";
import { Snippet } from "../typings";
import "./SnippetItem.scss";

interface Props {
  name: string;
  snippet: Snippet;
  vscode: any;
  setEdit(edit: boolean): void;
  duplicate(): void;
}

const SnippetItem = ({ name, snippet, vscode, setEdit, duplicate }: Props) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const edit = snippet[EDIT];

  return (
    <section id={name} className="code-snippets-editor-snippet">
      <div hidden={edit}>
        <div className="code-snippets-editor-snippet__top">
          <div className="code-snippets-editor-top-items">
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label">
                {window.i18nText.name}:{" "}
              </span>
              {name}
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
              onClick={() => {
                setEdit(true);
              }}
            >
              <span className="codicon codicon-edit"></span>
            </vscode-button>
            <vscode-button
              appearance="icon"
              aria-label={window.i18nText.duplicateItem}
              title={window.i18nText.duplicateItem}
              onClick={duplicate}
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
                  payload: { name },
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
            <span className="code-snippets-editor-label">
              {window.i18nText.body}:{" "}
            </span>
          </div>
          <div className="code-snippets-editor-snippet__body__content">
            <pre>{snippet.body.join("\n")}</pre>
          </div>
        </div>
      </div>
      {edit && (
        <form ref={formRef}>
          <div className="code-snippets-editor-snippet__top">
            <div className="code-snippets-editor-top-items">
              <vscode-text-field name="name" value={name}>
                {window.i18nText.name}
              </vscode-text-field>
              <vscode-text-field name="prefix" value={snippet.prefix}>
                {window.i18nText.prefix}
              </vscode-text-field>
              <vscode-text-field name="scope" value={snippet.scope}>
                {window.i18nText.scope}
              </vscode-text-field>
            </div>
            <div style={{ flex: "1 1 0" }}></div>
            <div className="code-snippets-editor-operation">
              <vscode-button
                onClick={() => {
                  if (!formRef.current) {
                    return;
                  }

                  const data = new FormData(formRef.current);
                  vscode.postMessage({
                    type: snippet[NEWITEM] ? "insert" : "update",
                    payload: {
                      name,
                      data: Object.fromEntries(data.entries()),
                      index: snippet[DUPLICATE_INDEX],
                    },
                  });
                }}
              >
                {window.i18nText.ok}
              </vscode-button>
              <vscode-button
                appearance="secondary"
                onClick={() => {
                  setEdit(false);
                }}
              >
                {window.i18nText.cancel}
              </vscode-button>
            </div>
          </div>
          <div className="code-snippets-editor-snippet__desc">
            <vscode-text-field name="description" value={snippet.description}>
              {window.i18nText.description}
            </vscode-text-field>
          </div>
          <div className="code-snippets-editor-snippet__body">
            <vscode-text-area
              resize="vertical"
              name="body"
              rows={10}
              value={snippet.body.join("\n")}
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
