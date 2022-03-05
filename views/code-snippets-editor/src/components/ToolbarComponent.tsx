import React, { useRef, useState } from "react";
import { Snippet } from "../typings";
import "./ToolbarComponent.scss";

interface Props {
  onAddSnippetClick(): void;
}

const ToolbarComponent = ({ onAddSnippetClick }: Props) => {
  return (
    <section className="code-snippets-editor-toolbar">
      <vscode-button onClick={onAddSnippetClick}>Add Snippet</vscode-button>
    </section>
  );
};

export default ToolbarComponent;
