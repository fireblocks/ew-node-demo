import inquirer from "inquirer";
import { getWalletIds } from "../utils/storage-utils";
import { getFireblocksNCWInstance } from "@fireblocks/ncw-js-sdk";
import { printWalletSummary } from "../utils/display";
import { setCustomClaim, getToken } from "../utils/firebase-auth";
import { EmbeddedWalletManager } from "./embeddedWalletManager";
import { CoreManager } from "./coreManager";
import { Prompt } from "../prompt";

export class UtilsManager {
  constructor(private readonly ewManager: EmbeddedWalletManager) {}

  setCustomPrincipalClaim = async () => {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "uid",
        message: "Enter the user ID:",
        default: process.env.FIREBASE_UID,
      },
      {
        type: "list",
        name: "claimValue",
        message: "Select the claim value:",
        choices: ["RANDOM", "SAVED", "USER_INPUT", "CLEAR"],
      },
    ]);
    let claimValue: string;

    if (answers.claimValue === "USER_INPUT") {
      const { claimValue: userInput } = await inquirer.prompt([
        {
          type: "input",
          name: "claimValue",
          message: "Enter the claim value:",
        },
      ]);
      claimValue = userInput;
      await Prompt.askToSaveWalletId(claimValue);
    } else if (answers.claimValue === "RANDOM") {
      claimValue = crypto.randomUUID();
    } else if (answers.claimValue === "CLEAR") {
      claimValue = "CLEAR";
    } else if (answers.claimValue === "SAVED") {
      const opts = getWalletIds();
      if (!opts) {
        console.log("No saved wallet IDs found.");
        return;
      }
      const getKey = (opt: { name: string; uuid: string }) =>
        `${opt.name}: ${opt.uuid}`;
      const { walletId } = await inquirer.prompt([
        {
          type: "list",
          name: "walletId",
          message: "Select the wallet ID:",
          choices: opts.map(getKey),
        },
      ]);
      claimValue = opts.find((opt) => getKey(opt) === walletId)?.uuid || "";
    }
    await setCustomClaim(
      answers.uid,
      "wallet_claim", // answers.claimKey
      claimValue
    );
    // refresh the token
    await this.refreshIdpToken();
    EmbeddedWalletManager.walletId = claimValue === "CLEAR" ? null : claimValue;
    if (CoreManager.isInitialized && CoreManager.deviceId) {
      const instance = getFireblocksNCWInstance(CoreManager.deviceId);
      if (instance) {
        instance.dispose();
      }
      CoreManager.isInitialized = false;
      CoreManager.deviceId = null;
    }
  };

  refreshIdpToken = async () => {
    return getToken(true);
  };

  getSummary = async () => {
    if (!EmbeddedWalletManager.isInitialized || !CoreManager.isInitialized) {
      throw "Must initialize both Embedded Wallet and Core NCW";
    }

    const promises: Promise<any>[] = [
      this.fetchAccountData(),
      this.fetchKeysState(),
    ];
    if (!EmbeddedWalletManager.walletId) {
      promises.push(this.ewManager.assignWallet());
    }

    const [accountData, keysState] = await Promise.all(promises);

    printWalletSummary(accountData, keysState);
  };

  private fetchAccountData = async () => {
    const accountData: {
      accountId: number;
      assetId: string;
      balance: string;
      available: string;
    }[] = [];

    const accounts = await EmbeddedWalletManager.instance.getAccounts();
    await Promise.all(
      accounts.data.map(async (account) => {
        const accountAssets = await EmbeddedWalletManager.instance.getAssets(
          account.accountId
        );
        await Promise.all(
          accountAssets.data.map(async (asset) => {
            const balance = await EmbeddedWalletManager.instance.getBalance(
              account.accountId,
              asset.id
            );
            accountData.push({
              accountId: account.accountId,
              assetId: asset.id,
              balance: balance.total,
              available: balance.available,
            });
          })
        );
      })
    );

    return accountData;
  };

  private fetchKeysState = async () => {
    const keysState: {
      keyId: string;
      status: string;
      backup: boolean;
      algorithm: string;
    }[] = [];

    const instance = getFireblocksNCWInstance(CoreManager.deviceId);
    const [keyStatus, backup] = await Promise.all([
      instance.getKeysStatus(),
      EmbeddedWalletManager.instance.getLatestBackup(),
    ]);

    for (const key of Object.values(keyStatus)) {
      const algorithmWithoutCMP = key.algorithm.replace("CMP_", "");
      keysState.push({
        keyId: key.keyId,
        status: key.keyStatus,
        backup: backup.keys.some(
          (backupKeys) => backupKeys.algorithm === algorithmWithoutCMP
        ),
        algorithm: algorithmWithoutCMP,
      });
    }

    return keysState;
  };
}
