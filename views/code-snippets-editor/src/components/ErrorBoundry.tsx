import React from "react";
import getVsCode from "../getVsCode";

const vscode = getVsCode();

export class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  openInDefaultEditor(e: any): void {
    e.preventDefault();
    vscode.postMessage({
      type: "openInDefaultEditor",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ display: "flex", justifyContent: "center" }}>
          Failed to open code snippets editor.{" "}
          <a onClick={this.openInDefaultEditor} style={{ cursor: "pointer" }}>
            Open in default editor
          </a>
        </main>
      );
    }

    return this.props.children;
  }
}
