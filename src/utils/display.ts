import chalk from "chalk";
import { EmbeddedWalletManager } from "../commands/embeddedWalletManager";
import { CoreManager } from "../commands/coreManager";

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
    " ".repeat(12),
    chalk.italic.bgBlue(`Session details (${process.env.ENV})\n`),
    `Init EW:   ${
      EmbeddedWalletManager.isInitialized
        ? `✅\n Wallet ID: ${EmbeddedWalletManager.walletId ?? "___"}\n`
        : "❌"
    }\n`,
    `Init Core: ${
      CoreManager.isInitialized
        ? `✅\n Device ID: ${CoreManager.deviceId ?? "___"}`
        : "❌"
    }`,
    `\n${yellowBlueLine}\n`
  );
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
  accountData.sort((a, b) => Number(b.balance) - Number(a.balance));
  console.log(chalk.bold.cyan("📊 Account Data:"));
  console.table(accountData);
  console.log(chalk.bold.cyan("🔑 Keys State:"));
  console.table(keysState);
}
