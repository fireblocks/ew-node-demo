import * as admin from "firebase-admin";
import * as serviceAccount from "../secrets/service-account-key.json";
import inquirer from "inquirer";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

async function setCustomClaim(
  uid: string,
  claimKey: string,
  claimValue: string
) {
  try {
    // Fetch current custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};
    console.log("@@@ DEBUGS | setCustomClaim | currentClaims:", currentClaims);

    // Update claims
    const updatedClaims =
      claimValue === "CLEAR"
        ? null
        : { ...currentClaims, [claimKey]: claimValue };
    await admin.auth().setCustomUserClaims(uid, updatedClaims);
    console.log("@@@ DEBUGS | setCustomClaim | updatedClaims:", updatedClaims);

    console.log(
      `Custom claim for user '${uid}' has been ${
        claimValue === "CLEAR"
          ? "cleared"
          : `set to [${claimKey}]: '${claimValue}'`
      }`
    );
  } catch (error) {
    console.error(
      `Error setting custom claim for user '${uid}' [${claimKey}: ${claimValue}]`,
      error
    );
  }
}
async function promptUser() {
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
      choices: ["USER_INPUT", "RANDOM", "CLEAR"],
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
  } else {
    throw new Error("Invalid claim value");
  }
  // const claimValue = answers.claimValue === "random UUID" ? crypto.randomUUID() : answers.claimValue;
  return { ...answers, claimValue };
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: node src/sdk-claimer.ts [uid?] [claimValue?]");
    process.exit(1);
  }
  const [, , uid, claimValue] = process.argv;
  let opts: { claimValue: string; uid: string; claimKey: string };
  if (uid) {
    opts = {
      uid,
      claimValue: claimValue ?? crypto.randomUUID(),
      claimKey: "wallet_claim",
    };
  } else {
    opts = await promptUser();
  }

  await setCustomClaim(opts.uid, opts.claimKey, opts.claimValue);
}

main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
