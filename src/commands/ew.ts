import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import {
  ConsoleLoggerFactory,
  generateDeviceId,
  getFireblocksNCWInstance,
  TEnv,
} from "@fireblocks/ncw-js-sdk";
import inquirer from "inquirer";
import { getToken } from "../utils/firebase-auth";
import chalk from "chalk";
import {
  FileSystemStorageProvider,
  FileSystemSecureStorageProvider,
} from "../utils/sdk-storage";
import { getDeviceId, setDeviceId } from "../utils/storage-utils";
import { input, inputAny } from "../utils/prompt-utils";
import { state } from "../app";
import { DestinationTransferPeerPath } from "@fireblocks/ts-sdk";

export let ew: EmbeddedWallet | null = null;
export const Commands: Record<string, Function> = {
  // Embedded Wallet
  [chalk.bold.italic("Wallet Management")]: () => {},
  // Wallet
  ["Assign Wallet"]: assignWallet,

  // Accounts
  ["Create Account"]: createAccount,
  ["Get Accounts"]: getAccounts,

  // Assets
  ["Add Asset"]: addAsset,
  ["Get Asset"]: getAsset,
  ["Get Assets"]: getAssets,
  ["Get Balance"]: getBalance,
  ["Get Supported Assets"]: getSupportedAssets,
  ["Refresh Balance"]: refreshBalance,

  // Addresses
  ["Get Addresses"]: getAddresses,

  // Devices
  ["Get Device"]: getDevice,

  // Backups
  ["Get Latest Backup"]: getLatestBackup,

  // NFTs
  [chalk.bold.italic("NFTs")]: () => {},
  ["Get NFT"]: getNFT,
  ["Get Owned NFTs"]: getOwnedNFTs,
  ["List Owned Assets"]: listOwnedAssets,
  ["List Owned Collections"]: listOwnedCollections,

  // Web3 Connections
  [chalk.bold.italic("Web3 Connections")]: () => {},
  ["Create Web3 Connection"]: createWeb3Connection,
  ["Get Web3 Connections"]: getWeb3Connections,
  ["Remove Web3 Connection"]: removeWeb3Connection,
  ["Submit Web3 Connection"]: submitWeb3Connection,

  // Transactions
  [chalk.bold.italic("Transactions")]: () => {},
  ["Create Transaction"]: createTransaction,
  ["Create Transaction (by free json input)"]: createTransactionByJsonInput,
  ["Get Latest Transactions"]: getLatestTxs,
  ["Cancel Transaction"]: cancelTransaction,
  ["Estimate Transaction Fee"]: estimateTransactionFee,
  ["Get Transaction By ID"]: getTransaction,
  ["Get Transactions"]: getTransactions,
};

export async function initEw() {
  if (ew) {
    console.log("EW already initialized");
    return;
  }
  const { sdkLogs } = await inquirer.prompt([
    {
      type: "confirm",
      name: "sdkLogs",
      message: "Enable SDK logs?",
      default: false,
    },
  ]);
  ew = new EmbeddedWallet({
    env: process.env.ENV as TEnv,
    logger: sdkLogs ? ConsoleLoggerFactory() : undefined,
    authClientId: process.env.AUTH_CLIENT_ID,
    authTokenRetriever: {
      getAuthToken: getToken,
    },
    reporting: { enabled: false },
  });
  state.initEW = true;

  const { shouldInitCore } = await inquirer.prompt({
    type: "confirm",
    name: "shouldInitCore",
    message: "Initialize Core?",
    default: true,
  });
  if (shouldInitCore) {
    await initCore();
  }
}

export async function assignWallet() {
  const result = await ew.assignWallet();
  state.walletId = result.walletId;
  return result;
}
async function getAccounts() {
  return ew.getAccounts();
}
async function getAddresses() {
  const { accountId, assetId } = await input("accountId", "assetId");

  return ew.getAddresses(accountId, assetId);
}
async function createAccount() {
  return ew.createAccount();
}

async function getAsset() {
  const { accountId, assetId } = await input("accountId", "assetId");
  return ew.getAsset(Number(accountId), assetId);
}

async function getBalance() {
  const { accountId, assetId } = await input("accountId", "assetId");
  return ew.getBalance(accountId, assetId);
}

async function refreshBalance() {
  const { accountId, assetId } = await input("accountId", "assetId");
  return ew.refreshBalance(accountId, assetId);
}

async function getDevice() {
  const { deviceId } = await input("deviceId");
  return ew.getDevice(deviceId);
}

async function getLatestBackup() {
  return ew.getLatestBackup();
}

