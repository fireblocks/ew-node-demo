import inquirer from "inquirer";
import chalk from "chalk";
import { Commands as BaseCommands } from "./commands/commands";
import { Commands as EWCommands } from "./commands/ew";
import { Commands as CoreCommands } from "./commands/core";

const EXIT_COMMAND = chalk.bold.italic("EXIT");
const LINE = "=".repeat(80);
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

    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: getSessionDetails(),
        choices,
        pageSize: 30,
      },
    ]);

    if (command === EXIT_COMMAND) {
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
  if (result instanceof Set) {
    result = Array.from(result);
  }
  logMessage("Command executed successfully:", result, chalk.green);
}

function logError(error: any) {
  logMessage("Command failed:", error, chalk.red);
}

function logMessage(message: string, data: any, color: chalk.Chalk) {
  console.log(
    color(
      `\n${message}`,
      `\n${LINE}\n`,
      JSON.stringify(data, null, 2),
      `\n${LINE}\n`
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
    EXIT_COMMAND,
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
function getSessionDetails(): string {
  const yellowBlueLine = (chalk.yellow("==") + chalk.blue("==")).repeat(13);
  return chalk.bold.yellow(
    `\n${yellowBlueLine}\n`,
    " ".repeat(16),
    chalk.italic.bgBlue("Session details\n"),
    `Init EW:   ${
      state.initEW ? `✅\n Wallet ID: ${state.walletId ?? "___"}\n` : "❌"
    }\n`,
    `Init Core: ${
      state.initCore ? `✅\n Device ID: ${state.coreDeviceId ?? "___"}` : "❌"
    }`,
    `\n${yellowBlueLine}\n`
  );
}
