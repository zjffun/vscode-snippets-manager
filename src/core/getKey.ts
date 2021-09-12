import { IVSCodeSnippet } from "..";

export default (
  key: string,
  vscodeSnippetsObj: { [key: string]: IVSCodeSnippet }
) => {
  if (!vscodeSnippetsObj[key]) {
    return key;
  }

  let newKey = key;
  let num = 1;
  while (vscodeSnippetsObj[`${newKey}${num}`]) {
    num++;
  }
  return `${newKey}${num}`;
};
