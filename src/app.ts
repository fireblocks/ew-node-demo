import { CommandsManager } from "./managers/commandsManager";
import { CoreManager } from "./managers/coreManager";
import { EmbeddedWalletManager } from "./managers/embeddedWalletManager";
import { GeneralCommandsManager } from "./managers/generalCommandsManager";
import { Prompt } from "./prompt";

const embeddedWalletManager = new EmbeddedWalletManager();
const coreManager = new CoreManager();
const walletManager = new GeneralCommandsManager(embeddedWalletManager);
const commandsManager = new CommandsManager(
  walletManager,
  coreManager,
  embeddedWalletManager
);
const prompt = new Prompt(commandsManager);

prompt.run();

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    // noop; silence this error
  } else {
    // Rethrow unknown errors
    throw error;
  }
});
