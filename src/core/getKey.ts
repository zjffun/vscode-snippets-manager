import { IVscodeSnippet } from "..";

export default (
  key: string,
  vscodeSnippetsObj: { [key: string]: IVscodeSnippet },
) => {
  if (!vscodeSnippetsObj[key]) {
    return key;
  }

  const newKey = key;
  let num = 1;
  while (vscodeSnippetsObj[`${newKey}${num}`]) {
    num++;
  }
  return `${newKey}${num}`;
};
