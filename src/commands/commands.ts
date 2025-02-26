import inquirer from "inquirer";
import { getToken, setCustomClaim } from "../utils/firebase-auth";
import { initEw } from "./ew";
import { state } from "../app";

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
    {
      type: "input",
      name: "claimKey",
      message: "Enter the claim key (default: 'wallet_claim'):",
      default: "wallet_claim",
    },
    {
      type: "list",
      name: "claimValue",
      message: "Select the claim value:",
      choices: ["RANDOM", "USER_INPUT", "CLEAR"],
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
  } else if (answers.claimValue === "RANDOM") {
    claimValue = crypto.randomUUID();
  } else if (answers.claimValue === "CLEAR") {
    claimValue = "CLEAR";
  }
  await setCustomClaim(answers.uid, answers.claimKey, claimValue);
  await getToken(true);
  state.walletId = claimValue === "CLEAR" ? null : claimValue;
}
