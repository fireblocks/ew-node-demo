import { getFireblocksNCWInstance } from "@fireblocks/ncw-js-sdk";
import { getDeviceId } from "../utils/utils";
import inquirer from "inquirer";
import { inputAny } from "../utils/prompt-utils";
import chalk from "chalk";
import { coreDeviceId } from "./ew";

export const Commands: Record<string, Function> = {
  // Wallet Management
  [chalk.bold.italic("Wallet Management")]: () => {},
  ["Approve Join Wallet Request"]: approveJoinWalletRequest,
  ["Request Join Existing Wallet"]: requestJoinExistingWallet,
  ["Stop Join Wallet"]: stopJoinWallet,
  ["Takeover"]: takeover,

  // Key Management
  [chalk.bold.italic("Key Management")]: () => {},
  ["Backup Keys"]: backupKeys,
  ["Recover Keys"]: recoverKeys,
  ["Generate MPC Keys"]: generateMPCKeys,
  ["Derive Asset Key"]: deriveAssetKey,
  ["Get Keys Status"]: getKeysStatus,
  ["Stop MPC Device Setup"]: stopMpcDeviceSetup,

  // Transaction Management
  [chalk.bold.italic("Transactions")]: () => {},
  ["Sign Transaction"]: signTransaction,
  ["Stop In Progress Sign Transaction"]: stopInProgressSignTransaction,
  ["Get In Progress Signing Tx ID"]: getInProgressSigningTxId,

  // General
  [chalk.bold.italic("General")]: () => {},
  ["Clear All Storage"]: clearAllStorage,
  ["Dispose"]: dispose,
  ["Get Physical Device ID"]: getPhysicalDeviceId,
};

export async function dispose() {
  const instance = await getCoreInstance();
  return instance.dispose();
}

export async function clearAllStorage() {
  const instance = await getCoreInstance();
  return instance.clearAllStorage();
}

export async function generateMPCKeys() {
  const instance = await getCoreInstance();
  const { algos } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "algos",
      message: "Select algorithms",
      choices: ["MPC_CMP_ECDSA_SECP256K1", "MPC_CMP_EDDSA_ED25519"],
      default: ["MPC_CMP_ECDSA_SECP256K1", "MPC_CMP_EDDSA_ED25519"],
    },
  ]);
  return instance.generateMPCKeys(new Set(algos));
}

export async function stopMpcDeviceSetup() {
  const instance = await getCoreInstance();
  return instance.stopMpcDeviceSetup();
}

export async function signTransaction() {
  const instance = await getCoreInstance();
  const txId = await inputAny("transaction ID");
  return instance.signTransaction(txId);
}

export async function stopInProgressSignTransaction() {
  const instance = await getCoreInstance();
  return instance.stopInProgressSignTransaction();
}

export async function getInProgressSigningTxId() {
  const instance = await getCoreInstance();
  return instance.getInProgressSigningTxId();
}

export async function backupKeys() {
  const instance = await getCoreInstance();
  const passphrase = await inputAny(
    "passphrase",
    process.env.DEFAULT_PASSPHRASE
  );
  const passphraseId = await inputAny(
    "passphrase ID (uuid)",
    process.env.DEFAULT_PASSPHRASE_ID
  );
  return instance.backupKeys(passphrase, passphraseId);
}

export async function recoverKeys() {
  const instance = await getCoreInstance();
  const passphrase = await inputAny(
    "passphrase",
    process.env.DEFAULT_PASSPHRASE
  );
  return instance.recoverKeys(() => Promise.resolve(passphrase));
}

export async function requestJoinExistingWallet() {
  const instance = await getCoreInstance();
  return instance.requestJoinExistingWallet({
    onRequestId: (requestId) => {
      console.log(chalk.cyan(`Request ID: ${requestId}`));
    },
  });
}

export async function approveJoinWalletRequest() {
  const instance = await getCoreInstance();
  const requestId = await inputAny("request ID");
  return instance.approveJoinWalletRequest(requestId);
}

export async function stopJoinWallet() {
  const instance = await getCoreInstance();
  return instance.stopJoinWallet();
}

export async function takeover() {
  const instance = await getCoreInstance();
  return instance.takeover();
}

// export async function exportFullKeys() {
//   const instance = await getCoreInstance();
//   return instance.exportFullKeys();
// }

export async function deriveAssetKey() {
  const instance = await getCoreInstance();
  const extendedPrivateKey = await inputAny("extended private key");
  const coinType = await inputAny("coin type");
  const account = await inputAny("account");
  const change = await inputAny("change");
  const index = await inputAny("index");
  return instance.deriveAssetKey(
    extendedPrivateKey,
    Number(coinType),
    Number(account),
    Number(change),
    Number(index)
  );
}

export async function getKeysStatus() {
  const instance = await getCoreInstance();
  return instance.getKeysStatus();
}

export async function getPhysicalDeviceId() {
  const instance = await getCoreInstance();
  return instance.getPhysicalDeviceId();
}

async function getCoreInstance() {
  const deviceId = coreDeviceId ?? getDeviceId();
  const instance = getFireblocksNCWInstance(deviceId);
  if (!instance) {
    throw new Error("Failed to get core instance");
  }
  return instance;
}
