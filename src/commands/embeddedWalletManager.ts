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
import { DestinationTransferPeerPath } from "@fireblocks/ts-sdk";
import { CoreManager } from "./coreManager";

export class EmbeddedWalletManager {
  public static isInitialized: boolean = false;
  public static walletId: string;

  private static ew: EmbeddedWallet | null = null;

  static get instance() {
    return EmbeddedWalletManager.ew;
  }

  async initEw() {
    if (EmbeddedWalletManager.ew) {
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
    EmbeddedWalletManager.ew = new EmbeddedWallet({
      env: process.env.ENV as TEnv,
      logger: sdkLogs ? ConsoleLoggerFactory() : undefined,
      authClientId: process.env.AUTH_CLIENT_ID,
      authTokenRetriever: {
        getAuthToken: getToken,
      },
      reporting: { enabled: false },
    });
    EmbeddedWalletManager.isInitialized = true;

    const { shouldInitCore } = await inquirer.prompt({
      type: "confirm",
      name: "shouldInitCore",
      message: "Initialize Core?",
      default: true,
    });
    if (shouldInitCore) {
      await this.initCore();
    }
  }

  async assignWallet() {
    const result = await EmbeddedWalletManager.ew.assignWallet();
    EmbeddedWalletManager.walletId = result.walletId;
    return result;
  }

  async getAccounts() {
    return EmbeddedWalletManager.ew.getAccounts();
  }

  async getAddresses() {
    const { accountId, assetId } = await input("accountId", "assetId");
    return EmbeddedWalletManager.ew.getAddresses(accountId, assetId);
  }

  async createAccount() {
    return EmbeddedWalletManager.ew.createAccount();
  }

  async getAsset() {
    const { accountId, assetId } = await input("accountId", "assetId");
    return EmbeddedWalletManager.ew.getAsset(Number(accountId), assetId);
  }

  async getBalance() {
    const { accountId, assetId } = await input("accountId", "assetId");
    return EmbeddedWalletManager.ew.getBalance(accountId, assetId);
  }

  async refreshBalance() {
    const { accountId, assetId } = await input("accountId", "assetId");
    return EmbeddedWalletManager.ew.refreshBalance(accountId, assetId);
  }

  async getDevice() {
    const { deviceId } = await input("deviceId");
    return EmbeddedWalletManager.ew.getDevice(deviceId);
  }

  async getLatestBackup() {
    return EmbeddedWalletManager.ew.getLatestBackup();
  }

  async getNFT() {
    const id = await inputAny("NFT ID");
    return EmbeddedWalletManager.ew.getNFT(id);
  }

  async getOwnedNFTs() {
    return EmbeddedWalletManager.ew.getOwnedNFTs();
  }

  async listOwnedCollections() {
    return EmbeddedWalletManager.ew.listOwnedCollections();
  }

  async listOwnedAssets() {
    return EmbeddedWalletManager.ew.listOwnedAssets();
  }

  async getSupportedAssets() {
    return EmbeddedWalletManager.ew.getSupportedAssets();
  }

  async getAssets() {
    const { accountId } = await input("accountId");
    return EmbeddedWalletManager.ew.getAssets(accountId);
  }

  async addAsset() {
    const { accountId, assetId } = await input("accountId", "assetId");
    return EmbeddedWalletManager.ew.addAsset(Number(accountId), assetId);
  }

  async getWeb3Connections() {
    return EmbeddedWalletManager.ew.getWeb3Connections();
  }

  async createWeb3Connection() {
    const { accountId } = await input("accountId");
    const uri = await inputAny("uri");
    return EmbeddedWalletManager.ew.createWeb3Connection({
      feeLevel: "MEDIUM" as any,
      ncwAccountId: accountId,
      uri,
    });
  }

  async submitWeb3Connection() {
    const connectionId = await inputAny("connectionId");
    const approve = await inquirer.prompt({
      type: "confirm",
      name: "approve",
      message: "Approve connection?",
    });

    return EmbeddedWalletManager.ew.submitWeb3Connection(connectionId, approve);
  }

  async removeWeb3Connection() {
    const connectionId = await inputAny("connectionId");
    return EmbeddedWalletManager.ew.removeWeb3Connection(connectionId);
  }

  async initCore() {
    if (!EmbeddedWalletManager.ew) {
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
      await EmbeddedWalletManager.ew.initializeCore({
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
    CoreManager.isInitialized = true;
    CoreManager.deviceId = deviceId;
  }

  async getTransaction() {
    const txId = await inputAny("txId");
    return EmbeddedWalletManager.ew.getTransaction(txId);
  }

  async getLatestTxs() {
    const [incoming, outgoing] = await Promise.all([
      EmbeddedWalletManager.ew.getTransactions({
        incoming: true,
        orderBy: "lastUpdated",
        limit: 2,
      }),
      EmbeddedWalletManager.ew.getTransactions({
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

  async cancelTransaction() {
    const txId = await inputAny("txId");
    return EmbeddedWalletManager.ew.cancelTransaction(txId);
  }

  async estimateTransactionFee() {
    const { accountId, assetId } = await input("accountId", "assetId");
    const amount = await inputAny("amount");
    const destination = await this.promptDestination();
    return EmbeddedWalletManager.ew.estimateTransactionFee({
      assetId,
      source: {
        id: accountId,
      },
      destination,
      amount,
    });
  }

  async getTransactions() {
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
    return EmbeddedWalletManager.ew.getTransactions(filter as any);
  }

  async createTransactionByJsonInput() {
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

    return EmbeddedWalletManager.ew.createTransaction(
      JSON.parse(txRequestJson)
    );
  }

  async createTransaction() {
    const { accountId, assetId } = await input("accountId", "assetId");
    const amount = await inputAny("amount");
    const destination = await this.promptDestination();
    return EmbeddedWalletManager.ew.createTransaction({
      assetId,
      source: {
        id: `${accountId}`,
      },
      destination,
      amount,
    });
  }

  async promptDestination(): Promise<DestinationTransferPeerPath> {
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
          EmbeddedWalletManager.walletId
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
}
