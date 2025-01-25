import * as path from "path";
import { runTests } from "@vscode/test-web";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../");

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(
      __dirname,
      "../dist/web/test/suite/index",
    );

    // Download VS Code, unzip it and run the integration test
    await runTests({
      browserType: "chromium",
      extensionDevelopmentPath,
      extensionTestsPath,
      folderPath: path.join(extensionDevelopmentPath, "test.temp"),
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
