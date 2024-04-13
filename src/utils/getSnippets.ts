import { ISnippet, ISnippetContainer } from "..";

export default function getSnippets(
  snippet: ISnippet,
  snippets: (ISnippet | ISnippetContainer)[]
) {
  if (snippets) {
    const result = snippets.filter(
      (s) =>
        !(s as ISnippetContainer).isFile &&
        !(s as ISnippetContainer).isExtension
    );
    return result as ISnippet[];
  }

  if (snippet) {
    return [snippet];
  }

  return [];
}
