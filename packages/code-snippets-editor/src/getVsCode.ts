declare global {
  const acquireVsCodeApi: any;
}

let vscode: any;
export default () => {
  if (!vscode) {
    return (vscode = acquireVsCodeApi());
  }
  return vscode;
};
