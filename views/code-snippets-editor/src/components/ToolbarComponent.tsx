import React, { useRef, useState } from "react";
import { Snippet } from "../typings";
import "./ToolbarComponent.scss";

interface Props {
  onAddSnippetClick(): void;
}

const ToolbarComponent = ({ onAddSnippetClick }: Props) => {
  return (
    <section className="code-snippets-editor-toolbar">
      <button
        className="code-snippets-editor-button code-snippets-editor-button-add"
        onClick={onAddSnippetClick}
      >
        Add Snippet
      </button>
    </section>
  );
};

export default ToolbarComponent;
