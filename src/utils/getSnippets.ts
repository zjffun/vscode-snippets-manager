import { ISnippet, ISnippetContainer } from "..";

export default function getSnippets(
  snippet: ISnippet | undefined,
  snippets: (ISnippet | ISnippetContainer)[],
) {
  if (snippets) {
    const result = snippets.filter(
      (s) =>
        !(s as ISnippetContainer).isFile &&
        !(s as ISnippetContainer).isExtension &&
        !(s as ISnippetContainer).isWorkspace,
    );
    return result as ISnippet[];
  }

  if (snippet) {
    return [snippet];
  }

  return [];
}
