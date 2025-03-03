import chalk from "chalk";
import { getSessionDetails, logResult } from "./utils/display";
import { addWalletId, getWalletIds } from "./utils/storage-utils";
import inquirer from "inquirer";
import { EmbeddedWalletManager } from "./managers/embeddedWalletManager";
import { CoreManager } from "./managers/coreManager";
import { CommandsManager } from "./managers/commandsManager";
import { UtilsManager } from "./managers/utilsCommandsManager";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));
const EXIT_COMMAND = chalk.bold.italic("EXIT");

export class Prompt {
  private shouldExit = false;
  private commandsManager: CommandsManager;

  constructor() {
    const embeddedWalletManager = new EmbeddedWalletManager();
    const coreManager = new CoreManager();
    const utilsManager = new UtilsManager(embeddedWalletManager);
    this.commandsManager = new CommandsManager(
      utilsManager,
      coreManager,
      embeddedWalletManager
    );
  }

  async run() {
    while (!this.shouldExit) {
      const choices = this.getChoices();

      // @ts-ignore -> inquirer-search-list is not typed
      const { command } = await inquirer.prompt([
        {
          type: "search-list",
          name: "command",
          message: getSessionDetails(),
          choices,
        },
      ]);

      if (command === EXIT_COMMAND) {
        this.shouldExit = true;
        if (EmbeddedWalletManager.walletId) {
          await Prompt.askToSaveWalletId(EmbeddedWalletManager.walletId);
        }
      } else {
        await this.execute(() => this.commandsManager.all[command]());
      }
    }
  }

  private getChoices() {
    const baseChoices = Object.keys(this.commandsManager.BaseCommands);
    const ewChoices = EmbeddedWalletManager.isInitialized
      ? [
          chalk.bold.yellow("========== EW Commands =========="),
          ...Object.keys(this.commandsManager.EmbeddedWalletCommands),
        ]
      : [];
    const coreChoices = CoreManager.isInitialized
      ? [
          chalk.bold.yellow("========== Core Commands =========="),
          ...Object.keys(this.commandsManager.CoreCommands),
        ]
      : [];
    return [...baseChoices, ...ewChoices, ...coreChoices, EXIT_COMMAND];
  }

  private async execute(cb: () => Promise<any>) {
    try {
      const result = await cb();
      logResult(result);
      return result;
    } catch (error) {
      logResult(error, false);
    }
  }

  public static async askToSaveWalletId(walletId: string) {
    const wallets = getWalletIds();

    if (wallets?.find((opt) => opt.uuid === walletId)) {
      return;
    }
    const { save } = await inquirer.prompt([
      {
        type: "confirm",
        name: "save",
        message: "Save this wallet ID?",
      },
    ]);
    if (save) {
      let walletName: string;
      let nameExists: boolean;
      do {
        const promptRes = await inquirer.prompt([
          {
            type: "input",
            name: "walletName",
            message: "Enter the wallet name:",
          },
        ]);
        walletName = (promptRes.walletName as string).trim().replace(",", "_");
        nameExists = wallets?.some((opt) => opt.name === walletName);
        if (nameExists) {
          console.log(
            "Wallet name already exists. Please enter a different name."
          );
        }
      } while (nameExists);
      addWalletId(walletName, walletId);
    }
  }
}
