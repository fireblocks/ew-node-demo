import chalk from "chalk";
import { CoreManager } from "./coreManager";
import { EmbeddedWalletManager } from "./embeddedWalletManager";
import { WalletManager } from "./general";

export class CommandsManager {
  constructor(
    private readonly walletManager: WalletManager,
    private readonly coreManager: CoreManager,
    private readonly ewManager: EmbeddedWalletManager
  ) {}

  get BaseCommands(): Record<string, Function> {
    return {
      "Get Wallet Summary": this.walletManager.getSummary,
      "Initialize Embedded Wallet": this.ewManager.initEw,
      "Initialize Core NCW": this.ewManager.initCore,
      "Refresh Idp Token": this.walletManager.refreshIdpToken,
      "Set Custom Principal Claim": this.walletManager.setCustomPrincipalClaim,
    };
  }

  get CoreCommands(): Record<string, Function> {
    return {
      // Wallet Management
      [chalk.bold.italic("Wallet Management")]: () => {},
      ["Approve Join Wallet Request"]:
        this.coreManager.approveJoinWalletRequest,
      ["Request Join Existing Wallet"]:
        this.coreManager.requestJoinExistingWallet,
      ["Stop Join Wallet"]: this.coreManager.stopJoinWallet,
      ["Takeover"]: this.coreManager.takeover,

      // Key Management
      [chalk.bold.italic("Key Management")]: () => {},
      ["Backup Keys"]: this.coreManager.backupKeys,
      ["Recover Keys"]: this.coreManager.recoverKeys,
      ["Generate MPC Keys"]: this.coreManager.generateMPCKeys,
      ["Derive Asset Key"]: this.coreManager.deriveAssetKey,
      ["Get Keys Status"]: this.coreManager.getKeysStatus,
      ["Stop MPC Device Setup"]: this.coreManager.stopMpcDeviceSetup,

      // Transaction Management
      [chalk.bold.italic("Transactions")]: () => {},
      ["Sign Transaction"]: this.coreManager.signTransaction,
      ["Stop In Progress Sign Transaction"]:
        this.coreManager.stopInProgressSignTransaction,
      ["Get In Progress Signing Tx ID"]:
        this.coreManager.getInProgressSigningTxId,

      // General
      [chalk.bold.italic("General")]: () => {},
      ["Clear All Storage"]: this.coreManager.clearAllStorage,
      ["Dispose"]: this.coreManager.dispose,
      ["Get Physical Device ID"]: this.coreManager.getPhysicalDeviceId,
    };
  }

  get EmbeddedWalletCommands(): Record<string, Function> {
    return {
      [chalk.bold.italic("Wallet Management")]: () => {},
      // Wallet
      ["Assign Wallet"]: this.ewManager.assignWallet,

      // Accounts
      ["Create Account"]: this.ewManager.createAccount,
      ["Get Accounts"]: this.ewManager.getAccounts,

      // Assets
      ["Add Asset"]: this.ewManager.addAsset,
      ["Get Asset"]: this.ewManager.getAsset,
      ["Get Assets"]: this.ewManager.getAssets,
      ["Get Balance"]: this.ewManager.getBalance,
      ["Get Supported Assets"]: this.ewManager.getSupportedAssets,
      ["Refresh Balance"]: this.ewManager.refreshBalance,

      // Addresses
      ["Get Addresses"]: this.ewManager.getAddresses,

      // Devices
      ["Get Device"]: this.ewManager.getDevice,

      // Backups
      ["Get Latest Backup"]: this.ewManager.getLatestBackup,

      // NFTs
      [chalk.bold.italic("NFTs")]: () => {},
      ["Get NFT"]: this.ewManager.getNFT,
      ["Get Owned NFTs"]: this.ewManager.getOwnedNFTs,
      ["List Owned Assets"]: this.ewManager.listOwnedAssets,
      ["List Owned Collections"]: this.ewManager.listOwnedCollections,

      // Web3 Connections
      [chalk.bold.italic("Web3 Connections")]: () => {},
      ["Create Web3 Connection"]: this.ewManager.createWeb3Connection,
      ["Get Web3 Connections"]: this.ewManager.getWeb3Connections,
      ["Remove Web3 Connection"]: this.ewManager.removeWeb3Connection,
      ["Submit Web3 Connection"]: this.ewManager.submitWeb3Connection,

      // Transactions
      [chalk.bold.italic("Transactions")]: () => {},
      ["Create Transaction"]: this.ewManager.createTransaction,
      ["Create Transaction (by free json input)"]:
        this.ewManager.createTransactionByJsonInput,
      ["Get Latest Transactions"]: this.ewManager.getLatestTxs,
      ["Cancel Transaction"]: this.ewManager.cancelTransaction,
      ["Estimate Transaction Fee"]: this.ewManager.estimateTransactionFee,
      ["Get Transaction By ID"]: this.ewManager.getTransaction,
      ["Get Transactions"]: this.ewManager.getTransactions,
    };
  }
}
