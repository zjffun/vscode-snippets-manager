import { ExtensionContext } from "vscode";
import {
  HelpAndFeedbackView,
  Link,
  StandardLinksProvider,
  Command,
} from "vscode-ext-help-and-feedback-view";

export function registerHelpAndFeedbackView(context: ExtensionContext) {
  const items = new Array<Link | Command>();
  const predefinedProvider = new StandardLinksProvider(
    "zjffun.snippetsmanager",
  );
  items.push(predefinedProvider.getGetStartedLink());
  items.push({
    url: "https://code.visualstudio.com/docs/editor/userdefinedsnippets",
    title: "Snippets in VS Code",
    icon: "question",
  });
  items.push(predefinedProvider.getReviewIssuesLink());
  items.push(predefinedProvider.getReportIssueLink());
  new HelpAndFeedbackView(
    context,
    "snippetsmanager-snippetsView-HelpAndFeedback",
    items,
  );
}
