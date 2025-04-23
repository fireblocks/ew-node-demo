import inquirer from "inquirer";
import { addWalletId, getWalletIds } from "../utils/storage-utils";

export class WalletStorageManager {
  public async promptAndSaveWallet(walletId: string): Promise<void> {
    if (this.isWalletStored(walletId)) {
      return;
    }

    const { save } = await inquirer.prompt([
      {
        type: "confirm",
        name: "save",
        message: "Save this wallet ID?",
      },
    ]);

    if (save) {
      let walletName: string;
      let nameExists: boolean;
      do {
        const promptRes = await inquirer.prompt([
          {
            type: "input",
            name: "walletName",
            message: "Enter the wallet name:",
          },
        ]);
        walletName = (promptRes.walletName as string).trim().replace(",", "_");
        nameExists = this.getStoredWallets()?.some(
          (opt) => opt.name === walletName
        );
        if (nameExists) {
          console.log(
            "Wallet name already exists. Please enter a different name."
          );
        }
      } while (nameExists);

      this.saveWalletWithName(walletName, walletId);
    }
  }

  private getStoredWallets() {
    return getWalletIds();
  }

  private isWalletStored(walletId: string) {
    const wallets = this.getStoredWallets();
    return wallets?.some((wallet) => wallet.uuid === walletId) ?? false;
  }

  private saveWalletWithName(name: string, walletId: string) {
    return addWalletId(name, walletId);
  }
}
