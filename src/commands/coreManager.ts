import { getFireblocksNCWInstance } from "@fireblocks/ncw-js-sdk";
import { getDeviceId } from "../utils/storage-utils";
import inquirer from "inquirer";
import { inputAny } from "../utils/prompt-utils";
import chalk from "chalk";

export class CoreManager {
  public static isInitialized: boolean = false;
  public static deviceId: string;
  private async getCoreInstance() {
    const deviceId = CoreManager.deviceId ?? getDeviceId();
    const instance = getFireblocksNCWInstance(deviceId);
    if (!instance) {
      throw new Error("Failed to get core instance");
    }
    return instance;
  }

  public async dispose() {
    const instance = await this.getCoreInstance();
    return instance.dispose();
  }

  public async clearAllStorage() {
    const instance = await this.getCoreInstance();
    return instance.clearAllStorage();
  }

  public async generateMPCKeys() {
    const toTMPCAlgorithm = (algo: string) => algo.replace("MPC_", "MPC_CMP_");
    const instance = await this.getCoreInstance();
    const { algos } = await inquirer.prompt({
      type: "checkbox",
      name: "algos",
      message: "Select algorithms",
      choices: ["MPC_ECDSA_SECP256K1", "MPC_EDDSA_ED25519"],
      default: ["MPC_ECDSA_SECP256K1"],
    });

    return instance.generateMPCKeys(new Set(algos.map(toTMPCAlgorithm)));
  }

  public async stopMpcDeviceSetup() {
    const instance = await this.getCoreInstance();
    return instance.stopMpcDeviceSetup();
  }

  public async signTransaction() {
    const instance = await this.getCoreInstance();
    const txId = await inputAny("transaction ID");
    return instance.signTransaction(txId);
  }

  public async stopInProgressSignTransaction() {
    const instance = await this.getCoreInstance();
    return instance.stopInProgressSignTransaction();
  }

  public async getInProgressSigningTxId() {
    const instance = await this.getCoreInstance();
    return instance.getInProgressSigningTxId();
  }

  public async backupKeys() {
    const instance = await this.getCoreInstance();
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

  public async recoverKeys() {
    const instance = await this.getCoreInstance();
    const passphrase = await inputAny(
      "passphrase",
      process.env.DEFAULT_PASSPHRASE
    );
    return instance.recoverKeys(() => Promise.resolve(passphrase));
  }

  public async requestJoinExistingWallet() {
    const instance = await this.getCoreInstance();
    return instance.requestJoinExistingWallet({
      onRequestId: (requestId) => {
        console.log(chalk.cyan(`Request ID: ${requestId}`));
      },
    });
  }

  public async approveJoinWalletRequest() {
    const instance = await this.getCoreInstance();
    const requestId = await inputAny("request ID");
    return instance.approveJoinWalletRequest(requestId);
  }

  public async stopJoinWallet() {
    const instance = await this.getCoreInstance();
    return instance.stopJoinWallet();
  }

  public async takeover() {
    const instance = await this.getCoreInstance();
    return instance.takeover();
  }

  // public async exportFullKeys() {
  //   const instance = await this.getCoreInstance();
  //   return instance.exportFullKeys();
  // }

  public async deriveAssetKey() {
    const instance = await this.getCoreInstance();
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

  public async getKeysStatus() {
    const instance = await this.getCoreInstance();
    return instance.getKeysStatus();
  }

  public async getPhysicalDeviceId() {
    const instance = await this.getCoreInstance();
    return instance.getPhysicalDeviceId();
  }
}
