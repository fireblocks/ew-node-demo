import chalk from "chalk";
import { state } from "../app";

const LINE = "=".repeat(80);

export function logResult(result: any, success: boolean = true) {
  switch (true) {
    case result instanceof Set:
      result = Array.from(result);
      break;
    case result instanceof Error:
      result = {
        name: result.name,
        message: result.message,
        stack: result.stack,
      };
      break;
  }

  const message = `Command ${success ? "executed successfully" : "failed"}`;
  const color = success ? chalk.green : chalk.red;

  console.log(
    color(
      `\n${message}`,
      `\n${LINE}\n`,
      JSON.stringify(result, null, 2),
      `\n${LINE}\n`
    )
  );
}

export function getSessionDetails(): string {
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
