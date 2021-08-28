export type CreateSnippetJSONType = {
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
}: CreateSnippetJSONType) => {
  const body = bodyText.split("\n");

  return {
    prefix,
    body,
    description,
    scope,
  };
};
