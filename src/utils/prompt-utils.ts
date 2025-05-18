/* eslint-disable @typescript-eslint/no-explicit-any */
import inquirer from "inquirer";
import { getDeviceId } from "./storage-utils";
import { EmbeddedWalletManager } from "../managers/embeddedWalletManager";

type TUserInput = "accountId" | "assetId" | "deviceId";

export async function inputAccountAndAssetWithChoices(): Promise<{
  accountId: number;
  assetId: string;
}> {
  const { accountId } = await input("accountId");
  let assets: string[];
  try {
    const accountAssets = await EmbeddedWalletManager.instance.getAssets(accountId);
    assets = accountAssets.data.map(a => a.id);
  } catch {
    /* empty */
  }
  const assetId = await inputAny("assetId", assets?.[0], assets);
  return { accountId, assetId };
}

export async function input(...type: TUserInput[]): Promise<Partial<Record<TUserInput, any>>> {
  const result: Partial<Record<TUserInput, any>> = {};
  for (const t of type) {
    switch (t) {
      case "accountId": {
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
      }
      case "assetId": {
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
      }
      case "deviceId": {
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
  }
  return result;
}

export async function inputAny(
  name: string,
  defaultValue?: string,
  choices?: string[]
): Promise<string> {
  const { value } = await inquirer.prompt([
    {
      type: choices ? "list" : "input",
      name: "value",
      message: `Enter ${name}`,
      choices,
      default: defaultValue,
    },
  ]);
  return value;
}
