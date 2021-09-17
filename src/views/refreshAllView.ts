import { refresh as refreshWorkspaceView } from "./WorkspaceSnippetsExplorerView";
import { refresh as refreshUserView } from "./UserSnippetsExplorerView";
import { refresh as refreshExtensionView } from "./ExtensionSnippetsExplorerView";

export default function () {
  refreshWorkspaceView();
  refreshUserView();
  refreshExtensionView();
}
