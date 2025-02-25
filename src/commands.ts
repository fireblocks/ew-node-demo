import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import {
  ConsoleLoggerFactory,
  getFireblocksNCWInstance,
  TEnv,
} from "@fireblocks/ncw-js-sdk";
import { getToken } from "./utils/firebase-auth";
import inquirer from "inquirer";
import { getDeviceId } from "./utils/utils";
import {
  FileSystemSecureStorageProvider,
  FileSystemStorageProvider,
} from "./utils/sdk-storage";

let ew: EmbeddedWallet | null = null;

export const Commands: Record<string, Function> = {
  "Init Embedded Wallet": initEw,
  "Init Core": initCore,
};

async function initEw() {
  if (ew) {
    console.log("EW already initialized");
    return;
  }
  ew = new EmbeddedWallet({
    env: process.env.ENV as TEnv,
    logger: ConsoleLoggerFactory(),
    authClientId: process.env.AUTH_CLIENT_ID,
    authTokenRetriever: {
      getAuthToken: getToken,
    },
    reporting: { enabled: false },
  });
  initEwCommands();
  console.log("EW initialized");
}

async function initCore() {
  const { deviceId } = await inquirer.prompt([
    {
      type: "input",
      name: "deviceId",
      message: "Enter device ID",
      default: getDeviceId(),
    },
  ]);

  if (getFireblocksNCWInstance(deviceId)) {
    console.log("Core already initialized");
    return;
  }
  await ew.initializeCore({
    deviceId,
    eventsHandler: {
      handleEvent: console.log,
    },
    storageProvider: new FileSystemStorageProvider("storage/public"),
    secureStorageProvider: new FileSystemSecureStorageProvider(
      "storage/secure"
    ),
  });
  console.log("Core initialized");
}

function initEwCommands() {
  Commands["EW: Assign Wallet"] = ew.assignWallet;
}
