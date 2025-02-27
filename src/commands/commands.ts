import inquirer from "inquirer";
import { getToken, setCustomClaim } from "../utils/firebase-auth";
import { initCore, initEw } from "./ew";
import { state } from "../app";
import { getWalletIds } from "../utils/storage-utils";
import { askToSaveWalletId } from "../prompt";
import { getFireblocksNCWInstance } from "@fireblocks/ncw-js-sdk";

export const Commands: Record<string, Function> = {
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
      console.log("No saved wallet IDs found");
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
