import ReactDOM from "react-dom";
import CodeSnippetsEditor from "./CodeSnippetsEditor";
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.render(
  <ErrorBoundary>
    <CodeSnippetsEditor />
  </ErrorBoundary>,
  document.getElementById("root")
);
