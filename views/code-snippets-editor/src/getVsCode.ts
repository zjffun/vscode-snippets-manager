import { IVscodeState } from "./typings";

export interface IVscode {
  getState: () => IVscodeState | undefined;
  setState: (state: any) => void;
  [key: string]: any;
}

declare global {
  interface Window {
    vsCodeApi: any;
  }
  const acquireVsCodeApi: any;
}

let vscode: IVscode;

export default (): IVscode => {
  if (vscode) {
    return vscode;
  }
  if (window.vsCodeApi) {
    return (vscode = window.vsCodeApi);
  }
  return (vscode = acquireVsCodeApi());
};
