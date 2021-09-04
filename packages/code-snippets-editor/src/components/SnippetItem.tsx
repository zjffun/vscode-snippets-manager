import React, { useRef, useState } from "react";
import { Snippet } from "../typings";
import "./SnippetItem.scss";

interface Props {
  name: string;
  snippet: Snippet;
  vscode: any;
}

const CodeSnippetsEditor = ({ name, snippet, vscode }: Props) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [edit, setEdit] = useState(false);

  return (
    <section className="code-snippets-editor-snippet">
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
            <div className="monaco-action-bar animated">
              <ul className="actions-container" role="toolbar">
                <li className="action-item" role="presentation">
                  <a
                    className="action-label codicon codicon-edit"
                    role="button"
                    title="Edit Item"
                    tabIndex={-1}
                    data-focusable="true"
                    onClick={() => {
                      setEdit(true);
                    }}
                  ></a>
                </li>
                <li className="action-item" role="presentation">
                  <a
                    className="action-label codicon codicon-close code-snippets-editor-close-icon"
                    role="button"
                    title="Remove Item"
                    tabIndex={-1}
                    data-focusable="true"
                    onClick={() => {
                      vscode.postMessage({
                        type: "delete",
                        payload: { key: name },
                      });
                    }}
                  ></a>
                </li>
              </ul>
            </div>
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
              <div className="code-snippets-editor-top-items__item">
                <span className="code-snippets-editor-label">Name: </span>
                <input name="name" type="text" defaultValue={name} />{" "}
              </div>
              <div className="code-snippets-editor-top-items__item">
                <span className="code-snippets-editor-label">Prefix: </span>
                <input
                  name="prefix"
                  type="text"
                  defaultValue={snippet.prefix}
                />{" "}
              </div>
              <div className="code-snippets-editor-top-items__item">
                <span className="code-snippets-editor-label">Scope: </span>
                <input
                  name="scope"
                  type="text"
                  defaultValue={snippet.scope}
                />{" "}
              </div>
            </div>
            <div style={{ flex: "1 1 0" }}></div>
            <div className="code-snippets-editor-operation">
              <a
                className="monaco-button monaco-text-button code-snippets-editor-button code-snippets-editor-button-ok"
                tabIndex={0}
                role="button"
                onClick={() => {
                  if (!formRef.current) {
                    return;
                  }

                  const data = new FormData(formRef.current);
                  vscode.postMessage({
                    type: "update",
                    payload: {
                      key: name,
                      data: Object.fromEntries(data.entries()),
                    },
                  });

                  setEdit(false);
                }}
              >
                OK
              </a>
              <a
                className="monaco-button monaco-text-button code-snippets-editor-button code-snippets-editor-button-cancel"
                tabIndex={0}
                role="button"
                onClick={() => {
                  setEdit(false);
                }}
              >
                Cancel
              </a>
            </div>
          </div>
          <div className="code-snippets-editor-snippet__desc">
            <span className="code-snippets-editor-label">Description: </span>
            <input
              name="description"
              type="text"
              defaultValue={snippet.description}
            />
          </div>
          <div className="code-snippets-editor-snippet__body">
            <div>
              <span className="code-snippets-editor-label">Body:</span>
            </div>
            <div className="code-snippets-editor-snippet__body__content">
              <textarea
                name="body"
                rows={10}
                defaultValue={snippet.body.join("\n")}
              ></textarea>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};

export default CodeSnippetsEditor;
