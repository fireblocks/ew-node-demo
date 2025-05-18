import { EmbeddedWallet, IPaginatedResponse } from "@fireblocks/embedded-wallet-sdk";
import {
  ConsoleLoggerFactory,
  generateDeviceId,
  getFireblocksNCWInstance,
  TEnv,
} from "@fireblocks/ncw-js-sdk";
import { EventsHandler } from "../utils/eventsHandler";
import inquirer from "inquirer";
import { getToken } from "../utils/firebase-auth";
import {
  FileSystemStorageProvider,
  FileSystemSecureStorageProvider,
} from "../utils/sdk-storage";
import { getDeviceId, setDeviceId } from "../utils/storage-utils";
import {
  input,
  inputAccountAndAssetWithChoices,
  inputAny,
} from "../utils/prompt-utils";
import { AmountInfo, CreateConnectionResponse, CreateTransactionResponse, DestinationTransferPeerPath, DestinationTransferPeerPathResponse, EstimatedTransactionFeeResponse, GetTransactionOperation, SessionDTO, SourceTransferPeerPathResponse, TokenOwnershipResponse, TokenResponse, TransactionResponse } from "@fireblocks/ts-sdk";
import { CoreManager } from "./coreManager";
import { ENV } from "../config";
import { NCW } from "fireblocks-sdk";

export class EmbeddedWalletManager {
  public static isInitialized: boolean = false;
  public static walletId: string;

  private static ew: EmbeddedWallet | null = null;

  static get instance() {
    return EmbeddedWalletManager.ew;
  }

  autoInit = async () => {
    await this.initEw(true);
  };

