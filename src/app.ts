import inquirer from "inquirer";
import chalk from "chalk";
import { Commands as BaseCommands } from "./commands/commands";
import { Commands as EWCommands } from "./commands/ew";
import { Commands as CoreCommands } from "./commands/core";

export const state = {
  initEW: false,
  initCore: false,
};

const allCommands = { ...BaseCommands, ...EWCommands, ...CoreCommands };
async function main() {
  let exit = false;

  while (!exit) {
    const choices = getChoices();

    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: "Choose a command to execute:",
        choices,
        pageSize: 40,
      },
    ]);

    if (command === "EXIT") {
      exit = true;
    } else {
      await allCommands[command]();
    }
  }
}

function getChoices() {
  const baseChoices = Object.keys(BaseCommands);
  const ewChoices =
    state.initEW && Object.keys(EWCommands).length
      ? [
          new inquirer.Separator(
            chalk.bold.cyan("========== EW Commands ==========")
          ),
          ...Object.keys(EWCommands),
        ]
      : [];
  const coreChoices =
    state.initCore && Object.keys(CoreCommands).length
      ? [
          new inquirer.Separator(
            chalk.bold.cyan("========== Core Commands ==========")
          ),
          ...Object.keys(CoreCommands),
        ]
      : [];
  return [
    ...baseChoices,
    ...ewChoices,
    ...coreChoices,
    new inquirer.Separator(),
    "EXIT",
  ];
}

main();
