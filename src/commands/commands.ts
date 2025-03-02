import inquirer from "inquirer";
import { getToken, setCustomClaim } from "../utils/firebase-auth";
import { ew, initCore, initEw } from "./ew";
import { state } from "../app";
import { getWalletIds } from "../utils/storage-utils";
import { askToSaveWalletId, printWalletSummary } from "../prompt";
import { getFireblocksNCWInstance } from "@fireblocks/ncw-js-sdk";

export const Commands: Record<string, Function> = {
  "Get Wallet Summary": getSummary,
  "Init all": initAll,
  "Initialize Embedded Wallet": initEw,
  "Initialize Core NCW": initCore,
  "Set Custom Principal Claim": setCustomPrincipalClaim,
};

async function setCustomPrincipalClaim() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "uid",
      message: "Enter the user ID:",
      default: process.env.FIREBASE_UID,
    },
    // {
    //   type: "input",
    //   name: "claimKey",
    //   message: "Enter the claim key (default: 'wallet_claim'):",
    //   default: "wallet_claim",
    // },
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
    await askToSaveWalletId(claimValue);
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
  await getToken(true);
  state.walletId = claimValue === "CLEAR" ? null : claimValue;
  if (state.initCore && state.coreDeviceId) {
    const instance = getFireblocksNCWInstance(state.coreDeviceId);
    if (instance) {
      instance.dispose();
    }
    state.initCore = false;
    state.coreDeviceId = null;
  }
}

async function getSummary() {
  if (!state.initEW && !state.initCore) {
    console.log("Please initialize both Embedded Wallet and Core NCW first.");
    return;
  }

  const accountData = await fetchAccountData();
  const keysState = await fetchKeysState();

  printWalletSummary(accountData, keysState);
}

async function fetchAccountData() {
  const accountData: {
    accountId: number;
    assetId: string;
    balance: string;
    available: string;
  }[] = [];

  const accounts = await ew.getAccounts();
  await Promise.all(
    accounts.data.map(async (account) => {
      const accountAssets = await ew.getAssets(account.accountId);
      await Promise.all(
        accountAssets.data.map(async (asset) => {
          const balance = await ew.getBalance(account.accountId, asset.id);
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
}

async function fetchKeysState() {
  const keysState: {
    keyId: string;
    status: string;
    backup: boolean;
    algorithm: string;
  }[] = [];

  const instance = getFireblocksNCWInstance(state.coreDeviceId);
  const [keyStatus, backup] = await Promise.all([
    instance.getKeysStatus(),
    ew.getLatestBackup(),
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
}

async function initAll() {
  await initEw();
  await initCore();
}
