import inquirer from "inquirer";
import chalk from "chalk";
import { Commands as BaseCommands } from "./commands/commands";
import { coreDeviceId, Commands as EWCommands, walletId } from "./commands/ew";
import { Commands as CoreCommands } from "./commands/core";

export const state = {
  initEW: false,
  initCore: false,
};
const exitCommand = chalk.bold.italic("EXIT");

const allCommands = { ...BaseCommands, ...EWCommands, ...CoreCommands };
async function main() {
  let shouldExit = false;

  while (!shouldExit) {
    const choices = getChoices();

    displaySessionDetails();
    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: "Choose a command to execute:",
        choices,
        pageSize: 40,
      },
    ]);

    if (command === exitCommand) {
      shouldExit = true;
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
    logError(error);
  }
}
function logResult(result: any) {
  console.log(
    chalk.green(
      "\n================================================================================\n",
      "Command executed successfully:\n",
      JSON.stringify(result, null, 2),
      "\n================================================================================\n"
    )
  );
}

function logError(error: any) {
  console.log(
    chalk.red(
      "\n================================================================================\n",
      "Command failed:\n",
      JSON.stringify(error),
      "\n================================================================================\n"
    )
  );
}

function getChoices() {
  const baseChoices = Object.keys(BaseCommands);
  const ewChoices = state.initEW
    ? [
        new inquirer.Separator(
          chalk.bold.yellow("========== EW Commands ==========")
        ),
        ...Object.keys(EWCommands),
      ]
    : [];
  const coreChoices = state.initCore
    ? [
        new inquirer.Separator(
          chalk.bold.yellow("========== Core Commands ==========")
        ),
        ...Object.keys(CoreCommands),
      ]
    : [];
  return [
    ...baseChoices,
    ...ewChoices,
    ...coreChoices,
    new inquirer.Separator(),
    exitCommand,
  ];
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
function displaySessionDetails() {
  console.log(
    chalk.yellow(
      "\n================================================================================\n",
      "Session details:\n",
      `Wallet ID:      ${walletId ?? "???"}\n`,
      `Core Device ID: ${coreDeviceId ?? "???"}`,
      "\n================================================================================\n"
    )
  );
}
