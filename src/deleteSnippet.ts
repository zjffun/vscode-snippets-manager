import { Snippet } from ".";
import updateSnippets from "./core/updateSnippets";

export default async (snippet: Snippet) => {
  if (!snippet.uri) {
    return;
  }
  if (!snippet.key) {
    return;
  }

  await updateSnippets({
    snippetsUri: snippet.uri,
    snippets: { [snippet.key]: undefined },
  });
};
