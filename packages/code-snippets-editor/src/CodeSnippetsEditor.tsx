import React, { useEffect, useState } from "react";
import SnippetItem from "./components/SnippetItem";
import { SnippetEntries } from "./typings";

import "./CodeSnippetsEditor.scss";

declare global {
  const acquireVsCodeApi: any;
}

const vscode = acquireVsCodeApi();

function getSnippetEntries(text: string): SnippetEntries {
  try {
    return Object.entries(JSON.parse(text));
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

  return (
    <main className="code-snippets-editor">
      <ul className="code-snippets-editor-snippets">
        {snippetEntries.map(([key, snippet]) => {
          return (
            <li className="code-snippets-editor-snippets__item" key={key}>
              <SnippetItem
                name={key}
                snippet={snippet}
                vscode={vscode}
              ></SnippetItem>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default CodeSnippetsEditor;
