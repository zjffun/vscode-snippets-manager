import React, { useRef, useState } from "react";
import { EDIT, NEWITEM } from "../symbols";
import { Snippet } from "../typings";
import "./SnippetItem.scss";

interface Props {
  name: string;
  snippet: Snippet;
  vscode: any;
  setEdit(edit: boolean): void;
}

const CodeSnippetsEditor = ({ name, snippet, vscode, setEdit }: Props) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const edit = snippet[EDIT];

  return (
    <section id={name} className="code-snippets-editor-snippet">
      <div hidden={edit}>
        <div className="code-snippets-editor-snippet__top">
          <div className="code-snippets-editor-top-items">
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label">Name: </span>
              {name}
            </div>
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label"> Prefix: </span>
              {snippet.prefix}
            </div>
            <div className="code-snippets-editor-top-items__item">
              <span className="code-snippets-editor-label">Scope: </span>
              {snippet.scope}
            </div>
          </div>
          <div style={{ flex: "1 1 0" }}></div>
          <div className="code-snippets-editor-operation">
            <vscode-button
              appearance="icon"
              aria-label="Edit Item"
              title="Edit Item"
              onClick={() => {
                setEdit(true);
              }}
            >
              <span className="codicon codicon-edit"></span>
            </vscode-button>
            <vscode-button
              appearance="icon"
              aria-label="Remove Item"
              title="Remove Item"
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
          <span className="code-snippets-editor-label">Description: </span>
          {snippet.description}
        </div>
        <div className="code-snippets-editor-snippet__body">
          <div>
            <span className="code-snippets-editor-label">Body:</span>
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
                Name
              </vscode-text-field>
              <vscode-text-field name="prefix" value={snippet.prefix}>
                Prefix
              </vscode-text-field>
              <vscode-text-field name="scope" value={snippet.scope}>
                Scope
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
                    },
                  });

                  setEdit(false);
                }}
              >
                OK
              </vscode-button>
              <vscode-button
                appearance="secondary"
                onClick={() => {
                  setEdit(false);
                }}
              >
                Cancel
              </vscode-button>
            </div>
          </div>
          <div className="code-snippets-editor-snippet__desc">
            <vscode-text-field name="description" value={snippet.description}>
              Description
            </vscode-text-field>
          </div>
          <div className="code-snippets-editor-snippet__body">
            <vscode-text-area
              resize="vertical"
              name="body"
              rows={10}
              value={snippet.body.join("\n")}
            >
              Body
            </vscode-text-area>
          </div>
        </form>
      )}
    </section>
  );
};

export default CodeSnippetsEditor;
