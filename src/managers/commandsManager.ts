import { UtilsManager } from "./utilsCommandsManager";
import { CoreManager } from "./coreManager";
import { EmbeddedWalletManager } from "./embeddedWalletManager";
import { Commands, CommandFlags } from "../utils/commands";
import { createTitle } from "../utils/display";

type CommandFunction = () => Promise<unknown>;
type CommandRecord = Record<string, CommandFunction>;

export class CommandsManager {
  constructor(
    private readonly walletManager: UtilsManager,
    private readonly coreManager: CoreManager,
    private readonly ewManager: EmbeddedWalletManager
  ) {}

  get All(): CommandRecord {
    return {
      ...this.BaseCommands,
      ...this.CoreCommands,
      ...this.EmbeddedWalletCommands,
    };
  }

  get BaseCommands(): CommandRecord {
    return {
      [Commands.GET_WALLET_SUMMARY]: this.walletManager.getSummary,
      [Commands.INITIALIZE_EMBEDDED_WALLET]: this.ewManager.initEw,
      [Commands.INITIALIZE_CORE_NCW]: this.ewManager.initCore,
      [Commands.REFRESH_IDP_TOKEN]: this.walletManager.refreshIdpToken,
      [Commands.SET_CUSTOM_PRINCIPAL_CLAIM]: this.walletManager.setCustomPrincipalClaim,
      [Commands.GET_CUSTOM_PRINCIPAL_CLAIM]: this.walletManager.getCustomPrincipalClaim,
    };
  }

  get CoreCommands(): CommandRecord {
    return {
      // Wallet Management
      ...createTitle("Wallet Management"),
      [Commands.APPROVE_JOIN_WALLET_REQUEST]: this.coreManager.approveJoinWalletRequest,
      [Commands.REQUEST_JOIN_EXISTING_WALLET]: this.coreManager.requestJoinExistingWallet,
      [Commands.STOP_JOIN_WALLET]: this.coreManager.stopJoinWallet,
      [Commands.TAKEOVER]: this.coreManager.takeover,

      // Key Management
      ...createTitle("Key Management"),
      [Commands.BACKUP_KEYS]: this.coreManager.backupKeys,
      [Commands.RECOVER_KEYS]: this.coreManager.recoverKeys,
      [Commands.GENERATE_MPC_KEYS]: this.coreManager.generateMPCKeys,
      [Commands.DERIVE_ASSET_KEY]: this.coreManager.deriveAssetKey,
      [Commands.GET_KEYS_STATUS]: this.coreManager.getKeysStatus,
      [Commands.STOP_MPC_DEVICE_SETUP]: this.coreManager.stopMpcDeviceSetup,

      // Transaction Management
      ...createTitle("Transaction Management"),
      [Commands.SIGN_TRANSACTION]: this.coreManager.signTransaction,
      [Commands.STOP_IN_PROGRESS_SIGN_TRANSACTION]: this.coreManager.stopInProgressSignTransaction,
      [Commands.GET_IN_PROGRESS_SIGNING_TX_ID]: this.coreManager.getInProgressSigningTxId,

      // General
      ...createTitle("General"),
      [Commands.CLEAR_ALL_STORAGE]: this.coreManager.clearAllStorage,
      [Commands.DISPOSE]: this.coreManager.dispose,
      [Commands.GET_PHYSICAL_DEVICE_ID]: this.coreManager.getPhysicalDeviceId,
    };
  }

  get EmbeddedWalletCommands(): CommandRecord {
    return {
      ...createTitle("Wallet Management"),
      [Commands.ASSIGN_WALLET]: this.ewManager.assignWallet,
      [Commands.CREATE_ACCOUNT]: this.ewManager.createAccount,
      [Commands.GET_ACCOUNTS]: this.ewManager.getAccounts,
      [Commands.ADD_ASSET]: this.ewManager.addAsset,
      [Commands.GET_ASSET]: this.ewManager.getAsset,
      [Commands.GET_ASSETS]: this.ewManager.getAssets,
      [Commands.GET_BALANCE]: this.ewManager.getBalance,
      [Commands.GET_SUPPORTED_ASSETS]: this.ewManager.getSupportedAssets,
      [Commands.REFRESH_BALANCE]: this.ewManager.refreshBalance,
      [Commands.GET_ADDRESSES]: this.ewManager.getAddresses,
      [Commands.GET_DEVICE]: this.ewManager.getDevice,
      [Commands.GET_LATEST_BACKUP]: this.ewManager.getLatestBackup,
      ...createTitle("NFTs"),
      [Commands.GET_NFT]: this.ewManager.getNFT,
      [Commands.GET_OWNED_NFTS]: this.ewManager.getOwnedNFTs,
      [Commands.LIST_OWNED_ASSETS]: this.ewManager.listOwnedAssets,
      [Commands.LIST_OWNED_COLLECTIONS]: this.ewManager.listOwnedCollections,
      ...createTitle("Web3 Connections"),
      [Commands.CREATE_WEB3_CONNECTION]: this.ewManager.createWeb3Connection,
      [Commands.GET_WEB3_CONNECTIONS]: this.ewManager.getWeb3Connections,
      [Commands.REMOVE_WEB3_CONNECTION]: this.ewManager.removeWeb3Connection,
      [Commands.SUBMIT_WEB3_CONNECTION]: this.ewManager.submitWeb3Connection,
      ...createTitle("Transactions"),
      [Commands.CREATE_TRANSACTION]: this.ewManager.createTransaction,
      [Commands.CREATE_AND_SIGN_TRANSACTION]: this.ewManager.createAndSignTransaction,
      [Commands.CREATE_TRANSACTION_BY_JSON]: this.ewManager.createTransactionByJsonInput,
      [Commands.GET_LATEST_TRANSACTIONS]: this.ewManager.getLatestTxs,
      [Commands.CANCEL_TRANSACTION]: this.ewManager.cancelTransaction,
      [Commands.ESTIMATE_TRANSACTION_FEE]: this.ewManager.estimateTransactionFee,
      [Commands.GET_TRANSACTION_BY_ID]: this.ewManager.getTransaction,
      [Commands.GET_TRANSACTIONS]: this.ewManager.getTransactions,
    };
  }

  get Flags(): Record<CommandFlags, CommandFunction> {
    return {
      [CommandFlags.INIT]: this.ewManager.autoInit,
      [CommandFlags.ENV]: async () => void 0,
    };
  }
}
