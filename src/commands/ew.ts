import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import { getFireblocksNCWInstance, TEnv } from "@fireblocks/ncw-js-sdk";
import inquirer from "inquirer";
import { getToken } from "../utils/firebase-auth";
import { execute } from "./commands";
import chalk from "chalk";
import {
  FileSystemStorageProvider,
  FileSystemSecureStorageProvider,
} from "../utils/sdk-storage";
import { getDeviceId } from "../utils/utils";
import { input, inputAny } from "./utils";
import { state } from "../app";

export let ew: EmbeddedWallet | null = null;
export const Commands: Record<string, Function> = {
  ["Initialize Core"]: initCore,
  ["Assign Wallet"]: assignWallet,
  ["Add Asset"]: addAsset,
  ["Create Account"]: createAccount,
  ["Get Accounts"]: getAccounts,
  ["Get Addresses"]: getAddresses,
  ["Get Asset"]: getAsset,
  ["Get Assets"]: getAssets,
  ["Get Balance"]: getBalance,
  ["Get Device"]: getDevice,
  ["Get Latest Backup"]: getLatestBackup,
  ["Get NFT"]: getNFT,
  ["Get Owned NFTs"]: getOwnedNFTs,
  ["List Owned Collections"]: listOwnedCollections,
  ["List Owned Assets"]: listOwnedAssets,
  ["Get Supported Assets"]: getSupportedAssets,
};

export async function initEw() {
  if (ew) {
    console.log("EW already initialized");
    return;
  }
  ew = new EmbeddedWallet({
    env: process.env.ENV as TEnv,
    // logger: ConsoleLoggerFactory(),
    authClientId: process.env.AUTH_CLIENT_ID,
    authTokenRetriever: {
      getAuthToken: getToken,
    },
    reporting: { enabled: false },
  });
  state.initEW = true;
  console.log("EW initialized");
}

async function assignWallet() {
  return execute(() => ew.assignWallet());
}
async function getAccounts() {
  return execute(() => ew.getAccounts());
}
async function getAddresses() {
  const { accountId, assetId } = await input("accountId", "assetId");

  return execute(() => ew.getAddresses(accountId, assetId));
}
async function createAccount() {
  return execute(() => ew.createAccount());
}

async function getAsset() {
  const { accountId, assetId } = await input("accountId", "assetId");
  return execute(() => ew.getAsset(Number(accountId), assetId));
}

async function getBalance() {
  const { accountId, assetId } = await input("accountId", "assetId");
  return execute(() => ew.getBalance(accountId, assetId));
}

async function getDevice() {
  const { deviceId } = await input("deviceId");
  return execute(() => ew.getDevice(deviceId));
}

async function getLatestBackup() {
  return execute(() => ew.getLatestBackup());
}

async function getNFT() {
  const id = inputAny("NFT ID");
  return execute(() => ew.getNFT(id));
}
async function getOwnedNFTs() {
  const { accountId } = await input("accountId");
  return execute(() => ew.getOwnedNFTs(accountId));
}

async function listOwnedCollections() {
  const { accountId } = await input("accountId");
  return execute(() => ew.listOwnedCollections(accountId));
}

async function listOwnedAssets() {
  const { accountId } = await input("accountId");
  return execute(() => ew.listOwnedAssets(accountId));
}

async function getSupportedAssets() {
  return execute(() => ew.getSupportedAssets());
}

async function getAssets() {
  const { accountId } = await input("accountId");
  return execute(() => ew.getAssets(accountId));
}

async function addAsset() {
  const { accountId, assetId } = await input("accountId", "assetId");

  return execute(() => ew.addAsset(Number(accountId), assetId));
}

async function initCore() {
  const { deviceId } = await inquirer.prompt([
    {
      type: "input",
      name: "deviceId",
      message: "Enter device ID",
      default: getDeviceId(),
    },
  ]);

  if (getFireblocksNCWInstance(deviceId)) {
    console.log("Core already initialized");
  } else {
    await ew.initializeCore({
      deviceId,
      eventsHandler: {
        handleEvent: (event) => {
          console.log("Event received:", chalk.yellow(JSON.stringify(event)));
        },
      },
      storageProvider: new FileSystemStorageProvider("storage/public"),
      secureStorageProvider: new FileSystemSecureStorageProvider(
        "storage/secure"
      ),
    });

    console.log("Core initialized");
  }
  state.initCore = true;
}
