import inquirer from "inquirer";
import chalk from "chalk";
import { commands } from "./commands";

async function main() {
  let exit = false;

  while (!exit) {
    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: "Choose a command to execute:",
        choices: [...Object.keys(commands), chalk.red("EXIT")],
      },
    ]);

    if (command === chalk.red("exit")) {
      exit = true;
    } else {
      await commands[command]();
    }
  }
}

main();
