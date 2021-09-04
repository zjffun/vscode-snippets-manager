export interface Snippet {
  body: string[];
  description: string;
  prefix: string;
  scope: string;
}

export type SnippetEntries = [string, Snippet][];
