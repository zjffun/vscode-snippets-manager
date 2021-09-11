import React, { useEffect, useState } from "react";
import SnippetItem from "./components/SnippetItem";
import { SnippetEntries } from "./typings";

import "./CodeSnippetsEditor.scss";
import ToolbarComponent from "./components/ToolbarComponent";
import { EDIT, NEWITEM } from "./symbols";

declare global {
  const acquireVsCodeApi: any;
}

const vscode = acquireVsCodeApi();

function getSnippetEntries(text: string): SnippetEntries {
  try {
    return JSON.parse(text).map(([k, v]: [string, any]) => {
      return [k, { ...v, [EDIT]: false }];
    });
  } catch {
    return Object.entries({});
  }
}

const CodeSnippetsEditor = () => {
  // Webviews are normally torn down when not visible and re-created when they become visible again.
  // State lets us save information across these re-loads
  const [snippetEntries, setSnippetEntries] = useState<SnippetEntries>(
    getSnippetEntries(vscode.getState()?.text)
  );

  useEffect(() => {
    // Handle messages sent from the extension to the webview
    window.addEventListener("message", (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
        case "update":
          const text = message.text;
          setSnippetEntries(getSnippetEntries(text));

          // Then persist state information.
          // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
          vscode.setState({ text });
          return;
      }
    });
  }, []);

  const handleAddSnippetClick = () => {
    setSnippetEntries((snippetEntries) => [
      [
        "",
        {
          body: [],
          description: "",
          prefix: "",
          scope: "",
          [EDIT]: true,
          [NEWITEM]: true,
        },
      ],
      ...snippetEntries,
    ]);
  };

  return (
    <main className="code-snippets-editor">
      <ToolbarComponent
        onAddSnippetClick={handleAddSnippetClick}
      ></ToolbarComponent>
      <ul className="code-snippets-editor-snippets">
        {snippetEntries.map(([key, snippet]) => {
          return (
            <li className="code-snippets-editor-snippets__item" key={key}>
              <SnippetItem
                name={key}
                snippet={snippet}
                vscode={vscode}
                setEdit={(edit) => {
                  setSnippetEntries((snippetEntries) =>
                    snippetEntries.map(([k, v]) => {
                      let _v = v;
                      if (k === key) {
                        _v = { ...v, [EDIT]: edit };
                      }

                      return [k, _v];
                    })
                  );
                }}
              ></SnippetItem>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default CodeSnippetsEditor;
