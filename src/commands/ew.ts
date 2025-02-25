import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import {
  ConsoleLoggerFactory,
  getFireblocksNCWInstance,
  TEnv,
} from "@fireblocks/ncw-js-sdk";
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
import { DestinationTransferPeerPath } from "@fireblocks/ts-sdk";

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
  ["Get Web3 Connections"]: getWeb3Connections,
  ["Create Web3 Connection"]: createWeb3Connection,
  ["Submit Web3 Connection"]: submitWeb3Connection,
  ["Remove Web3 Connection"]: removeWeb3Connection,
  ["Create Transaction"]: createTransaction,
  ["Estimate Transaction Fee"]: estimateTransactionFee,
  ["Get Transaction By ID"]: getTransaction,
  ["Get Transactions"]: getTransactions,
  ["Cancel Transaction"]: cancelTransaction,
};

export async function initEw() {
  if (ew) {
    console.log("EW already initialized");
    return;
  }
  ew = new EmbeddedWallet({
    env: process.env.ENV as TEnv,
    logger: ConsoleLoggerFactory(),
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
  const id = await inputAny("NFT ID");
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

async function getWeb3Connections() {
  return execute(() => ew.getWeb3Connections());
}

async function createWeb3Connection() {
  const { accountId } = await input("accountId");
  const uri = await inputAny("uri");
  return execute(() =>
    ew.createWeb3Connection({
      feeLevel: "LOW" as any,
      ncwAccountId: accountId,
      uri,
    })
  );
}

async function submitWeb3Connection() {
  const connectionId = await inputAny("connectionId");
  const approve = await inquirer.prompt({
    type: "confirm",
    name: "approve",
    message: "Approve connection?",
  });

  return execute(() => ew.submitWeb3Connection(connectionId, approve));
}

async function removeWeb3Connection() {
  const connectionId = await inputAny("connectionId");
  return execute(() => ew.removeWeb3Connection(connectionId));
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

async function getTransaction() {
  const txId = await inputAny("txId");
  return execute(() => ew.getTransaction(txId));
}

async function cancelTransaction() {
  const txId = await inputAny("txId");
  return execute(() => ew.cancelTransaction(txId));
}

async function estimateTransactionFee() {
  const { accountId, assetId } = await input("accountId", "assetId");
  const amount = await inputAny("amount");
  const destination = await promptDestination();
  return execute(() =>
    ew.estimateTransactionFee({
      assetId,
      source: {
        id: accountId,
      },
      destination,
      amount,
    })
  );
}

async function getTransactions() {
  const { direction } = await inquirer.prompt([
    {
      type: "list",
      name: "direction",
      message: "Select direction",
      choices: ["incoming", "outgoing"],
    },
  ]);
  const filter = {};
  if (direction === "incoming") {
    filter["incoming"] = true;
  }
  if (direction === "outgoing") {
    filter["outgoing"] = true;
  }
  return execute(() => ew.getTransactions(filter as any));
}

async function createTransaction() {
  const { accountId, assetId } = await input("accountId", "assetId");
  const amount = await inputAny("amount");
  const destination = await promptDestination();
  return execute(() =>
    ew.createTransaction({
      assetId,
      source: {
        id: `${accountId}`,
      },
      destination,
      amount,
    })
  );
}

async function promptDestination(): Promise<DestinationTransferPeerPath> {
  const { destinationType } = await inquirer.prompt([
    {
      type: "list",
      name: "destinationType",
      message: "Select destination type",
      choices: ["VAULT_ACCOUNT", "ONE_TIME_ADDRESS", "END_USER_WALLET"],
    },
  ]);

  let destination: DestinationTransferPeerPath;

  switch (destinationType) {
    case "ONE_TIME_ADDRESS":
      const destAddress = await inputAny("Destination Address");
      destination = {
        type: "ONE_TIME_ADDRESS",
        oneTimeAddress: {
          address: destAddress,
        },
      };
      break;
    case "END_USER_WALLET":
      const destWalletId = await inputAny("Destination Wallet ID");
      destination = {
        type: "END_USER_WALLET",
        walletId: destWalletId,
        id: "0",
      };
      break;
    case "VAULT_ACCOUNT":
      const vaultAccountId = await inputAny("Vault Account ID", "0");
      destination = {
        type: "VAULT_ACCOUNT",
        id: vaultAccountId,
      };
      break;
  }

  return destination;
}
