import ReactDOM from "react-dom";
import CodeSnippetsEditor from "./CodeSnippetsEditor";
import { ErrorBoundary } from "./components/ErrorBoundry";

ReactDOM.render(
  <ErrorBoundary>
    <CodeSnippetsEditor />
  </ErrorBoundary>,
  document.getElementById("root")
);
