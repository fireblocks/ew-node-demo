import inquirer from "inquirer";
import chalk from "chalk";
import {
  askToSaveWalletId,
  Commands as BaseCommands,
} from "./commands/commands";
import { Commands as EWCommands } from "./commands/ew";
import { Commands as CoreCommands } from "./commands/core";
import { getSessionDetails, logResult } from "./utils/display";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));

const EXIT_COMMAND = chalk.bold.italic("EXIT");
export const state = {
  initEW: false,
  initCore: false,
  walletId: undefined,
  coreDeviceId: undefined,
};

const allCommands = { ...BaseCommands, ...EWCommands, ...CoreCommands };
async function main() {
  let shouldExit = false;

  while (!shouldExit) {
    const choices = getChoices();

    // @ts-ignore
    const { command } = await inquirer.prompt([
      {
        type: "search-list",
        name: "command",
        message: getSessionDetails(),
        choices,
      },
    ]);

    if (command === EXIT_COMMAND) {
      shouldExit = true;
      if (state.walletId) {
        await askToSaveWalletId(state.walletId);
      }
    } else {
      await execute(() => allCommands[command]());
    }
  }
}

export async function execute(cb: () => Promise<any>) {
  try {
    const result = await cb();
    logResult(result);
    return result;
  } catch (error) {
    logResult(error, false);
  }
}

function getChoices() {
  const baseChoices = Object.keys(BaseCommands);
  const ewChoices = state.initEW
    ? [
        chalk.bold.yellow("========== EW Commands =========="),
        ...Object.keys(EWCommands),
      ]
    : [];
  const coreChoices = state.initCore
    ? [
        chalk.bold.yellow("========== Core Commands =========="),
        ...Object.keys(CoreCommands),
      ]
    : [];
  return [...baseChoices, ...ewChoices, ...coreChoices, EXIT_COMMAND];
}

main();

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    // noop; silence this error
  } else {
    // Rethrow unknown errors
    throw error;
  }
});
