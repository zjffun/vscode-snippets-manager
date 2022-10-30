import getVsCode from "./getVsCode";
import { IVscodeState } from "./typings";
export function getState(): Required<IVscodeState> {
  const vscode = getVsCode();
  const state = vscode.getState();

  return {
    addingSnippets: state?.addingSnippets || [],
    editingSnippetObjMap: state?.editingSnippetObjMap || {},
    vscodeSnippetEntries: state?.vscodeSnippetEntries || [],
    scrollY: state?.scrollY || 0,
  };
}
