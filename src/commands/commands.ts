import chalk from "chalk";
import { initEw } from "./ew";

export const Commands: Record<string, Function> = {
  "Init Embedded Wallet": initEw,
};

export async function execute(cb: () => Promise<any>) {
  try {
    const result = await cb();
    logResult(result);
  } catch (error) {
    logError(error);
  }
}
function logResult(result: any) {
  console.log(
    chalk.green("Command executed successfully:", JSON.stringify(result))
  );
}

function logError(error: any) {
  console.log(chalk.red("Command failed:", JSON.stringify(error)));
}