async function getNFT() {
  const id = await inputAny("NFT ID");
  return ew.getNFT(id);
}
async function getOwnedNFTs() {
  return ew.getOwnedNFTs();
}

async function listOwnedCollections() {
  return ew.listOwnedCollections();
}

async function listOwnedAssets() {
  return ew.listOwnedAssets();
}

async function getSupportedAssets() {
  return ew.getSupportedAssets();
}

async function getAssets() {
  const { accountId } = await input("accountId");
  return ew.getAssets(accountId);
}

async function addAsset() {
  const { accountId, assetId } = await input("accountId", "assetId");

  return ew.addAsset(Number(accountId), assetId);
}

async function getWeb3Connections() {
  return ew.getWeb3Connections();
}

async function createWeb3Connection() {
  const { accountId } = await input("accountId");
  const uri = await inputAny("uri");
  return ew.createWeb3Connection({
    feeLevel: "MEDIUM" as any,
    ncwAccountId: accountId,
    uri,
  });
}

async function submitWeb3Connection() {
  const connectionId = await inputAny("connectionId");
  const approve = await inquirer.prompt({
    type: "confirm",
    name: "approve",
    message: "Approve connection?",
  });

  return ew.submitWeb3Connection(connectionId, approve);
}

async function removeWeb3Connection() {
  const connectionId = await inputAny("connectionId");
  return ew.removeWeb3Connection(connectionId);
}

export async function initCore() {
  if (!ew) {
    throw "Embedded Wallet not initialized";
  }
  const latestDeviceId = getDeviceId();
  let { deviceId } = await inquirer.prompt([
    {
      type: "input",
      name: "deviceId",
      message: "Enter device ID (leave blank to generate a random one)",
      default: latestDeviceId,
    },
  ]);

  if (!deviceId) {
    deviceId = generateDeviceId();
  }
  if (deviceId !== latestDeviceId) {
    setDeviceId(deviceId);
  }

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
  }
  state.initCore = true;
  state.coreDeviceId = deviceId;
}

async function getTransaction() {
  const txId = await inputAny("txId");
  return ew.getTransaction(txId);
}

async function getLatestTxs() {
  const [incoming, outgoing] = await Promise.all([
    ew.getTransactions({
      incoming: true,
      orderBy: "lastUpdated",
      limit: 2,
    }),
    ew.getTransactions({
      outgoing: true,
      orderBy: "lastUpdated",
      limit: 2,
    }),
  ]);
  return [...incoming.data, ...outgoing.data]
    .sort((a, b) => (a.lastUpdated > b.lastUpdated ? -1 : 1))
    .map((tx) => ({
      id: tx.id,
      operation: tx.operation,
      asset: tx.assetId,
      amount: tx.amount ?? tx.amountInfo,
      status: tx.status,
      source: tx.source,
      destination: tx.destination,
      lastUpdated: new Date(tx.lastUpdated).toLocaleString(),
    }));
}

async function cancelTransaction() {
  const txId = await inputAny("txId");
  return ew.cancelTransaction(txId);
}

async function estimateTransactionFee() {
  const { accountId, assetId } = await input("accountId", "assetId");
  const amount = await inputAny("amount");
  const destination = await promptDestination();
  return ew.estimateTransactionFee({
    assetId,
    source: {
      id: accountId,
    },
    destination,
    amount,
  });
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
  return ew.getTransactions(filter as any);
}

async function createTransactionByJsonInput() {
  const { txRequestJson } = await inquirer.prompt({
    type: "editor",
    name: "txRequestJson",
    message: "Enter transaction JSON",
    default: JSON.stringify(
      {
        assetId: "BTC",
        source: {
          id: "0",
        },
        destination: {
          type: "VAULT_ACCOUNT",
          id: "0",
        },
        amount: "1",
      },
      null,
      2
    ),
    validate: (text) => {
      try {
        JSON.parse(text);
        return true;
      } catch (e) {
        return "Invalid JSON. Please try again";
      }
    },
  });

  return ew.createTransaction(JSON.parse(txRequestJson));
}

async function createTransaction() {
  const { accountId, assetId } = await input("accountId", "assetId");
  const amount = await inputAny("amount");
  const destination = await promptDestination();
  return ew.createTransaction({
    assetId,
    source: {
      id: `${accountId}`,
    },
    destination,
    amount,
  });
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
      const destWalletId = await inputAny(
        "Destination Wallet ID",
        state.walletId
      );
      const destAccountId = await inputAny("Destination Account ID", "0");
      destination = {
        type: "END_USER_WALLET",
        walletId: destWalletId,
        id: `${destAccountId}`,
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