  initEw = async (auto = false) => {
    if (EmbeddedWalletManager.ew) {
      console.log("EW already initialized");
      return;
    }

    let sdkLogs = false;
    if (!auto) {
      const response = await inquirer.prompt([
        {
          type: "confirm",
          name: "sdkLogs",
          message: "Enable SDK logs?",
          default: false,
        },
      ]);
      sdkLogs = response.sdkLogs;
    }

    EmbeddedWalletManager.ew = new EmbeddedWallet({
      env: ENV.ENV as TEnv,
      logger: sdkLogs ? ConsoleLoggerFactory() : undefined,
      logLevel: "VERBOSE",
      authClientId: ENV.AUTH_CLIENT_ID,
      authTokenRetriever: {
        getAuthToken: getToken,
      },
      reporting: { enabled: false },
    });
    EmbeddedWalletManager.isInitialized = true;

    if (auto) {
      await this.initCore(auto);
    } else {
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
  };

  assignWallet = async () => {
    const result = await EmbeddedWalletManager.ew.assignWallet();
    EmbeddedWalletManager.walletId = result.walletId;
    return result;
  };

  getAccounts = async () => {
    return EmbeddedWalletManager.ew.getAccounts();
  };

  getAddresses = async () => {
    const { assetId, accountId } = await inputAccountAndAssetWithChoices();
    return EmbeddedWalletManager.ew.getAddresses(accountId, assetId);
  };

  createAccount = async () => {
    return EmbeddedWalletManager.ew.createAccount();
  };

  getAsset = async () => {
    const { assetId, accountId } = await inputAccountAndAssetWithChoices();
    return EmbeddedWalletManager.ew.getAsset(Number(accountId), assetId);
  };

  getBalance = async () => {
    const { assetId, accountId } = await inputAccountAndAssetWithChoices();
    return EmbeddedWalletManager.ew.getBalance(accountId, assetId);
  };

  refreshBalance = async () => {
    const { assetId, accountId } = await inputAccountAndAssetWithChoices();
    return EmbeddedWalletManager.ew.refreshBalance(accountId, assetId);
  };

  getDevice = async () => {
    const { deviceId } = await input("deviceId");
    return EmbeddedWalletManager.ew.getDevice(deviceId);
  };

  getLatestBackup = async () => {
    return EmbeddedWalletManager.ew.getLatestBackup();
  };

  getNFT = async (): Promise<TokenResponse> => {
    const id = await inputAny("NFT ID");
    return EmbeddedWalletManager.ew.getNFT({ id });
  };

  getOwnedNFTs = async (): Promise<IPaginatedResponse<TokenOwnershipResponse>> => {
    return EmbeddedWalletManager.ew.getOwnedNFTs();
  };

  listOwnedCollections = async (): Promise<IPaginatedResponse<TokenOwnershipResponse>> => {
    return EmbeddedWalletManager.ew.listOwnedCollections();
  };

  listOwnedAssets = async (): Promise<IPaginatedResponse<TokenOwnershipResponse>> => {
    return EmbeddedWalletManager.ew.listOwnedAssets();
  };

  getSupportedAssets = async (): Promise<IPaginatedResponse<NCW.WalletAssetResponse>> => {
    return EmbeddedWalletManager.ew.getSupportedAssets();
  };

  getAssets = async (): Promise<IPaginatedResponse<NCW.WalletAssetResponse>> => {
    const { accountId } = await input("accountId");
    return EmbeddedWalletManager.ew.getAssets(accountId);
  };

  addAsset = async (): Promise<NCW.WalletAssetAddress> => {
    const { assetId, accountId } = await input("accountId", "assetId");
    return EmbeddedWalletManager.ew.addAsset(Number(accountId), assetId);
  };

  getWeb3Connections = async (): Promise<IPaginatedResponse<SessionDTO>> => {
    return EmbeddedWalletManager.ew.getWeb3Connections();
  };

  createWeb3Connection = async (): Promise<CreateConnectionResponse> => {
    const { accountId } = await input("accountId");
    const uri = await inputAny("uri");
    return EmbeddedWalletManager.ew.createWeb3Connection({
      feeLevel: "MEDIUM" as any,
      ncwAccountId: accountId,
      uri,
    });
  };

  submitWeb3Connection = async () => {
    const connectionId = await inputAny("connectionId");
    const approve = await inquirer.prompt({
      type: "confirm",
      name: "approve",
      message: "Approve connection?",
    });

    return EmbeddedWalletManager.ew.submitWeb3Connection(connectionId, approve);
  };

  removeWeb3Connection = async () => {
    const connectionId = await inputAny("connectionId");
    return EmbeddedWalletManager.ew.removeWeb3Connection(connectionId);
  };

  initCore = async (auto = false) => {
    if (!EmbeddedWalletManager.ew) {
      throw "Embedded Wallet not initialized";
    }

    const latestDeviceId = getDeviceId();
    let deviceId: string;

    if (auto) {
      deviceId = latestDeviceId || generateDeviceId();
    } else {
      const { deviceId: promptDeviceId } = await inquirer.prompt({
        type: "input",
        name: "deviceId",
        message: "Enter device ID (leave blank to generate a random one)",
        default: latestDeviceId,
      });
      deviceId = promptDeviceId || generateDeviceId();
    }

    if (deviceId !== latestDeviceId) {
      setDeviceId(deviceId);
    }

    if (getFireblocksNCWInstance(deviceId)) {
      console.log("Core already initialized");
    } else {
      await EmbeddedWalletManager.ew.initializeCore({
        deviceId,
        eventsHandler: new EventsHandler(),
        storageProvider: new FileSystemStorageProvider("storage/public"),
        secureStorageProvider: new FileSystemSecureStorageProvider(
          "storage/secure"
        ),
      });
    }

    CoreManager.isInitialized = true;
    CoreManager.deviceId = deviceId;
  };

  getTransaction = async (): Promise<TransactionResponse> => {
    const txId = await inputAny("txId");
    return EmbeddedWalletManager.ew.getTransaction(txId);
  };

  getLatestTxs = async (): Promise<{
      id: string;
      operation: GetTransactionOperation;
      asset: string;
      amount: number | AmountInfo;
      status: string;
      source: SourceTransferPeerPathResponse;
      destination: DestinationTransferPeerPathResponse;
      lastUpdated: string;
  }[]> => {
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
  };

  cancelTransaction = async () => {
    const txId = await inputAny("txId");
    return EmbeddedWalletManager.ew.cancelTransaction(txId);
  };

  estimateTransactionFee = async (): Promise<EstimatedTransactionFeeResponse> => {
    const { assetId, accountId } = await inputAccountAndAssetWithChoices();
    const amount = await inputAny("amount");
    const destination = await this.promptDestination();
    return EmbeddedWalletManager.ew.estimateTransactionFee({
      assetId,
      source: {
        id: accountId.toString(),
      },
      destination,
      amount,
    });
  };

  getTransactions = async (): Promise<IPaginatedResponse<TransactionResponse>> => {
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
  };

  createTransactionByJsonInput = async (): Promise<TransactionResponse> => {
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
  };

  createTransaction = async (): Promise<CreateTransactionResponse> => {
    const { assetId, accountId } = await inputAccountAndAssetWithChoices();
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
  };

  createAndSignTransaction = async () => {
    if (!(CoreManager.isInitialized && CoreManager.deviceId)) {
      throw "Core not initialized";
    }
    const tx = await this.createTransaction();
    const core = getFireblocksNCWInstance(CoreManager.deviceId);
    return core.signTransaction(tx.id);
  };

  promptDestination = async (): Promise<DestinationTransferPeerPath> => {
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
  };
}
