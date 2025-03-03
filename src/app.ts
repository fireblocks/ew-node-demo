import { CommandsManager } from "./commands/commandsManager";
import { CoreManager } from "./commands/coreManager";
import { EmbeddedWalletManager } from "./commands/embeddedWalletManager";
import { WalletManager } from "./commands/general";
import { Prompt } from "./prompt";

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    // noop; silence this error
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

const embeddedWalletManager = new EmbeddedWalletManager();
const coreManager = new CoreManager();
const walletManager = new WalletManager(embeddedWalletManager);
const commandsManager = new CommandsManager(
  walletManager,
  coreManager,
  embeddedWalletManager
);
const prompt = new Prompt(commandsManager);

prompt.run();
