import "./config";
import { CLI } from "./cli";

async function main() {
  const cli = new CLI();
  await cli.run();
}

main().then(() => {
  process.exit(0);
});

process.on("uncaughtException", error => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    // noop; silence this error
  } else {
    // Rethrow unknown errors
    throw error;
  }
});
