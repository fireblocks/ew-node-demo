import chalk from "chalk";
import { EXIT_COMMAND, getSessionDetails, logResult } from "./utils/display";
import { WalletStorageManager } from "./managers/walletStorageManager";
import inquirer from "inquirer";
import { EmbeddedWalletManager } from "./managers/embeddedWalletManager";
import { CoreManager } from "./managers/coreManager";
import { CommandsManager } from "./managers/commandsManager";
import { UtilsManager } from "./managers/utilsCommandsManager";
import { CommandFlags } from "./utils/commands";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));

export class CLI {
  private shouldExit = false;
  private commandsManager: CommandsManager;
  private walletStorageManager: WalletStorageManager;

  constructor() {
    const embeddedWalletManager = new EmbeddedWalletManager();
    const coreManager = new CoreManager();
    const utilsManager = new UtilsManager(embeddedWalletManager);
    this.commandsManager = new CommandsManager(
      utilsManager,
      coreManager,
      embeddedWalletManager
    );
    this.walletStorageManager = new WalletStorageManager();
  }

  async run() {
    await this._init();

    while (!this.shouldExit) {
      const choices = this._getChoices();

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
          await this.walletStorageManager.promptAndSaveWallet(
            EmbeddedWalletManager.walletId
          );
        }
      } else {
        await this._execute(() => this.commandsManager.All[command]());
      }
    }
  }

  private async _init() {
    if (process.argv.includes(CommandFlags.INIT)) {
      await this._execute(() =>
        this.commandsManager.Flags[CommandFlags.INIT]()
      );
    }
  }

  private _getChoices() {
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

  private async _execute(cb: () => Promise<any>) {
    try {
      const result = await cb();
      logResult(result);
      return result;
    } catch (error) {
      logResult(error, false);
    }
  }
}
