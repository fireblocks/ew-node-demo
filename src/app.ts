import inquirer from "inquirer";
import chalk from "chalk";
import { Commands } from "./commands";

async function main() {
  let exit = false;

  while (!exit) {
    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: "Choose a command to execute:",
        choices: [...Object.keys(Commands), chalk.red("EXIT")],
      },
    ]);

    if (command === chalk.red("exit")) {
      exit = true;
    } else {
      await Commands[command]();
    }
  }
}

main();
