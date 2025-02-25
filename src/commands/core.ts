import { getFireblocksNCWInstance } from "@fireblocks/ncw-js-sdk";
import { getDeviceId } from "../utils/utils";
import inquirer from "inquirer";
import { inputAny } from "../utils/prompt-utils";
import chalk from "chalk";
import { execute } from "./commands";

export const Commands: Record<string, Function> = {
  ["Dispose"]: dispose,
  ["Clear All Storage"]: clearAllStorage,
  ["Generate MPC Keys"]: generateMPCKeys,
  ["Stop MPC Device Setup"]: stopMpcDeviceSetup,
  ["Sign Transaction"]: signTransaction,
  ["Stop In Progress Sign Transaction"]: stopInProgressSignTransaction,
  ["Get In Progress Signing Tx ID"]: getInProgressSigningTxId,
  ["Backup Keys"]: backupKeys,
  ["Recover Keys"]: recoverKeys,
  ["Request Join Existing Wallet"]: requestJoinExistingWallet,
  ["Approve Join Wallet Request"]: approveJoinWalletRequest,
  ["Stop Join Wallet"]: stopJoinWallet,
  ["Takeover"]: takeover,
  ["Derive Asset Key"]: deriveAssetKey,
  ["Get Keys Status"]: getKeysStatus,
  ["Get Physical Device ID"]: getPhysicalDeviceId,
};

export async function dispose() {
  const instance = await getCoreInstance();
  return execute(() => instance.dispose());
}

export async function clearAllStorage() {
  const instance = await getCoreInstance();
  return execute(() => instance.clearAllStorage());
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
  return execute(() => instance.generateMPCKeys(new Set(algos)));
}

export async function stopMpcDeviceSetup() {
  const instance = await getCoreInstance();
  return execute(() => instance.stopMpcDeviceSetup());
}

export async function signTransaction() {
  const instance = await getCoreInstance();
  const txId = await inputAny("transaction ID");
  return execute(() => instance.signTransaction(txId));
}

export async function stopInProgressSignTransaction() {
  const instance = await getCoreInstance();
  return execute(() => instance.stopInProgressSignTransaction());
}

export async function getInProgressSigningTxId() {
  const instance = await getCoreInstance();
  return execute(() => instance.getInProgressSigningTxId());
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
  return execute(() => instance.backupKeys(passphrase, passphraseId));
}

export async function recoverKeys() {
  const instance = await getCoreInstance();
  const passphrase = await inputAny(
    "passphrase",
    process.env.DEFAULT_PASSPHRASE
  );
  return execute(() => instance.recoverKeys(() => Promise.resolve(passphrase)));
}

export async function requestJoinExistingWallet() {
  const instance = await getCoreInstance();
  return execute(() =>
    instance.requestJoinExistingWallet({
      onRequestId: (requestId) => {
        console.log(chalk.cyan(`Request ID: ${requestId}`));
      },
    })
  );
}

export async function approveJoinWalletRequest() {
  const instance = await getCoreInstance();
  const requestId = await inputAny("request ID");
  return execute(() => instance.approveJoinWalletRequest(requestId));
}

export async function stopJoinWallet() {
  const instance = await getCoreInstance();
  return execute(async () => instance.stopJoinWallet());
}

export async function takeover() {
  const instance = await getCoreInstance();
  return execute(() => instance.takeover());
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
  return execute(async () =>
    instance.deriveAssetKey(
      extendedPrivateKey,
      Number(coinType),
      Number(account),
      Number(change),
      Number(index)
    )
  );
}

export async function getKeysStatus() {
  const instance = await getCoreInstance();
  return execute(() => instance.getKeysStatus());
}

export async function getPhysicalDeviceId() {
  const instance = await getCoreInstance();
  return execute(async () => instance.getPhysicalDeviceId());
}

async function getCoreInstance() {
  const deviceId = getDeviceId();
  const instance = getFireblocksNCWInstance(deviceId);
  if (!instance) {
    throw new Error("Failed to get core instance");
  }
  return instance;
}
