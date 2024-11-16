import { useEffect, useRef, useState } from "react";
import Tags from "@yaireo/tagify/dist/react.tagify.jsx";
import { getState, langIds } from "../common";
import getVsCode from "../getVsCode";
import { EDIT, NAME, NEW_ITEM } from "../symbols";
import { ISnippet } from "../typings";

import "@yaireo/tagify/dist/tagify.css";
import "./SnippetItem.scss";

interface Props {
  snippet: ISnippet;
  readonly: boolean;
  clickEdit(): void;
  saveEdit(): void;
  cancelEdit(): void;
}

function originalInputValueFormat(
  values: {
    value: string;
  }[],
) {
  return values.map((item) => item.value).join(",");
}

const SnippetItem = (props: Props) => {
  const { readonly, clickEdit, saveEdit, cancelEdit } = props;
  const [snippet, setSnippet] = useState<ISnippet>(props.snippet);
  const vscode = getVsCode();
  const keyName = snippet[NAME];
  const editing = snippet[EDIT];
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameInputRef = useRef<HTMLButtonElement | null>(null);
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleChange = (changedData?: { prefix?: string[] }) => {
    if (!formRef.current) {
      return;
    }

    const data = new FormData(formRef.current);
    const newRawSnippet = {
      name: data.get("name")?.toString() || "",
      prefix: data.getAll("prefix") as string[],
      scope: data.get("scope")?.toString() || "",
      description: data.get("description")?.toString() || "",
      body: data.get("body")?.toString() || "",
    };

    if (changedData?.prefix) {
      newRawSnippet.prefix = changedData?.prefix;
    }

    const state = getState();

    if (snippet[NEW_ITEM]) {
      const index = state.addingSnippets.findIndex((d) => d[NAME] === keyName);

      if (index === -1) {
        return;
      }

      const currentSnippet = state.addingSnippets[index];

      const newSnippet = {
        ...currentSnippet,
        ...newRawSnippet,
      };

      state.addingSnippets.splice(index, 1, newSnippet);

      vscode.setState(state);

      setSnippet(newSnippet);

      return;
    }

    if (editing) {
      const snippet = state.editingSnippetObjMap[keyName];
      if (!snippet) {
        return;
      }

      const newSnippet = {
        ...snippet,
        ...newRawSnippet,
      };

      state.editingSnippetObjMap[keyName] = newSnippet;

      vscode.setState(state);

      setSnippet(newSnippet);

      return;
    }
  };

  useEffect(() => {
    setSnippet(props.snippet);
  }, [props.snippet]);

  return (
    <section id={keyName} className="code-snippets-editor-snippet">
      <div hidden={editing}>
        <div className="code-snippets-editor-snippet__top">
          <div className="code-snippets-editor-snippet__top__prefix">
            {Array.isArray(snippet.prefix) ? (
              snippet.prefix.map((prefix, index) => {
                return (
                  <div
                    className="code-snippets-editor-snippet__top__prefix__item"
                    key={index}
                  >
                    {prefix}
                  </div>
                );
              })
            ) : (
              <div className="code-snippets-editor-snippet__top__prefix__item">
                {snippet.prefix}
              </div>
            )}
          </div>

          <div style={{ flex: "1 1 0" }}></div>
          {!readonly && (
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
                aria-label={window.i18nText.editBody}
                title={window.i18nText.editBody}
                onClick={() => {
                  vscode.postMessage({
                    type: "editBody",
                    payload: { keyName },
                  });
                }}
                {...{
                  disabled: snippet?.disabledInfo?.body || undefined,
                }}
              >
                <span className="codicon codicon-file-code"></span>
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
                <span className="codicon codicon-trash"></span>
              </vscode-button>
              <vscode-button
                appearance="icon"
                aria-label={window.i18nText.snippetSyntax}
                title={window.i18nText.snippetSyntax}
                onClick={() => {
                  vscode.postMessage({
                    type: "help",
                  });
                }}
              >
                <span className="codicon codicon-question"></span>
              </vscode-button>
            </div>
          )}
        </div>

        {snippet.scope && (
          <div className="code-snippets-editor-snippet__scope">
            {snippet.scope.split(",").map((scope, index) => {
              return (
                <span
                  key={index}
                  className="code-snippets-editor-snippet__scope__item"
                >
                  {scope}
                </span>
              );
            })}
          </div>
        )}

        {snippet.description && (
          <div className="code-snippets-editor-snippet__desc">
            {snippet.description}
          </div>
        )}

        <div className="code-snippets-editor-snippet__body">
          <pre>{snippet.body}</pre>
        </div>
      </div>
      {editing && (
        <form ref={formRef}>
          <div className="code-snippets-editor-snippet__top">
            <div className="code-snippets-editor-top-items">
              <vscode-text-field
                ref={nameInputRef}
                name="name"
                value={snippet.name}
                onInput={handleChange}
              >
                {window.i18nText.name}
              </vscode-text-field>
              {Array.isArray(snippet.prefix) ? (
                snippet.prefix.map((prefix, index) => {
                  return (
                    <vscode-text-field
                      key={index}
                      name="prefix"
                      value={prefix}
                      onInput={handleChange}
                      {...{
                        disabled: snippet?.disabledInfo?.prefix || undefined,
                      }}
                    >
                      {window.i18nText.prefix}
                      {index === 0 ? (
                        <vscode-button
                          slot="end"
                          appearance="icon"
                          onClick={() => {
                            handleChange({
                              prefix: [...snippet.prefix, ""],
                            });
                          }}
                        >
                          <span className="codicon codicon-plus"></span>
                        </vscode-button>
                      ) : (
                        <vscode-button
                          slot="end"
                          appearance="icon"
                          onClick={() => {
                            handleChange({
                              prefix: (snippet.prefix as string[]).filter(
                                (_, i) => i !== index,
                              ),
                            });
                          }}
                        >
                          <span className="codicon codicon-trash"></span>
                        </vscode-button>
                      )}
                    </vscode-text-field>
                  );
                })
              ) : (
                <vscode-text-field
                  name="prefix"
                  value={snippet.prefix}
                  onInput={handleChange}
                  {...{
                    disabled: snippet?.disabledInfo?.prefix || undefined,
                  }}
                >
                  {window.i18nText.prefix}
                </vscode-text-field>
              )}
            </div>
            <div style={{ flex: "1 1 0" }}></div>
            <div className="code-snippets-editor-operation">
              <vscode-button ref={saveBtnRef} onClick={saveEdit}>
                {window.i18nText.save}
              </vscode-button>
              <vscode-button
                ref={cancelBtnRef}
                appearance="secondary"
                onClick={cancelEdit}
              >
                {window.i18nText.cancel}
              </vscode-button>
            </div>
          </div>
          <div
            className="code-snippets-editor-snippet__scope-edit"
            {...{
              disabled: snippet?.disabledInfo?.scope || undefined,
            }}
          >
            <div className="code-snippets-editor-snippet__scope-edit__label">
              Scope
            </div>
            <Tags
              name="scope"
              whitelist={langIds}
              placeholder="Add Scopes"
              defaultValue={snippet.scope} // initial value
              onChange={handleChange}
              settings={{
                dropdown: {
                  enabled: 1,
                },
                originalInputValueFormat,
              }}
              disabled={snippet?.disabledInfo?.scope}
            />
          </div>

          <div className="code-snippets-editor-snippet__desc">
            <vscode-text-field
              name="description"
              value={snippet.description}
              onInput={handleChange}
              {...{
                disabled: snippet?.disabledInfo?.description || undefined,
              }}
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
              {...{
                disabled: snippet?.disabledInfo?.body || undefined,
              }}
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
