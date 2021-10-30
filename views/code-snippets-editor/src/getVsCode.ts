declare global {
  interface Window {
    vsCodeApi: any;
  }
  const acquireVsCodeApi: any;
}

let vscode: any;
export default () => {
  if (vscode) {
    return vscode;
  }
  if (window.vsCodeApi) {
    return (vscode = window.vsCodeApi);
  }
  return (vscode = acquireVsCodeApi());
};
