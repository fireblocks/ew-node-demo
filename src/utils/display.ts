import chalk from "chalk";
import { EmbeddedWalletManager } from "../managers/embeddedWalletManager";
import { CoreManager } from "../managers/coreManager";
import { ENV } from "../config";
import { TEvent } from "@fireblocks/ncw-js-sdk";

const LINE = "=".repeat(80);

export function createTitle(text: string) {
  return { [chalk.bold.italic(text)]: async () => void 0 };
}

export function logResult(result: unknown, success: boolean = true) {
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

  console.log(color(`\n${message}`, `\n${LINE}\n`, JSON.stringify(result, null, 2), `\n${LINE}\n`));
}

export function getSessionDetails(): string {
  const yellowBlueLine = (chalk.yellow("==") + chalk.blue("==")).repeat(13);
  return chalk.bold.yellow(
    `\n${yellowBlueLine}\n`,
    " ".repeat(12),
    chalk.italic.bgBlue(`Session details (${ENV.ENV})\n`),
    `Init EW:   ${
      EmbeddedWalletManager.isInitialized
        ? `✅\n Wallet ID: ${EmbeddedWalletManager.walletId ?? "___"}\n`
        : "❌"
    }\n`,
    `Init Core: ${
      CoreManager.isInitialized ? `✅\n Device ID: ${CoreManager.deviceId ?? "___"}` : "❌"
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
  const groupedAccounts = accountData.reduce(
    (acc, account) => {
      if (!acc[account.accountId]) {
        acc[account.accountId] = [];
      }
      acc[account.accountId].push(account);
      return acc;
    },
    {} as Record<number, typeof accountData>
  );

  Object.entries(groupedAccounts).forEach(([accountId, accounts]) => {
    console.log(chalk.bold.cyan(`📊 Account ${accountId}`));
    console.table(accounts);
  });

  console.log(chalk.bold.cyan("🔑 Keys State:"));
  console.table(keysState);
}

export const EXIT_COMMAND = chalk.bold.italic("EXIT");

export function printEvent(type: TEvent["type"], data: unknown) {
  const formattedData = JSON.stringify(data, null, 2)
    .split("\n")
    .map(line => chalk.cyan("│ ") + chalk.white(line))
    .join("\n");

  console.log(`
${chalk.cyan(`╭─ Event Received ────────────────────────────────`)}
${chalk.cyan("│ " + chalk.bold.italic.white(type))}
${formattedData}
${chalk.cyan("╰────────────────────────────────────────────────")}
`);
}
