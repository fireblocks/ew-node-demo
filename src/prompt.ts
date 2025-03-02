import chalk from "chalk";
import { getSessionDetails, logResult } from "./utils/display";
import { state } from "./app";
import { Commands as BaseCommands } from "./commands/commands";
import { Commands as EWCommands } from "./commands/ew";
import { Commands as CoreCommands } from "./commands/core";
import { addWalletId, getWalletIds } from "./utils/storage-utils";
import inquirer from "inquirer";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));
const EXIT_COMMAND = chalk.bold.italic("EXIT");

const allCommands = { ...BaseCommands, ...EWCommands, ...CoreCommands };

export async function runPrompt() {
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

export async function execute(cb: () => Promise<any>) {
  try {
    const result = await cb();
    logResult(result);
    return result;
  } catch (error) {
    logResult(error, false);
  }
}

export async function askToSaveWalletId(walletId: string) {
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

export function printWalletSummary(
  accountData: {
    accountId: number;
    assetId: string;
    balance: string;
    available: string;
  }[],
  keysState: {
    keyId: string;
    status: string;
    backup: boolean;
    algorithm: string;
  }[]
) {
  console.log(chalk.bold.cyan("📊 Account Data:"));
  console.table(accountData, ["accountId", "assetId", "balance", "available"]);
  console.log(chalk.bold.cyan("🔑 Keys State:"));
  console.table(keysState, ["algorithm", "keyId", "status", "backup"]);
}
