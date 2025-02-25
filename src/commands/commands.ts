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
