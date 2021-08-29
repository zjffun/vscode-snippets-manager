import { Snippet } from "..";

export type CreateSnippetObjectParam = {
  bodyText: string;
  prefix: string;
  description: string;
  scope: string;
};

export default ({
  bodyText,
  prefix,
  description,
  scope,
}: CreateSnippetObjectParam): Snippet => {
  const body = bodyText.split("\n");

  return {
    prefix,
    body,
    description,
    scope,
  };
};
