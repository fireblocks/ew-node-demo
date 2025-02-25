import inquirer from "inquirer";
import { getDeviceId } from "../utils/utils";

type TUserInput = "accountId" | "assetId" | "deviceId";

export async function input(
  ...type: TUserInput[]
): Promise<Partial<Record<TUserInput, any>>> {
  const result: Partial<Record<TUserInput, any>> = {};
  for (const t of type) {
    switch (t) {
      case "accountId":
        const { accountId } = await inquirer.prompt([
          {
            type: "input",
            name: "accountId",
            message: "Enter account ID",
            default: "0",
          },
        ]);
        result.accountId = Number(accountId);
        break;
      case "assetId":
        const { assetId } = await inquirer.prompt([
          {
            type: "input",
            name: "assetId",
            message: "Enter asset ID",
            default: "XRP_TEST",
          },
        ]);
        result.assetId = assetId;
        break;
      case "deviceId":
        const { deviceId } = await inquirer.prompt([
          {
            type: "input",
            name: "deviceId",
            message: "Enter device ID",
            default: getDeviceId(),
          },
        ]);
        result.deviceId = deviceId;
        break;
    }
  }
  return result;
}

export async function inputAny(name: string, defaultValue?: string) {
  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message: `Enter ${name}`,
      default: defaultValue,
    },
  ]);
  return value;
}
