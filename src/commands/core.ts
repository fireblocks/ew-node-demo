import {
  generateDeviceId,
  getFireblocksNCWInstance,
} from "@fireblocks/ncw-js-sdk";
import { getDeviceId, setDeviceId } from "../utils/storage-utils";
import inquirer from "inquirer";
import { inputAny } from "../utils/prompt-utils";
import chalk from "chalk";
import { state } from "../app";

export const Commands: Record<string, Function> = {
  ["Set Device ID"]: setCoreDeviceId,

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

async function dispose() {
  const instance = await getCoreInstance();
  return instance.dispose();
}

async function clearAllStorage() {
  const instance = await getCoreInstance();
  return instance.clearAllStorage();
}

async function generateMPCKeys() {
  const instance = await getCoreInstance();
  const { algos } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "algos",
      message: "Select algorithms",
      choices: ["MPC_CMP_ECDSA_SECP256K1", "MPC_CMP_EDDSA_ED25519"],
      default: ["MPC_CMP_ECDSA_SECP256K1"],
    },
  ]);
  return instance.generateMPCKeys(new Set(algos));
}

async function stopMpcDeviceSetup() {
  const instance = await getCoreInstance();
  return instance.stopMpcDeviceSetup();
}

async function signTransaction() {
  const instance = await getCoreInstance();
  const txId = await inputAny("transaction ID");
  return instance.signTransaction(txId);
}

async function stopInProgressSignTransaction() {
  const instance = await getCoreInstance();
  return instance.stopInProgressSignTransaction();
}

async function getInProgressSigningTxId() {
  const instance = await getCoreInstance();
  return instance.getInProgressSigningTxId();
}

async function backupKeys() {
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

async function recoverKeys() {
  const instance = await getCoreInstance();
  const passphrase = await inputAny(
    "passphrase",
    process.env.DEFAULT_PASSPHRASE
  );
  return instance.recoverKeys(() => Promise.resolve(passphrase));
}

async function requestJoinExistingWallet() {
  const instance = await getCoreInstance();
  return instance.requestJoinExistingWallet({
    onRequestId: (requestId) => {
      console.log(chalk.cyan(`Request ID: ${requestId}`));
    },
  });
}

async function approveJoinWalletRequest() {
  const instance = await getCoreInstance();
  const requestId = await inputAny("request ID");
  return instance.approveJoinWalletRequest(requestId);
}

async function stopJoinWallet() {
  const instance = await getCoreInstance();
  return instance.stopJoinWallet();
}

async function takeover() {
  const instance = await getCoreInstance();
  return instance.takeover();
}

// async function exportFullKeys() {
//   const instance = await getCoreInstance();
//   return instance.exportFullKeys();
// }

async function deriveAssetKey() {
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

async function getKeysStatus() {
  const instance = await getCoreInstance();
  return instance.getKeysStatus();
}

async function getPhysicalDeviceId() {
  const instance = await getCoreInstance();
  return instance.getPhysicalDeviceId();
}

async function getCoreInstance() {
  const deviceId = state.coreDeviceId ?? getDeviceId();
  const instance = getFireblocksNCWInstance(deviceId);
  if (!instance) {
    throw new Error("Failed to get core instance");
  }
  return instance;
}

async function setCoreDeviceId() {
  const deviceId = await inputAny("deviceId", generateDeviceId());
  setDeviceId(deviceId);
  state.coreDeviceId = deviceId;
  return deviceId;
}
