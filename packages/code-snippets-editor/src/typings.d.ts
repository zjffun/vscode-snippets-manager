import { EDIT, NEWITEM } from "./symbols";

export interface Snippet {
  body: string[];
  description: string;
  prefix: string;
  scope: string;
  [EDIT]?: boolean;
  [NEWITEM]?: boolean;
}

export type SnippetEntries = [string, Snippet][];
