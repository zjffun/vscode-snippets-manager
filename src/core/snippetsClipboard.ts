import { ISnippet } from "..";

let clipboard: ISnippet[] = [];

export function setClipboard(snippets: ISnippet[]) {
  clipboard = snippets;
}

export function getClipboard() {
  return clipboard;
}
