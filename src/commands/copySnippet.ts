import { ISnippet } from "..";
import { setClipboard } from "../core/snippetsClipboard";

export default async (snippets: ISnippet[]) => {
  setClipboard(snippets);
};
