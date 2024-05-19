import { useRef } from "react";
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

const SnippetItem = ({
  snippet,
  readonly,
  clickEdit,
  saveEdit,
  cancelEdit,
}: Props) => {
  const vscode = getVsCode();
  const keyName = snippet[NAME];
  const editing = snippet[EDIT];
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameInputRef = useRef<HTMLButtonElement | null>(null);
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

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
          <span className="code-snippets-editor-snippet__top__prefix">
            {snippet.prefix}
          </span>

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
          {!readonly && (
            <span className="code-snippets-editor-snippet__body__edit-button">
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
                <span className="codicon codicon-edit"></span> Edit Body
              </vscode-button>
            </span>
          )}
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
                tab-goto-key={`${keyName}-name-input`}
                shift-tab-goto={`[tab-goto-key="${keyName}-cancel-button"]`}
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
            </div>
            <div style={{ flex: "1 1 0" }}></div>
            <div className="code-snippets-editor-operation">
              <vscode-button
                ref={saveBtnRef}
                onClick={saveEdit}
                tab-goto-key={`${keyName}-save-button`}
                shift-tab-goto={`[tab-goto-key="${keyName}-body-input"]`}
              >
                {window.i18nText.save}
              </vscode-button>
              <vscode-button
                ref={cancelBtnRef}
                appearance="secondary"
                onClick={cancelEdit}
                tab-goto-key={`${keyName}-cancel-button`}
                tab-goto={`[tab-goto-key="${keyName}-name-input"]`}
              >
                {window.i18nText.cancel}
              </vscode-button>
            </div>
          </div>

          {/* <vscode-text-field
                name="scope"
                value={snippet.scope}
                onInput={handleChange}
                tab-goto-key={`${keyName}-scope-input`}
                tab-goto={`[tab-goto-key="${keyName}-description-input"]`}
              >
                {window.i18nText.scope}
              </vscode-text-field> */}
          <div
            className="code-snippets-editor-snippet__scope"
            tab-goto-key={`${keyName}-scope-input`}
            tab-goto={`[tab-goto-key="${keyName}-description-input"]`}
          >
            <Tags
              name="scope"
              whitelist={langIds}
              placeholder="Add Scopes"
              defaultValue={snippet.scope} // initial value
            />
          </div>

          <div className="code-snippets-editor-snippet__desc">
            <vscode-text-field
              name="description"
              value={snippet.description}
              onInput={handleChange}
              tab-goto-key={`${keyName}-description-input`}
              shift-tab-goto={`[tab-goto-key="${keyName}-scope-input"]`}
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
              tab-goto-key={`${keyName}-body-input`}
              tab-goto={`[tab-goto-key="${keyName}-save-button"]`}
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
