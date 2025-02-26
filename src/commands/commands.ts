import inquirer from "inquirer";
import { getToken, setCustomClaim } from "../utils/firebase-auth";
import { initEw } from "./ew";
import { state } from "../app";
import { addWalletId, getWalletIds } from "../utils/storage-utils";

export const Commands: Record<string, Function> = {
  "Init Embedded Wallet": initEw,
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
    askToSaveWalletId(claimValue);
  } else if (answers.claimValue === "RANDOM") {
    claimValue = crypto.randomUUID();
  } else if (answers.claimValue === "CLEAR") {
    claimValue = "CLEAR";
  } else if (answers.claimValue === "SAVED") {
    const opts = getWalletIds();
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
}

export async function askToSaveWalletId(walletId: string) {
  const wallets = getWalletIds();
  if (wallets?.find((opt) => opt.uuid === walletId)) {
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
      const response = await inquirer.prompt([
        {
          type: "input",
          name: "walletName",
          message: "Enter the wallet name:",
        },
      ]);
      walletName = response.walletName;
      nameExists = wallets?.some((opt) => opt.name === walletName);
      if (nameExists) {
        console.log(
          "Wallet name already exists. Please enter a different name."
        );
      }
    } while (nameExists);
    addWalletId(walletName, walletId);
  }
}
