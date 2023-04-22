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

  componentDidCatch(e: any) {
    const errMsg = e?.message;

    vscode.postMessage({
      type: "error",
      payload: {
        errMsg,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            display: "flex",
            height: "100vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: "1rem",
              lineHeight: "1.5rem",
            }}
          >
            <p>Failed to open code snippets editor.</p>
            <a onClick={this.openInDefaultEditor} style={{ cursor: "pointer" }}>
              Open in default editor
            </a>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
